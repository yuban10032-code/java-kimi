const fetch = require('node-fetch');

const AI_API_KEY = process.env.AI_API_KEY;
const AI_API_URL = process.env.AI_API_URL;

const SYSTEM_PROMPT = `You are a PostgreSQL SQL query generator for a student management system.

Database Schema:

Table: students
- id (SERIAL PRIMARY KEY)
- student_no (VARCHAR(20), UNIQUE) - Student number
- name (VARCHAR(100)) - Student name
- gender (VARCHAR(10)) - Gender
- birthday (DATE) - Birth date
- id_card (VARCHAR(18), UNIQUE) - ID card number
- phone (VARCHAR(20)) - Phone number
- email (VARCHAR(100)) - Email
- address (TEXT) - Home address
- major (VARCHAR(100)) - Major
- class_name (VARCHAR(50)) - Class name
- grade (VARCHAR(20)) - Grade level
- enrollment_date (DATE) - Enrollment date
- status (VARCHAR(20), DEFAULT 'active') - Status: active/graduated/suspended
- photo_url (TEXT) - Photo URL
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)

Table: scores
- id (SERIAL PRIMARY KEY)
- student_id (INTEGER, REFERENCES students(id))
- course_name (VARCHAR(100)) - Course name
- course_code (VARCHAR(50)) - Course code
- score (DECIMAL(5,2)) - Score
- credit (DECIMAL(3,1)) - Credit
- semester (VARCHAR(20)) - Semester
- exam_type (VARCHAR(20), DEFAULT 'regular') - Exam type
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)

Rules:
1. Generate ONLY SELECT queries. No INSERT, UPDATE, DELETE, DROP, CREATE, ALTER, TRUNCATE, or any other modifying statements.
2. Only query from tables: students, scores.
3. Use proper PostgreSQL syntax.
4. When joining tables, use explicit JOIN syntax.
5. Return ONLY the raw SQL query, no markdown formatting, no explanations.
6. If the user asks something unrelated to the database, respond with: UNSAFE_QUERY: <reason>
7. Use parameterized-style safety in your reasoning, but output raw SQL for read-only queries.
8. Column names may be in Chinese; map them to the English column names above.
9. Common queries:
   - Student count: SELECT COUNT(*) FROM students
   - Average score: SELECT AVG(score) FROM scores WHERE course_name = 'xxx'
   - Top students: SELECT s.name, sc.score FROM students s JOIN scores sc ON s.id = sc.student_id ORDER BY sc.score DESC LIMIT n
   - Students by major: SELECT * FROM students WHERE major = 'xxx'
   - Failing scores: SELECT s.name, sc.course_name, sc.score FROM students s JOIN scores sc ON s.id = sc.student_id WHERE sc.score < 60

Response format: Return ONLY the SQL query string, nothing else.`;

/**
 * Send a natural language query to the AI API and get SQL back
 * @param {string} userQuery - Natural language query from user
 * @returns {Promise<string>} - Generated SQL or error message
 */
async function generateSQL(userQuery) {
  if (!AI_API_KEY || !AI_API_URL) {
    throw new Error('AI_API_KEY and AI_API_URL environment variables must be set');
  }

  const response = await fetch(AI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${AI_API_KEY}`
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userQuery }
      ],
      temperature: 0.1,
      max_tokens: 500
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`AI API error (${response.status}): ${errorText}`);
  }

  const data = await response.json();

  if (!data.choices || data.choices.length === 0) {
    throw new Error('AI API returned empty response');
  }

  const sql = data.choices[0].message.content.trim();
  return sql;
}

/**
 * Send a natural language query and get both SQL and explanation
 * @param {string} userQuery - Natural language query from user
 * @param {string} sql - The generated SQL query
 * @param {Array} results - Query execution results
 * @returns {Promise<string>} - Explanation from AI
 */
async function generateExplanation(userQuery, sql, results) {
  if (!AI_API_KEY || !AI_API_URL) {
    throw new Error('AI_API_KEY and AI_API_URL environment variables must be set');
  }

  const explanationPrompt = `You are a helpful assistant explaining SQL query results for a student management system.

User asked: "${userQuery}"

SQL executed: ${sql}

Results (first 10 rows shown): ${JSON.stringify(results.slice(0, 10), null, 2)}

Provide a brief, clear explanation of what the query does and summarize the results in natural language. Keep it concise (2-4 sentences).`;

  const response = await fetch(AI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${AI_API_KEY}`
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You explain SQL query results in simple, natural language.' },
        { role: 'user', content: explanationPrompt }
      ],
      temperature: 0.3,
      max_tokens: 300
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`AI API error (${response.status}): ${errorText}`);
  }

  const data = await response.json();

  if (!data.choices || data.choices.length === 0) {
    throw new Error('AI API returned empty response');
  }

  return data.choices[0].message.content.trim();
}

module.exports = {
  generateSQL,
  generateExplanation
};
