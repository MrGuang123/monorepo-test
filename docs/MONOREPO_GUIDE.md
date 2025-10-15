# Monorepo 开发完整指南

## 📚 目录

1. [完整工作流程](#完整工作流程)
2. [为什么这样配置](#为什么这样配置)
3. [Registry 配置详解](#registry-配置详解)
4. [常见问题](#常见问题)

---

## 完整工作流程

### 1️⃣ 初始化项目（首次）

```bash
# 克隆项目
git clone <your-repo>
cd monorepo-test

# 启动私仓服务
docker-compose up -d

# 创建 Verdaccio 用户（首次使用）
npm adduser --registry http://localhost:4873
# 输入用户名: test
# 输入密码: test
# 输入邮箱: test@test.com

# 安装依赖
pnpm install
```

### 2️⃣ 日常开发流程

```bash
# 场景 1: 开发单个包
cd packages/cli
# 编辑 index.js
# 添加新功能...

# 场景 2: 包之间互相依赖
# 假设 hooks 要使用 cli
cd packages/hooks
# 在 package.json 中添加依赖
{
  "dependencies": {
    "@monorepo-test/cli": "workspace:*"
  }
}

# 回到根目录安装
cd ../..
pnpm install

# 现在 hooks 可以直接使用 cli，无需发布！
```

**hooks/index.js 示例**:

```javascript
const { greet } = require("@monorepo-test/cli");

function useGreeting(name) {
  const message = greet(name);
  return { message, timestamp: Date.now() };
}

module.exports = { useGreeting };
```

### 3️⃣ 测试流程

```bash
# 在根目录创建测试文件
node test.js
```

**test.js**:

```javascript
const cli = require("./packages/cli");
const hooks = require("./packages/hooks");

console.log(cli.greet("World"));
console.log(hooks.useCustomHook(10));
```

### 4️⃣ 版本管理

```bash
# 升级所有包的版本号
pnpm version:patch   # 1.0.0 -> 1.0.1
pnpm version:minor   # 1.0.0 -> 1.1.0
pnpm version:major   # 1.0.0 -> 2.0.0

# 或者单独升级某个包
cd packages/cli
npm version patch
```

### 5️⃣ 发布到私仓（内部测试）

```bash
# 发布所有包
pnpm publish:all

# 或单独发布
pnpm publish:cli
pnpm publish:hooks

# 验证发布成功
# 访问 http://localhost:4873
# 可以看到已发布的包
```

### 6️⃣ 在其他项目中使用

```bash
# 新建一个测试项目
mkdir test-project
cd test-project
npm init -y

# 创建 .npmrc 文件
echo "registry=http://localhost:4873" > .npmrc

# 安装你发布的包
npm install @monorepo-test/cli
npm install @monorepo-test/hooks

# 使用
node index.js
```

**test-project/index.js**:

```javascript
const { greet, runCommand } = require("@monorepo-test/cli");
const { useCustomHook } = require("@monorepo-test/hooks");

console.log(greet("Alice"));
console.log(runCommand("test"));
console.log(useCustomHook(5));
```

### 7️⃣ 提交到 GitHub

```bash
# 回到 monorepo-test 项目
cd ../monorepo-test

# 提交代码
git add .
git commit -m "feat: add new features to cli and hooks"
git push origin main

# 创建版本标签（推荐）
git tag -a v1.0.1 -m "Release version 1.0.1"
git push origin v1.0.1
```

### 8️⃣ 发布到公共 npm（可选）

```bash
# 登录到 npm
npm login

# 修改发布目标（去掉 --registry 参数）
# 或者临时指定
pnpm --filter @monorepo-test/cli publish --registry https://registry.npmjs.org

# 发布后任何人都可以安装
npm install @monorepo-test/cli
```

---

## 为什么这样配置

### 🎯 pnpm 管理依赖的优势

#### 1. **磁盘空间节省**

```
传统方式（npm/yarn）:
project1/node_modules/lodash  ← 1.5MB
project2/node_modules/lodash  ← 1.5MB
project3/node_modules/lodash  ← 1.5MB
总计: 4.5MB

pnpm 方式:
~/.pnpm-store/lodash          ← 1.5MB (只存一份)
project1/node_modules/lodash  → 硬链接
project2/node_modules/lodash  → 硬链接
project3/node_modules/lodash  → 硬链接
总计: 1.5MB
```

#### 2. **安装速度对比**

```bash
# 实际测试（100个依赖的项目）
npm install    → 45秒
yarn install   → 35秒
pnpm install   → 15秒  ✨
```

#### 3. **严格的依赖管理（防止幽灵依赖）**

**npm/yarn 的问题**:

```javascript
// package.json 中没有声明 lodash
{
  "dependencies": {
    "express": "^4.0.0"  // express 依赖 lodash
  }
}

// 但你的代码可以直接用 lodash（错误！）
const _ = require('lodash');  // 能运行，但不应该
```

**pnpm 的优势**:

```javascript
// 同样的情况
const _ = require("lodash"); // ❌ 报错！必须显式声明依赖
```

#### 4. **Workspace 支持**

```yaml
# pnpm-workspace.yaml
packages:
  - "packages/*"
```

```json
// packages/hooks/package.json
{
  "dependencies": {
    "@monorepo-test/cli": "workspace:*" // 自动链接本地包
  }
}
```

### 🔧 统一使用 pnpm 的好处

```json
{
  "scripts": {
    // ✅ 统一工具链
    "publish:all": "pnpm -r publish ...",
    "publish:cli": "pnpm --filter @monorepo-test/cli publish ..."
  }
}
```

**优势**:

1. **一致性**: 开发和发布使用同一套工具
2. **简单**: 不需要安装多个包管理器
3. **速度**: pnpm publish 也很快
4. **可维护性**: 减少上下文切换

---

## Registry 配置详解

### 📍 三个配置的作用

#### 1. `.npmrc` - 项目级配置

```bash
registry=http://localhost:4873
```

**作用**:

- 控制 `pnpm install` / `npm install` 从哪里下载包
- 全局影响所有安装操作

**场景**:

```bash
# 会从 http://localhost:4873 下载
pnpm install lodash

# 除非显式指定
pnpm install lodash --registry https://registry.npmjs.org
```

#### 2. `publishConfig` - 包级配置

```json
// packages/cli/package.json
{
  "publishConfig": {
    "registry": "http://localhost:4873"
  }
}
```

**作用**:

- 只控制 `pnpm publish` 发布到哪里
- 只在发布时生效

**场景**:

```bash
# 会发布到 http://localhost:4873
cd packages/cli
pnpm publish
```

#### 3. 命令行参数 - 临时覆盖

```bash
pnpm publish --registry http://localhost:4873
```

**作用**:

- 临时覆盖前两个配置
- 优先级最高

### 🤔 它们是重复的吗？

**不是重复，而是分层防护！**

```
┌─────────────────────────────────────────────┐
│ 场景 1: 日常开发测试（发布到私仓）           │
├─────────────────────────────────────────────┤
│ .npmrc: registry=http://localhost:4873      │  ← 从私仓下载
│ publishConfig: http://localhost:4873        │  ← 发布到私仓
│ 命令行: --registry http://localhost:4873    │  ← 确保发布到私仓
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ 场景 2: 发布到公共 npm                       │
├─────────────────────────────────────────────┤
│ .npmrc: registry=http://localhost:4873      │  ← 还是从私仓下载依赖
│ publishConfig: http://localhost:4873        │  ← 默认发布到私仓
│ 命令行: --registry https://registry.npmjs.org │ ← 覆盖！发布到公网
└─────────────────────────────────────────────┘
```

### 💡 最佳实践建议

#### 方案 A: 灵活切换（推荐）

```json
// packages/cli/package.json
{
  "publishConfig": {
    "registry": "http://localhost:4873"
  }
}
```

```bash
# 发布到私仓（使用 publishConfig）
pnpm publish

# 发布到公网（命令行覆盖）
pnpm publish --registry https://registry.npmjs.org
```

#### 方案 B: 明确指定

```json
// package.json - 使用脚本区分
{
  "scripts": {
    "publish:local": "pnpm -r publish --registry http://localhost:4873",
    "publish:npm": "pnpm -r publish --registry https://registry.npmjs.org"
  }
}
```

### 🎭 三种配置的实际效果

```bash
# 测试 1: 无任何配置
pnpm publish
# ↓
# 发布到: https://registry.npmjs.org (npm 默认)

# 测试 2: 只有 .npmrc
# .npmrc: registry=http://localhost:4873
pnpm publish
# ↓
# 发布到: http://localhost:4873

# 测试 3: 只有 publishConfig
# publishConfig: { "registry": "http://localhost:4873" }
pnpm publish
# ↓
# 发布到: http://localhost:4873

# 测试 4: 三者都有，但命令行不同
# .npmrc + publishConfig + 命令行
pnpm publish --registry https://registry.npmjs.org
# ↓
# 发布到: https://registry.npmjs.org (命令行优先级最高！)
```

### 🔒 安全考虑

**问题**: 如果误操作把内部包发布到公网怎么办？

**解决方案 1: 使用 private 标记**

```json
{
  "name": "@company/internal-package",
  "private": true // ← 阻止任何 publish
}
```

**解决方案 2: 使用作用域 + registry 映射**

```bash
# .npmrc
@monorepo-test:registry=http://localhost:4873
@company:registry=http://internal-registry.company.com
```

---

## 常见问题

### Q1: Verdaccio 重启后数据会丢失吗？

**不会！** 数据存储在本地：

```yaml
# docker-compose.yml
volumes:
  - ./verdaccio/storage:/verdaccio/storage # 持久化存储
```

### Q2: 如何清理某个包的所有版本？

```bash
# 方法 1: 使用 npm unpublish
npm unpublish @monorepo-test/cli --force --registry http://localhost:4873

# 方法 2: 直接删除存储文件
rm -rf verdaccio/storage/@monorepo-test/cli
docker-compose restart
```

### Q3: 多人协作怎么共享 Verdaccio？

```yaml
# docker-compose.yml
services:
  verdaccio:
    ports:
      - "4873:4873"  # 局域网内可访问

# 团队成员的 .npmrc
registry=http://192.168.1.100:4873  # 替换为服务器 IP
```

### Q4: workspace 依赖发布后会变吗？

**会！** pnpm 会自动转换：

```json
// 开发时
{
  "dependencies": {
    "@monorepo-test/cli": "workspace:*"
  }
}

// 发布后（自动转换）
{
  "dependencies": {
    "@monorepo-test/cli": "^1.0.0"  // 指向实际版本
  }
}
```

### Q5: 如何回退到某个版本？

```bash
# 查看所有版本
npm view @monorepo-test/cli versions --registry http://localhost:4873

# 安装特定版本
npm install @monorepo-test/cli@1.0.0 --registry http://localhost:4873
```

### Q6: pnpm install 和 pnpm publish 的 registry 是独立的吗？

**是的！**

```bash
# install 使用 .npmrc 中的 registry（下载）
pnpm install
# ↓ 从 http://localhost:4873 下载

# publish 使用 publishConfig 或命令行参数（上传）
pnpm publish
# ↓ 发布到 publishConfig 指定的地址
```

---

## 🚀 快速命令参考

```bash
# 开发阶段
pnpm install                    # 安装所有依赖
pnpm add lodash -w              # 给根项目添加依赖
pnpm add lodash --filter cli    # 给 cli 包添加依赖

# 版本管理
pnpm version:patch              # 升级 patch 版本
pnpm version:minor              # 升级 minor 版本
pnpm version:major              # 升级 major 版本

# 发布
pnpm publish:all                # 发布所有包到私仓
pnpm publish:cli                # 发布 cli 到私仓
pnpm publish:hooks              # 发布 hooks 到私仓

# Verdaccio 管理
docker-compose up -d            # 启动私仓
docker-compose down             # 停止私仓
docker-compose logs -f          # 查看日志
docker-compose restart          # 重启私仓

# Git 管理
git tag v1.0.0                  # 创建标签
git push origin v1.0.0          # 推送标签
git tag -d v1.0.0               # 删除本地标签
git push origin :refs/tags/v1.0.0  # 删除远程标签
```

---

## 📖 推荐阅读

- [pnpm 官方文档](https://pnpm.io/zh/)
- [Verdaccio 官方文档](https://verdaccio.org/zh-CN/)
- [Monorepo 最佳实践](https://monorepo.tools/)
