#!/bin/bash
# 数据库恢复脚本

if [ -z "$1" ]; then
    echo "用法: $0 <备份文件.sql.gz>"
    exit 1
fi

BACKUP_FILE=$1
DB_NAME="student_management"
DB_USER="student_admin"

echo "恢复数据库 ${DB_NAME} 从 ${BACKUP_FILE}..."

if [ -f "${BACKUP_FILE}.gz" ]; then
    gunzip -c "${BACKUP_FILE}.gz" | docker exec -i student_db psql -U ${DB_USER} -d ${DB_NAME}
elif [ -f "${BACKUP_FILE}" ]; then
    cat "${BACKUP_FILE}" | docker exec -i student_db psql -U ${DB_USER} -d ${DB_NAME}
else
    echo "备份文件不存在: ${BACKUP_FILE}"
    exit 1
fi

if [ $? -eq 0 ]; then
    echo "恢复成功"
else
    echo "恢复失败"
    exit 1
fi
