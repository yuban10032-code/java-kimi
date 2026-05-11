const express = require('express');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const { generateTokens, verifyRefreshToken } = require('../middleware/auth');
const logger = require('../middleware/logger');

const router = express.Router();

const adminUser = {
  id: 1,
  username: 'admin',
  passwordHash: bcrypt.hashSync('admin123', 10),
  role: 'admin'
};

const refreshTokens = new Set();

router.post('/login',
  [
    body('username').trim().notEmpty().withMessage('Username is required'),
    body('password').notEmpty().withMessage('Password is required')
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { username, password } = req.body;

      if (username !== adminUser.username) {
        logger.warn(`Failed login attempt for username: ${username}`);
        return res.status(401).json({ error: 'Invalid username or password' });
      }

      const isValidPassword = bcrypt.compareSync(password, adminUser.passwordHash);
      if (!isValidPassword) {
        logger.warn(`Failed login attempt for username: ${username}`);
        return res.status(401).json({ error: 'Invalid username or password' });
      }

      const tokens = generateTokens({
        userId: adminUser.id,
        username: adminUser.username,
        role: adminUser.role
      });

      refreshTokens.add(tokens.refreshToken);

      logger.info(`User ${username} logged in successfully`);

      res.json({
        message: 'Login successful',
        user: {
          id: adminUser.id,
          username: adminUser.username,
          role: adminUser.role
        },
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken
      });
    } catch (error) {
      next(error);
    }
  }
);

router.post('/refresh', (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({ error: 'Refresh token is required' });
    }

    if (!refreshTokens.has(refreshToken)) {
      return res.status(403).json({ error: 'Invalid refresh token' });
    }

    const user = verifyRefreshToken(refreshToken);

    const tokens = generateTokens({
      userId: user.userId,
      username: user.username,
      role: user.role
    });

    refreshTokens.delete(refreshToken);
    refreshTokens.add(tokens.refreshToken);

    res.json({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken
    });
  } catch (error) {
    next(error);
  }
});

router.post('/logout', (req, res) => {
  const { refreshToken } = req.body;
  if (refreshToken) {
    refreshTokens.delete(refreshToken);
  }
  res.json({ message: 'Logged out successfully' });
});

module.exports = router;
