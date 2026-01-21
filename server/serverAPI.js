require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const { Rcon } = require('rcon-client');
const si = require('systeminformation');

const app = express();
app.use(express.json());
app.use(cors());

// --- CẤU HÌNH ---
const RCON_OPTIONS = {
    host: process.env.RCON_HOST,
    port: parseInt(process.env.RCON_PORT),
    password: process.env.RCON_PASSWORD,
    timeout: 5000, 
    tcp: true
};


let refreshTokens = []; 
let dashboardCache = { data: null, lastUpdated: 0 };
const CACHE_DURATION = 5000; // Cache 5 giây

// --- HELPER FUNCTIONS ---
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
    // Cache: Nếu dữ liệu chưa cũ quá 5 giây thì trả về luôn
    if (dashboardCache.data && (now - dashboardCache.lastUpdated < CACHE_DURATION)) {
        return dashboardCache.data;
    }

    try {
        const rcon = await Rcon.connect(RCON_OPTIONS);
        
        // 1. LẤY LIST PLAYER
        const listResponse = await rcon.send('list');
        
        // 2. LẤY TPS (Gửi lệnh 'spark health' hoặc 'tps' để lấy thông tin chi tiết)
        let tpsResponse = "";
        try {
            // Thử lệnh tps thường
            tpsResponse = await rcon.send('tps');
            
            // Nếu server trả về lỗi hoặc không hiểu, thử lệnh spark tps hoặc spark health
            if (tpsResponse.includes("Unknown") || tpsResponse.includes("not found")) {
                 // Spark thường trả về MSPT khi gõ lệnh này
                 tpsResponse = await rcon.send('spark tps');
            }
        } catch (e) {}
        
        await rcon.end();

        // Debug: Log ra để kiểm tra
        console.log("LOG RCON:", tpsResponse);

        // 3. XỬ LÝ DỮ LIỆU
        let current = 0, max = 0, players = [], tps = 20.0;

        // A. Parse Player
        const countMatch = listResponse.match(/(\d+)\s*of\s*a\s*max\s*of\s*(\d+)/) || listResponse.match(/(\d+)\s*\/\s*(\d+)/);
        if (countMatch) { 
            current = parseInt(countMatch[1]); 
            max = parseInt(countMatch[2]); 
        }
        
        if (listResponse.includes(':')) {
            const namesPart = listResponse.split(':')[1];
            if (namesPart.trim()) players = namesPart.split(',').map(n => n.trim()).filter(n => n.length > 0);
        }

        // B. Parse TPS (Logic mới cho Spark MSPT)
        if (tpsResponse) {
            // Xóa mã màu
            const cleanTPS = tpsResponse.replace(/§[0-9a-fk-or]/g, "");

            // CASE 1: Server trả về MSPT dạng "1.9/2.3/3.1/5.9" (Spark)
            // Regex tìm chuỗi số dạng: so/so/so/so
            const msptMatch = cleanTPS.match(/(\d+\.\d+)\/(\d+\.\d+)\/(\d+\.\d+)\/(\d+\.\d+)/);
            
            if (msptMatch) {
                // Lấy số thứ 2 (Median - Trung vị) là chính xác nhất
                const medianMspt = parseFloat(msptMatch[2]); 
                
                // Công thức: Nếu xử lý < 50ms thì TPS là 20. Nếu > 50ms thì lấy 1000/mspt
                if (medianMspt <= 50.0) {
                    tps = 20.0;
                } else {
                    tps = parseFloat((1000 / medianMspt).toFixed(1));
                }
                console.log(`Detected Spark MSPT: ${medianMspt}ms -> Calculated TPS: ${tps}`);
            } 
            // CASE 2: Server trả về TPS dạng "TPS: 19.5" (Paper/Spigot)
            else {
                const standardMatch = cleanTPS.match(/(\d{1,2}\.\d{1,2})/);
                if (standardMatch) {
                    tps = Math.min(parseFloat(standardMatch[0]), 20.0);
                }
            }
        }

        const newData = { online: current, max: max, list: players, tps: tps };
        
        dashboardCache.data = newData;
        dashboardCache.lastUpdated = now;

        return newData;
    } catch (e) {
        console.error("Lỗi lấy data MC:", e.message);
        return dashboardCache.data || { online: 0, max: 0, list: [], tps: 0 };
    }
}

// --- AUTH & ROUTES (GIỮ NGUYÊN KHÔNG ĐỔI) ---
const authenticateToken = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Chưa đăng nhập' });
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
        if (err) return res.status(403).json({ message: 'Token hết hạn' });
        req.user = user;
        next();
    });
};

app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    try {
        const accounts = JSON.parse(fs.readFileSync('./data/accounts.json', 'utf8'));
        const user = accounts.find(a => a.username === username && a.password === password);
        if (user) {
            const payload = { username: user.username, role: user.role };
            const accessToken = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '15m' });
            const refreshToken = jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '7d' });
            refreshTokens.push(refreshToken);
            res.json({ success: true, accessToken, refreshToken, user: payload });
        } else { res.status(401).json({ success: false, message: 'Sai thông tin' }); }
    } catch { res.status(500).json({ success: false }); }
});

app.post('/api/refresh', (req, res) => {
    const { refreshToken } = req.body;
    if (!refreshToken || !refreshTokens.includes(refreshToken)) return res.sendStatus(403);
    jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        const accessToken = jwt.sign({ username: user.username, role: user.role }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '15m' });
        res.json({ accessToken });
    });
});

app.post('/api/logout', (req, res) => {
    refreshTokens = refreshTokens.filter(t => t !== req.body.refreshToken);
    res.json({ success: true });
});

app.get('/api/dashboard', authenticateToken, async (req, res) => {
    const [cpu, mem, mc] = await Promise.all([si.currentLoad(), si.mem(), getMinecraftData()]);
    res.json({
        hardware: { cpu: cpu.currentLoad.toFixed(1), ram: ((mem.active / mem.total) * 100).toFixed(1) },
        minecraft: mc
    });
});

app.get('/api/player/banlist', authenticateToken, async (req, res) => {
    const raw = await sendRconCommand('banlist players');
    let list = [];
    if (raw.includes(':')) {
        list = raw.split(':')[1].split(',').map(n => n.trim().split(' ')[0]).filter(n => n.length > 0);
    }
    res.json({ list });
});

app.post('/api/player/kick', authenticateToken, async (req, res) => {
    const { player, reason } = req.body;
    res.json({ success: true, message: await sendRconCommand(`kick ${player} ${reason}`) });
});

app.post('/api/player/ban', authenticateToken, async (req, res) => {
    const { player, reason } = req.body;
    res.json({ success: true, message: await sendRconCommand(`ban ${player} ${reason}`) });
});

app.post('/api/player/unban', authenticateToken, async (req, res) => {
    const msg = await sendRconCommand(`pardon ${req.body.player}`);
    if (msg.includes("Nothing changed")) return res.json({ success: false, message: "Không tìm thấy" });
    res.json({ success: true, message: msg });
});

app.post('/api/player/op', authenticateToken, async (req, res) => {
    res.json({ success: true, message: await sendRconCommand(`op ${req.body.player}`) });
});

app.post('/api/player/deop', authenticateToken, async (req, res) => {
    res.json({ success: true, message: await sendRconCommand(`deop ${req.body.player}`) });
});

app.post('/api/player/command', authenticateToken, async (req, res) => {
    res.json({ success: true, message: await sendRconCommand(req.body.command) });
});

app.listen(process.env.PORT || 5000, () => console.log('Server Running...'));