require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const { Rcon } = require('rcon-client');
const si = require('systeminformation');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();

// --- 1. BẢO MẬT: HELMET ---
app.use(helmet());

// --- 2. BẢO MẬT: CORS ---
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10kb' }));

// --- 3. BẢO MẬT: RATE LIMITING ---
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 200, 
    message: { message: "Quá nhiều request, vui lòng thử lại sau 15 phút." },
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api', generalLimiter);

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { success: false, message: "Bạn đã thử đăng nhập quá nhiều lần. Hãy đợi 15 phút." }
});

// --- CẤU HÌNH RCON ---
const RCON_OPTIONS = {
    host: process.env.RCON_HOST,
    port: parseInt(process.env.RCON_PORT),
    password: process.env.RCON_PASSWORD,
    timeout: 5000, 
    tcp: true
};

let refreshTokens = []; 
let dashboardCache = { data: null, lastUpdated: 0 };
const CACHE_DURATION = 5000; 

// --- HELPER: VALIDATE INPUT ---
const isValidMcName = (name) => /^[a-zA-Z0-9_]{3,16}$/.test(name);

// --- HELPER: SANITIZE REASON ---
const sanitizeReason = (text) => {
    if (!text) return "Admin Action";
    return text.replace(/[;\\"'$<>{}]/g, "").trim();
};

// --- HELPER RCON ---
async function sendRconCommand(command) {
    let rcon;
    try {
        rcon = await Rcon.connect(RCON_OPTIONS);
        const response = await rcon.send(command);
        return response;
    } catch (error) {
        console.error(`[RCON Error] ${command}:`, error.message);
        return `Error: ${error.message}`;
    } finally {
        if (rcon) try { await rcon.end(); } catch (e) {}
    }
}

async function getMinecraftData() {
    const now = Date.now();
    if (dashboardCache.data && (now - dashboardCache.lastUpdated < CACHE_DURATION)) {
        return dashboardCache.data;
    }

    try {
        const rcon = await Rcon.connect(RCON_OPTIONS);
        const listResponse = await rcon.send('list');
        
        let tpsResponse = "";
        try {
            tpsResponse = await rcon.send('tps');
            if (tpsResponse.includes("Unknown") || tpsResponse.includes("not found")) {
                 tpsResponse = await rcon.send('spark tps');
            }
        } catch (e) {}
        
        await rcon.end();

        // Xử lý dữ liệu
        let current = 0, max = 0, players = [], tps = 20.0;

        const countMatch = listResponse.match(/(\d+)\s*of\s*a\s*max\s*of\s*(\d+)/) || listResponse.match(/(\d+)\s*\/\s*(\d+)/);
        if (countMatch) { current = parseInt(countMatch[1]); max = parseInt(countMatch[2]); }
        
        if (listResponse.includes(':')) {
            const namesPart = listResponse.split(':')[1];
            if (namesPart.trim()) players = namesPart.split(',').map(n => n.trim()).filter(n => n.length > 0);
        }

        if (tpsResponse) {
            const cleanTPS = tpsResponse.replace(/§[0-9a-fk-or]/g, "");
            const msptMatch = cleanTPS.match(/(\d+\.\d+)\/(\d+\.\d+)\/(\d+\.\d+)\/(\d+\.\d+)/); // Spark
            
            if (msptMatch) {
                const medianMspt = parseFloat(msptMatch[2]); 
                tps = medianMspt <= 50.0 ? 20.0 : parseFloat((1000 / medianMspt).toFixed(1));
            } else {
                const standardMatch = cleanTPS.match(/(\d{1,2}\.\d{1,2})/); // Paper/Spigot
                if (standardMatch) tps = Math.min(parseFloat(standardMatch[0]), 20.0);
            }
        }

        const newData = { online: current, max: max, list: players, tps: tps };
        dashboardCache.data = newData;
        dashboardCache.lastUpdated = now;
        return newData;
    } catch (e) {
        console.error("Lỗi data MC:", e.message);
        return dashboardCache.data || { online: 0, max: 0, list: [], tps: 0 };
    }
}

// --- MIDDLEWARE AUTH ---
const authenticateToken = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Chưa đăng nhập' });
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
        if (err) return res.status(403).json({ message: 'Token hết hạn' });
        req.user = user;
        next();
    });
};

// --- ROUTES ---

