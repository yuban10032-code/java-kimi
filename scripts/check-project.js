const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname, '..');

const REQUIRED_FILES = [
    'docker-compose.yml',
    '.env.example',
    '.env',
    'README.md',
    'CHANGELOG.md',
    'LICENSE',
    'DEPLOYMENT.md',
    'start.bat',
    'stop.bat',
    'start.ps1',
    'backend/package.json',
    'backend/server.js',
    'backend/Dockerfile',
    'backend/config/database.js',
    'backend/config/cache.js',
    'backend/middleware/auth.js',
    'backend/middleware/errorHandler.js',
    'backend/middleware/logger.js',
    'backend/middleware/rateLimiter.js',
    'backend/middleware/requestLogger.js',
    'backend/middleware/notify.js',
    'backend/middleware/performance.js',
    'backend/websocket.js',
    'backend/routes/auth.js',
    'backend/routes/students.js',
    'backend/routes/scores.js',
    'backend/routes/dashboard.js',
    'backend/routes/agent.js',
    'backend/routes/courses.js',
    'backend/routes/classes.js',
    'backend/routes/export.js',
    'backend/routes/import.js',
    'backend/routes/logs.js',
    'backend/routes/reports.js',
    'backend/routes/system.js',
    'backend/routes/batch.js',
    'backend/routes/search.js',
    'backend/routes/notifications.js',
    'backend/routes/backup.js',
    'backend/routes/performance.js',
    'backend/utils/validators.js',
    'backend/jest.config.js',
    'backend/tests/setup.js',
    'backend/tests/auth.test.js',
    'backend/tests/students.test.js',
    'backend/tests/dashboard.test.js',
    'frontend/index.html',
    'frontend/dashboard.html',
    'frontend/students.html',
    'frontend/student-form.html',
    'frontend/scores.html',
    'frontend/agent.html',
    'frontend/courses.html',
    'frontend/classes.html',
    'frontend/reports.html',
    'frontend/import.html',
    'frontend/settings.html',
    'frontend/profile.html',
    'frontend/system.html',
    'frontend/logs.html',
    'frontend/api-docs.html',
    'frontend/404.html',
    'frontend/css/styles.css',
    'frontend/js/app.js',
    'frontend/js/charts.js',
    'frontend/js/shortcuts.js',
    'frontend/js/components.js',
    'frontend/js/cache.js',
    'frontend/js/utils.js',
    'frontend/backup.html',
    'frontend/service-worker.js',
    'frontend/manifest.json',
    'frontend/robots.txt',
    'frontend/Dockerfile',
    'frontend/nginx.conf',
    'agent/package.json',
    'agent/server.js',
    'agent/Dockerfile',
    'agent/config/database.js',
    'agent/routes/agent.js',
    'flyway/sql/V1__Create_student_tables.sql',
    'flyway/sql/V2__Insert_sample_data.sql',
    'flyway/sql/V3__Add_performance_indexes.sql',
    'flyway/sql/V4__Add_backup_logs.sql',
    'flyway/conf/flyway.conf',
    'monitor/health-check.js',
    'monitor/watch.js',
    'monitor/self-check.sh',
    'monitor/package.json',
    'scripts/test-api.js',
    'scripts/init-db.js',
    'scripts/generate-test-data.js',
    'scripts/check-project.js',
    'scripts/package.json',
];

const REQUIRED_DIRS = [
    'backend',
    'backend/config',
    'backend/middleware',
    'backend/routes',
    'backend/utils',
    'backend/tests',
    'frontend',
    'frontend/css',
    'frontend/js',
    'agent',
    'agent/config',
    'agent/routes',
    'flyway',
    'flyway/sql',
    'flyway/conf',
    'monitor',
    'scripts',
];

function checkFile(filePath) {
    const fullPath = path.join(PROJECT_ROOT, filePath);
    return fs.existsSync(fullPath);
}

function checkDir(dirPath) {
    const fullPath = path.join(PROJECT_ROOT, dirPath);
    return fs.existsSync(fullPath) && fs.statSync(fullPath).isDirectory();
}

function checkSize(filePath) {
    const fullPath = path.join(PROJECT_ROOT, filePath);
    if (!fs.existsSync(fullPath)) return 0;
    return fs.statSync(fullPath).size;
}

function runCheck() {
    console.log('========== 项目结构检查 ==========\n');
    
    let passCount = 0;
    let failCount = 0;

    console.log('[目录检查]');
    REQUIRED_DIRS.forEach(dir => {
        if (checkDir(dir)) {
            console.log(`  ✓ ${dir}`);
            passCount++;
        } else {
            console.log(`  ✗ ${dir} (缺失)`);
            failCount++;
        }
    });

    console.log('\n[文件检查]');
    REQUIRED_FILES.forEach(file => {
        if (checkFile(file)) {
            const size = checkSize(file);
            console.log(`  ✓ ${file} (${size} bytes)`);
            passCount++;
        } else {
            console.log(`  ✗ ${file} (缺失)`);
            failCount++;
        }
    });

    console.log('\n========== 检查结果 ==========');
    console.log(`通过: ${passCount}`);
    console.log(`失败: ${failCount}`);
    console.log(`总计: ${passCount + failCount}`);
    
    if (failCount === 0) {
        console.log('\n✓ 项目结构完整！');
    } else {
        console.log(`\n✗ 发现 ${failCount} 个问题需要修复`);
        process.exit(1);
    }
}

runCheck();
