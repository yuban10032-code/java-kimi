const express = require('express');
const { query } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/stats', authenticateToken, async (req, res, next) => {
  try {
    const studentStats = await query(`
      SELECT
        COUNT(*) as total_students,
        COUNT(CASE WHEN gender = 'male' THEN 1 END) as male_count,
        COUNT(CASE WHEN gender = 'female' THEN 1 END) as female_count,
        COUNT(CASE WHEN gender = 'other' THEN 1 END) as other_count,
        AVG(age) as average_age
      FROM students
    `);

    const scoreStats = await query(`
      SELECT
        COUNT(*) as total_scores,
        AVG(score) as average_score,
        MAX(score) as highest_score,
        MIN(score) as lowest_score
      FROM scores
    `);

    const courseStats = await query(`
      SELECT c.name, COUNT(s.id) as exam_count, AVG(s.score) as average_score
      FROM courses c
      LEFT JOIN scores s ON c.id = s.course_id
      GROUP BY c.id, c.name
      ORDER BY average_score DESC NULLS LAST
    `);

    const classStats = await query(`
      SELECT class, COUNT(*) as student_count, AVG(age) as average_age
      FROM students
      WHERE class IS NOT NULL
      GROUP BY class
      ORDER BY class
    `);

    const gradeDistribution = await query(`
      SELECT
        CASE
          WHEN score >= 90 THEN 'A (90-100)'
          WHEN score >= 80 THEN 'B (80-89)'
          WHEN score >= 70 THEN 'C (70-79)'
          WHEN score >= 60 THEN 'D (60-69)'
          ELSE 'F (<60)'
        END as grade_range,
        COUNT(*) as count
      FROM scores
      GROUP BY
        CASE
          WHEN score >= 90 THEN 'A (90-100)'
          WHEN score >= 80 THEN 'B (80-89)'
          WHEN score >= 70 THEN 'C (70-79)'
          WHEN score >= 60 THEN 'D (60-69)'
          ELSE 'F (<60)'
        END
      ORDER BY grade_range
    `);

    res.json({
      students: studentStats.rows[0],
      scores: scoreStats.rows[0],
      courses: courseStats.rows,
      classes: classStats.rows,
      gradeDistribution: gradeDistribution.rows
    });
  } catch (error) {
    next(error);
  }
});

router.get('/charts', authenticateToken, async (req, res, next) => {
  try {
    const monthlyScores = await query(`
      SELECT
        DATE_TRUNC('month', exam_date) as month,
        COUNT(*) as exam_count,
        AVG(score) as average_score
      FROM scores
      WHERE exam_date IS NOT NULL
      GROUP BY DATE_TRUNC('month', exam_date)
      ORDER BY month
      LIMIT 12
    `);

    const topStudents = await query(`
      SELECT
        st.id,
        st.name,
        st.student_no,
        AVG(s.score) as average_score,
        COUNT(s.id) as exam_count
      FROM students st
      JOIN scores s ON st.id = s.student_id
      GROUP BY st.id, st.name, st.student_no
      HAVING COUNT(s.id) >= 2
      ORDER BY average_score DESC
      LIMIT 10
    `);

    const genderDistribution = await query(`
      SELECT
        COALESCE(gender, 'unknown') as gender,
        COUNT(*) as count
      FROM students
      GROUP BY gender
    `);

    const ageDistribution = await query(`
      SELECT
        CASE
          WHEN age < 15 THEN '<15'
          WHEN age BETWEEN 15 AND 17 THEN '15-17'
          WHEN age BETWEEN 18 AND 20 THEN '18-20'
          WHEN age BETWEEN 21 AND 23 THEN '21-23'
          ELSE '>23'
        END as age_group,
        COUNT(*) as count
      FROM students
      WHERE age IS NOT NULL
      GROUP BY
        CASE
          WHEN age < 15 THEN '<15'
          WHEN age BETWEEN 15 AND 17 THEN '15-17'
          WHEN age BETWEEN 18 AND 20 THEN '18-20'
          WHEN age BETWEEN 21 AND 23 THEN '21-23'
          ELSE '>23'
        END
      ORDER BY age_group
    `);

    res.json({
      monthlyScores: monthlyScores.rows.map(r => ({
        month: r.month,
        exam_count: parseInt(r.exam_count),
        average_score: parseFloat(r.average_score)
      })),
      topStudents: topStudents.rows.map(r => ({
        ...r,
        average_score: parseFloat(r.average_score),
        exam_count: parseInt(r.exam_count)
      })),
      genderDistribution: genderDistribution.rows,
      ageDistribution: ageDistribution.rows
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
