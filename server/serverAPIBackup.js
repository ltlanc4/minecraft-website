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
    host: process.env.RCON_HOST || 'localhost',
    port: parseInt(process.env.RCON_PORT) || 25575,
    password: process.env.RCON_PASSWORD || 'your_rcon_password',
    timeout: 5000, 
    tcp: true
};

let refreshTokens = []; 

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
    try {
        const rcon = await Rcon.connect(RCON_OPTIONS);
        
        // 1. Lấy List
        const listResponse = await rcon.send('list');
        
        // 2. Lấy TPS (Thử Spigot -> Fabric)
        let tps = 20.0;
        let tpsRes = "";
        try { tpsRes = await rcon.send('tps'); } catch {}
        if (!tpsRes || tpsRes.includes("Unknown")) {
            try { tpsRes = await rcon.send('spark tps'); } catch {}
        }
        await rcon.end();

        // Parse Player Count
        let current = 0, max = 0, players = [];
        const countMatch = listResponse.match(/are (\d+)\s+of\s+a\s+max\s+of\s+(\d+)/) || listResponse.match(/(\d+)\s*\/\s*(\d+)/);
        if (countMatch) { current = parseInt(countMatch[1]); max = parseInt(countMatch[2]); }
        
        // Parse Player Names
        if (listResponse.includes(':')) {
            players = listResponse.split(':')[1].split(',').map(n => n.trim()).filter(n => n.length > 0);
        }

        // Parse TPS
        const tpsMatch = tpsRes.match(/(\d{1,2}\.\d{1,2})/);
        if (tpsMatch) tps = Math.min(parseFloat(tpsMatch[1]), 20.0);

        return { online: current, max: max, list: players, tps: tps };
    } catch (e) {
        return { online: 0, max: 0, list: [], tps: 0 };
    }
}

// --- MIDDLEWARE ---
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
        } else {
            res.status(401).json({ success: false, message: 'Sai thông tin' });
        }
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
    const msg = await sendRconCommand(`kick ${player} ${reason}`);
    res.json({ success: true, message: msg });
});

app.post('/api/player/ban', authenticateToken, async (req, res) => {
    const { player, reason } = req.body;
    const msg = await sendRconCommand(`ban ${player} ${reason}`);
    res.json({ success: true, message: msg });
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

app.listen(process.env.PORT || 5000, () => console.log('Server Running...'));