@echo off
chcp 65001 >nul
echo ========================================
echo  学生信息管理系统 - 停止脚本
echo ========================================
echo.

docker compose down

echo.
echo 服务已停止
echo.
pause
