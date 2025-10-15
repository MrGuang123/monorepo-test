// di.ts — 一个可在面试中“默写”的通用DI容器（无第三方依赖）
// 设计目标：
// 1) 支持三种Provider：Class / Value / Factory
// 2) 支持作用域：Singleton、Transient；支持子容器（Scoped）
// 3) 支持构造器注入（静态 inject 数组声明依赖）与属性注入（@Inject 装饰器）
// 4) 支持模块化注册（ContainerModule）
// 5) 支持循环依赖检测
// 6) 支持生命周期 onInit()
// 7) 纯TypeScript，易于在JS中改写；无 reflect-metadata 依赖

/* ===================== 类型与辅助 ===================== */
export type Token<T = any> =
  | symbol
  | string
  | (new (...args: any[]) => T);

export enum Scope {
  Singleton = "Singleton",
  Transient = "Transient",
}

export interface BaseProvider<T = any> {
  token: Token<T>;
  scope?: Scope;
}
export interface ClassProvider<T = any>
  extends BaseProvider<T> {
  useClass: new (...args: any[]) => T;
}
export interface ValueProvider<T = any>
  extends BaseProvider<T> {
  useValue: T;
}
export interface FactoryProvider<T = any>
  extends BaseProvider<T> {
  useFactory: (...deps: any[]) => T;
  deps?: Token[];
}
export type Provider<T = any> =
  | ClassProvider<T>
  | ValueProvider<T>
  | FactoryProvider<T>;

export interface OnInit {
  onInit(): void | Promise<void>;
}

// 错误类型
export class ResolutionError extends Error {}
export class CircularDependencyError extends Error {}
export class ProviderNotFoundError extends Error {}

/* ===================== 属性注入元数据 ===================== */
// 使用 WeakMap 保存类的属性注入声明：Ctor -> Array<{key, token}>
const propertyInjections: WeakMap<
  Function,
  Array<{ key: string | symbol; token: Token }>
> = new WeakMap();

export function Inject(token: Token): PropertyDecorator {
  return (target: Object, propertyKey: string | symbol) => {
    const ctor = (target as any).constructor;
    const list = propertyInjections.get(ctor) ?? [];
    list.push({ key: propertyKey, token });
    propertyInjections.set(ctor, list);
  };
}

/* ===================== 容器实现 ===================== */
export class Container {
  private providers = new Map<Token, Provider>();
  private singletons = new Map<Token, any>();
  private parent?: Container;

  constructor(parent?: Container) {
    this.parent = parent;
  }

  // 注册多个或单个 Provider
  register(...providers: Provider[]) {
    providers.forEach((p) => this.setProvider(p));
    return this;
  }

  // 创建子容器（作用域隔离，继承父级Provider定义，但单例实例独立）
  createChild(): Container {
    return new Container(this);
  }

  // 解析依赖
  resolve<T>(token: Token<T>, _stack: Token[] = []): T {
    // 循环依赖检测
    if (_stack.includes(token)) {
      const path = [..._stack, token]
        .map((t) => tokenToString(t))
        .join(" -> ");
      throw new CircularDependencyError(
        `Circular dependency detected: ${path}`
      );
    }

    const provider = this.getProvider(token);
    if (!provider)
      throw new ProviderNotFoundError(
        `No provider for token: ${tokenToString(token)}`
      );

    const scope = provider.scope ?? Scope.Singleton;

    // 单例缓存
    if (
      scope === Scope.Singleton &&
      this.singletons.has(provider.token)
    ) {
      return this.singletons.get(provider.token);
    }

    // 实例化
    const instance = this.instantiate(provider, [
      ..._stack,
      token,
    ]);

    // 属性注入
    this.applyPropertyInjections(instance);

    // 生命周期
    if (typeof (instance as any)?.onInit === "function") {
      (instance as any as OnInit).onInit();
    }

    if (scope === Scope.Singleton) {
      this.singletons.set(provider.token, instance);
    }

    return instance as T;
  }

  /* ============== 私有方法 ============== */
  private setProvider(p: Provider) {
    if (!p || !p.token)
      throw new ResolutionError(
        "Invalid provider: missing token"
      );
    this.providers.set(p.token, p);
  }

  private getProvider(token: Token): Provider | undefined {
    if (this.providers.has(token))
      return this.providers.get(token);
    return this.parent?.getProvider(token);
  }

