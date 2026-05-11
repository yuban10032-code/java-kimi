function formatDate(date) {
  if (!date) return null;
  const d = new Date(date);
  return d.toISOString().split('T')[0];
}

function formatDateTime(date) {
  if (!date) return null;
  const d = new Date(date);
  return d.toISOString();
}

function calculateAge(birthDate) {
  if (!birthDate) return null;
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

function generateStudentNo(grade, sequence) {
  const year = grade.replace('级', '');
  return `${year}${String(sequence).padStart(4, '0')}`;
}

function maskPhone(phone) {
  if (!phone || phone.length < 7) return phone;
  return phone.substring(0, 3) + '****' + phone.substring(7);
}

function maskIdCard(idCard) {
  if (!idCard || idCard.length < 8) return idCard;
  return idCard.substring(0, 4) + '**********' + idCard.substring(idCard.length - 4);
}

function parsePagination(query) {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 10));
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}

function buildWhereClause(filters, startIndex = 1) {
  const conditions = [];
  const values = [];
  let index = startIndex;

  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== null && value !== '') {
      if (key.endsWith('_like')) {
        conditions.push(`${key.replace('_like', '')} ILIKE $${index}`);
        values.push(`%${value}%`);
      } else {
        conditions.push(`${key} = $${index}`);
        values.push(value);
      }
      index++;
    }
  }

  return {
    where: conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '',
    values,
    nextIndex: index,
  };
}

module.exports = {
  formatDate,
  formatDateTime,
  calculateAge,
  generateStudentNo,
  maskPhone,
  maskIdCard,
  parsePagination,
  buildWhereClause,
};
