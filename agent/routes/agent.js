const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');

const router = express.Router();

const AI_API_URL = process.env.AI_API_URL || 'https://api.z.ai/v1';
const AI_API_KEY = process.env.AI_API_KEY;
const AI_PROVIDER = process.env.AI_PROVIDER || 'openai';
const AI_MODEL = process.env.AI_MODEL || 'MiniMax-M2.7';

const SYSTEM_PROMPT = `你是一个学生信息管理系统数据库助手。你的任务是根据用户的自然语言问题，生成安全的PostgreSQL SQL查询语句。

可用表结构：
1. students (学生表)
   - id: 主键
   - student_no: 学号
   - name: 姓名
   - gender: 性别 (男/女)
   - birthday: 出生日期
   - id_card: 身份证号
   - phone: 电话
   - email: 邮箱
   - address: 地址
   - major: 专业
   - class_name: 班级
   - grade: 年级
   - enrollment_date: 入学日期
   - status: 状态 (active/graduated/suspended)

2. scores (成绩表)
   - id: 主键
   - student_id: 学生ID (关联students.id)
   - course_name: 课程名称
   - course_code: 课程代码
   - score: 成绩 (0-100)
   - credit: 学分
   - semester: 学期 (如: 2024-2025-1)
   - exam_type: 考试类型

规则：
- 只生成SELECT语句
- 不要生成INSERT/UPDATE/DELETE/DROP等修改语句
- 如果用户要求修改数据，拒绝并说明权限不足
- 查询尽量使用中文列别名
- 对于统计查询，使用ROUND保留2位小数
- 关联查询时使用JOIN`;

function detectProvider() {
  if (AI_PROVIDER !== 'auto') return AI_PROVIDER;
  if (AI_API_URL.includes('minimaxi') || AI_API_URL.includes('anthropic')) return 'anthropic';
  return 'openai';
}

async function callAI(messages) {
  if (!AI_API_KEY) {
    throw new Error('AI API未配置，请设置AI_API_KEY环境变量');
  }

  const provider = detectProvider();

  try {
    if (provider === 'anthropic') {
      // Anthropic / MiniMax Token Plan format
      const userMessages = messages.filter(m => m.role !== 'system');
      const systemMsg = messages.find(m => m.role === 'system');

      const response = await fetch(`${AI_API_URL}/v1/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': AI_API_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: AI_MODEL,
          max_tokens: 1024,
          system: systemMsg ? systemMsg.content : SYSTEM_PROMPT,
          messages: userMessages.map(m => ({
            role: m.role,
            content: [{ type: 'text', text: m.content }]
          })),
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`AI API错误 (${response.status}): ${errorText}`);
      }

      const data = await response.json();
      if (!data.content || !data.content[0]) {
        throw new Error('AI API返回无效响应: ' + JSON.stringify(data));
      }
      return data.content[0].text;
    } else {
      // OpenAI compatible format
      const response = await fetch(`${AI_API_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${AI_API_KEY}`,
        },
        body: JSON.stringify({
          model: AI_MODEL,
          messages,
          temperature: 0.1,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`AI API错误 (${response.status}): ${errorText}`);
      }

      const data = await response.json();
      if (!data.choices || !data.choices[0]) {
        throw new Error('AI API返回无效响应');
      }
      return data.choices[0].message.content;
    }
  } catch (err) {
    console.error('AI API call error:', err);
    throw err;
  }
}

function extractSQL(text) {
  const sqlMatch = text.match(/```sql\s*([\s\S]*?)```/);
  if (sqlMatch) return sqlMatch[1].trim();
  
  const selectMatch = text.match(/SELECT[\s\S]*?;/i);
  if (selectMatch) return selectMatch[0].trim();
  
  return text.trim();
}

function isSafeSQL(sql) {
  const upper = sql.toUpperCase();
  const forbidden = ['INSERT', 'UPDATE', 'DELETE', 'DROP', 'TRUNCATE', 'ALTER', 'CREATE', 'GRANT', 'REVOKE'];
  return !forbidden.some(keyword => upper.includes(keyword));
}

function sanitizeSQL(sql) {
  // Additional safety: ensure it starts with SELECT
  const trimmed = sql.trim();
  if (!trimmed.toUpperCase().startsWith('SELECT')) {
    throw new Error('只允许SELECT查询');
  }
  return trimmed;
}

router.post('/query', [
  body('query').notEmpty().withMessage('查询内容不能为空'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { query } = req.body;

  try {
    // Check if AI is configured
    if (!AI_API_KEY) {
      // Fallback: direct search without AI
      const fallbackResult = await db.query(
        `SELECT * FROM students 
         WHERE name ILIKE $1 OR student_no ILIKE $1 OR major ILIKE $1 
         LIMIT 20`,
        [`%${query}%`]
      );
      return res.json({
        success: true,
        data: fallbackResult.rows,
        sql: `-- AI未配置，使用基础搜索\nSELECT * FROM students WHERE name ILIKE '%${query}%' OR student_no ILIKE '%${query}%' LIMIT 20`,
        note: 'AI服务未配置，使用基础搜索模式',
      });
    }

    const aiMessages = [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: `请为以下问题生成SQL查询（只返回SQL，不要解释）：\n\n${query}` },
    ];

    const aiResponse = await callAI(aiMessages);
    const sql = extractSQL(aiResponse);

    if (!sql.toUpperCase().startsWith('SELECT')) {
      return res.status(400).json({
        success: false,
        message: 'AI生成的查询不是SELECT语句',
        aiResponse,
      });
    }

    if (!isSafeSQL(sql)) {
      return res.status(400).json({
        success: false,
        message: '检测到不安全的SQL操作，只允许查询',
        sql,
      });
    }

    const safeSQL = sanitizeSQL(sql);
    const result = await db.query(safeSQL);

    res.json({
      success: true,
      data: result.rows,
      sql: safeSQL,
      rowCount: result.rowCount,
    });
  } catch (err) {
    console.error('Agent query error:', err);
    res.status(500).json({
      success: false,
      message: err.message || '查询失败',
    });
  }
});

router.post('/explain', [
  body('query').notEmpty().withMessage('查询内容不能为空'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { query } = req.body;

  try {
    const result = await db.query(
      `SELECT * FROM students 
       WHERE name ILIKE $1 OR student_no ILIKE $1 OR major ILIKE $1 
       LIMIT 10`,
      [`%${query}%`]
    );

    if (!AI_API_KEY) {
      return res.json({
        success: true,
        data: result.rows,
        explanation: `找到 ${result.rows.length} 条相关记录（AI未配置，无法生成自然语言解释）`,
      });
    }

    const aiMessages = [
      { role: 'system', content: '你是学生信息管理助手。根据查询结果，用自然语言回答用户的问题。' },
      { role: 'user', content: `问题：${query}\n\n查询结果：${JSON.stringify(result.rows, null, 2)}\n\n请用中文回答：` },
    ];

    const aiResponse = await callAI(aiMessages);

    res.json({
      success: true,
      data: result.rows,
      explanation: aiResponse,
    });
  } catch (err) {
    console.error('Agent explain error:', err);
    res.status(500).json({
      success: false,
      message: err.message || '解释失败',
    });
  }
});

router.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    aiConfigured: !!AI_API_KEY,
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