  private instantiate(
    provider: Provider,
    stack: Token[]
  ): any {
    if (isClassProvider(provider)) {
      const Ctor = provider.useClass;
      const deps: Token[] = (Ctor as any).inject ?? []; // 构造器依赖声明
      const args = deps.map((dep) =>
        this.resolve(dep, stack)
      );
      return new Ctor(...args);
    }

    if (isFactoryProvider(provider)) {
      const deps = provider.deps ?? [];
      const args = deps.map((dep) =>
        this.resolve(dep, stack)
      );
      return provider.useFactory(...args);
    }

    if (isValueProvider(provider)) {
      return provider.useValue;
    }

    throw new ResolutionError("Unknown provider type");
  }

  private applyPropertyInjections(instance: any) {
    if (!instance || typeof instance !== "object") return;
    const ctor = instance.constructor;
    const list = propertyInjections.get(ctor) ?? [];
    for (const { key, token } of list) {
      Object.defineProperty(instance, key, {
        configurable: true,
        enumerable: true,
        writable: true,
        value: this.resolve(token),
      });
    }
  }
}

/* ===================== 模块支持 ===================== */
export class ContainerModule {
  constructor(
    private readonly loaders: Array<(c: Container) => void>
  ) {}
  load(container: Container) {
    this.loaders.forEach((fn) => fn(container));
  }
}

/* ===================== 工具函数与类型守卫 ===================== */
function isClassProvider(p: Provider): p is ClassProvider {
  return (p as any).useClass;
}
function isValueProvider(p: Provider): p is ValueProvider {
  return (p as any).useValue !== undefined;
}
function isFactoryProvider(
  p: Provider
): p is FactoryProvider {
  return (p as any).useFactory;
}

function tokenToString(t: Token): string {
  if (typeof t === "string") return t;
  if (typeof t === "symbol")
    return t.description ?? t.toString();
  return (t as any).name ?? "[AnonymousClass]";
}

/* ===================== 使用示例（可删） ===================== */
// 1) 定义Tokens（也可直接用类作为token）
const TOKENS = {
  Logger: Symbol("Logger"),
  Config: Symbol("Config"),
  Clock: Symbol("Clock"),
};

// 2) 定义服务
class ConsoleLogger {
  log(msg: string) {
    console.log(`[LOG] ${msg}`);
  }
}

class SystemClock {
  now() {
    return new Date();
  }
}

class Greeter implements OnInit {
  static inject = [
    TOKENS.Logger,
    TOKENS.Config,
    TOKENS.Clock,
  ] as const;
  constructor(
    private logger: ConsoleLogger,
    private config: { appName: string },
    private clock: SystemClock
  ) {}

  // 属性注入示例
  @Inject(TOKENS.Logger)
  private anotherLogger!: ConsoleLogger;

  onInit() {
    this.logger.log("Greeter initialized");
  }

  greet(name: string) {
    const t = this.clock.now().toISOString();
    this.anotherLogger.log(
      `Hello ${name} from ${this.config.appName} at ${t}`
    );
  }
}

// 3) 组装容器
export function buildRootContainer() {
  const root = new Container();

  const coreModule = new ContainerModule([
    (c) =>
      c.register({
        token: TOKENS.Logger,
        useClass: ConsoleLogger,
        scope: Scope.Singleton,
      }),
    (c) =>
      c.register({
        token: TOKENS.Clock,
        useClass: SystemClock,
        scope: Scope.Transient,
      }),
    (c) =>
      c.register({
        token: TOKENS.Config,
        useValue: { appName: "MyApp" },
      }),
    (c) =>
      c.register({
        token: Greeter,
        useClass: Greeter,
        scope: Scope.Transient,
      }),
  ]);

  coreModule.load(root);
  return root;
}

// 4) 演示：
if (require.main === module) {
  const root = buildRootContainer();
  const child = root.createChild(); // 子容器有独立的单例缓存

  const g1 = root.resolve(Greeter);
  g1.greet("Alice");

  const g2 = child.resolve(Greeter);
  g2.greet("Bob");

  // 单例验证：Logger 在各自容器内是单例
  console.log(
    "root Logger === child Logger?",
    root.resolve(TOKENS.Logger) ===
      child.resolve(TOKENS.Logger)
  ); // false
  console.log(
    "root Logger self-singleton?",
    root.resolve(TOKENS.Logger) ===
      root.resolve(TOKENS.Logger)
  ); // true
}
