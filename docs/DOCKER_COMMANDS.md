# Docker Compose 命令说明

## 版本差异

Docker Compose 有两个版本：

| 版本          | 命令格式                  | 说明             |
| ------------- | ------------------------- | ---------------- |
| **V1 (旧版)** | `docker-compose` (连字符) | 独立安装的工具   |
| **V2 (新版)** | `docker compose` (空格)   | 集成在 Docker 中 |

## 检查你的版本

```bash
# 检查 Docker 版本
docker --version
# Docker version 28.5.1 表示是新版

# 检查 Compose 版本
docker compose version
# Docker Compose version v2.x.x 表示是 V2

# 如果你有旧版
docker-compose --version
# docker-compose version 1.x.x
```

## 本项目使用的命令

**你应该使用: `docker compose`** (空格)

### 常用命令对照表

| 操作     | V2 命令 (推荐)                     | V1 命令 (旧版)                     |
| -------- | ---------------------------------- | ---------------------------------- |
| 启动服务 | `docker compose up -d`             | `docker-compose up -d`             |
| 停止服务 | `docker compose down`              | `docker-compose down`              |
| 查看日志 | `docker compose logs -f`           | `docker-compose logs -f`           |
| 重启服务 | `docker compose restart`           | `docker-compose restart`           |
| 查看状态 | `docker compose ps`                | `docker-compose ps`                |
| 进入容器 | `docker compose exec verdaccio sh` | `docker-compose exec verdaccio sh` |

## 快速开始

### 1. 启动 Verdaccio

```bash
# 启动（后台运行）
docker compose up -d
```

输出示例：

```
[+] Running 1/1
 ✔ Container verdaccio  Started
```

### 2. 检查运行状态

```bash
# 查看容器状态
docker compose ps

# 或使用 docker 命令
docker ps
```

输出示例：

```
CONTAINER ID   IMAGE                     STATUS          PORTS
abc123def456   verdaccio/verdaccio      Up 10 seconds   0.0.0.0:4873->4873/tcp
```

### 3. 查看日志

```bash
# 查看所有日志
docker compose logs

# 实时查看日志
docker compose logs -f

# 只看最后 50 行
docker compose logs --tail=50
```

### 4. 访问 Verdaccio

```bash
# 在浏览器打开
open http://localhost:4873

# 或使用 curl 测试
curl http://localhost:4873
```

### 5. 停止服务

```bash
# 停止并删除容器（数据保留）
docker compose down

# 停止但不删除容器
docker compose stop
```

## 故障排查

### 问题 1: 命令不存在

```bash
# 如果提示 "docker: 'compose' is not a docker command"
# 说明你是旧版 Docker，使用:
docker-compose up -d

# 或者升级 Docker Desktop 到最新版
```

### 问题 2: 端口已被占用

```bash
# 错误: Bind for 0.0.0.0:4873 failed: port is already allocated

# 查找占用端口的进程
lsof -i :4873

# 停止占用的进程或修改 docker-compose.yml 中的端口
```

### 问题 3: 权限问题

```bash
# macOS 上如果遇到权限问题
sudo chown -R $(whoami) ./verdaccio

# 或者给目录正确的权限
chmod -R 755 ./verdaccio
```

### 问题 4: 容器无法启动

```bash
# 查看详细错误日志
docker compose logs verdaccio

# 删除容器重新创建
docker compose down
docker compose up -d

# 如果配置文件有问题，删除 storage
rm -rf ./verdaccio/storage
docker compose up -d
```

## 高级操作

### 进入容器内部

```bash
# 进入 verdaccio 容器
docker compose exec verdaccio sh

# 在容器内可以执行命令
ls -la /verdaccio/storage
cat /verdaccio/conf/config.yaml
exit
```

### 清理数据

```bash
# 停止服务
docker compose down

# 删除数据（谨慎！会删除所有已发布的包）
rm -rf ./verdaccio/storage

# 重新启动
docker compose up -d
```

### 重新构建

```bash
# 如果修改了配置文件
docker compose down
docker compose up -d --force-recreate
```

## 常见使用场景

### 场景 1: 每天开始工作

```bash
# 启动 Verdaccio
docker compose up -d

# 确认运行
curl http://localhost:4873

# 开始开发...
```

### 场景 2: 结束工作

```bash
# 停止服务（可选，也可以一直运行）
docker compose stop

# 或者完全清理
docker compose down
```

### 场景 3: 查看问题

```bash
# 查看实时日志
docker compose logs -f verdaccio

# 检查容器状态
docker compose ps

# 重启服务
docker compose restart
```

### 场景 4: 清理并重新开始

```bash
# 完全清理
docker compose down -v
rm -rf ./verdaccio/storage

# 重新启动
docker compose up -d
```

## 替代方案

如果 Docker 有问题，可以不使用 Docker：

```bash
# 全局安装 Verdaccio
npm install -g verdaccio

# 直接运行
verdaccio

# 配置文件位置: ~/.config/verdaccio/config.yaml
```

## 常用命令速查

```bash
# 启动
docker compose up -d

# 停止
docker compose down

# 日志
docker compose logs -f

# 状态
docker compose ps

# 重启
docker compose restart

# 进入容器
docker compose exec verdaccio sh

# 测试连接
curl http://localhost:4873
```

## 总结

- ✅ **新版 Docker**: 使用 `docker compose` (空格)
- ✅ **旧版 Docker**: 使用 `docker-compose` (连字符)
- ✅ **本项目**: 推荐使用新版命令
- ✅ **不想用 Docker**: 直接安装 `npm install -g verdaccio`
