const express = require('express');
const { body, param, validationResult } = require('express-validator');
const db = require('../config/database');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();
router.use(verifyToken);

router.get('/', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT DISTINCT course_name, course_code FROM scores ORDER BY course_name'
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('Get courses error:', err);
    res.status(500).json({ success: false, message: '获取课程列表失败' });
  }
});

router.get('/stats/:courseName', async (req, res) => {
  try {
    const courseName = req.params.courseName;
    
    const statsResult = await db.query(
      `SELECT 
        COUNT(*) as total_students,
        ROUND(AVG(score)::numeric, 2) as avg_score,
        MAX(score) as max_score,
        MIN(score) as min_score,
        COUNT(CASE WHEN score >= 60 THEN 1 END) as pass_count,
        COUNT(CASE WHEN score < 60 THEN 1 END) as fail_count
       FROM scores WHERE course_name = $1`,
      [courseName]
    );

    const distributionResult = await db.query(
      `SELECT 
        CASE 
          WHEN score >= 90 THEN '优秀'
          WHEN score >= 80 THEN '良好'
          WHEN score >= 70 THEN '中等'
          WHEN score >= 60 THEN '及格'
          ELSE '不及格'
        END as grade,
        COUNT(*) as count
       FROM scores WHERE course_name = $1
       GROUP BY 
        CASE 
          WHEN score >= 90 THEN '优秀'
          WHEN score >= 80 THEN '良好'
          WHEN score >= 70 THEN '中等'
          WHEN score >= 60 THEN '及格'
          ELSE '不及格'
        END`,
      [courseName]
    );

    res.json({
      success: true,
      data: {
        stats: statsResult.rows[0],
        distribution: distributionResult.rows,
      },
    });
  } catch (err) {
    console.error('Get course stats error:', err);
    res.status(500).json({ success: false, message: '获取课程统计失败' });
  }
});

module.exports = router;
