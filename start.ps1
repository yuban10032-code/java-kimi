# 学生信息管理系统 - PowerShell启动脚本

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  学生信息管理系统 - 启动脚本" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check Docker
Write-Host "[1/4] 检查Docker环境..." -NoNewline
try {
    $dockerVersion = docker --version 2>$null
    Write-Host " OK" -ForegroundColor Green
} catch {
    Write-Host " 失败" -ForegroundColor Red
    Write-Host "[错误] Docker未安装或未运行" -ForegroundColor Red
    exit 1
}

# Start services
Write-Host "[2/4] 构建并启动服务..."
try {
    docker compose up -d --build
    Write-Host "      服务启动成功" -ForegroundColor Green
} catch {
    Write-Host "      启动失败" -ForegroundColor Red
    exit 1
}

# Wait for initialization
Write-Host "[3/4] 等待数据库初始化..." -NoNewline
Start-Sleep -Seconds 5
Write-Host " 完成" -ForegroundColor Green

# Check status
Write-Host "[4/4] 检查服务状态..."
docker compose ps

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  服务启动完成！" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "访问地址:" -ForegroundColor Yellow
Write-Host "  前端页面: http://localhost:8080"
Write-Host "  后端API:  http://localhost:3001"
Write-Host "  Agent:    http://localhost:3002"
Write-Host ""
Write-Host "默认账号:" -ForegroundColor Yellow
Write-Host "  用户名: admin"
Write-Host "  密码:   admin123"
Write-Host ""
Write-Host "常用命令:" -ForegroundColor Cyan
Write-Host "  查看日志: docker compose logs -f"
Write-Host "  停止服务: docker compose down"
Write-Host "  重启服务: docker compose restart"
Write-Host ""

Read-Host "按 Enter 键继续"
