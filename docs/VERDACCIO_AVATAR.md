# Verdaccio 头像显示配置指南

## 问题现象

在 Verdaccio Web 界面 (http://localhost:4873) 查看已发布的包时，发现无法显示发布者的头像。

## 解决方案

### 方式 1: 使用 Gravatar（推荐，已配置）

Verdaccio 默认使用 **Gravatar** 服务来显示用户头像。

#### 配置步骤

**1. 在 Verdaccio 配置文件中启用 Gravatar**

```yaml
# verdaccio/config/config.yaml
web:
  title: Monorepo Test Registry
  gravatar: true # ✅ 启用 Gravatar
```

**2. 注册用户时使用有效邮箱**

```bash
npm adduser --registry http://localhost:4873
# 用户名: yourname
# 密码: yourpassword
# 邮箱: your.email@example.com  # ← 重要！使用真实邮箱
```

**3. 在 Gravatar 注册头像**

访问 [Gravatar 官网](https://gravatar.com/) 完成以下步骤：

```
1. 访问 https://gravatar.com/
2. 注册账号（使用与 npm 注册相同的邮箱）
3. 上传头像图片
4. 等待几分钟缓存更新
5. 刷新 Verdaccio 页面
```

**4. 验证头像显示**

```bash
# 1. 发布一个包
pnpm publish:cli

# 2. 访问 Verdaccio Web 界面
open http://localhost:4873

# 3. 点击查看包详情
# 应该能看到发布者头像
```

#### Gravatar 工作原理

```
用户注册 → 提供邮箱 → Verdaccio 计算 MD5 → 请求 Gravatar
     ↓
user@example.com
     ↓
MD5(user@example.com) = 5e884898da28047151d0e56f8dc62927
     ↓
https://www.gravatar.com/avatar/5e884898da28047151d0e56f8dc62927
     ↓
返回头像图片或默认头像
```

### 方式 2: 自定义头像 URL（高级）

如果不想使用 Gravatar，可以配置自定义头像服务。

#### 配置示例

```yaml
# verdaccio/config/config.yaml
web:
  title: Monorepo Test Registry
  gravatar: false # 禁用 Gravatar

  # 使用自定义头像服务
  # 例如：公司内部头像服务
  logo: https://your-company.com/logo.png
```

### 方式 3: 禁用头像显示

如果不需要显示头像，可以完全禁用。

```yaml
# verdaccio/config/config.yaml
web:
  title: Monorepo Test Registry
  gravatar: false
```

## 常见问题

### Q1: 配置了 Gravatar 但头像不显示？

**原因和解决方案：**

1. **邮箱没有在 Gravatar 注册**

   ```bash
   # 解决：访问 https://gravatar.com/ 注册
   ```

2. **使用了无效邮箱**

   ```bash
   # 查看当前用户邮箱
   cat ./verdaccio/config/htpasswd

   # 输出示例：
   # test:$apr1$xxx:autocreated 2025-10-15T00:00:00.000Z

   # 重新注册使用正确邮箱
   npm adduser --registry http://localhost:4873
   ```

3. **Gravatar 缓存未更新**

   ```bash
   # 等待 5-10 分钟，或者强制刷新浏览器
   # Chrome: Cmd+Shift+R (Mac) / Ctrl+Shift+R (Windows)
   # Firefox: Cmd+Shift+R (Mac) / Ctrl+F5 (Windows)
   ```

4. **网络问题无法访问 Gravatar**

   ```bash
   # 测试是否能访问 Gravatar
   curl -I https://www.gravatar.com/

   # 如果无法访问，使用方式 2 或 3
   ```

### Q2: 如何快速测试头像功能？

**使用已有 Gravatar 邮箱测试：**

```bash
# 一些已知的测试邮箱（有 Gravatar 头像）
npm adduser --registry http://localhost:4873
# 邮箱: test@example.com (会显示默认头像)

# 或使用你自己的 GitHub 邮箱
# GitHub 用户的头像会自动关联到 Gravatar
```

### Q3: 如何批量为多个用户设置头像？

**方案 1: 要求团队成员注册 Gravatar**

```bash
# 1. 给团队发送邮件
"请访问 https://gravatar.com/ 注册并上传头像
使用与 npm 注册相同的邮箱"

# 2. 团队成员完成后自动生效
```

**方案 2: 使用公司内部头像服务**

```yaml
# 配置自定义头像 API
web:
  gravatar: false
  # 自定义实现需要修改 Verdaccio 源码
```

### Q4: 头像显示很慢怎么办？

**原因**: Gravatar 在国外，访问可能较慢

**解决方案**:

1. **使用 Gravatar 国内镜像**

   ```yaml
   # 需要修改 Verdaccio 源码，不推荐
   ```

2. **禁用头像**

   ```yaml
   web:
     gravatar: false
   ```

3. **使用缓存代理**
   ```nginx
   # Nginx 配置缓存 Gravatar 请求
   location /avatar/ {
     proxy_pass https://www.gravatar.com/avatar/;
     proxy_cache gravatar_cache;
     proxy_cache_valid 200 30d;
   }
   ```

### Q5: 如何查看包的发布者信息？

```bash
# 方法 1: Web 界面查看
open http://localhost:4873

# 方法 2: 使用 npm 命令
npm view @monorepo-test/cli --registry http://localhost:4873

# 方法 3: 查看包的 package.json
npm pack @monorepo-test/cli --registry http://localhost:4873
tar -xzf monorepo-test-cli-1.0.0.tgz
cat package/package.json | grep author
```

## 完整配置示例

### 推荐配置（本项目）

```yaml
# verdaccio/config/config.yaml
storage: /verdaccio/storage

web:
  title: Monorepo Test Registry
  gravatar: true # 启用 Gravatar 头像
  sort_packages: asc # 包排序方式
  # darkMode: true            # 深色模式（可选）
  # logo: /path/to/logo.png   # 自定义 Logo（可选）

auth:
  htpasswd:
    file: /verdaccio/conf/htpasswd
    max_users: 1000

packages:
  "@*/*":
    access: $all
    publish: $authenticated
    unpublish: $authenticated
    proxy: npmjs

  "**":
    access: $all
    publish: $authenticated
    unpublish: $authenticated
    proxy: npmjs

server:
  keepAliveTimeout: 60

middlewares:
  audit:
    enabled: true

logs: { type: stdout, format: pretty, level: http }
```

### 企业配置（高安全）

```yaml
web:
  title: Company Private Registry
  gravatar: false # 禁用外部服务
  logo: /internal/logo.png # 使用内部 Logo

auth:
  htpasswd:
    file: /verdaccio/conf/htpasswd
    max_users: -1 # 禁用注册

packages:
  "@company/*":
    access: $authenticated # 只有登录用户可访问
    publish: $authenticated
    unpublish: $authenticated
```

## 设置步骤总结

### 快速设置（5 分钟）

```bash
# 1. 确认配置已更新（已完成）
cat verdaccio/config/config.yaml | grep gravatar
# 应该看到: gravatar: true

# 2. 重启 Verdaccio（已完成）
docker compose restart

# 3. 注册新用户（使用真实邮箱）
npm adduser --registry http://localhost:4873
# 邮箱: your-real-email@example.com

# 4. 在 Gravatar 注册头像
# 访问: https://gravatar.com/
# 使用相同邮箱注册并上传头像

# 5. 发布包测试
pnpm publish:cli

# 6. 查看效果
open http://localhost:4873
```

### 完整设置（包含 Gravatar）

```bash
# 1. 访问 Gravatar
open https://gravatar.com/

# 2. 注册账号
# 使用你的邮箱: your@example.com

# 3. 验证邮箱
# 查收验证邮件并点击链接

# 4. 上传头像
# 选择图片 → 裁剪 → 选择等级 → 保存

# 5. 在 Verdaccio 中使用相同邮箱注册
npm adduser --registry http://localhost:4873
# 邮箱: your@example.com  # 必须相同！

# 6. 等待 5-10 分钟缓存更新

# 7. 刷新浏览器查看
open http://localhost:4873
```

## 验证配置

### 检查配置是否生效

```bash
# 1. 检查配置文件
cat verdaccio/config/config.yaml | grep -A 3 "web:"

# 应该看到:
# web:
#   title: Monorepo Test Registry
#   gravatar: true

# 2. 检查 Verdaccio 是否运行
docker compose ps

# 3. 查看日志
docker compose logs -f verdaccio

# 4. 访问 Web 界面
open http://localhost:4873

# 5. 发布测试包
pnpm publish:cli

# 6. 查看包详情页
# 应该能看到包信息和发布者
```

### 测试 Gravatar 连接

```bash
# 测试是否能访问 Gravatar API
curl -I https://www.gravatar.com/avatar/00000000000000000000000000000000

# 应该返回:
# HTTP/2 200
# content-type: image/jpeg
```

## 额外功能

### Web 界面其他配置选项

```yaml
web:
  title: Monorepo Test Registry
  gravatar: true

  # 自定义 Logo
  logo: https://your-domain.com/logo.png

  # 主要颜色
  primary_color: "#4b5e40"

  # 深色模式
  darkMode: true

  # 自定义 HTML 页脚
  footer: "© 2025 Your Company"

  # 包列表排序
  sort_packages: asc # asc 或 desc
```

## 故障排查

```bash
# 问题: 头像不显示

# 1. 检查配置
cat verdaccio/config/config.yaml | grep gravatar

# 2. 检查用户邮箱
cat verdaccio/config/htpasswd

# 3. 测试 Gravatar API
EMAIL_MD5=$(echo -n "your@example.com" | md5)
curl "https://www.gravatar.com/avatar/$EMAIL_MD5"

# 4. 查看浏览器控制台
# 打开 http://localhost:4873
# 按 F12 查看网络请求
# 查找失败的头像请求

# 5. 清除浏览器缓存
# Chrome: Cmd+Shift+Delete (Mac) / Ctrl+Shift+Delete (Windows)

# 6. 重启 Verdaccio
docker compose restart
```

## 参考资源

- [Verdaccio 官方文档 - Web UI](https://verdaccio.org/docs/webui)
- [Gravatar 官网](https://gravatar.com/)
- [Verdaccio GitHub](https://github.com/verdaccio/verdaccio)

## 总结

✅ **已配置完成**:

- 启用了 Gravatar 头像支持
- 配置了 Web 界面标题
- 允许用户注册

📝 **使用 Gravatar 的步骤**:

1. 在 https://gravatar.com/ 注册
2. 使用相同邮箱在 Verdaccio 注册
3. 等待缓存更新（5-10 分钟）
4. 刷新浏览器查看

💡 **如果不想用 Gravatar**:

- 设置 `gravatar: false` 禁用头像显示
- 或者配置自定义头像服务

现在你可以访问 http://localhost:4873 查看效果了！
