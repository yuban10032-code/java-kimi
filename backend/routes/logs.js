const express = require('express');
const db = require('../config/database');
const { verifyToken, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(verifyToken);
router.use(requireRole('admin'));

router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const countResult = await db.query('SELECT COUNT(*) FROM operation_logs');
    const total = parseInt(countResult.rows[0].count);

    const result = await db.query(
      `SELECT ol.*, u.username, u.display_name 
       FROM operation_logs ol
       LEFT JOIN users u ON ol.user_id = u.id
       ORDER BY ol.created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    res.json({
      success: true,
      data: result.rows,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error('Get logs error:', err);
    res.status(500).json({ success: false, message: '获取日志失败' });
  }
});

module.exports = router;
