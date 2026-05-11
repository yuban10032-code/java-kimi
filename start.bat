@echo off
chcp 65001 >nul
echo ========================================
echo  学生信息管理系统 - 启动脚本
echo ========================================
echo.

REM Check if docker is available
docker --version >nul 2>&1
if errorlevel 1 (
    echo [错误] Docker未安装或未运行，请先安装Docker Desktop
    pause
    exit /b 1
)

echo [1/4] 检查Docker环境... OK

echo [2/4] 构建并启动服务...
docker compose up -d --build

if errorlevel 1 (
    echo [错误] 启动失败
    pause
    exit /b 1
)

echo [3/4] 等待数据库初始化...
timeout /t 5 /nobreak >nul

echo [4/4] 检查服务状态...
docker compose ps

echo.
echo ========================================
echo  服务启动完成！
echo ========================================
echo.
echo 访问地址:
echo   前端页面: http://localhost:8080
echo   后端API:  http://localhost:3001
echo   Agent:    http://localhost:3002
echo.
echo 默认账号:
echo   用户名: admin
echo   密码:   admin123
echo.
echo 命令:
echo   查看日志: docker compose logs -f
echo   停止服务: docker compose down
echo   重启服务: docker compose restart
echo.
pause
