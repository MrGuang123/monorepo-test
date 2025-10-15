# Git 提交 vs npm Publish 的区别

## 核心区别

### 🎯 目的不同

| Git              | npm Publish          |
| ---------------- | -------------------- |
| **版本控制**     | **分发使用**         |
| 保存开发历史     | 提供可安装的包       |
| 团队协作         | 让他人使用你的代码   |
| 包含所有开发资源 | 只包含运行必需的文件 |

### 📦 内容对比

```
┌─────────────────────────────────────────────────────────┐
│                   完整项目仓库                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │              Git 提交的内容                       │   │
│  │  ┌────────────────────────────────────────┐      │   │
│  │  │    npm Publish 的内容（运行时必需）     │      │   │
│  │  │  - package.json                        │      │   │
│  │  │  - index.js (源代码)                   │      │   │
│  │  │  - README.md (可选)                    │      │   │
│  │  │  - dist/ (构建产物，如果有)            │      │   │
│  │  └────────────────────────────────────────┘      │   │
│  │                                                   │   │
│  │  + 测试文件 (test/)                              │   │
│  │  + 开发配置 (.eslintrc, tsconfig.json)          │   │
│  │  + 示例代码 (examples/)                          │   │
│  │  + CI/CD 配置 (.github/workflows/)              │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  + Monorepo 配置 (pnpm-workspace.yaml)                  │
│  + Docker 配置 (docker-compose.yml)                     │
│  + 其他包的代码                                         │
│  + .git 目录                                            │
└─────────────────────────────────────────────────────────┘
```

## 实际示例

### 示例 1: 基础项目

**Git 仓库结构**:

```
packages/cli/
├── src/
│   └── index.js          # 源代码
├── test/
│   └── index.test.js     # 测试文件 (Git ✅, npm ❌)
├── .eslintrc             # 开发配置 (Git ✅, npm ❌)
├── package.json          # 包配置 (Git ✅, npm ✅)
├── README.md             # 文档 (Git ✅, npm ✅)
└── .npmignore            # npm 忽略规则 (Git ✅, npm ❌)
```

**npm Publish 后用户得到的**:

```
node_modules/@monorepo-test/cli/
├── src/
│   └── index.js          # ✅ 能运行就行
├── package.json          # ✅ 必需
└── README.md             # ✅ 帮助文档
```

### 示例 2: TypeScript 项目

**Git 仓库**:

```
packages/cli/
├── src/
│   └── index.ts          # TypeScript 源码 (Git ✅, npm ❌)
├── dist/
│   └── index.js          # 编译后的 JS (Git ❌, npm ✅)
├── test/
│   └── index.test.ts     # 测试 (Git ✅, npm ❌)
├── tsconfig.json         # TS 配置 (Git ✅, npm ❌)
├── package.json          # (Git ✅, npm ✅)
└── README.md             # (Git ✅, npm ✅)
```

**npm Publish 后**:

```
node_modules/@monorepo-test/cli/
├── dist/
│   └── index.js          # ✅ 编译后的代码
├── package.json          # ✅ main: "dist/index.js"
└── README.md
```

## 控制 npm Publish 内容的方法

### 方法 1: .npmignore 文件（推荐）

```.npmignore
# 这些文件不会被 publish
test/
*.test.js
.eslintrc
tsconfig.json
.github/
```

### 方法 2: package.json 中的 files 字段

```json
{
  "name": "@monorepo-test/cli",
  "files": ["index.js", "dist/", "README.md"]
}
```

**注意**: `files` 是白名单（只包含这些），`.npmignore` 是黑名单（排除这些）。

### 方法 3: 查看将要发布的内容

```bash
# 模拟发布，查看会包含哪些文件
cd packages/cli
npm pack --dry-run

# 实际打包（不上传）
npm pack
# 会生成 monorepo-test-cli-1.0.0.tgz
# 解压查看内容
tar -xzf monorepo-test-cli-1.0.0.tgz
ls package/
```

## 常见场景

### 场景 1: 开源项目

```bash
# 1. 开发完成，提交到 Git
git add .
git commit -m "feat: add new feature"
git push origin main

# 2. 发布到 npm
cd packages/cli
npm version patch       # 升级版本
npm publish            # 发布

# 结果:
# - Git: 包含所有代码、测试、配置
# - npm: 只包含运行时必需的文件
```

### 场景 2: 私有项目

```bash
# 1. 提交到公司 Git
git push origin main

# 2. 发布到公司私仓
pnpm publish:cli --registry http://npm.company.com

# Git 和 npm 可以是不同的服务器
```

### 场景 3: Monorepo

```bash
# Git 提交整个 monorepo
git add .
git commit -m "update all packages"
git push

# npm 单独发布每个包
pnpm publish:cli        # 只发布 cli 包
pnpm publish:hooks      # 只发布 hooks 包

# Git: 一个仓库包含多个包
# npm: 多个独立的包可以单独安装
```

## 最佳实践

### ✅ Git 应该包含

- 所有源代码（包括测试）
- 开发配置文件
- 文档和示例
- CI/CD 配置
- Monorepo 配置

**目的**: 让其他开发者能参与开发

### ✅ npm 应该包含

- 运行时必需的代码
- package.json
- README.md
- LICENSE（如果有）

**目的**: 让用户能直接使用，包体积尽量小

### ❌ 都不应该包含

- `node_modules/` - 太大，可重新安装
- 构建缓存 - 临时文件
- IDE 配置 - 个人偏好
- 敏感信息 - 密钥、密码

## 验证发布内容

### 本地验证

```bash
# 1. 打包但不发布
cd packages/cli
npm pack

# 2. 查看包内容
tar -tzf monorepo-test-cli-1.0.0.tgz

# 3. 解压验证
mkdir test-extract
tar -xzf monorepo-test-cli-1.0.0.tgz -C test-extract
tree test-extract/
```

### 发布后验证

```bash
# 1. 发布到私仓
pnpm publish:cli

# 2. 在新目录测试安装
mkdir test-install
cd test-install
npm init -y
echo "registry=http://localhost:4873" > .npmrc
npm install @monorepo-test/cli

# 3. 查看安装的内容
tree node_modules/@monorepo-test/cli/

# 4. 测试能否正常使用
node -e "console.log(require('@monorepo-test/cli'))"
```

## 实际工作流程

```bash
# 完整流程示例

# 1. 开发新功能
vim packages/cli/index.js
vim packages/cli/test/index.test.js

# 2. 测试
npm test

# 3. 提交到 Git（包含测试文件）
git add packages/cli/
git commit -m "feat: add new CLI command"
git push origin main

# 4. 升级版本
cd packages/cli
npm version patch  # 1.0.0 -> 1.0.1

# 5. 发布到 npm（不包含测试文件）
pnpm publish:cli

# 6. 推送版本标签
git push origin v1.0.1
```

## 总结

| 方面     | Git      | npm Publish |
| -------- | -------- | ----------- |
| **范围** | 整个项目 | 单个包      |
| **目的** | 开发协作 | 运行使用    |
| **内容** | 开发资源 | 运行时文件  |
| **体积** | 较大     | 尽量小      |
| **受众** | 开发者   | 用户        |

**记住**:

- Git 是给**开发者**看的，包含开发所需的一切
- npm 是给**用户**用的，只包含运行所需的最小集合
- 两者可以独立版本，但通常保持同步
