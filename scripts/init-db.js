const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://student_admin:student_pass_2024@localhost:5432/student_management',
});

async function init() {
  console.log('初始化数据库...');
  
  try {
    // Check if admin user exists
    const result = await pool.query("SELECT id FROM users WHERE username = 'admin'");
    
    if (result.rows.length === 0) {
      const bcrypt = require('bcryptjs');
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash('admin123', salt);
      
      await pool.query(
        'INSERT INTO users (username, password_hash, display_name, role, email) VALUES ($1, $2, $3, $4, $5)',
        ['admin', hash, '系统管理员', 'admin', 'admin@school.edu']
      );
      console.log('✓ 创建默认管理员账号');
    } else {
      console.log('✓ 管理员账号已存在');
    }

    // Check tables
    const tables = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
    console.log(`✓ 数据库包含 ${tables.rows.length} 个表`);
    
    tables.rows.forEach(t => {
      console.log(`  - ${t.table_name}`);
    });

    console.log('\n数据库初始化完成！');
  } catch (err) {
    console.error('初始化失败:', err.message);
  } finally {
    await pool.end();
  }
}

init();
