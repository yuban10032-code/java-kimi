const express = require('express');
const { body, param, validationResult } = require('express-validator');
const { query } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const logger = require('../middleware/logger');

const router = express.Router();

router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search, class: className, grade } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let sql = 'SELECT * FROM students WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    if (search) {
      sql += ` AND (name ILIKE $${paramIndex} OR student_no ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (className) {
      sql += ` AND class = $${paramIndex}`;
      params.push(className);
      paramIndex++;
    }

    if (grade) {
      sql += ` AND grade = $${paramIndex}`;
      params.push(grade);
      paramIndex++;
    }

    const countResult = await query(sql.replace('SELECT *', 'SELECT COUNT(*) as total'), params);
    const total = parseInt(countResult.rows[0].total);

    sql += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
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

router.get('/:id',
  authenticateToken,
  [param('id').isInt().withMessage('Invalid student ID')],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const result = await query('SELECT * FROM students WHERE id = $1', [id]);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Student not found' });
      }

      const scoresResult = await query(
        'SELECT s.*, c.name as course_name FROM scores s JOIN courses c ON s.course_id = c.id WHERE s.student_id = $1',
        [id]
      );

      res.json({
        ...result.rows[0],
        scores: scoresResult.rows
      });
    } catch (error) {
      next(error);
    }
  }
);

router.post('/',
  authenticateToken,
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('student_no').trim().notEmpty().withMessage('Student number is required'),
    body('gender').optional().isIn(['male', 'female', 'other']).withMessage('Gender must be male, female, or other'),
    body('age').optional().isInt({ min: 0, max: 120 }).withMessage('Age must be between 0 and 120'),
    body('email').optional().isEmail().withMessage('Invalid email format')
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, student_no, gender, age, class: className, grade, email, phone, address } = req.body;

      const existingResult = await query('SELECT id FROM students WHERE student_no = $1', [student_no]);
      if (existingResult.rows.length > 0) {
        return res.status(409).json({ error: 'Student number already exists' });
      }

      const result = await query(
        `INSERT INTO students (name, student_no, gender, age, class, grade, email, phone, address)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING *`,
        [name, student_no, gender || null, age || null, className || null, grade || null, email || null, phone || null, address || null]
      );

      logger.info(`Student created: ${result.rows[0].id}`);
      res.status(201).json(result.rows[0]);
    } catch (error) {
      next(error);
    }
  }
);

router.put('/:id',
  authenticateToken,
  [
    param('id').isInt().withMessage('Invalid student ID'),
    body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
    body('gender').optional().isIn(['male', 'female', 'other']).withMessage('Gender must be male, female, or other'),
    body('age').optional().isInt({ min: 0, max: 120 }).withMessage('Age must be between 0 and 120'),
    body('email').optional().isEmail().withMessage('Invalid email format')
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const { name, student_no, gender, age, class: className, grade, email, phone, address } = req.body;

      const existingResult = await query('SELECT * FROM students WHERE id = $1', [id]);
      if (existingResult.rows.length === 0) {
        return res.status(404).json({ error: 'Student not found' });
      }

      if (student_no) {
        const dupResult = await query('SELECT id FROM students WHERE student_no = $1 AND id != $2', [student_no, id]);
        if (dupResult.rows.length > 0) {
          return res.status(409).json({ error: 'Student number already exists' });
        }
      }

      const student = existingResult.rows[0];
      const result = await query(
        `UPDATE students SET
          name = $1, student_no = $2, gender = $3, age = $4, class = $5,
          grade = $6, email = $7, phone = $8, address = $9, updated_at = NOW()
         WHERE id = $10
         RETURNING *`,
        [
          name || student.name,
          student_no || student.student_no,
          gender !== undefined ? gender : student.gender,
          age !== undefined ? age : student.age,
          className !== undefined ? className : student.class,
          grade !== undefined ? grade : student.grade,
          email !== undefined ? email : student.email,
          phone !== undefined ? phone : student.phone,
          address !== undefined ? address : student.address,
          id
        ]
      );

      logger.info(`Student updated: ${id}`);
      res.json(result.rows[0]);
    } catch (error) {
      next(error);
    }
  }
);

router.delete('/:id',
  authenticateToken,
  [param('id').isInt().withMessage('Invalid student ID')],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;

      const existingResult = await query('SELECT id FROM students WHERE id = $1', [id]);
      if (existingResult.rows.length === 0) {
        return res.status(404).json({ error: 'Student not found' });
      }

      await query('DELETE FROM scores WHERE student_id = $1', [id]);
      await query('DELETE FROM students WHERE id = $1', [id]);

      logger.info(`Student deleted: ${id}`);
      res.json({ message: 'Student deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
