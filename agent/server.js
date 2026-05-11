const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const agentRoutes = require('./routes/agent');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/agent', agentRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Student Management AI Agent Service', version: '1.0.0' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Agent service running on port ${PORT}`);
});