// LOGIN ROUTE (ĐÃ CẬP NHẬT CHECK PERMISSION)
app.post('/api/login', loginLimiter, (req, res) => {
    const { username, password } = req.body;
    
    // 1. Log ra terminal để xem User nhập cái gì (Debug)
    console.log(`[LOGIN TRY] User: ${username} | Pass: ${password}`);

    if (!username || !password) return res.status(400).json({ success: false, message: "Thiếu thông tin" });

    try {
        const accounts = JSON.parse(fs.readFileSync('./data/accounts.json', 'utf8'));
        
        const user = accounts.find(a => a.username === username && a.password === password);
        
        if (user) {

            // --- FIX: Dùng parseInt để chấp nhận cả "1" và 1 ---
            // Nếu permission không tồn tại hoặc parse ra không phải 1 thì chặn
            if (!user.permission || parseInt(user.permission) !== 1) {
                return res.status(403).json({ success: false, message: 'Tài khoản không có quyền Admin.' });
            }
            // ----------------------------------------------------

            console.log(`[LOGIN SUCCESS] Cấp Token cho ${user.username}`);

            const payload = { username: user.username, permission: user.permission };
            const accessToken = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '15m' });
            const refreshToken = jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '7d' });
            refreshTokens.push(refreshToken);
            
            res.json({ success: true, accessToken, refreshToken, user: payload });
        } else {
            console.log(`[LOGIN FAIL] Sai thông tin`);
            res.status(401).json({ success: false, message: 'Sai tài khoản hoặc mật khẩu' }); 
        }
    } catch (e) { 
        console.error("Lỗi đọc file/server:", e);
        res.status(500).json({ success: false, message: "Lỗi server nội bộ" }); 
    }
});

app.post('/api/refresh', (req, res) => {
    const { refreshToken } = req.body;
    if (!refreshToken || !refreshTokens.includes(refreshToken)) return res.sendStatus(403);
    jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        const accessToken = jwt.sign({ username: user.username, permission: user.permission }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '15m' });
        res.json({ accessToken });
    });
});

app.post('/api/logout', (req, res) => {
    refreshTokens = refreshTokens.filter(t => t !== req.body.refreshToken);
    res.json({ success: true });
});

app.get('/api/dashboard', authenticateToken, async (req, res) => {
    try {
        const [cpu, mem, mc] = await Promise.all([si.currentLoad(), si.mem(), getMinecraftData()]);
        res.json({
            hardware: { cpu: cpu.currentLoad.toFixed(0), ram: ((mem.active / mem.total) * 100).toFixed(0), ramUsage: (mem.active / Math.pow(1024, 3)).toFixed(0), ramTotal: (mem.total / Math.pow(1024, 3)).toFixed(0) },
            minecraft: mc
        });
    } catch (e) { res.status(500).json({ error: "Internal Error" }); }
});

app.get('/api/player/banlist', authenticateToken, async (req, res) => {
    const raw = await sendRconCommand('banlist players');
    let list = [];
    if (raw.includes(':')) {
        list = raw.split(':')[1].split(',').map(n => n.trim().split(' ')[0]).filter(n => n.length > 0);
    }
    res.json({ list });
});

// --- CÁC ROUTE PLAYER ACTION ---

app.post('/api/player/kick', authenticateToken, async (req, res) => {
    const { player, reason } = req.body;
    if (!isValidMcName(player)) return res.status(400).json({ success: false, message: "Tên người chơi không hợp lệ" });
    const safeReason = sanitizeReason(reason);
    res.json({ success: true, message: await sendRconCommand(`kick ${player} ${safeReason}`) });
});

app.post('/api/player/ban', authenticateToken, async (req, res) => {
    const { player, reason } = req.body;
    if (!isValidMcName(player)) return res.status(400).json({ success: false, message: "Tên người chơi không hợp lệ" });
    const safeReason = sanitizeReason(reason);
    res.json({ success: true, message: await sendRconCommand(`ban ${player} ${safeReason}`) });
});

app.post('/api/player/unban', authenticateToken, async (req, res) => {
    const { player } = req.body;
    if (!isValidMcName(player)) return res.status(400).json({ success: false, message: "Tên người chơi không hợp lệ" });
    const msg = await sendRconCommand(`pardon ${player}`);
    if (msg.includes("Nothing changed")) return res.json({ success: false, message: "Không tìm thấy" });
    res.json({ success: true, message: msg });
});

app.post('/api/player/op', authenticateToken, async (req, res) => {
    const { player } = req.body;
    if (!isValidMcName(player)) return res.status(400).json({ success: false, message: "Tên người chơi không hợp lệ" });
    res.json({ success: true, message: await sendRconCommand(`op ${player}`) });
});

app.post('/api/player/deop', authenticateToken, async (req, res) => {
    const { player } = req.body;
    if (!isValidMcName(player)) return res.status(400).json({ success: false, message: "Tên người chơi không hợp lệ" });
    res.json({ success: true, message: await sendRconCommand(`deop ${player}`) });
});

app.listen(process.env.PORT || 5000, () => console.log('Server Securely Running (Permission Checked)...'));