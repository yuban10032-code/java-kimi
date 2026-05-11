const express = require('express');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();
router.use(verifyToken);

// File upload endpoint (placeholder - requires multer for actual file handling)
router.post('/avatar', (req, res) => {
  // In production, use multer to handle file uploads
  res.json({
    success: true,
    message: '文件上传功能需要配置 multer 和存储服务',
    note: '建议使用: npm install multer',
  });
});

module.exports = router;
