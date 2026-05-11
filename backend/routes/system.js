const express = require('express');
const os = require('os');
const db = require('../config/database');
const { verifyToken, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(verifyToken);
router.use(requireRole('admin'));

router.get('/info', async (req, res) => {
  try {
    const dbResult = await db.query("SELECT version()");
    const dbVersion = dbResult.rows[0].version;

    const uptime = process.uptime();
    const memoryUsage = process.memoryUsage();

    res.json({
      success: true,
      data: {
        nodeVersion: process.version,
        platform: process.platform,
        dbVersion,
        uptime: Math.floor(uptime),
        uptimeFormatted: formatUptime(uptime),
        memory: {
          rss: formatBytes(memoryUsage.rss),
          heapTotal: formatBytes(memoryUsage.heapTotal),
          heapUsed: formatBytes(memoryUsage.heapUsed),
        },
        cpu: os.cpus().length,
        hostname: os.hostname(),
        timestamp: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error('Get system info error:', err);
    res.status(500).json({ success: false, message: '获取系统信息失败' });
  }
});

router.get('/db-stats', async (req, res) => {
  try {
    const tableSizeResult = await db.query(
      `SELECT 
        schemaname,
        tablename,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
        pg_total_relation_size(schemaname||'.'||tablename) as size_bytes
       FROM pg_tables
       WHERE schemaname = 'public'
       ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC`
    );

    const indexResult = await db.query(
      `SELECT 
        schemaname,
        tablename,
        indexname,
        pg_size_pretty(pg_relation_size(indexrelid)) as size
       FROM pg_stat_user_indexes
       WHERE schemaname = 'public'
       ORDER BY pg_relation_size(indexrelid) DESC`
    );

    res.json({
      success: true,
      data: {
        tables: tableSizeResult.rows,
        indexes: indexResult.rows,
      },
    });
  } catch (err) {
    console.error('Get DB stats error:', err);
    res.status(500).json({ success: false, message: '获取数据库统计失败' });
  }
});

function formatUptime(seconds) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  return `${days}天 ${hours}小时 ${minutes}分 ${secs}秒`;
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

module.exports = router;
