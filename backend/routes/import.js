const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();
router.use(verifyToken);

function parseCSV(csvText) {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) return [];
  
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  const rows = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
    const row = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx] || '';
    });
    rows.push(row);
  }
  
  return rows;
}

router.post('/students', [
  body('data').notEmpty().withMessage('数据不能为空'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { data } = req.body;
  
  try {
    let rows;
    if (typeof data === 'string') {
      rows = parseCSV(data);
    } else if (Array.isArray(data)) {
      rows = data;
    } else {
      return res.status(400).json({ success: false, message: '数据格式错误' });
    }

    const results = { success: 0, failed: 0, errors: [] };
    
    for (const row of rows) {
      try {
        await db.query(
          `INSERT INTO students (student_no, name, gender, birthday, phone, email, major, class_name, grade, enrollment_date, status)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
           ON CONFLICT (student_no) DO NOTHING`,
          [
            row.student_no || row['学号'],
            row.name || row['姓名'],
            row.gender || row['性别'] || null,
            row.birthday || row['出生日期'] || null,
            row.phone || row['电话'] || null,
            row.email || row['邮箱'] || null,
            row.major || row['专业'] || null,
            row.class_name || row['班级'] || null,
            row.grade || row['年级'] || null,
            row.enrollment_date || row['入学日期'] || null,
            row.status || row['状态'] || 'active',
          ]
        );
        results.success++;
      } catch (err) {
        results.failed++;
        results.errors.push({ row, error: err.message });
      }
    }

    res.json({ success: true, data: results });
  } catch (err) {
    console.error('Import students error:', err);
    res.status(500).json({ success: false, message: '导入失败' });
  }
});

module.exports = router;
