export type Token<T = any> = symbol | string | (new (...args: any[]) => T)
export enum Scope {
  Singleton = 'Singleton',
  Transient = 'Transient'
}
export interface BaseProvider<T = any> { token: Token<T>; scope?: Scope }
export interface ClassProvider<T = any> extends BaseProvider<T> { useClass: new (...args: any[]) => T }
export interface ValueProvider<T = any> extends BaseProvider<T> { useValue: T }
export interface FactoryProvider<T = any> extends BaseProvider<T> { useFactory: (...deps: any[]) => T; deps?: Token[]}
export type Provider<T = any> = ClassProvider<T> | ValueProvider<T> | FactoryProvider<T>;
export interface OnInit { onInit(): void | Promise<void> }

export class ResolutionError extends Error {}
export class CircularDependencyError extends Error {}
export class ProviderNotFoundError extends Error {}

const propertyInjections: WeakMap<Function, Array<{ key: string | symbol; token: Token }>> = new WeakMap()

export function Inject(token: Token): PropertyDecorator {
  return (target: Object, propertyKey: string | symbol) {
    const ctor = (target as any).constructor
    const list = propertyInjections.get(ctor) ?? []
    list.push({ key: propertyKey, token })
    propertyInjections.set(ctor, list)
  }
}

export class Container {
  private providers = new Map<Token, Provider>()
  private singletons = new Map<Token, any>()
  private parent?: Container
  constructor(parent?: Container) { this.parent = parent }

  register(...providers: Provider[]) {
    providers.forEach(p => this.setProvider(p))
    return this;
  }

  createChild(): Container { return new Container(this) }

  resolve<T>(token: Token<T>, _stack: Token[] = []): T {
    if(_stack.includes(token)) {
      const path = [..._stack, token].map(t => tokenToString(t)).join(' -> ')
      throw new CircularDependencyError(`Circular dependency detected: ${path}`)
    }
    const provider = this.getProvider(token)
    if(!provider) throw new ProviderNotFoundError(`No provider for token: ${tokenToString(token)}`)
    const scope = provider.scope ?? Scope.Singleton

    if(scope === Scope.Singleton && this.singletons.has(provider.token)) {
      return this.singletons.get(provider.token)
    }

    const instance = this.instantiate(provider, [..._stack, token])
    this.applyPropertyInjections(instance)
    if(typeof (instance as any)?.onInit === 'function') {
      ;(instance as any as OnInit).onInit()
    }

    if(scope === Scope.Singleton) {
      this.singletons.set(provider.token, instance)
    }

    return instance as T
  }

  private setProvider(p: Provider) {
    if(!p || !p.token) throw new ResolutionError('Invalid provider: missing token')
    this.providers.set(p.token, p)
  }

  private getProvider(token: Token): Provider | undefined {
    if(this.providers.has(token)) return this.providers.get(token)
    return this.parent?.getProvider(token)
  }

  private instantiate(provider: Provider, stack: Token[]): any {
    if(isClassProvider(provider)) {
      const ctor = provider.useClass
    }
  }
}
