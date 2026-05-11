const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth');
const { getStats, getDatabaseStats, clearMetrics } = require('../middleware/performance');

router.get('/', verifyToken, requireRole('admin'), async (req, res, next) => {
    try {
        const { range = '1h' } = req.query;
        const rangeMap = { '1h': 3600000, '6h': 21600000, '24h': 86400000, '7d': 604800000 };
        const timeRange = rangeMap[range] || 3600000;

        const [appStats, dbStats] = await Promise.all([
            Promise.resolve(getStats(timeRange)),
            getDatabaseStats()
        ]);

        res.json({
            success: true,
            data: {
                app: appStats,
                database: dbStats,
                server: {
                    uptime: process.uptime(),
                    memoryUsage: process.memoryUsage(),
                    nodeVersion: process.version,
                    platform: process.platform
                }
            }
        });
    } catch (err) {
        next(err);
    }
});

router.post('/clear', verifyToken, requireRole('admin'), (req, res) => {
    clearMetrics();
    res.json({ success: true, message: '性能指标已清空' });
});

module.exports = router;
