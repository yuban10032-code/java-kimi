const express = require('express');
const db = require('../config/database');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();
router.use(verifyToken);

router.get('/students', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM students ORDER BY student_no');
    
    const headers = ['学号', '姓名', '性别', '出生日期', '身份证号', '电话', '邮箱', '专业', '班级', '年级', '入学日期', '状态'];
    const rows = result.rows.map(s => [
      s.student_no, s.name, s.gender || '', s.birthday || '', s.id_card || '', s.phone || '',
      s.email || '', s.major || '', s.class_name || '', s.grade || '', s.enrollment_date || '', s.status
    ]);

    let csv = '\ufeff' + headers.join(',') + '\n';
    rows.forEach(row => {
      csv += row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',') + '\n';
    });

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=students.csv');
    res.send(csv);
  } catch (err) {
    console.error('Export students error:', err);
    res.status(500).json({ success: false, message: '导出失败' });
  }
});

router.get('/scores', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT s.student_no, s.name, sc.course_name, sc.course_code, sc.score, sc.credit, sc.semester, sc.exam_type
       FROM scores sc
       JOIN students s ON sc.student_id = s.id
       ORDER BY sc.semester DESC, s.student_no`
    );

    const headers = ['学号', '姓名', '课程', '课程代码', '成绩', '学分', '学期', '考试类型'];
    const rows = result.rows.map(r => [
      r.student_no, r.name, r.course_name, r.course_code || '', r.score, r.credit || '', r.semester || '', r.exam_type
    ]);

    let csv = '\ufeff' + headers.join(',') + '\n';
    rows.forEach(row => {
      csv += row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',') + '\n';
    });

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=scores.csv');
    res.send(csv);
  } catch (err) {
    console.error('Export scores error:', err);
    res.status(500).json({ success: false, message: '导出失败' });
  }
});

module.exports = router;
