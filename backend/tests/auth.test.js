// 认证模块测试
const request = require('supertest');
const app = require('../server');

describe('Auth API', () => {
  test('POST /api/auth/login - 成功登录', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'admin', password: 'admin123' });
    
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
  });

  test('POST /api/auth/login - 错误密码', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'admin', password: 'wrong' });
    
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test('POST /api/auth/login - 缺少参数', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'admin' });
    
    expect(res.status).toBe(400);
  });
});
