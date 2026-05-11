// 学生模块测试
const request = require('supertest');
const app = require('../server');

let token;

beforeAll(async () => {
  const res = await request(app)
    .post('/api/auth/login')
    .send({ username: 'admin', password: 'admin123' });
  token = res.body.data.token;
});

describe('Students API', () => {
  test('GET /api/students - 获取列表', async () => {
    const res = await request(app)
      .get('/api/students')
      .set('Authorization', `Bearer ${token}`);
    
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test('GET /api/students/:id - 获取详情', async () => {
    const res = await request(app)
      .get('/api/students/1')
      .set('Authorization', `Bearer ${token}`);
    
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('POST /api/students - 创建学生', async () => {
    const res = await request(app)
      .post('/api/students')
      .set('Authorization', `Bearer ${token}`)
      .send({
        student_no: 'TEST001',
        name: '测试学生',
        gender: '男',
        major: '测试专业',
      });
    
    expect([200, 201, 409]).toContain(res.status);
  });
});
