# 学生信息管理系统 - 长期记忆

## 项目概况
- **路径**: `c:\Users\yuban10032\WorkBuddy\20260511020652\`
- **名称**: 学生信息管理系统 (Student Management System)
- **当前版本**: v1.1.0
- **用途**: 管理学生各类信息的后台管理系统

## 技术栈
- 后端: Node.js + Express + PostgreSQL + WebSocket(ws)
- 前端: 原生 HTML/CSS/JS + Canvas 图表
- AI: OpenAI-compatible API (Agent 服务)
- 部署: Docker + Docker Compose + Flyway
- 测试: Jest + Supertest

## 关键配置
- 后端端口: 3001 (API) + /ws (WebSocket)
- Agent端口: 3002
- 前端端口: 8080 (nginx)
- 数据库: PostgreSQL 5432
- 默认账号: admin / admin123

## 项目结构要点
- `backend/routes/` - 15+ API 路由模块
- `frontend/*.html` - 15+ 页面
- `flyway/sql/` - V1~V4 数据库迁移
- `scripts/check-project.js` - 111 项结构自检

## 已交付功能模块
1. 登录认证 (JWT + bcrypt + 角色权限)
2. 学生管理 (CRUD + 搜索筛选分页批量操作)
3. 成绩管理 (录入统计)
4. 数据看板 (统计卡片 + Canvas 图表)
5. AI助手 (自然语言查询数据库)
6. 课程/班级管理
7. 操作日志
8. 数据导入/导出 (CSV)
9. 统计报表
10. WebSocket 实时通知
11. PWA 离线支持 (Service Worker)
12. 数据库备份/恢复
13. 性能监控
14. 前端缓存策略

## 注意事项
- 启动需 Docker Desktop 运行
- `npm install` 需在 backend/ 和 agent/ 目录分别执行
- WebSocket 连接地址硬编码为当前 hostname:3001/ws
- 前端 API_BASE 硬编码为 http://localhost:3001/api
