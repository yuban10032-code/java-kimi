function validateStudent(data) {
    const errors = [];
    
    if (!data.student_no || data.student_no.length < 5) {
        errors.push('学号至少5个字符');
    }
    
    if (!data.name || data.name.length < 2) {
        errors.push('姓名至少2个字符');
    }
    
    if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
        errors.push('邮箱格式不正确');
    }
    
    if (data.phone && !/^1[3-9]\d{9}$/.test(data.phone)) {
        errors.push('手机号码格式不正确');
    }
    
    if (data.id_card && !/^\d{17}[\dXx]$/.test(data.id_card)) {
        errors.push('身份证号格式不正确');
    }
    
    return errors;
}

function validateScore(data) {
    const errors = [];
    
    if (!data.student_id || isNaN(data.student_id)) {
        errors.push('学生ID无效');
    }
    
    if (!data.course_name || data.course_name.length < 2) {
        errors.push('课程名称至少2个字符');
    }
    
    if (typeof data.score !== 'number' || data.score < 0 || data.score > 100) {
        errors.push('成绩必须在0-100之间');
    }
    
    return errors;
}

function sanitizeString(str) {
    if (typeof str !== 'string') return '';
    return str.trim().replace(/[<>]/g, '');
}

module.exports = { validateStudent, validateScore, sanitizeString };
