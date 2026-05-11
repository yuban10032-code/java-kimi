const { pool, query } = require('../config/database');
const { verifyToken, requireRole } = require('../middleware/auth');
const { broadcast } = require('../websocket');
const express = require('express');
const router = express.Router();

const TABLES = ['users', 'students', 'scores', 'operation_logs'];
const SENSITIVE_COLUMNS = ['password_hash'];

// Create backup
router.post('/create', verifyToken, requireRole('admin'), async (req, res, next) => {
    try {
        const { name, description, includeUsers = false } = req.body;
        const backupName = name || `backup_${new Date().toISOString().replace(/[:.]/g, '-')}`;

        const backup = {
            version: '1.0',
            createdAt: new Date().toISOString(),
            createdBy: req.user.username,
            name: backupName,
            description: description || '',
            tables: {}
        };

        for (const table of TABLES) {
            if (table === 'users' && !includeUsers) continue;

            const result = await query(`SELECT * FROM ${table} ORDER BY id`);
            backup.tables[table] = result.rows.map(row => {
                const cleaned = { ...row };
                SENSITIVE_COLUMNS.forEach(col => delete cleaned[col]);
                return cleaned;
            });
        }

        // Store backup metadata
        await query(
            `INSERT INTO backup_logs (name, description, created_by, data_size, table_count)
             VALUES ($1, $2, $3, $4, $5)`,
            [backupName, description, req.user.id, JSON.stringify(backup).length, Object.keys(backup.tables).length]
        );

        broadcast({
            type: 'notification',
            title: '备份完成',
            message: `数据库备份 "${backupName}" 创建成功`,
            notificationType: 'success'
        });

        res.json({
            success: true,
            message: '备份创建成功',
            data: backup
        });
    } catch (err) {
        next(err);
    }
});

// Download backup as JSON file
router.get('/download/:name', verifyToken, requireRole('admin'), async (req, res, next) => {
    try {
        const { name } = req.params;
        const { includeUsers = false } = req.query;

        const backup = {
            version: '1.0',
            createdAt: new Date().toISOString(),
            createdBy: req.user.username,
            name,
            tables: {}
        };

        for (const table of TABLES) {
            if (table === 'users' && includeUsers !== 'true') continue;
            const result = await query(`SELECT * FROM ${table} ORDER BY id`);
            backup.tables[table] = result.rows;
        }

        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="${name}.json"`);
        res.send(JSON.stringify(backup, null, 2));
    } catch (err) {
        next(err);
    }
});

// Restore from backup
router.post('/restore', verifyToken, requireRole('admin'), async (req, res, next) => {
    const client = await pool.connect();
    try {
        const { data, options = {} } = req.body;
        const { skipUsers = true, overwriteExisting = false } = options;

        if (!data || !data.tables) {
            return res.status(400).json({ success: false, message: '无效的备份数据' });
        }

        await client.query('BEGIN');

        // Truncate tables if overwrite
        if (overwriteExisting) {
            await client.query('TRUNCATE TABLE scores, students, operation_logs RESTART IDENTITY CASCADE');
            if (!skipUsers) {
                await client.query("DELETE FROM users WHERE username != 'admin'");
            }
        }

        // Restore each table
        const restored = {};
        for (const [table, rows] of Object.entries(data.tables)) {
            if (!TABLES.includes(table)) continue;
            if (table === 'users' && skipUsers) continue;
            if (!Array.isArray(rows) || rows.length === 0) continue;

            const columns = Object.keys(rows[0]).filter(c => c !== 'id');
            const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
            const columnNames = columns.join(', ');

            let count = 0;
            for (const row of rows) {
                const values = columns.map(c => row[c]);
                try {
                    await client.query(
                        `INSERT INTO ${table} (${columnNames}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`,
                        values
                    );
                    count++;
                } catch (e) {
                    console.error(`Restore row failed for ${table}:`, e.message);
                }
            }
            restored[table] = count;
        }

        await client.query('COMMIT');

        await query(
            'INSERT INTO backup_logs (name, description, created_by, action) VALUES ($1, $2, $3, $4)',
            [data.name || 'unknown', 'Restore operation', req.user.id, 'restore']
        );

        broadcast({
            type: 'notification',
            title: '恢复完成',
            message: '数据库恢复成功',
            notificationType: 'success'
        });

        res.json({
            success: true,
            message: '数据恢复成功',
            data: restored
        });
    } catch (err) {
        await client.query('ROLLBACK');
        next(err);
    } finally {
        client.release();
    }
});

// List backups
router.get('/list', verifyToken, requireRole('admin'), async (req, res, next) => {
    try {
        // Check if backup_logs table exists
        const tableCheck = await query(
            "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'backup_logs')"
        );

        if (!tableCheck.rows[0].exists) {
            return res.json({ success: true, data: [] });
        }

        const result = await query(
            'SELECT * FROM backup_logs ORDER BY created_at DESC LIMIT 50'
        );
        res.json({ success: true, data: result.rows });
    } catch (err) {
        next(err);
    }
});

// Export to CSV
router.post('/export-csv', verifyToken, async (req, res, next) => {
    try {
        const { table, filters = {} } = req.body;
        const allowedTables = ['students', 'scores'];
        if (!allowedTables.includes(table)) {
            return res.status(400).json({ success: false, message: '不支持的表' });
        }

        let sql = `SELECT * FROM ${table}`;
        const conditions = [];
        const values = [];

        if (filters.studentId) {
            conditions.push(`student_id = $${values.length + 1}`);
            values.push(filters.studentId);
        }
        if (filters.semester) {
            conditions.push(`semester = $${values.length + 1}`);
            values.push(filters.semester);
        }
        if (filters.major) {
            conditions.push(`major = $${values.length + 1}`);
            values.push(filters.major);
        }

        if (conditions.length > 0) {
            sql += ' WHERE ' + conditions.join(' AND ');
        }

        const result = await query(sql, values);
        const rows = result.rows;

        if (rows.length === 0) {
            return res.json({ success: false, message: '无数据可导出' });
        }

        const headers = Object.keys(rows[0]);
        const csvLines = [
            headers.join(','),
            ...rows.map(row => headers.map(h => {
                const val = row[h];
                if (val === null || val === undefined) return '';
                const str = String(val);
                if (str.includes(',') || str.includes('"') || str.includes('\n')) {
                    return '"' + str.replace(/"/g, '""') + '"';
                }
                return str;
            }).join(','))
        ];

        const csv = '\ufeff' + csvLines.join('\n');

        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${table}_export_${Date.now()}.csv"`);
        res.send(csv);
    } catch (err) {
        next(err);
    }
});

module.exports = router;
