# 学生信息管理系统

一个功能完善、生产就绪的学生信息管理系统，支持Docker部署、响应式布局和AI助手。

## 功能特性

### 核心功能
- **登录认证**：JWT token认证，支持管理员和教师角色
- **数据看板**：统计卡片、Canvas图表、实时数据
- **学生管理**：CRUD、搜索筛选、分页、批量操作
- **成绩管理**：成绩录入、统计、分析
- **课程管理**：课程列表、成绩分布统计
- **班级管理**：班级列表、学生名单

### AI与自动化
- **AI助手**：自然语言查询数据库（支持OpenAI-compatible API）
- **批量操作**：批量删除、批量更新状态
- **数据导入/导出**：CSV格式支持
- **全局搜索**：Ctrl+K快速搜索

### 系统功能
- **操作日志**：完整的操作审计
- **统计报表**：年级/专业/成绩多维分析
- **系统监控**：运行状态、数据库统计、性能指标
- **数据分析**：用户活动趋势、活跃度排行
- **通知系统**：实时通知、未读提醒、WebSocket推送
- **数据备份/恢复**：JSON备份、CSV导出、一键恢复

### 技术特性
- **响应式布局**：适配桌面、平板、手机
- **Docker部署**：一键启动所有服务
- **数据库迁移**：Flyway版本管理
- **性能优化**：数据库索引、请求缓存、前端缓存策略
- **安全**：速率限制、SQL注入防护、XSS防护
- **PWA支持**：Service Worker离线缓存、Manifest配置
- **实时通信**：WebSocket双向通信、心跳检测
- **快捷键**：完整的键盘操作支持

## 技术栈

| 层级 | 技术 |
|------|------|
| 后端 | Node.js + Express + PostgreSQL |
| 前端 | 原生HTML/CSS/JS + Canvas图表 |
| AI | OpenAI-compatible API |
| 数据库 | PostgreSQL 16 + Flyway |
| 容器化 | Docker + Docker Compose |
| 测试 | Jest + Supertest |

## 快速开始

### 环境要求
- Docker Desktop 4.0+
- 4GB RAM（推荐8GB）

### 1. 启动服务

Windows:
```bash
start.bat
```

Linux/Mac:
```bash
./start.sh
```

或手动:
```bash
docker compose up -d --build
```

### 2. 访问系统

| 服务 | 地址 |
|------|------|
| 前端页面 | http://localhost:8080 |
| 后端API | http://localhost:3001 |
| Agent服务 | http://localhost:3002 |

### 3. 默认账号
- 用户名：`admin`
- 密码：`admin123`

## 项目结构

```
.
├── docker-compose.yml          # Docker Compose配置
├── .env                        # 环境变量
├── README.md                   # 项目说明
├── API.md                      # API文档
├── DEPLOYMENT.md               # 部署指南
├── CHANGELOG.md                # 更新日志
├── start.bat / start.ps1       # Windows启动脚本
├── stop.bat                    # Windows停止脚本
├── flyway/                     # 数据库迁移
│   ├── conf/
│   └── sql/
│       ├── V1__Create_student_tables.sql
│       ├── V2__Insert_sample_data.sql
│       ├── V3__Add_performance_indexes.sql
│       └── V4__Add_backup_logs.sql
├── backend/                    # 后端API服务
│   ├── server.js
│   ├── package.json
│   ├── Dockerfile
│   ├── jest.config.js
│   ├── config/                 # 配置
│   ├── websocket.js            # WebSocket服务器
│   ├── middleware/             # 中间件（auth/performance/notify/rateLimit等）
│   ├── routes/                 # API路由
│   ├── utils/                  # 工具函数
│   └── tests/                  # Jest测试套件
├── frontend/                   # 前端页面
│   ├── index.html              # 登录页
│   ├── dashboard.html          # 数据看板
│   ├── students.html           # 学生管理
│   ├── student-form.html       # 学生表单
│   ├── scores.html             # 成绩管理
│   ├── courses.html            # 课程管理
│   ├── classes.html            # 班级管理
│   ├── agent.html              # AI助手
│   ├── reports.html            # 统计报表
│   ├── analytics.html          # 数据分析
│   ├── import.html             # 数据导入
│   ├── backup.html             # 数据备份/恢复
│   ├── logs.html               # 操作日志
│   ├── system.html             # 系统监控
│   ├── settings.html           # 系统设置
│   ├── profile.html            # 个人中心
│   ├── api-docs.html           # API文档
│   ├── 404.html                # 错误页面
│   ├── css/styles.css          # 样式
│   ├── js/app.js               # 主逻辑（含WebSocket、ServiceWorker）
│   ├── js/charts.js            # Canvas图表
│   ├── js/shortcuts.js         # 快捷键
│   ├── js/components.js        # 组件
│   ├── js/utils.js             # 工具函数
│   ├── js/cache.js             # 前端缓存管理器
│   ├── manifest.json           # PWA配置
│   ├── service-worker.js       # Service Worker离线缓存
│   ├── robots.txt              # 爬虫规则
│   └── Dockerfile
├── agent/                      # AI Agent服务
│   ├── server.js
│   ├── Dockerfile
│   └── routes/
├── monitor/                    # 监控自检
│   ├── health-check.js
│   ├── watch.js
│   └── self-check.sh
└── scripts/                    # 工具脚本
    ├── test-api.js
    ├── init-db.js
    ├── generate-test-data.js
    ├── check-project.js
    ├── backup-db.sh
    └── restore-db.sh
```

## API文档

详见 [API.md](API.md)

## 快捷键

| 快捷键 | 功能 |
|--------|------|
| Ctrl + K | 全局搜索 |
| Ctrl + / | 快捷键帮助 |
| Ctrl + S | 保存表单 |
| Ctrl + R | 刷新页面 |
| ESC | 关闭弹窗 |
| / | 聚焦搜索框 |
| N | 新增记录 |
| 1-6 | 快速导航 |

## 监控与自检

```bash
# 运行健康检查
node monitor/health-check.js

# 启动持续监控
node monitor/watch.js

# 项目结构检查
node scripts/check-project.js

# API测试
node scripts/test-api.js
```

## 部署

详见 [DEPLOYMENT.md](DEPLOYMENT.md)

## 许可证

[MIT](LICENSE)

