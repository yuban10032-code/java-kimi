const express = require('express');
const db = require('../config/database');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();
router.use(verifyToken);

router.get('/global', async (req, res) => {
  const { q } = req.query;
  
  if (!q || q.length < 2) {
    return res.status(400).json({ success: false, message: '搜索关键词至少2个字符' });
  }

  try {
    const searchPattern = `%${q}%`;
    
    // Search students
    const studentsResult = await db.query(
      `SELECT id, student_no, name, major, class_name, 'student' as type
       FROM students
       WHERE name ILIKE $1 OR student_no ILIKE $1 OR phone ILIKE $1 OR major ILIKE $1
       LIMIT 10`,
      [searchPattern]
    );

    // Search scores
    const scoresResult = await db.query(
      `SELECT s.id, st.name, st.student_no, s.course_name, 'score' as type
       FROM scores s
       JOIN students st ON s.student_id = st.id
       WHERE st.name ILIKE $1 OR s.course_name ILIKE $1
       LIMIT 10`,
      [searchPattern]
    );

    res.json({
      success: true,
      data: {
        students: studentsResult.rows,
        scores: scoresResult.rows,
        total: studentsResult.rowCount + scoresResult.rowCount,
      },
    });
  } catch (err) {
    console.error('Global search error:', err);
    res.status(500).json({ success: false, message: '搜索失败' });
  }
});

module.exports = router;
