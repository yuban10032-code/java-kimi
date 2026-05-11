const express = require('express');
const db = require('../config/database');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();
router.use(verifyToken);

router.get('/', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT 
        class_name,
        grade,
        major,
        COUNT(*) as student_count,
        COUNT(CASE WHEN gender = '男' THEN 1 END) as male_count,
        COUNT(CASE WHEN gender = '女' THEN 1 END) as female_count
       FROM students 
       WHERE status = 'active' AND class_name IS NOT NULL
       GROUP BY class_name, grade, major
       ORDER BY grade, class_name`
    );

    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('Get classes error:', err);
    res.status(500).json({ success: false, message: '获取班级列表失败' });
  }
});

router.get('/:className/students', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT * FROM students WHERE class_name = $1 AND status = 'active' ORDER BY student_no`,
      [req.params.className]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('Get class students error:', err);
    res.status(500).json({ success: false, message: '获取班级学生失败' });
  }
});

module.exports = router;
