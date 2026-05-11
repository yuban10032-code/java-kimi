const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://student_admin:student_pass_2024@localhost:5432/student_management',
});

const MAJORS = ['计算机科学与技术', '软件工程', '人工智能', '数据科学', '网络安全', '电子信息工程', '通信工程', '自动化'];
const CLASSES = ['01班', '02班', '03班', '04班'];
const GRADES = ['2022级', '2023级', '2024级'];
const COURSES = [
  { name: '高等数学', code: 'MATH101', credit: 4.0 },
  { name: '大学英语', code: 'ENG101', credit: 3.0 },
  { name: '程序设计基础', code: 'CS101', credit: 4.0 },
  { name: '数据结构', code: 'CS102', credit: 4.0 },
  { name: '操作系统', code: 'CS201', credit: 4.0 },
  { name: '计算机网络', code: 'CS202', credit: 3.5 },
  { name: '数据库原理', code: 'CS203', credit: 4.0 },
  { name: '线性代数', code: 'MATH102', credit: 3.0 },
  { name: '概率论与数理统计', code: 'MATH103', credit: 3.0 },
  { name: '离散数学', code: 'MATH201', credit: 3.0 },
];

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function generateStudentNo(grade, index) {
  const year = grade.replace('级', '');
  return `${year}${String(index).padStart(4, '0')}`;
}

async function generateStudents(count = 100) {
  console.log(`生成 ${count} 名学生...`);
  
  for (let i = 0; i < count; i++) {
    const grade = randomChoice(GRADES);
    const major = randomChoice(MAJORS);
    const className = major.substring(0, 2) + grade.substring(2, 4) + randomChoice(CLASSES);
    
    const student = {
      student_no: generateStudentNo(grade, 1001 + i),
      name: `学生${i + 1}`,
      gender: Math.random() > 0.5 ? '男' : '女',
      birthday: randomDate(new Date(2003, 0, 1), new Date(2007, 11, 31)).toISOString().split('T')[0],
      phone: `138${String(randomInt(10000000, 99999999))}`,
      email: `student${i + 1}@student.edu`,
      major,
      class_name: className,
      grade,
      enrollment_date: `${grade.replace('级', '')}-09-01`,
      status: 'active',
    };

    try {
      const result = await pool.query(
        `INSERT INTO students (student_no, name, gender, birthday, phone, email, major, class_name, grade, enrollment_date, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id`,
        [student.student_no, student.name, student.gender, student.birthday, student.phone, 
         student.email, student.major, student.class_name, student.grade, student.enrollment_date, student.status]
      );

      const studentId = result.rows[0].id;
      
      // Generate scores for this student
      const numCourses = randomInt(3, 6);
      const selectedCourses = [...COURSES].sort(() => 0.5 - Math.random()).slice(0, numCourses);
      
      for (const course of selectedCourses) {
        const score = randomInt(55, 100);
        await pool.query(
          `INSERT INTO scores (student_id, course_name, course_code, score, credit, semester, exam_type)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [studentId, course.name, course.code, score, course.credit, '2024-2025-1', 'regular']
        );
      }
    } catch (err) {
      console.error(`生成学生 ${i + 1} 失败:`, err.message);
    }
  }

  console.log('测试数据生成完成！');
}

async function main() {
  try {
    await generateStudents(50);
    console.log('完成！');
  } catch (err) {
    console.error('错误:', err);
  } finally {
    await pool.end();
  }
}

main();
