const express = require('express');
const { body, param, validationResult } = require('express-validator');
const { query } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const logger = require('../middleware/logger');

const router = express.Router();

router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const { page = 1, limit = 10, student_id, course_id, min_score, max_score } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let sql = `
      SELECT s.*, st.name as student_name, st.student_no, c.name as course_name
      FROM scores s
      JOIN students st ON s.student_id = st.id
      JOIN courses c ON s.course_id = c.id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    if (student_id) {
      sql += ` AND s.student_id = $${paramIndex}`;
      params.push(parseInt(student_id));
      paramIndex++;
    }

    if (course_id) {
      sql += ` AND s.course_id = $${paramIndex}`;
      params.push(parseInt(course_id));
      paramIndex++;
    }

    if (min_score) {
      sql += ` AND s.score >= $${paramIndex}`;
      params.push(parseFloat(min_score));
      paramIndex++;
    }

    if (max_score) {
      sql += ` AND s.score <= $${paramIndex}`;
      params.push(parseFloat(max_score));
      paramIndex++;
    }

    const countResult = await query(
      sql.replace('SELECT s.*, st.name as student_name, st.student_no, c.name as course_name', 'SELECT COUNT(*) as total'),
      params
    );
    const total = parseInt(countResult.rows[0].total);

    sql += ` ORDER BY s.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(parseInt(limit), offset);

    const result = await query(sql, params);

    res.json({
      data: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    next(error);
  }
});

router.get('/student/:id',
  authenticateToken,
  [param('id').isInt().withMessage('Invalid student ID')],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;

      const studentResult = await query('SELECT id, name, student_no FROM students WHERE id = $1', [id]);
      if (studentResult.rows.length === 0) {
        return res.status(404).json({ error: 'Student not found' });
      }

      const scoresResult = await query(
        `SELECT s.*, c.name as course_name, c.code as course_code
         FROM scores s
         JOIN courses c ON s.course_id = c.id
         WHERE s.student_id = $1
         ORDER BY s.exam_date DESC`,
        [id]
      );

      const statsResult = await query(
        `SELECT
          AVG(score) as average_score,
          MAX(score) as highest_score,
          MIN(score) as lowest_score,
          COUNT(*) as total_exams
         FROM scores WHERE student_id = $1`,
        [id]
      );

      res.json({
        student: studentResult.rows[0],
        scores: scoresResult.rows,
        statistics: statsResult.rows[0]
      });
    } catch (error) {
      next(error);
    }
  }
);

router.post('/',
  authenticateToken,
  [
    body('student_id').isInt().withMessage('Valid student ID is required'),
    body('course_id').isInt().withMessage('Valid course ID is required'),
    body('score').isFloat({ min: 0, max: 100 }).withMessage('Score must be between 0 and 100'),
    body('exam_date').optional().isISO8601().withMessage('Invalid exam date format'),
    body('exam_type').optional().trim().notEmpty().withMessage('Exam type cannot be empty')
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { student_id, course_id, score, exam_date, exam_type, remark } = req.body;

      const studentResult = await query('SELECT id FROM students WHERE id = $1', [student_id]);
      if (studentResult.rows.length === 0) {
        return res.status(404).json({ error: 'Student not found' });
      }

      const courseResult = await query('SELECT id FROM courses WHERE id = $1', [course_id]);
      if (courseResult.rows.length === 0) {
        return res.status(404).json({ error: 'Course not found' });
      }

      const existingResult = await query(
        'SELECT id FROM scores WHERE student_id = $1 AND course_id = $2 AND exam_date = $3 AND exam_type = $4',
        [student_id, course_id, exam_date || null, exam_type || null]
      );
      if (existingResult.rows.length > 0) {
        return res.status(409).json({ error: 'Score record already exists for this exam' });
      }

      const result = await query(
        `INSERT INTO scores (student_id, course_id, score, exam_date, exam_type, remark)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [student_id, course_id, score, exam_date || null, exam_type || null, remark || null]
      );

      logger.info(`Score created: ${result.rows[0].id}`);
      res.status(201).json(result.rows[0]);
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
