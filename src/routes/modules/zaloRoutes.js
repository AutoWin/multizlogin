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
    zaloAccounts
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

export default router;