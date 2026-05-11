# 部署指南

## 环境要求

- Docker Desktop 4.0+
- Docker Compose 2.0+
- 4GB RAM（推荐8GB）
- 10GB 磁盘空间

## 快速部署

### 1. 克隆项目

```bash
git clone <repository-url>
cd student-management-system
```

### 2. 配置环境变量

```bash
cp .env.example .env
# 编辑 .env 文件，配置AI API密钥（可选）
```

### 3. 启动服务

Windows:
```bash
start.bat
```

Linux/Mac:
```bash
./start.sh
```

或直接使用 Docker Compose:
```bash
docker compose up -d --build
```

### 4. 验证部署

```bash
# 检查容器状态
docker compose ps

# 查看日志
docker compose logs -f backend

# 测试API
curl http://localhost:3001/health
```

### 5. 访问系统

- 前端：http://localhost:8080
- 默认账号：admin / admin123

## 生产部署

### 1. 修改默认密码

```bash
# 进入数据库容器
docker compose exec db psql -U student_admin -d student_management

# 修改管理员密码
UPDATE users SET password_hash = '$2b$10$newhash' WHERE username = 'admin';
```

### 2. 配置HTTPS

使用反向代理（Nginx/Traefik）配置SSL证书。

### 3. 配置AI服务

在 `.env` 文件中设置：
```
AI_API_KEY=your_api_key
AI_API_URL=https://api.z.ai/v1
```

### 4. 数据库备份

```bash
# 手动备份
bash scripts/backup-db.sh

# 定时备份（Linux crontab）
0 2 * * * /path/to/scripts/backup-db.sh
```

## 故障排除

### 端口冲突

如果端口已被占用，修改 `docker-compose.yml` 中的端口映射：
```yaml
ports:
  - "8081:80"  # 改为其他端口
```

### 数据库连接失败

```bash
# 重启数据库服务
docker compose restart db

# 查看数据库日志
docker compose logs db
```

### Flyway迁移失败

```bash
# 手动运行迁移
docker compose run --rm flyway migrate

# 修复迁移
docker compose run --rm flyway repair
```

## 升级

```bash
# 拉取最新代码
git pull

# 重新构建并启动
docker compose down
docker compose up -d --build
```
