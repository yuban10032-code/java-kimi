-- 创建备份日志表
CREATE TABLE IF NOT EXISTS backup_logs (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL COMMENT '备份名称',
    description TEXT COMMENT '备份描述',
    created_by INTEGER REFERENCES users(id),
    data_size BIGINT COMMENT '数据大小(字节)',
    table_count INTEGER DEFAULT 0 COMMENT '备份表数量',
    action VARCHAR(20) DEFAULT 'backup' COMMENT '操作类型: backup/restore',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE backup_logs IS '数据库备份日志表';

CREATE INDEX IF NOT EXISTS idx_backup_logs_created_at ON backup_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_backup_logs_created_by ON backup_logs(created_by);
