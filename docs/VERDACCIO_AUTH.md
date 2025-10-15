# Verdaccio 用户认证完全指南

## 为什么默认禁用用户注册？

Verdaccio 默认配置 `max_users: -1` 是禁用用户注册的，这是出于安全考虑：

### 安全原因

1. **防止公开暴露** - 如果 Verdaccio 暴露在公网，任何人都可以注册
2. **企业内部使用** - 大多数私仓用于公司内部，只需要少数固定用户
3. **资源控制** - 避免恶意用户注册大量账号占用资源
4. **合规要求** - 企业环境需要严格控制访问权限

### 使用场景

```
┌─────────────────────────────────────────────────────────┐
│               使用场景决策树                             │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  个人学习/小团队开发？                                    │
│         ↓ 是                                             │
│    启用注册 (方式 1)                                      │
│    max_users: 1000                                       │
│                                                          │
│  生产环境/企业内部？                                      │
│         ↓ 是                                             │
│    禁用注册 + 预创建用户 (方式 2)                         │
│    或使用免认证模式 (方式 3)                              │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

## 方式 1: 允许用户自主注册（推荐用于开发/测试）

### 配置文件

```yaml
# verdaccio/config/config.yaml
auth:
  htpasswd:
    file: /verdaccio/conf/htpasswd
    max_users: 1000 # 允许最多 1000 个用户
    # 或者不设置 max_users，表示无限制
```

### 使用步骤

```bash
# 1. 修改配置后重启 Verdaccio
docker compose restart

# 2. 注册新用户
npm adduser --registry http://localhost:4873
# 输入用户名: test
# 输入密码: test123
# 输入邮箱: test@example.com

# 3. 验证登录
npm whoami --registry http://localhost:4873

# 4. 发布包
pnpm publish:cli
```

### 优点和缺点

**优点**:

- ✅ 每个开发者可以自己注册
- ✅ 适合小团队快速开始
- ✅ 方便测试和学习

**缺点**:

- ❌ 如果暴露在公网不安全
- ❌ 无法集中管理用户

## 方式 2: 禁用注册 + 管理员预创建用户（推荐用于生产环境）

### 配置文件

```yaml
# verdaccio/config/config.yaml
auth:
  htpasswd:
    file: /verdaccio/conf/htpasswd
    max_users: -1 # 禁用注册
```

### 预创建用户

#### 方法 A: 使用 htpasswd 工具

```bash
# 1. 安装 htpasswd（macOS/Linux）
brew install httpd  # macOS
# 或
sudo apt-get install apache2-utils  # Linux

# 2. 创建用户文件
htpasswd -bc ./verdaccio/config/htpasswd admin admin123
htpasswd -b ./verdaccio/config/htpasswd developer dev123
htpasswd -b ./verdaccio/config/htpasswd tester test123

# 3. 重启 Verdaccio
docker compose restart

# 4. 用户直接登录（不需要注册）
npm login --registry http://localhost:4873
# 用户名: admin
# 密码: admin123
```

#### 方法 B: 临时启用注册创建用户

```bash
# 1. 临时修改配置允许注册
# 在 config.yaml 中设置 max_users: 10

# 2. 重启 Verdaccio
docker compose restart

# 3. 创建所需的用户
npm adduser --registry http://localhost:4873  # 用户1
npm adduser --registry http://localhost:4873  # 用户2

# 4. 创建完成后，改回禁用注册
# 在 config.yaml 中设置 max_users: -1

# 5. 再次重启
docker compose restart

# 现在只有已创建的用户可以登录，无法注册新用户
```

#### 方法 C: 手动编辑 htpasswd 文件

```bash
# 1. 生成密码哈希（使用 Node.js）
node -e "console.log(require('crypto').createHash('sha1').update('mypassword').digest('hex'))"

# 2. 手动编辑 htpasswd 文件
# verdaccio/config/htpasswd
admin:{SHA}hashed_password_here:autocreated 2025-10-15T00:00:00.000Z
```

### 优点和缺点

**优点**:

- ✅ 更安全，防止未授权访问
- ✅ 集中管理用户
- ✅ 适合生产环境

**缺点**:

- ❌ 需要管理员手动创建用户
- ❌ 增加了初始设置复杂度

## 方式 3: 完全免认证模式（仅用于本地开发）

### 配置文件

```yaml
# verdaccio/config/config.yaml
auth:
  htpasswd:
    file: /verdaccio/conf/htpasswd

packages:
  "@*/*":
    access: $all
    publish: $all # 任何人都可以发布
    unpublish: $all # 任何人都可以取消发布
    proxy: npmjs

  "**":
    access: $all
    publish: $all
    unpublish: $all
    proxy: npmjs
```

### 使用

```bash
# 无需登录，直接发布
pnpm publish:cli

