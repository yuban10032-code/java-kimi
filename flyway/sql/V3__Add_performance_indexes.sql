-- 添加性能优化索引

-- 学生表复合索引
CREATE INDEX IF NOT EXISTS idx_students_major_class ON students(major, class_name);
CREATE INDEX IF NOT EXISTS idx_students_grade_status ON students(grade, status);
CREATE INDEX IF NOT EXISTS idx_students_enrollment ON students(enrollment_date);

-- 成绩表复合索引
CREATE INDEX IF NOT EXISTS idx_scores_student_semester ON scores(student_id, semester);
CREATE INDEX IF NOT EXISTS idx_scores_course_semester ON scores(course_name, semester);
CREATE INDEX IF NOT EXISTS idx_scores_score ON scores(score);

-- 用户表索引
CREATE INDEX IF NOT EXISTS idx_users_username_active ON users(username, is_active);

-- 日志表分区准备（按时间范围查询优化）
CREATE INDEX IF NOT EXISTS idx_logs_action_target ON operation_logs(action, target_type);
