// src/routes/modules/webhookRoutes.js
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
    getWebhookUrl,
    setWebhookUrl,
    removeWebhookConfig,
    getAllWebhookConfigs
} from '../../services/webhookService.js';
import { asyncHandler } from '../../middleware/errorHandler.js';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Endpoint để lấy tất cả cấu hình webhook
router.get('/account-webhooks', asyncHandler(async (req, res) => {
    const webhookConfigs = getAllWebhookConfigs();
    res.json({ success: true, data: webhookConfigs });
}));

// Endpoint để lấy cấu hình webhook của một tài khoản
router.get('/account-webhook/:ownId', asyncHandler(async (req, res) => {
    const { ownId } = req.params;

    if (!ownId) {
        return res.status(400).json({ success: false, error: 'ownId là bắt buộc' });
    }

    const messageWebhookUrl = getWebhookUrl('messageWebhookUrl', ownId);
    const groupEventWebhookUrl = getWebhookUrl('groupEventWebhookUrl', ownId);
    const reactionWebhookUrl = getWebhookUrl('reactionWebhookUrl', ownId);

    res.json({
        success: true,
        data: {
            ownId,
            messageWebhookUrl,
            groupEventWebhookUrl,
            reactionWebhookUrl
        }
    });
}));

// Endpoint để thiết lập webhook URL cho một tài khoản cụ thể
router.post('/account-webhook', asyncHandler(async (req, res) => {
    const { ownId, messageWebhookUrl, groupEventWebhookUrl, reactionWebhookUrl } = req.body;

    if (!ownId) {
        return res.status(400).json({ success: false, error: 'ownId là bắt buộc' });
    }

    let success = true;

    // Thiết lập từng loại webhook URL nếu được cung cấp
    if (messageWebhookUrl !== undefined) {
        success = success && setWebhookUrl(ownId, 'messageWebhookUrl', messageWebhookUrl);
    }

    if (groupEventWebhookUrl !== undefined) {
        success = success && setWebhookUrl(ownId, 'groupEventWebhookUrl', groupEventWebhookUrl);
    }

    if (reactionWebhookUrl !== undefined) {
        success = success && setWebhookUrl(ownId, 'reactionWebhookUrl', reactionWebhookUrl);
    }

    if (success) {
        res.json({ success: true, message: 'Đã cập nhật webhook URLs cho tài khoản' });
    } else {
        res.status(500).json({ success: false, error: 'Lỗi khi cập nhật webhook URLs' });
    }
}));

// Endpoint để xóa cấu hình webhook của một tài khoản
router.delete('/account-webhook/:ownId', asyncHandler(async (req, res) => {
    const { ownId } = req.params;

    if (!ownId) {
        return res.status(400).json({ success: false, error: 'ownId là bắt buộc' });
    }

    if (removeWebhookConfig(ownId)) {
        res.json({ success: true, message: 'Đã xóa cấu hình webhook cho tài khoản' });
    } else {
        res.status(500).json({ success: false, error: 'Lỗi khi xóa cấu hình webhook' });
    }
}));

export default router;