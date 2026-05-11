const fs = require('fs');
const path = require('path');

const SERVICES = [
  { name: 'Database', url: 'http://localhost:5432', type: 'tcp' },
  { name: 'Backend API', url: 'http://localhost:3001/health', type: 'http' },
  { name: 'Frontend', url: 'http://localhost:8080', type: 'http' },
  { name: 'Agent Service', url: 'http://localhost:3002/health', type: 'http' },
];

const LOG_FILE = path.join(__dirname, '../logs/health-check.log');
const REPORT_FILE = path.join(__dirname, '../logs/health-report.json');

function ensureDir(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function log(message) {
  const timestamp = new Date().toISOString();
  const line = `[${timestamp}] ${message}\n`;
  ensureDir(LOG_FILE);
  fs.appendFileSync(LOG_FILE, line);
  console.log(line.trim());
}

async function checkHTTP(url) {
  try {
    const response = await fetch(url, { timeout: 5000 });
    return { status: response.status === 200 ? 'healthy' : 'unhealthy', code: response.status };
  } catch (err) {
    return { status: 'unhealthy', error: err.message };
  }
}

async function checkService(service) {
  if (service.type === 'http') {
    return await checkHTTP(service.url);
  }
  return { status: 'unknown', message: 'TCP check not implemented' };
}

async function runHealthCheck() {
  log('========== 健康检查开始 ==========');
  
  const results = [];
  
  for (const service of SERVICES) {
    const result = await checkService(service);
    results.push({
      name: service.name,
      url: service.url,
      ...result,
      checkedAt: new Date().toISOString(),
    });
    
    const icon = result.status === 'healthy' ? '✓' : '✗';
    log(`${icon} ${service.name}: ${result.status}${result.error ? ' - ' + result.error : ''}`);
  }

  const healthyCount = results.filter(r => r.status === 'healthy').length;
  const overallStatus = healthyCount === results.length ? 'healthy' : 'degraded';
  
  const report = {
    timestamp: new Date().toISOString(),
    overallStatus,
    summary: { total: results.length, healthy: healthyCount, unhealthy: results.length - healthyCount },
    services: results,
  };

  ensureDir(REPORT_FILE);
  fs.writeFileSync(REPORT_FILE, JSON.stringify(report, null, 2));
  
  log(`========== 健康检查结束: ${overallStatus} (${healthyCount}/${results.length}) ==========`);
  
  return report;
}

async function selfHeal(report) {
  const unhealthy = report.services.filter(s => s.status !== 'healthy');
  
  for (const service of unhealthy) {
    log(`[自愈] 尝试重启服务: ${service.name}`);
    // In Docker Compose environment, we can't directly restart services
    // This is a placeholder for self-healing logic
    log(`[自愈] ${service.name} 重启指令已记录（需在Docker环境中执行）`);
  }
}

async function optimize() {
  log('[优化] 执行系统自检优化...');
  
  // Check for old log files
  const logsDir = path.join(__dirname, '../logs');
  if (fs.existsSync(logsDir)) {
    const files = fs.readdirSync(logsDir);
    const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
    const now = Date.now();
    
    for (const file of files) {
      const filePath = path.join(logsDir, file);
      const stats = fs.statSync(filePath);
      if (now - stats.mtime.getTime() > maxAge) {
        fs.unlinkSync(filePath);
        log(`[优化] 清理过期日志: ${file}`);
      }
    }
  }

  // Check report directory size
  if (fs.existsSync(REPORT_FILE)) {
    const stats = fs.statSync(REPORT_FILE);
    if (stats.size > 10 * 1024 * 1024) { // 10MB
      fs.writeFileSync(REPORT_FILE, '{}');
      log('[优化] 重置过大的报告文件');
    }
  }

  log('[优化] 自检优化完成');
}

async function main() {
  const report = await runHealthCheck();
  
  if (report.overallStatus !== 'healthy') {
    await selfHeal(report);
  }
  
  await optimize();
}

// Run immediately if called directly
if (require.main === module) {
  main().catch(err => {
    log(`[错误] ${err.message}`);
    process.exit(1);
  });
}

module.exports = { runHealthCheck, selfHeal, optimize };
