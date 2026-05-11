// 看板模块测试
const request = require('supertest');
const app = require('../server');

let token;

beforeAll(async () => {
  const res = await request(app)
    .post('/api/auth/login')
    .send({ username: 'admin', password: 'admin123' });
  token = res.body.data.token;
});

describe('Dashboard API', () => {
  test('GET /api/dashboard/stats - 统计数据', async () => {
    const res = await request(app)
      .get('/api/dashboard/stats')
      .set('Authorization', `Bearer ${token}`);
    
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.totalStudents).toBeDefined();
  });

  test('GET /api/dashboard/charts - 图表数据', async () => {
    const res = await request(app)
      .get('/api/dashboard/charts')
      .set('Authorization', `Bearer ${token}`);
    
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
