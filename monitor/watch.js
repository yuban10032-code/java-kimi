const { runHealthCheck, optimize } = require('./health-check');

const INTERVAL = 60 * 1000; // 60 seconds

async function watch() {
  console.log(`[监控] 启动持续监控，间隔 ${INTERVAL}ms`);
  
  while (true) {
    try {
      await runHealthCheck();
      await optimize();
    } catch (err) {
      console.error('[监控] 错误:', err.message);
    }
    
    await new Promise(resolve => setTimeout(resolve, INTERVAL));
  }
}

watch().catch(err => {
  console.error('[监控] 致命错误:', err);
  process.exit(1);
});
