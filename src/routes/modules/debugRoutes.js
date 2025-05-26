// src/routes/modules/debugRoutes.js
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getAllWebhookConfigs } from '../../services/webhookService.js';
import { asyncHandler } from '../../middleware/errorHandler.js';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// API test JSON đơn giản
router.post('/test-json', (req, res) => {
  // Trả về chính xác request body được gửi lên
  res.setHeader('Content-Type', 'application/json');
  return res.json({
    success: true,
    message: 'Test JSON thành công',
    receivedData: req.body || null
  });
});

// API kiểm tra trạng thái session
router.get('/session-test', (req, res) => {
  try {
    // Kiểm tra session object có tồn tại không
    const hasSession = !!req.session;

    // Lấy thông tin session hiện tại
    const sessionInfo = {
      exists: hasSession,
      id: req.sessionID || 'no-session-id',
      isAuthenticated: hasSession && req.session.authenticated === true,
      username: hasSession ? (req.session.username || 'none') : 'no-session',
      role: hasSession ? (req.session.role || 'none') : 'no-session',
      cookieSettings: hasSession ? {
        maxAge: req.session.cookie.maxAge,
        httpOnly: req.session.cookie.httpOnly,
        secure: req.session.cookie.secure,
        path: req.session.cookie.path
      } : 'no-cookie'
    };

    // Trả về thông tin
    return res.json({
      success: true,
      message: 'Session test',
      sessionInfo
    });
  } catch (error) {
    console.error('Session test error:', error);
    return res.json({
      success: false,
      message: 'Lỗi khi kiểm tra session',
      error: error.message || 'Unknown error'
    });
  }
});

// Endpoint debug để kiểm tra trạng thái webhookConfig
router.get('/debug-webhook-config', asyncHandler(async (req, res) => {
  const webhookConfigs = getAllWebhookConfigs();
  const fileExists = fs.existsSync(path.join(__dirname, 'webhookConfig.json'));

  res.json({
    success: true,
    configExists: !!webhookConfigs,
    fileExists: fileExists,
    data: webhookConfigs,
    dirname: __dirname,
    configPath: path.join(__dirname, 'webhookConfig.json')
  });
}));

// Endpoint debug để kiểm tra file users.json
router.get('/debug-users-file', asyncHandler(async (req, res) => {
  const userFilePath = path.join(process.cwd(), 'data', 'cookies', 'users.json');
  const fileExists = fs.existsSync(userFilePath);
  let fileContent = null;
  let users = [];

  if (fileExists) {
    fileContent = fs.readFileSync(userFilePath, 'utf8');
    try {
      users = JSON.parse(fileContent);
      // Che giấu thông tin nhạy cảm
      users = users.map(user => ({
        username: user.username,
        role: user.role,
        saltLength: user.salt ? user.salt.length : 0,
        hashLength: user.hash ? user.hash.length : 0,
        saltPrefix: user.salt ? user.salt.substring(0, 5) + '...' : null,
        hashPrefix: user.hash ? user.hash.substring(0, 5) + '...' : null
      }));
    } catch (parseError) {
      return res.status(500).json({
        success: false,
        error: 'Invalid JSON in users file',
        parseError: parseError.message
      });
    }
  }

  res.json({
    success: true,
    fileExists: fileExists,
    filePath: userFilePath,
    fileSize: fileContent ? fileContent.length : 0,
    users: users
  });
}));

export default router;