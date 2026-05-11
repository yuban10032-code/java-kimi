#!/bin/bash

# 学生信息管理系统自检脚本
# 运行环境: Docker Compose

echo "========== 学生管理系统自检 =========="
echo "检查时间: $(date)"
echo ""

# 检查Docker服务
echo "[1/6] 检查Docker服务..."
if docker ps >/dev/null 2>&1; then
    echo "  ✓ Docker服务正常"
else
    echo "  ✗ Docker服务未运行"
    exit 1
fi

# 检查容器状态
echo ""
echo "[2/6] 检查容器状态..."
containers=("student_db" "student_flyway" "student_backend" "student_frontend" "student_agent")
for container in "${containers[@]}"; do
    status=$(docker inspect -f '{{.State.Status}}' "$container" 2>/dev/null || echo "not_found")
    if [ "$status" = "running" ]; then
        echo "  ✓ $container 运行中"
    elif [ "$status" = "exited" ]; then
        echo "  ✗ $container 已停止，尝试重启..."
        docker restart "$container"
    else
        echo "  ✗ $container 不存在"
    fi
done

# 检查数据库连接
echo ""
echo "[3/6] 检查数据库连接..."
if docker exec student_db pg_isready -U student_admin >/dev/null 2>&1; then
    echo "  ✓ 数据库连接正常"
else
    echo "  ✗ 数据库连接失败"
fi

# 检查API健康
echo ""
echo "[4/6] 检查后端API..."
if curl -sf http://localhost:3001/health >/dev/null 2>&1; then
    echo "  ✓ 后端API正常"
else
    echo "  ✗ 后端API异常"
fi

# 检查前端
echo ""
echo "[5/6] 检查前端服务..."
if curl -sf http://localhost:8080 >/dev/null 2>&1; then
    echo "  ✓ 前端服务正常"
else
    echo "  ✗ 前端服务异常"
fi

# 检查Agent
echo ""
echo "[6/6] 检查Agent服务..."
if curl -sf http://localhost:3002/health >/dev/null 2>&1; then
    echo "  ✓ Agent服务正常"
else
    echo "  ✗ Agent服务异常"
fi

echo ""
echo "========== 自检完成 =========="
