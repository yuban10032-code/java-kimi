const express = require('express');
const db = require('../config/database');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();
router.use(verifyToken);

router.get('/daily-activity', async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    
    const result = await db.query(
      `SELECT 
        DATE(created_at) as date,
        COUNT(*) as count,
        action
       FROM operation_logs
       WHERE created_at >= CURRENT_DATE - INTERVAL '${days} days'
       GROUP BY DATE(created_at), action
       ORDER BY date DESC`,
    );

    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('Get daily activity error:', err);
    res.status(500).json({ success: false, message: '获取活动统计失败' });
  }
});

router.get('/user-activity', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT 
        u.username,
        u.display_name,
        COUNT(ol.id) as action_count,
        MAX(ol.created_at) as last_action
       FROM users u
       LEFT JOIN operation_logs ol ON u.id = ol.user_id
       WHERE ol.created_at >= CURRENT_DATE - INTERVAL '7 days'
       GROUP BY u.id, u.username, u.display_name
       ORDER BY action_count DESC
       LIMIT 20`
    );

    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('Get user activity error:', err);
    res.status(500).json({ success: false, message: '获取用户活动失败' });
  }
});

module.exports = router;
