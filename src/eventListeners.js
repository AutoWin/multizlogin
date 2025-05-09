import { GroupEventType } from "zca-js";
import { getWebhookUrl, triggerN8nWebhook } from './utils/helpers.js';
import fs from 'fs';
import { loginZaloAccount, zaloAccounts } from './api/zalo/zalo.js';
import { broadcastMessage } from './server.js';
import axios from 'axios'; // Make sure axios is imported

// Biến để theo dõi thời gian relogin cho từng tài khoản
export const reloginAttempts = new Map();
// Thời gian tối thiểu giữa các lần thử relogin (5 phút)
const RELOGIN_COOLDOWN = 5 * 60 * 1000;

export function setupEventListeners(api, loginResolve) {
    const ownId = api.getOwnId();

    api.listener.selfListen = true;

    // Lắng nghe sự kiện tin nhắn và gửi đến webhook được cấu hình cho tin nhắn
    api.listener.on("message", (msg) => {
        const messageWebhookUrl = getWebhookUrl("messageWebhookUrl", ownId);
        if (messageWebhookUrl) {
            // Thêm ownId vào dữ liệu để webhook biết tin nhắn từ tài khoản nào
            const msgWithOwnId = { ...msg, _accountId: ownId };
            triggerN8nWebhook(msgWithOwnId, messageWebhookUrl);
        }
    });

    // Lắng nghe sự kiện nhóm và gửi đến webhook được cấu hình cho sự kiện nhóm
    api.listener.on("group_event", (data) => {
        const groupEventWebhookUrl = getWebhookUrl("groupEventWebhookUrl", ownId);
        if (groupEventWebhookUrl) {
            // Thêm ownId vào dữ liệu
            const dataWithOwnId = { ...data, _accountId: ownId };
            triggerN8nWebhook(dataWithOwnId, groupEventWebhookUrl);
        }
    });

    // Lắng nghe sự kiện reaction và gửi đến webhook được cấu hình cho reaction
    api.listener.on("reaction", (reaction) => {
        const reactionWebhookUrl = getWebhookUrl("reactionWebhookUrl", ownId);
        console.log("Nhận reaction:", reaction);
        if (reactionWebhookUrl) {
            // Thêm ownId vào dữ liệu
            const reactionWithOwnId = { ...reaction, _accountId: ownId };
            triggerN8nWebhook(reactionWithOwnId, reactionWebhookUrl);
        }
    });

    api.listener.onConnected(() => {
        console.log(`Connected account ${ownId}`);
        loginResolve('login_success');

        // Cập nhật trạng thái đăng nhập thành true
        const accountIndex = zaloAccounts.findIndex(acc => acc.ownId === ownId);
        if (accountIndex !== -1) {
            zaloAccounts[accountIndex].isActive = true;
            console.log(`Đã cập nhật trạng thái đăng nhập của tài khoản ${ownId} thành true`);
        }

        // Gửi thông báo đến tất cả client
        try {
            broadcastMessage('login_success');

            // Gọi API thông báo đăng nhập thành công
            notifyLoginSuccess(ownId);
        } catch (err) {
            console.error('Lỗi khi gửi thông báo WebSocket:', err);
        }
    });

    api.listener.onClosed(() => {
        console.log(`Closed - API listener đã ngắt kết nối cho tài khoản ${ownId}`);

        // Cập nhật trạng thái đăng nhập thành false
        const accountIndex = zaloAccounts.findIndex(acc => acc.ownId === ownId);
        if (accountIndex !== -1) {
            zaloAccounts[accountIndex].isActive = false;
            console.log(`Đã cập nhật trạng thái đăng nhập của tài khoản ${ownId} thành false`);
        }

        // Gọi API thông báo đăng xuất
        notifyLogout(ownId);

        // Xử lý đăng nhập lại khi API listener bị đóng
        handleRelogin(api);

    });

    api.listener.onError((error) => {
        console.error(`Error on account ${ownId}:`, error);
    });
}

