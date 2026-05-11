const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { verifyToken } = require('../middleware/auth');
const { logOperation } = require('../middleware/logger');

const router = express.Router();
router.use(verifyToken);

router.post('/students/delete', [
  body('ids').isArray({ min: 1 }).withMessage('至少选择一个学生'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { ids } = req.body;

  try {
    const result = await db.query(
      'DELETE FROM students WHERE id = ANY($1::int[]) RETURNING id',
      [ids]
    );

    await logOperation(req.user.userId, 'BATCH_DELETE', 'student', null, { count: result.rowCount, ids }, req.ip);

    res.json({ success: true, message: `成功删除 ${result.rowCount} 名学生` });
  } catch (err) {
    console.error('Batch delete students error:', err);
    res.status(500).json({ success: false, message: '批量删除失败' });
  }
});

router.post('/students/status', [
  body('ids').isArray({ min: 1 }),
  body('status').isIn(['active', 'graduated', 'suspended']),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { ids, status } = req.body;

  try {
    const result = await db.query(
      'UPDATE students SET status = $1 WHERE id = ANY($2::int[]) RETURNING id',
      [status, ids]
    );

    await logOperation(req.user.userId, 'BATCH_UPDATE', 'student', null, { count: result.rowCount, status, ids }, req.ip);

    res.json({ success: true, message: `成功更新 ${result.rowCount} 名学生状态` });
  } catch (err) {
    console.error('Batch update status error:', err);
    res.status(500).json({ success: false, message: '批量更新失败' });
  }
});

router.post('/scores/delete', [
  body('ids').isArray({ min: 1 }),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { ids } = req.body;

  try {
    const result = await db.query(
      'DELETE FROM scores WHERE id = ANY($1::int[]) RETURNING id',
      [ids]
    );

    res.json({ success: true, message: `成功删除 ${result.rowCount} 条成绩记录` });
  } catch (err) {
    console.error('Batch delete scores error:', err);
    res.status(500).json({ success: false, message: '批量删除失败' });
  }
});

module.exports = router;
