const express = require('express');
const db = require('../config/database');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();
router.use(verifyToken);

router.get('/grade-summary', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT 
        grade,
        COUNT(*) as total_students,
        COUNT(CASE WHEN gender = '男' THEN 1 END) as male_count,
        COUNT(CASE WHEN gender = '女' THEN 1 END) as female_count,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_count,
        COUNT(CASE WHEN status = 'graduated' THEN 1 END) as graduated_count
       FROM students
       GROUP BY grade
       ORDER BY grade`
    );

    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('Get grade summary error:', err);
    res.status(500).json({ success: false, message: '获取年级汇总失败' });
  }
});

router.get('/major-summary', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT 
        major,
        COUNT(*) as total_students,
        COUNT(DISTINCT class_name) as class_count,
        ROUND(AVG(EXTRACT(YEAR FROM AGE(CURRENT_DATE, birthday)))::numeric, 1) as avg_age
       FROM students
       WHERE status = 'active' AND major IS NOT NULL
       GROUP BY major
       ORDER BY total_students DESC`
    );

    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('Get major summary error:', err);
    res.status(500).json({ success: false, message: '获取专业汇总失败' });
  }
});

router.get('/score-analysis', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT 
        course_name,
        COUNT(*) as total_students,
        ROUND(AVG(score)::numeric, 2) as avg_score,
        MAX(score) as max_score,
        MIN(score) as min_score,
        ROUND(STDDEV(score)::numeric, 2) as std_dev,
        COUNT(CASE WHEN score >= 90 THEN 1 END) as excellent_count,
        COUNT(CASE WHEN score >= 60 AND score < 90 THEN 1 END) as pass_count,
        COUNT(CASE WHEN score < 60 THEN 1 END) as fail_count
       FROM scores
       GROUP BY course_name
       ORDER BY avg_score DESC`
    );

    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('Get score analysis error:', err);
    res.status(500).json({ success: false, message: '获取成绩分析失败' });
  }
});

module.exports = router;
