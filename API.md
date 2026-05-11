# API 端点文档

## 基础信息

- **Base URL**: `http://localhost:3001/api`
- **认证方式**: Bearer Token
- **请求头**: `Authorization: Bearer <jwt_token>`

## 认证

### POST /auth/login
用户登录

**请求体**:
```json
{
  "username": "admin",
  "password": "admin123"
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": 1,
      "username": "admin",
      "displayName": "系统管理员",
      "role": "admin"
    }
  }
}
```

### POST /auth/register
用户注册

**请求体**:
```json
{
  "username": "teacher1",
  "password": "password123",
  "displayName": "张老师",
  "email": "teacher@school.edu"
}
```

## 学生管理

### GET /students
获取学生列表

**查询参数**:
- `page` - 页码 (默认: 1)
- `limit` - 每页数量 (默认: 10, 最大: 100)
- `search` - 搜索关键词（学号/姓名/电话）
- `major` - 按专业筛选
- `class_name` - 按班级筛选
- `grade` - 按年级筛选
- `status` - 按状态筛选

**响应**:
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

### GET /students/:id
获取学生详情

### POST /students
创建学生

**请求体**:
```json
{
  "student_no": "2024001001",
  "name": "张三",
  "gender": "男",
  "birthday": "2005-01-01",
  "phone": "13800138001",
  "email": "zhangsan@edu.com",
  "major": "计算机科学与技术",
  "class_name": "计科2401",
  "grade": "2024级",
  "enrollment_date": "2024-09-01"
}
```

### PUT /students/:id
更新学生

### DELETE /students/:id
删除学生

### GET /students/metadata/options
获取筛选选项（专业、班级、年级列表）

## 成绩管理

### GET /scores
获取成绩列表

**查询参数**:
- `page` - 页码
- `limit` - 每页数量
- `student_id` - 按学生ID筛选
- `course_name` - 按课程名筛选
- `semester` - 按学期筛选

### GET /scores/student/:id
获取学生成绩统计

### POST /scores
录入成绩

**请求体**:
```json
{
  "student_id": 1,
  "course_name": "高等数学",
  "course_code": "MATH101",
  "score": 85.5,
  "credit": 4.0,
  "semester": "2024-2025-1",
  "exam_type": "regular"
}
```

## 数据看板

### GET /dashboard/stats
获取统计数据

**响应**:
```json
{
  "success": true,
  "data": {
    "totalStudents": 100,
    "totalCourses": 20,
    "avgScore": 82.5,
    "passRate": 95.2,
    "gradeDistribution": [...],
    "majorDistribution": [...],
    "recentStudents": [...]
  }
}
```

### GET /dashboard/charts
获取图表数据

## 课程管理

### GET /courses
获取课程列表

### GET /courses/stats/:courseName
获取课程成绩统计

## 班级管理

### GET /classes
获取班级列表

### GET /classes/:className/students
获取班级学生名单

## AI助手

### POST /agent/query
自然语言查询数据库

**请求体**:
```json
{
  "query": "查询计算机专业的学生有多少人"
}
```

**响应**:
```json
{
  "success": true,
  "data": [...],
  "sql": "SELECT COUNT(*) FROM students WHERE major = '计算机科学与技术'",
  "rowCount": 1
}
```

## 数据导入/导出

### POST /import/students
导入学生数据（CSV格式）

### GET /export/students
导出学生数据为CSV

### GET /export/scores
导出成绩数据为CSV

## 统计报表

### GET /reports/grade-summary
年级汇总统计

### GET /reports/major-summary
专业汇总统计

### GET /reports/score-analysis
课程成绩分析

## 系统管理

### GET /system/info
系统信息（管理员）

### GET /system/db-stats
数据库统计（管理员）

### GET /logs
操作日志（管理员）

### GET /analytics/daily-activity
每日活动统计

### GET /analytics/user-activity
用户活动排行

## 批量操作

### POST /batch/students/delete
批量删除学生

**请求体**:
```json
{
  "ids": [1, 2, 3]
}
```

### POST /batch/students/status
批量更新学生状态

**请求体**:
```json
{
  "ids": [1, 2, 3],
  "status": "graduated"
}
```

## 搜索

### GET /search/global?q=关键词
全局搜索

## 通知

### GET /notifications
获取通知列表

### GET /notifications?unread=true
获取未读通知

### PUT /notifications/:id/read
标记通知已读

### PUT /notifications/read-all
标记全部已读

## 健康检查

### GET /health
服务健康状态

**响应**:
```json
{
  "status": "ok",
  "timestamp": "2026-05-11T02:00:00.000Z"
}
```
