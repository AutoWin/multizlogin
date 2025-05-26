// src/middleware/errorHandler.js
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Middleware to handle async errors in route handlers
 * @param {Function} fn - The async route handler function
 * @returns {Function} - Express middleware function
 */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Middleware to handle errors in the application
 */
export const errorMiddleware = (err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    message: 'Lỗi server',
    error: err.message || 'Unknown error'
  });
};

/**
 * Helper function to validate required fields in request body
 * @param {Object} req - Express request object
 * @param {Array} fields - Array of required field names
 * @returns {Object|null} - Error object or null if validation passes
 */
export const validateFields = (req, fields) => {
  for (const field of fields) {
    if (!req.body[field]) {
      return {
        status: 400,
        message: `Dữ liệu không hợp lệ: ${field} là bắt buộc`
      };
    }
  }
  return null;
};

/**
 * Helper function to find Zalo account by ownId
 * @param {Array} zaloAccounts - Array of Zalo accounts
 * @param {String} ownId - The ownId to find
 * @returns {Object|null} - The account or null if not found
 */
export const findZaloAccount = (zaloAccounts, ownId) => {
  const account = zaloAccounts.find(acc => acc.ownId === ownId);
  if (!account) {
    return {
      status: 400,
      message: 'Không tìm thấy tài khoản Zalo với OwnId này'
    };
  }
  return account;
};

export default {
  asyncHandler,
  errorMiddleware,
  validateFields,
  findZaloAccount
};