const API_BASE = 'http://localhost:3001/api';

async function test(endpoint, method = 'GET', body = null, token = null) {
  const url = `${API_BASE}${endpoint}`;
  const options = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (token) options.headers['Authorization'] = `Bearer ${token}`;
  if (body) options.body = JSON.stringify(body);

  try {
    const res = await fetch(url, options);
    const data = await res.json();
    return { ok: res.ok, status: res.status, data };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

async function runTests() {
  console.log('========== API测试开始 ==========\n');
  let token = null;

  // Test 1: Health check
  console.log('[TEST 1] 健康检查');
  const health = await test('/health');
  console.log(health.ok ? '  ✓ 通过' : '  ✗ 失败', health.data || health.error);

  // Test 2: Login
  console.log('\n[TEST 2] 用户登录');
  const login = await test('/auth/login', 'POST', { username: 'admin', password: 'admin123' });
  if (login.ok && login.data?.data?.token) {
    token = login.data.data.token;
    console.log('  ✓ 登录成功，获取到token');
  } else {
    console.log('  ✗ 登录失败', login.data?.message || login.error);
  }

  if (!token) {
    console.log('\n[跳过] 未获取到token，跳过后续测试');
    return;
  }

  // Test 3: Get students
  console.log('\n[TEST 3] 获取学生列表');
  const students = await test('/students?page=1&limit=5', 'GET', null, token);
  console.log(students.ok ? `  ✓ 获取到 ${students.data?.data?.length || 0} 条记录` : '  ✗ 失败', students.data?.message || students.error);

  // Test 4: Get dashboard stats
  console.log('\n[TEST 4] 获取看板统计');
  const stats = await test('/dashboard/stats', 'GET', null, token);
  console.log(stats.ok ? `  ✓ 统计: ${stats.data?.data?.totalStudents || 0} 名学生` : '  ✗ 失败', stats.data?.message || stats.error);

  // Test 5: Get courses
  console.log('\n[TEST 5] 获取课程列表');
  const courses = await test('/courses', 'GET', null, token);
  console.log(courses.ok ? `  ✓ 获取到 ${courses.data?.data?.length || 0} 门课程` : '  ✗ 失败', courses.data?.message || courses.error);

  // Test 6: Get classes
  console.log('\n[TEST 6] 获取班级列表');
  const classes = await test('/classes', 'GET', null, token);
  console.log(classes.ok ? `  ✓ 获取到 ${classes.data?.data?.length || 0} 个班级` : '  ✗ 失败', classes.data?.message || classes.error);

  // Test 7: Agent query (fallback mode)
  console.log('\n[TEST 7] AI查询 (fallback模式)');
  const agent = await test('/agent/query', 'POST', { query: '查询学生总数' }, token);
  console.log(agent.ok ? '  ✓ 查询成功' : '  ✗ 失败', agent.data?.message || agent.error);

  console.log('\n========== API测试结束 ==========');
}

runTests().catch(console.error);
