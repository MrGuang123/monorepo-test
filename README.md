# Monorepo Test

这是一个使用 pnpm workspace 管理的 monorepo 项目，使用 yarn 进行包发布到私有 npm 仓库（verdaccio）。

## 项目结构

```
monorepo-test/
├── packages/
│   ├── cli/          # CLI 工具包
│   └── hooks/        # Hooks 工具包
├── verdaccio/        # Verdaccio 配置和存储
├── docker-compose.yml
├── pnpm-workspace.yaml
└── package.json
```

## 快速开始

### 1. 启动 Verdaccio 私有仓库

```bash
# 方式 1: 使用 Docker（推荐）
docker compose up -d

# 注意: 如果你的 Docker 版本较旧，使用:
# docker-compose up -d

# 方式 2: 本地直接运行（不需要 Docker）
npm install -g verdaccio
verdaccio
```

Verdaccio 将在 `http://localhost:4873` 运行。

### 2. 安装依赖（使用 pnpm）

```bash
pnpm install
```

### 3. 创建 Verdaccio 用户（首次使用）

```bash
npm adduser --registry http://localhost:4873
# 用户名: test
# 密码: test123
# 邮箱: test@example.com

# 验证登录
npm whoami --registry http://localhost:4873
```

> 💡 关于用户认证的详细说明，请查看 [VERDACCIO_AUTH.md](./VERDACCIO_AUTH.md)

### 4. 发布包到私有仓库（使用 pnpm）

```bash
# 发布所有包
pnpm publish:all

# 或单独发布
pnpm publish:cli
pnpm publish:hooks
```

### 5. 在其他项目中使用

```bash
npm install @monorepo-test/cli --registry http://localhost:4873
npm install @monorepo-test/hooks --registry http://localhost:4873
```

## 包说明

### @monorepo-test/cli

CLI 工具包，提供命令行工具功能。

```javascript
const { greet, runCommand } = require("@monorepo-test/cli");

greet("World");
runCommand("build");
```

### @monorepo-test/hooks

Hooks 工具包，提供自定义 hooks。

```javascript
const {
  useCustomHook,
  useLogger,
} = require("@monorepo-test/hooks");

useCustomHook(10);
useLogger("Test message");
```

## 版本管理

```bash
# 升级所有包版本
pnpm version:patch  # 1.0.0 -> 1.0.1
pnpm version:minor  # 1.0.0 -> 1.1.0
pnpm version:major  # 1.0.0 -> 2.0.0
```

## Verdaccio 管理

```bash
docker compose up -d      # 启动
docker compose down       # 停止
docker compose logs -f    # 查看日志
docker compose restart    # 重启

# 旧版 Docker 使用 docker-compose (连字符)
# 新版 Docker 使用 docker compose (空格)
```

## 核心概念

### 为什么用 pnpm？

- ⚡️ **快速**: 比 npm/yarn 快 2-3 倍
- 💾 **节省空间**: 使用硬链接，相同包只存一份
- 🔒 **严格**: 防止使用未声明的依赖
- 🎯 **Monorepo 友好**: 原生支持 workspace

### Registry 配置说明

项目中有三处 registry 配置，作用不同：

1. **`.npmrc`**: 控制从哪里**下载**包
2. **`publishConfig`**: 控制发布到哪里（默认）
3. **`--registry` 参数**: 临时覆盖发布地址（优先级最高）

它们不是重复，而是分层防护，确保：

- 开发时从私仓下载依赖
- 测试时发布到私仓
- 正式发布时可以覆盖到公网

### 完整工作流程

```
开发 → 本地测试 → 发布私仓 → 验证 → 提交 GitHub → 发布公网 npm
 ↓       ↓          ↓          ↓        ↓              ↓
编辑   pnpm test  pnpm publish 安装测试  git push    npm publish
```

详细说明请查看：

- [MONOREPO_GUIDE.md](./MONOREPO_GUIDE.md) - Monorepo 完整开发指南
- [GIT_VS_NPM.md](./GIT_VS_NPM.md) - Git 提交 vs npm Publish 的区别
- [VERDACCIO_AUTH.md](./VERDACCIO_AUTH.md) - Verdaccio 用户认证完全指南
- [VERDACCIO_AVATAR.md](./VERDACCIO_AVATAR.md) - Verdaccio 头像显示配置
- [DOCKER_COMMANDS.md](./DOCKER_COMMANDS.md) - Docker Compose 命令参考

## 检查发布内容

```bash
# 查看将要发布的文件
bash check-publish-content.sh

# 或手动检查
cd packages/cli
npm pack --dry-run
```