# 无需登录，直接安装
npm install @monorepo-test/cli --registry http://localhost:4873
```

### 优点和缺点

**优点**:

- ✅ 最简单，无需任何认证
- ✅ 适合纯本地开发测试

**缺点**:

- ❌ 完全没有安全性
- ❌ 不适合任何共享环境
- ❌ 不推荐用于生产

## 推荐配置（本项目）

### 开发/学习阶段

已经为你配置好了：

```yaml
auth:
  htpasswd:
    file: /verdaccio/conf/htpasswd
    max_users: 1000 # ✅ 允许注册
```

```bash
# 1. 确保 Verdaccio 运行
docker compose ps

# 2. 注册用户（第一次）
npm adduser --registry http://localhost:4873

# 3. 后续登录
npm login --registry http://localhost:4873

# 4. 检查登录状态
npm whoami --registry http://localhost:4873
```

## 常见问题

### Q1: 忘记密码怎么办？

```bash
# 删除用户，重新注册
# 1. 停止 Verdaccio
docker compose down

# 2. 编辑 htpasswd 文件，删除对应用户行
vim ./verdaccio/config/htpasswd

# 3. 重启
docker compose up -d

# 4. 重新注册
npm adduser --registry http://localhost:4873
```

### Q2: 如何查看所有注册的用户？

```bash
# 查看 htpasswd 文件
cat ./verdaccio/config/htpasswd

# 输出示例：
# test:$apr1$xxx:autocreated 2025-10-15T00:00:00.000Z
# admin:$apr1$yyy:autocreated 2025-10-15T00:00:00.000Z
```

### Q3: 多台电脑如何共享同一个账号？

```bash
# 方法 1: 在每台电脑上登录
npm login --registry http://localhost:4873

# 方法 2: 复制 .npmrc 文件（不安全，不推荐）
# ~/.npmrc 包含了认证 token
```

### Q4: CI/CD 环境如何认证？

```bash
# 方法 1: 使用 npm token
npm token create --registry http://localhost:4873

# 方法 2: 使用环境变量
export NPM_TOKEN="your-token-here"

# .npmrc
//localhost:4873/:_authToken=${NPM_TOKEN}
```

### Q5: 报错 "user registration disabled"？

```bash
# 原因: max_users: -1
# 解决方案:

# 方法 1: 修改配置启用注册
# verdaccio/config/config.yaml
auth:
  htpasswd:
    max_users: 1000  # 改为 > 0

# 重启
docker compose restart

# 方法 2: 使用管理员预创建的账号
npm login --registry http://localhost:4873
```

### Q6: 如何重置所有用户？

```bash
# 1. 停止服务
docker compose down

# 2. 删除用户文件
rm ./verdaccio/config/htpasswd

# 3. 重启服务
docker compose up -d

# 4. 重新注册
npm adduser --registry http://localhost:4873
```

## 安全最佳实践

### 本地开发

```yaml
# ✅ 推荐配置
auth:
  htpasswd:
    max_users: 1000

packages:
  "@*/*":
    access: $all # 所有人可以下载
    publish: $authenticated # 只有登录用户可以发布
```

### 团队内网

```yaml
# ✅ 推荐配置
auth:
  htpasswd:
    max_users: -1 # 禁用注册，管理员创建用户

packages:
  "@*/*":
    access: $authenticated # 只有登录用户可以访问
    publish: $authenticated
```

### 公网环境（不推荐直接暴露）

```bash
# 如果必须暴露到公网，使用以下措施：

# 1. 使用 HTTPS
# 2. 配置反向代理（Nginx/Caddy）
# 3. 添加 IP 白名单
# 4. 使用 VPN
# 5. 启用速率限制
```

## 快速命令参考

```bash
# 注册新用户
npm adduser --registry http://localhost:4873

# 登录已有用户
npm login --registry http://localhost:4873

# 查看当前登录用户
npm whoami --registry http://localhost:4873

# 登出
npm logout --registry http://localhost:4873

# 查看所有用户（查看文件）
cat ./verdaccio/config/htpasswd

# 删除某个用户（手动编辑文件）
vim ./verdaccio/config/htpasswd
# 删除对应行，然后重启: docker compose restart
```

## 总结

| 场景           | 推荐方式 | 配置                         |
| -------------- | -------- | ---------------------------- |
| **个人学习**   | 方式 1   | `max_users: 1000`            |
| **小团队开发** | 方式 1   | `max_users: 100`             |
| **公司内网**   | 方式 2   | `max_users: -1` + 预创建用户 |
| **纯本地测试** | 方式 3   | `publish: $all`              |

**本项目已配置为方式 1**，你现在可以直接使用：

```bash
npm adduser --registry http://localhost:4873
```

如果还有问题，请查看：

- Verdaccio 日志: `docker compose logs -f`
- htpasswd 文件: `cat ./verdaccio/config/htpasswd`
