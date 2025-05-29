// src/routes/modules/zaloRoutes.js
import express from 'express';
import { 
    findUser,
    getUserInfo,
    sendFriendRequest,
    sendMessage,
    createGroup,
    getGroupInfo,
    addUserToGroup,
    removeUserFromGroup,
    sendImageToUser,
    sendImagesToUser,
    sendImageToGroup,
    sendImagesToGroup,
    zaloAccounts,
    loginZaloAccount
} from '../../api/zalo/zalo.js';
import { asyncHandler, validateFields, findZaloAccount } from '../../middleware/errorHandler.js';

const router = express.Router();

// Wrapper function to standardize Zalo API endpoints
const createZaloEndpoint = (handler) => {
    return asyncHandler(async (req, res) => {
        try {
            await handler(req, res);
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });
};

// Optimized Zalo API endpoints
router.post('/findUser', createZaloEndpoint(findUser));
router.post('/getUserInfo', createZaloEndpoint(getUserInfo));
router.post('/sendFriendRequest', createZaloEndpoint(sendFriendRequest));
router.post('/sendmessage', createZaloEndpoint(sendMessage));
router.post('/createGroup', createZaloEndpoint(createGroup));
router.post('/getGroupInfo', createZaloEndpoint(getGroupInfo));
router.post('/addUserToGroup', createZaloEndpoint(addUserToGroup));
router.post('/removeUserFromGroup', createZaloEndpoint(removeUserFromGroup));
router.post('/sendImageToUser', createZaloEndpoint(sendImageToUser));
router.post('/sendImagesToUser', createZaloEndpoint(sendImagesToUser));
router.post('/sendImageToGroup', createZaloEndpoint(sendImageToGroup));
router.post('/sendImagesToGroup', createZaloEndpoint(sendImagesToGroup));

// New endpoint to get QR code for Zalo login
router.get('/getQr', asyncHandler(async (req, res) => {
    try {
        // Get custom proxy from query parameter if provided
        const customProxy = req.query.proxy || null;

        // Call loginZaloAccount to generate QR code
        const qrCodeImage = await loginZaloAccount(customProxy);

        // Check if the result is a QR code image
        if (typeof qrCodeImage === 'string' && qrCodeImage.startsWith('data:image/png;base64,')) {
            res.json({ success: true, qrCode: qrCodeImage });
        } else {
            // If login was successful without QR code (e.g., using cookies)
            res.json({ success: true, message: 'Login successful without QR code' });
        }
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
}));

// New endpoint to login with QR code
router.post('/loginQr', asyncHandler(async (req, res) => {
    try {
        // This endpoint is called by external systems after scanning the QR code
        // The actual login happens when the QR code is scanned in the Zalo app
        // We just need to check if the account is logged in

        // Check if any new account has been added to zaloAccounts
        if (zaloAccounts.length > 0) {
            // Return the most recently added account info
            const latestAccount = zaloAccounts[zaloAccounts.length - 1];
            res.json({ 
                success: true, 
                message: 'Login successful', 
                accountInfo: {
                    ownId: latestAccount.ownId,
                    phoneNumber: latestAccount.phoneNumber || 'Unknown',
                    isActive: latestAccount.isActive || false
                }
            });
        } else {
            res.status(400).json({ 
                success: false, 
                error: 'No Zalo account logged in. Please scan the QR code with Zalo app first.' 
            });
        }
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
}));

// New endpoint to check account login status
router.post('/accountStatus', asyncHandler(async (req, res) => {
    try {
        const { accountId } = req.body;

        if (!accountId) {
            return res.status(400).json({ 
                success: false, 
                error: 'Dữ liệu không hợp lệ: accountId là bắt buộc' 
            });
        }

        // Find the account in zaloAccounts array
        const account = zaloAccounts.find(acc => acc.ownId === accountId);

        if (account) {
            // Return account status
            res.json({ 
                success: true, 
                data: {
                    accountId: account.ownId,
                    phoneNumber: account.phoneNumber || 'Unknown',
                    isActive: account.isActive || false,
                    loggedIn: true
                }
            });
        } else {
            // Account not found
            res.json({ 
                success: true, 
                data: {
                    accountId: accountId,
                    loggedIn: false,
                    message: 'Tài khoản không tồn tại hoặc chưa đăng nhập'
                }
            });
        }
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
}));

export default router;
