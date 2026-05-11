#!/bin/bash
# 数据库备份脚本

BACKUP_DIR="./backups"
DB_NAME="student_management"
DB_USER="student_admin"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/student_db_${TIMESTAMP}.sql"

mkdir -p ${BACKUP_DIR}

echo "开始备份数据库 ${DB_NAME}..."
docker exec student_db pg_dump -U ${DB_USER} -d ${DB_NAME} > ${BACKUP_FILE}

if [ $? -eq 0 ]; then
    echo "备份成功: ${BACKUP_FILE}"
    gzip ${BACKUP_FILE}
    echo "已压缩: ${BACKUP_FILE}.gz"
else
    echo "备份失败"
    exit 1
fi

# 清理7天前的备份
find ${BACKUP_DIR} -name "student_db_*.sql.gz" -mtime +7 -delete
echo "已清理7天前的旧备份"