// Hàm thông báo đăng nhập thành công đến API bên ngoài
async function notifyLoginSuccess(accountId) {
    try {
        const loginNotificationUrl = 'https://968b-118-70-181-108.ngrok-free.app/icheck_zalohub/login';

        // Tìm thông tin tài khoản từ mảng zaloAccounts
        const accountInfo = zaloAccounts.find(acc => acc.ownId === accountId);

        // Tạo một bản sao an toàn của thông tin tài khoản, loại bỏ các thuộc tính có thể gây lỗi
        const safeAccountInfo = accountInfo ? {
            ownId: accountInfo.ownId,
            name: accountInfo.name,
            phoneNumber: accountInfo.phoneNumber,
            proxy: accountInfo.proxy
            // Chỉ bao gồm các thuộc tính cơ bản, bỏ qua các thuộc tính phức tạp
        } : {};

        // Chuẩn bị dữ liệu gửi đi
        const payload = {
            account_id: accountId,
            status: 'login_success',
            timestamp: new Date().toISOString(),
            account_info: safeAccountInfo
        };

        console.log(`Đang gửi thông báo đăng nhập thành công cho tài khoản ${accountId} đến ${loginNotificationUrl}`);

        const response = await axios.post(loginNotificationUrl, payload);

        console.log(`Đã gửi thông báo đăng nhập thành công, phản hồi:`, response.data);
    } catch (error) {
        console.error(`Lỗi khi gửi thông báo đăng nhập thành công cho tài khoản ${accountId}:`, error.message);
    }
}

// Hàm thông báo đăng xuất hoặc mất kết nối đến API bên ngoài
async function notifyLogout(accountId) {
    try {
        const logoutNotificationUrl = 'https://968b-118-70-181-108.ngrok-free.app/icheck_zalohub/logout';

        // Tìm thông tin tài khoản từ mảng zaloAccounts
        const accountInfo = zaloAccounts.find(acc => acc.ownId === accountId);

        // Tạo một bản sao an toàn của thông tin tài khoản, loại bỏ các thuộc tính có thể gây lỗi
        const safeAccountInfo = accountInfo ? {
            ownId: accountInfo.ownId,
            name: accountInfo.name,
            phoneNumber: accountInfo.phoneNumber,
            proxy: accountInfo.proxy
            // Chỉ bao gồm các thuộc tính cơ bản, bỏ qua các thuộc tính phức tạp
        } : {};

        // Chuẩn bị dữ liệu gửi đi
        const payload = {
            account_id: accountId,
            status: 'disconnected',
            timestamp: new Date().toISOString(),
            account_info: safeAccountInfo
        };

        console.log(`Đang gửi thông báo đăng xuất/mất kết nối cho tài khoản ${accountId} đến ${logoutNotificationUrl}`);

        const response = await axios.post(logoutNotificationUrl, payload);

        console.log(`Đã gửi thông báo đăng xuất/mất kết nối, phản hồi:`, response.data);
    } catch (error) {
        console.error(`Lỗi khi gửi thông báo đăng xuất/mất kết nối cho tài khoản ${accountId}:`, error.message);
    }
}

// Hàm xử lý đăng nhập lại
async function handleRelogin(api) {
    try {
        console.log("Đang thử đăng nhập lại...");

        // Lấy ownId của tài khoản bị ngắt kết nối
        const ownId = api.getOwnId();

        if (!ownId) {
            console.error("Không thể xác định ownId, không thể đăng nhập lại");
            return;
        }

        // Kiểm tra thời gian relogin gần nhất
        const lastReloginTime = reloginAttempts.get(ownId);
        const now = Date.now();

        if (lastReloginTime && now - lastReloginTime < RELOGIN_COOLDOWN) {
            console.log(`Bỏ qua việc đăng nhập lại tài khoản ${ownId}, đã thử cách đây ${Math.floor((now - lastReloginTime) / 1000)} giây`);
            return;
        }

        // Cập nhật thời gian relogin
        reloginAttempts.set(ownId, now);

        // Tìm thông tin proxy từ mảng zaloAccounts
        const accountInfo = zaloAccounts.find(acc => acc.ownId === ownId);
        const customProxy = accountInfo?.proxy || null;

        // Tìm file cookie tương ứng
        const cookiesDir = './data/cookies';
        const cookieFile = `${cookiesDir}/cred_${ownId}.json`;

        if (!fs.existsSync(cookieFile)) {
            console.error(`Không tìm thấy file cookie cho tài khoản ${ownId}`);
            return;
        }

        // Đọc cookie từ file
        const cookie = JSON.parse(fs.readFileSync(cookieFile, "utf-8"));

        // Đăng nhập lại với cookie
        console.log(`Đang đăng nhập lại tài khoản ${ownId} với proxy ${customProxy || 'không có'}...`);

        // Thực hiện đăng nhập lại
        await loginZaloAccount(customProxy, cookie);
        console.log(`Đã đăng nhập lại thành công tài khoản ${ownId}`);
    } catch (error) {
        console.error("Lỗi khi thử đăng nhập lại:", error);
    }
}
