const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');

const authRoutes = require('./routes/auth');
const studentRoutes = require('./routes/students');
const scoreRoutes = require('./routes/scores');
const dashboardRoutes = require('./routes/dashboard');
const agentRoutes = require('./routes/agent');
const courseRoutes = require('./routes/courses');
const classRoutes = require('./routes/classes');
const exportRoutes = require('./routes/export');
const logRoutes = require('./routes/logs');
const importRoutes = require('./routes/import');
const reportRoutes = require('./routes/reports');
const systemRoutes = require('./routes/system');
const { router: notificationRoutes } = require('./routes/notifications');
const batchRoutes = require('./routes/batch');
const searchRoutes = require('./routes/search');
const uploadRoutes = require('./routes/upload');
const analyticsRoutes = require('./routes/analytics');
const backupRoutes = require('./routes/backup');
const performanceRoutes = require('./routes/performance');

const { errorHandler } = require('./middleware/errorHandler');
const { requestLogger } = require('./middleware/requestLogger');
const { rateLimit } = require('./middleware/rateLimiter');
const { performanceMonitor } = require('./middleware/performance');
const { initWebSocket, getStats } = require('./websocket');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined'));
app.use(requestLogger);
app.use(performanceMonitor());

// Rate limiting
app.use('/api/auth', rateLimit('auth'));

app.get('/health', (req, res) => {
  const wsStats = getStats();
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    websocket: wsStats,
    uptime: process.uptime()
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/scores', scoreRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/agent', agentRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/import', importRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/system', systemRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/batch', batchRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/backup', backupRoutes);
app.use('/api/performance', performanceRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Student Management System API', version: '1.1.0' });
});

app.use(errorHandler);

const server = require('http').createServer(app);

initWebSocket(server);

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`WebSocket server available at ws://localhost:${PORT}/ws`);
});

module.exports = app;
