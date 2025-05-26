// api/zalo/zalo.js
import { Zalo, ThreadType } from 'zca-js';
import { getPROXIES, getAvailableProxyIndex } from '../../services/proxyService.js';
import { setupEventListeners } from '../../eventListeners.js';
import { HttpsProxyAgent } from "https-proxy-agent";
import nodefetch from "node-fetch";
import fs from 'fs';
import { saveImage, removeImage } from '../../utils/helpers.js';

export const zaloAccounts = [];

// Helper function to validate required fields
const validateFields = (req, fields, res) => {
    for (const field of fields) {
        if (!req.body[field] || (Array.isArray(req.body[field]) && req.body[field].length === 0)) {
            res.status(400).json({ error: `Dữ liệu không hợp lệ: ${field} là bắt buộc` });
            return false;
        }
    }
    return true;
};

// Helper function to find Zalo account by ownId
const findAccount = (req, res) => {
    const { ownId } = req.body;
    if (!ownId) {
        res.status(400).json({ error: 'Dữ liệu không hợp lệ: ownId là bắt buộc' });
        return null;
    }

    const account = zaloAccounts.find(acc => acc.ownId === ownId);
    if (!account) {
        res.status(400).json({ error: 'Không tìm thấy tài khoản Zalo với OwnId này' });
        return null;
    }

    return account;
};

