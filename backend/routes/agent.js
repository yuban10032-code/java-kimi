const express = require('express');
const { body, validationResult } = require('express-validator');
const { query } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const logger = require('../middleware/logger');

const router = express.Router();

const parseQuery = (userQuery) => {
  const q = userQuery.toLowerCase().trim();

  if (/students?|all students/.test(q)) {
    return { type: 'students', sql: 'SELECT * FROM students ORDER BY created_at DESC LIMIT 50' };
  }

  if (/student.*name|find.*student|search.*student/.test(q)) {
    const nameMatch = userQuery.match(/name["']?\s*(?:is|:|=)?\s*["']?([^"',]+)["']?/i) ||
                      userQuery.match(/student["']?\s*(?:is|:|=|named)?\s*["']?([^"',]+)["']?/i);
    const name = nameMatch ? nameMatch[1].trim() : '%';
    return {
      type: 'students',
      sql: 'SELECT * FROM students WHERE name ILIKE $1 ORDER BY name',
      params: [`%${name}%`]
    };
  }

  if (/scores?|grades?|marks?/.test(q)) {
    return {
      type: 'scores',
      sql: `SELECT s.*, st.name as student_name, c.name as course_name
            FROM scores s
            JOIN students st ON s.student_id = st.id
            JOIN courses c ON s.course_id = c.id
            ORDER BY s.created_at DESC LIMIT 50`
    };
  }

  if (/average|mean|avg/.test(q)) {
    if (/course|subject/.test(q)) {
      return {
        type: 'statistics',
        sql: `SELECT c.name as course_name, AVG(s.score) as average_score, COUNT(*) as total_exams
              FROM scores s
              JOIN courses c ON s.course_id = c.id
              GROUP BY c.id, c.name
              ORDER BY average_score DESC`
      };
    }
    if (/student/.test(q)) {
      return {
        type: 'statistics',
        sql: `SELECT st.name, st.student_no, AVG(s.score) as average_score, COUNT(*) as exam_count
              FROM students st
              JOIN scores s ON st.id = s.student_id
              GROUP BY st.id, st.name, st.student_no
              ORDER BY average_score DESC
              LIMIT 20`
      };
    }
    return {
      type: 'statistics',
      sql: `SELECT AVG(score) as overall_average, MAX(score) as highest_score, MIN(score) as lowest_score, COUNT(*) as total_scores FROM scores`
    };
  }

  if (/count|how many|number of/.test(q)) {
    if (/student/.test(q)) {
      return { type: 'count', sql: 'SELECT COUNT(*) as count FROM students' };
    }
    if (/score|grade|exam/.test(q)) {
      return { type: 'count', sql: 'SELECT COUNT(*) as count FROM scores' };
    }
    if (/course/.test(q)) {
      return { type: 'count', sql: 'SELECT COUNT(*) as count FROM courses' };
    }
  }

  if (/course|subject/.test(q)) {
    return { type: 'courses', sql: 'SELECT * FROM courses ORDER BY name' };
  }

  if (/top|best|highest/.test(q)) {
    const limitMatch = q.match(/top\s*(\d+)/);
    const limit = limitMatch ? parseInt(limitMatch[1]) : 10;
    return {
      type: 'ranking',
      sql: `SELECT st.name, st.student_no, AVG(s.score) as average_score
            FROM students st
            JOIN scores s ON st.id = s.student_id
            GROUP BY st.id, st.name, st.student_no
            ORDER BY average_score DESC
            LIMIT $1`,
      params: [limit]
    };
  }

  if (/fail|failing|below 60|less than 60/.test(q)) {
    return {
      type: 'failing',
      sql: `SELECT st.name, st.student_no, c.name as course_name, s.score, s.exam_date
            FROM scores s
            JOIN students st ON s.student_id = st.id
            JOIN courses c ON s.course_id = c.id
            WHERE s.score < 60
            ORDER BY s.score ASC`
    };
  }

  if (/class/.test(q)) {
    const classMatch = userQuery.match(/class["']?\s*(?:is|:|=)?\s*["']?([^"',]+)["']?/i);
    if (classMatch) {
      const className = classMatch[1].trim();
      return {
        type: 'students',
        sql: 'SELECT * FROM students WHERE class = $1 ORDER BY name',
        params: [className]
      };
    }
    return {
      type: 'statistics',
      sql: `SELECT class, COUNT(*) as student_count, AVG(age) as average_age
            FROM students
            WHERE class IS NOT NULL
            GROUP BY class
            ORDER BY class`
    };
  }

  if (/male|female|gender/.test(q)) {
    return {
      type: 'statistics',
      sql: `SELECT gender, COUNT(*) as count FROM students GROUP BY gender`
    };
  }

  return {
    type: 'general',
    sql: `SELECT
            (SELECT COUNT(*) FROM students) as total_students,
            (SELECT COUNT(*) FROM scores) as total_scores,
            (SELECT COUNT(*) FROM courses) as total_courses,
            (SELECT AVG(score) FROM scores) as average_score`
  };
};

router.post('/query',
  authenticateToken,
  [body('query').trim().notEmpty().withMessage('Query is required')],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { query: userQuery } = req.body;
      logger.info(`Agent query received: ${userQuery}`);

      const parsed = parseQuery(userQuery);
      const result = await query(parsed.sql, parsed.params || []);

      logger.info(`Agent query executed: ${parsed.type}`);

      res.json({
        success: true,
        query: userQuery,
        interpretedAs: parsed.type,
        sql: parsed.sql,
        data: result.rows,
        rowCount: result.rowCount
      });
    } catch (error) {
      logger.error(`Agent query failed: ${error.message}`);
      next(error);
    }
  }
);

module.exports = router;
