const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://student_admin:student_pass_2024@localhost:5432/student_management',
});

pool.on('connect', () => {
  console.log('Agent connected to PostgreSQL database');
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};
