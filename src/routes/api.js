import express from 'express';
import { fileURLToPath } from 'url';
import path from 'path';
import { errorMiddleware } from '../middleware/errorHandler.js';

// Import modular routes
import authRoutes from './modules/authRoutes.js';
import zaloRoutes from './modules/zaloRoutes.js';
import webhookRoutes from './modules/webhookRoutes.js';
import debugRoutes from './modules/debugRoutes.js';

const router = express.Router();

// Dành cho ES Module: xác định __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Mount modular routes
router.use('/', authRoutes);
router.use('/', zaloRoutes);
router.use('/', webhookRoutes);
router.use('/', debugRoutes);

// Global error handler
router.use(errorMiddleware);

export default router;