// Wrapper function for Zalo API endpoints
const createZaloEndpoint = (handler) => {
    return async (req, res) => {
        try {
            await handler(req, res);
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    };
};

export async function findUser(req, res) {
    if (!validateFields(req, ['phone', 'ownId'], res)) return;

    const account = findAccount(req, res);
    if (!account) return;

    try {
        const { phone } = req.body;
        const userData = await account.api.findUser(phone);
        res.json({ success: true, data: userData });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
}

export async function getUserInfo(req, res) {
    if (!validateFields(req, ['userId', 'ownId'], res)) return;

    const account = findAccount(req, res);
    if (!account) return;

    try {
        const { userId } = req.body;
        const info = await account.api.getUserInfo(userId);
        res.json({ success: true, data: info });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
}

export async function sendFriendRequest(req, res) {
    if (!validateFields(req, ['userId', 'ownId'], res)) return;

    const account = findAccount(req, res);
    if (!account) return;

    try {
        const { userId } = req.body;
        const result = await account.api.sendFriendRequest('Xin chào, hãy kết bạn với tôi!', userId);
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
}

export async function sendMessage(req, res) {
    if (!validateFields(req, ['message', 'threadId', 'ownId'], res)) return;

    const account = findAccount(req, res);
    if (!account) return;

    try {
        const { message, threadId, type } = req.body;
        const msgType = type || ThreadType.User;
        const result = await account.api.sendMessage(message, threadId, msgType);
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
}

export async function createGroup(req, res) {
    if (!validateFields(req, ['members', 'ownId'], res)) return;

    // Additional validation for members array
    const { members } = req.body;
    if (!Array.isArray(members) || members.length === 0) {
        return res.status(400).json({ error: 'Dữ liệu không hợp lệ: members phải là mảng không rỗng' });
    }

    const account = findAccount(req, res);
    if (!account) return;

    try {
        const { name, avatarPath } = req.body;
        // Gọi API createGroup từ zaloAccounts
        const result = await account.api.createGroup({ members, name, avatarPath });
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
}

export async function getGroupInfo(req, res) {
    if (!validateFields(req, ['groupId', 'ownId'], res)) return;

    // Additional validation for groupId
    const { groupId } = req.body;
    if (Array.isArray(groupId) && groupId.length === 0) {
        return res.status(400).json({ error: 'Dữ liệu không hợp lệ: groupId không được là mảng rỗng' });
    }

    const account = findAccount(req, res);
    if (!account) return;

    try {
        // Gọi API getGroupInfo từ zaloAccounts
        const result = await account.api.getGroupInfo(groupId);
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
}

export async function addUserToGroup(req, res) {
    if (!validateFields(req, ['groupId', 'memberId', 'ownId'], res)) return;

    // Additional validation for memberId
    const { memberId } = req.body;
    if (Array.isArray(memberId) && memberId.length === 0) {
        return res.status(400).json({ error: 'Dữ liệu không hợp lệ: memberId không được là mảng rỗng' });
    }

    const account = findAccount(req, res);
    if (!account) return;

    try {
        const { groupId } = req.body;
        // Gọi API addUserToGroup từ zaloAccounts
        const result = await account.api.addUserToGroup(memberId, groupId);
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
}

export async function removeUserFromGroup(req, res) {
    if (!validateFields(req, ['groupId', 'memberId', 'ownId'], res)) return;

    // Additional validation for memberId
    const { memberId } = req.body;
    if (Array.isArray(memberId) && memberId.length === 0) {
        return res.status(400).json({ error: 'Dữ liệu không hợp lệ: memberId không được là mảng rỗng' });
    }

    const account = findAccount(req, res);
    if (!account) return;

    try {
        const { groupId } = req.body;
        // Gọi API removeUserFromGroup từ zaloAccounts
        const result = await account.api.removeUserFromGroup(memberId, groupId);
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
}

// Hàm gửi một hình ảnh đến người dùng
export async function sendImageToUser(req, res) {
    if (!validateFields(req, ['imagePath', 'threadId', 'ownId'], res)) return;

    const account = findAccount(req, res);
    if (!account) return;

    try {
        const { imagePath: imageUrl, threadId } = req.body;

        const imagePath = await saveImage(imageUrl);
        if (!imagePath) return res.status(500).json({ success: false, error: 'Failed to save image' });

        const result = await account.api.sendMessage(
            {
                msg: "",
                attachments: [imagePath]
            },
            threadId,
            ThreadType.User
        ).catch(console.error);

        removeImage(imagePath);
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
}

// Hàm gửi nhiều hình ảnh đến người dùng
export async function sendImagesToUser(req, res) {
    if (!validateFields(req, ['imagePaths', 'threadId', 'ownId'], res)) return;

    // Additional validation for imagePaths array
    const { imagePaths: imageUrls } = req.body;
    if (!Array.isArray(imageUrls) || imageUrls.length === 0) {
        return res.status(400).json({ error: 'Dữ liệu không hợp lệ: imagePaths phải là mảng không rỗng' });
    }

    const account = findAccount(req, res);
    if (!account) return;

    try {
        const { threadId } = req.body;

        const imagePaths = [];
        for (const imageUrl of imageUrls) {
            const imagePath = await saveImage(imageUrl);
            if (!imagePath) {
                // Clean up any saved images
                for (const path of imagePaths) {
                    removeImage(path);
                }
                return res.status(500).json({ success: false, error: 'Failed to save one or more images' });
            }
            imagePaths.push(imagePath);
        }

        const result = await account.api.sendMessage(
            {
                msg: "",
                attachments: imagePaths
            },
            threadId,
            ThreadType.User
        ).catch(console.error);

        for (const imagePath of imagePaths) {
            removeImage(imagePath);
        }
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
}

// Hàm gửi một hình ảnh đến nhóm
export async function sendImageToGroup(req, res) {
    if (!validateFields(req, ['imagePath', 'threadId', 'ownId'], res)) return;

    const account = findAccount(req, res);
    if (!account) return;

    try {
        const { imagePath: imageUrl, threadId } = req.body;

        const imagePath = await saveImage(imageUrl);
        if (!imagePath) return res.status(500).json({ success: false, error: 'Failed to save image' });

        const result = await account.api.sendMessage(
            {
                msg: "",
                attachments: [imagePath]
            },
            threadId,
            ThreadType.Group
        ).catch(console.error);

        removeImage(imagePath);
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
}

// Hàm gửi nhiều hình ảnh đến nhóm
export async function sendImagesToGroup(req, res) {
    if (!validateFields(req, ['imagePaths', 'threadId', 'ownId'], res)) return;

    // Additional validation for imagePaths array
    const { imagePaths: imageUrls } = req.body;
    if (!Array.isArray(imageUrls) || imageUrls.length === 0) {
        return res.status(400).json({ error: 'Dữ liệu không hợp lệ: imagePaths phải là mảng không rỗng' });
    }

    const account = findAccount(req, res);
    if (!account) return;

    try {
        const { threadId } = req.body;

        const imagePaths = [];
        for (const imageUrl of imageUrls) {
            const imagePath = await saveImage(imageUrl);
            if (!imagePath) {
                // Clean up any saved images
                for (const path of imagePaths) {
                    removeImage(path);
                }
                return res.status(500).json({ success: false, error: 'Failed to save one or more images' });
            }
            imagePaths.push(imagePath);
        }

        const result = await account.api.sendMessage(
            {
                msg: "",
                attachments: imagePaths
            },
            threadId,
            ThreadType.Group
        ).catch(console.error);

        for (const imagePath of imagePaths) {
            removeImage(imagePath);
        }
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
}

export async function loginZaloAccount(customProxy, cred) {
    let loginResolve;
    return new Promise(async (resolve, reject) => {
        console.log('Bắt đầu quá trình đăng nhập Zalo...');
        console.log('Custom proxy:', customProxy || 'không có');
        console.log('Đang nhập với cookie:', cred ? 'có' : 'không');

        loginResolve = resolve;
        let agent;
        let proxyUsed = null;
        let useCustomProxy = false;
        let proxies = [];
        try {
            const proxiesJson = fs.readFileSync('./data/proxies.json', 'utf8');
            proxies = JSON.parse(proxiesJson);
            console.log(`Đã đọc ${proxies.length} proxy từ file proxies.json`);
        } catch (error) {
            console.error("Không thể đọc hoặc phân tích cú pháp proxies.json:", error);
            console.log('Đang tạo file proxies.json trống...');
            if (!fs.existsSync('./data')) {
                fs.mkdirSync('./data', { recursive: true });
            }
            fs.writeFileSync('./data/proxies.json', '[]', 'utf8');
            proxies = [];
        }

        // Kiểm tra nếu người dùng nhập proxy
        if (customProxy && customProxy.trim() !== "") {
            try {
                // Sử dụng constructor URL để kiểm tra tính hợp lệ
                new URL(customProxy);
                useCustomProxy = true;
                console.log('Proxy nhập vào hợp lệ:', customProxy);

                // Kiểm tra xem proxy đã tồn tại trong mảng proxies chưa
                if (!proxies.includes(customProxy)) {
                    proxies.push(customProxy);
                    // Lưu mảng proxies đã cập nhật vào proxies.json
                    fs.writeFileSync('./data/proxies.json', JSON.stringify(proxies, null, 4), 'utf8');
                    console.log(`Đã thêm proxy mới vào proxies.json: ${customProxy}`);
                } else {
                    console.log(`Proxy đã tồn tại trong proxies.json: ${customProxy}`);
                }

            } catch (err) {
                console.log(`Proxy nhập vào không hợp lệ: ${customProxy}. Sẽ sử dụng proxy mặc định.`);
            }
        }

        if (useCustomProxy) {
            console.log('Sử dụng proxy tùy chỉnh:', customProxy);
            agent = new HttpsProxyAgent(customProxy);
        } else {
            // Chọn proxy tự động từ danh sách nếu không có proxy do người dùng nhập hợp lệ
            if (proxies.length > 0) {
                const proxyIndex = getAvailableProxyIndex();
                if (proxyIndex === -1) {
                    console.log('Tất cả proxy đều đã đủ tài khoản. Không thể đăng nhập thêm!');
                } else {
                    proxyUsed = getPROXIES()[proxyIndex];
                    console.log('Sử dụng proxy tự động:', proxyUsed.url);
                    agent = new HttpsProxyAgent(proxyUsed.url);
                }
            } else {
                console.log('Không có proxy nào có sẵn, sẽ đăng nhập không qua proxy');
                agent = null; // Không sử dụng proxy
            }
        }
        let zalo;
        if (useCustomProxy || agent) {
            console.log('Khởi tạo Zalo SDK với proxy agent');
            zalo = new Zalo({
                agent: agent,
                // @ts-ignore
                polyfill: nodefetch,
            });
        } else {
            console.log('Khởi tạo Zalo SDK không có proxy');
            zalo = new Zalo({
            });
        }

        let api;
        try {
            if (cred) {
                console.log('Đang thử đăng nhập bằng cookie...');
                try {
                    api = await zalo.login(cred);
                    console.log('Đăng nhập bằng cookie thành công');
                } catch (error) {
                    console.error("Lỗi khi đăng nhập bằng cookie:", error);
                    console.log('Chuyển sang đăng nhập bằng mã QR...');
                    // If cookie login fails, attempt QR code login
                    api = await zalo.loginQR(null, (qrData) => {
                        console.log('Đã nhận dữ liệu QR:', qrData ? 'có dữ liệu' : 'không có dữ liệu');
                        if (qrData?.data?.image) {
                            const qrCodeImage = `data:image/png;base64,${qrData.data.image}`;
                            console.log('Đã tạo mã QR, độ dài:', qrCodeImage.length);
                            resolve(qrCodeImage);
                        } else {
                            console.error('Không thể lấy mã QR từ Zalo SDK');
                            reject(new Error("Không thể lấy mã QR"));
                        }
                    });
                }
            } else {
                console.log('Đang tạo mã QR để đăng nhập...');
                api = await zalo.loginQR(null, (qrData) => {
                    console.log('Đã nhận dữ liệu QR:', qrData ? 'có dữ liệu' : 'không có dữ liệu');
                    if (qrData?.data?.image) {
                        const qrCodeImage = `data:image/png;base64,${qrData.data.image}`;
                        console.log('Đã tạo mã QR, độ dài:', qrCodeImage.length);
                        resolve(qrCodeImage);
                    } else {
                        console.error('Không thể lấy mã QR từ Zalo SDK');
                        reject(new Error("Không thể lấy mã QR"));
                    }
                });
            }

            api.listener.onConnected(() => {
                console.log("Zalo SDK đã kết nối");
                resolve(true);
            });

            console.log('Thiết lập event listeners');
            setupEventListeners(api, loginResolve);
            api.listener.start();

            // Nếu sử dụng proxy mặc định từ danh sách thì cập nhật usedCount
            if (!useCustomProxy && proxyUsed) {
                proxyUsed.usedCount++;
                proxyUsed.accounts.push(api);
                console.log(`Đã cập nhật proxy ${proxyUsed.url} với usedCount = ${proxyUsed.usedCount}`);
            }

            console.log('Đang lấy thông tin tài khoản...');
            const accountInfo = await api.fetchAccountInfo();
            if (!accountInfo?.profile) {
                console.error('Không tìm thấy thông tin profile trong phản hồi');
                throw new Error("Không tìm thấy thông tin profile");
            }
            const { profile } = accountInfo;
            const phoneNumber = profile.phoneNumber;
            const ownId = profile.userId;
            const displayName = profile.displayName;
            console.log(`Thông tin tài khoản: ID=${ownId}, Tên=${displayName}, SĐT=${phoneNumber}`);

            const existingAccountIndex = zaloAccounts.findIndex(acc => acc.ownId === api.getOwnId());
            if (existingAccountIndex !== -1) {
                // Thay thế tài khoản cũ bằng tài khoản mới
                zaloAccounts[existingAccountIndex] = { 
                    api: api, 
                    ownId: api.getOwnId(), 
                    proxy: useCustomProxy ? customProxy : (proxyUsed && proxyUsed.url), 
                    phoneNumber: phoneNumber,
                    isActive: true // Thêm trạng thái đăng nhập
                };
                console.log('Đã cập nhật tài khoản hiện có trong danh sách zaloAccounts');
            } else {
                // Thêm tài khoản mới nếu không tìm thấy tài khoản cũ
                zaloAccounts.push({ 
                    api: api, 
                    ownId: api.getOwnId(), 
                    proxy: useCustomProxy ? customProxy : (proxyUsed && proxyUsed.url), 
                    phoneNumber: phoneNumber,
                    isActive: true // Thêm trạng thái đăng nhập
                });
                console.log('Đã thêm tài khoản mới vào danh sách zaloAccounts');
            }

            console.log('Đang lưu cookie...');
            const context = await api.getContext();
            const {imei, cookie, userAgent} = context;
            const data = {
                imei: imei,
                cookie: cookie,
                userAgent: userAgent,
            }
            const cookiesDir = './data/cookies';
            if (!fs.existsSync(cookiesDir)) {
                fs.mkdirSync(cookiesDir, { recursive: true });
                console.log('Đã tạo thư mục cookies');
            }
            fs.access(`${cookiesDir}/cred_${ownId}.json`, fs.constants.F_OK, (err) => {
                if (err) {
                    fs.writeFile(`${cookiesDir}/cred_${ownId}.json`, JSON.stringify(data, null, 4), (err) => {
                        if (err) {
                            console.error('Lỗi khi ghi file cookie:', err);
                        } else {
                            console.log(`Đã lưu cookie vào file cred_${ownId}.json`);
                        }
                    });
                } else {
                    console.log(`File cred_${ownId}.json đã tồn tại, không ghi đè`);
                }
            });

            console.log(`Đã đăng nhập vào tài khoản ${ownId} (${displayName}) với số điện thoại ${phoneNumber} qua proxy ${useCustomProxy ? customProxy : (proxyUsed?.url || 'không có proxy')}`);
        } catch (error) {
            console.error('Lỗi trong quá trình đăng nhập Zalo:', error);
            reject(error);
        }
    });
}
