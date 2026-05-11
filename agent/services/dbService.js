const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000
});

pool.on('error', (err) => {
  console.error('[DB] Unexpected database error:', err.message);
});

const ALLOWED_TABLES = ['students', 'scores'];

/**
 * Validate that a SQL query is safe to execute
 * - Must be a SELECT statement
 * - Must only reference allowed tables
 * @param {string} sql - SQL query to validate
 * @returns {{safe: boolean, error?: string}} - Validation result
 */
function validateSQL(sql) {
  const trimmed = sql.trim().toLowerCase();

  // Must start with SELECT
  if (!trimmed.startsWith('select')) {
    return { safe: false, error: 'Only SELECT queries are allowed. Query does not start with SELECT.' };
  }

  // Block dangerous keywords
  const dangerousKeywords = [
    'insert ', 'update ', 'delete ', 'drop ', 'create ', 'alter ', 'truncate ',
    'grant ', 'revoke ', 'exec ', 'execute ', 'call ', 'copy ', 'load_file',
    'into outfile', 'into dumpfile', 'pg_read_file', 'pg_ls_dir'
  ];

  for (const keyword of dangerousKeywords) {
    if (trimmed.includes(keyword)) {
      return { safe: false, error: `Dangerous keyword detected: "${keyword.trim()}". Only read-only SELECT queries are permitted.` };
    }
  }

  // Check table whitelist using regex to find FROM and JOIN clauses
  const tableRegex = /(?:from|join)\s+([a-zA-Z_][a-zA-Z0-9_]*)/gi;
  let match;
  const foundTables = new Set();

  while ((match = tableRegex.exec(sql)) !== null) {
    foundTables.add(match[1].toLowerCase());
  }

  for (const table of foundTables) {
    if (!ALLOWED_TABLES.includes(table)) {
      return { safe: false, error: `Table "${table}" is not in the allowed tables list: ${ALLOWED_TABLES.join(', ')}.` };
    }
  }

  return { safe: true };
}

/**
 * Execute a validated SELECT query safely
 * @param {string} sql - Validated SQL query
 * @returns {Promise<Array>} - Query results
 */
async function executeQuery(sql) {
  const validation = validateSQL(sql);
  if (!validation.safe) {
    throw new Error(validation.error);
  }

  const client = await pool.connect();
  try {
    const result = await client.query(sql);
    return result.rows;
  } finally {
    client.release();
  }
}

/**
 * Get database schema information for context
 * @returns {Promise<Object>} - Schema info
 */
async function getSchemaInfo() {
  const client = await pool.connect();
  try {
    const tablesResult = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name = ANY($1)
      ORDER BY table_name
    `, [ALLOWED_TABLES]);

    const schema = {};
    for (const row of tablesResult.rows) {
      const columnsResult = await client.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = $1
        ORDER BY ordinal_position
      `, [row.table_name]);
      schema[row.table_name] = columnsResult.rows;
    }

    return schema;
  } finally {
    client.release();
  }
}

/**
 * Health check for database connection
 * @returns {Promise<boolean>}
 */
async function healthCheck() {
  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    return true;
  } catch (err) {
    return false;
  }
}

module.exports = {
  validateSQL,
  executeQuery,
  getSchemaInfo,
  healthCheck,
  ALLOWED_TABLES
};
