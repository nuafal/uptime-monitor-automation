require('dotenv').config();
const axios = require('axios');
const fs = require('fs');
const os = require('os');

const path = require('path');
const rootDir = path.join(__dirname, '..');

// CONFIGURATION
const WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;
const HISTORY_FILE = path.join(rootDir, 'config', 'history.json'); 
const DASHBOARD_FILE = path.join(rootDir, 'src', 'dashboard.html');
const MAX_HISTORY = 50; 
const URLS_TO_CHECK = [
    "https://google.com",
    "https://github.com/nuafal", 
    "https://this-site-does-not-exist-123.com"
];

// 1. HELPER: Get System Stats
function getSystemHealth() {
    const freeMem = os.freemem() / 1024 / 1024 / 1024;
    const totalMem = os.totalmem() / 1024 / 1024 / 1024;
    const uptime = os.uptime() / 3600;

    return {
        freeMem: freeMem.toFixed(2),
        totalMem: totalMem.toFixed(2),
        uptime: uptime.toFixed(2)
    };
}

// 2. HELPER: Database Manager
function updateHistory(newEntry) {
    let history = [];
    if (fs.existsSync(HISTORY_FILE)) {
        try { history = JSON.parse(fs.readFileSync(HISTORY_FILE)); } 
        catch (e) { console.log("⚠️ History file corrupted, starting fresh."); }
    }
    history.push(newEntry);
    if (history.length > MAX_HISTORY) history = history.slice(history.length - MAX_HISTORY);
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2));
    return history;
}

// 3. HELPER: Send Alert
async function sendAlert(message) {
    if (!WEBHOOK_URL) return;
    try { await axios.post(WEBHOOK_URL, { content: message }); } 
    catch (error) { console.error("❌ Alert failed:", error.message); }
}

// 4. MAIN: Check Sites & Generate Dashboard
async function checkSites() {
    console.log(`🔍 Starting Check at ${new Date().toLocaleTimeString()}...`);
    
        let currentResults = {
            timestamp: new Date().toLocaleString([], {
                month: 'short', 
                day: 'numeric', 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: true
            }),
            sites: []
        };

    // --- CHECK SITES LOOP ---
    for (const url of URLS_TO_CHECK) {
        const start = Date.now();
        let status = 'UP';
        let latency = 0;

        try {
            await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 5000 });
            latency = ((Date.now() - start) / 1000); 
            console.log(`✅ ${url}: ${latency}s`);
        } catch (error) {
            console.log(`❌ ${url}: DOWN`);
            status = 'DOWN';
            await sendAlert(`💀 **CRITICAL:** ${url} is DOWN!`);
        }
        currentResults.sites.push({ url, status, latency });
    }

    // --- UPDATE DATABASE ---
    const historyData = updateHistory(currentResults);

    // --- PREPARE CHART DATA ---
    const labels = historyData.map(h => h.timestamp);
    const datasets = URLS_TO_CHECK.map((url, index) => {
        const colors = ['#2ecc71', '#3498db', '#9b59b6', '#f1c40f', '#e67e22']; 
        const color = colors[index % colors.length];
        return {
            label: url.replace('https://', ''),
            data: historyData.map(h => {
                const site = h.sites.find(s => s.url === url);
                return site ? site.latency : 0;
            }),
            borderColor: color,
            backgroundColor: color,
            tension: 0.4,
            fill: false
        };
    });

    // --- GENERATE HTML ---
    let htmlContent = `
    <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <title>Uptime Dashboard</title>
            <meta http-equiv="refresh" content="30">
            <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
            <style>
                :root {
                    --bg-color: #f4f4f9; --card-bg: #ffffff; --text-color: #333333;
                    --toggle-bg: #ccc; --toggle-active: #2196F3;
                }
                [data-theme="dark"] {
                    --bg-color: #1a1a1a; --card-bg: #2d2d2d; --text-color: #ffffff;
                    --toggle-bg: #666; --toggle-active: #2ecc71;
                }
                body { font-family: 'Segoe UI', sans-serif; padding: 20px; background-color: var(--bg-color); color: var(--text-color); transition: background-color 0.3s, color 0.3s; }
                .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
                .card { background-color: var(--card-bg); padding: 20px; margin-bottom: 15px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
                
                .switch { position: relative; display: inline-block; width: 60px; height: 34px; }
                .switch input { opacity: 0; width: 0; height: 0; }
                .slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: var(--toggle-bg); transition: .4s; border-radius: 34px; }
                .slider:before { position: absolute; content: "☀️"; height: 26px; width: 26px; left: 4px; bottom: 4px; background-color: white; transition: .4s; border-radius: 50%; text-align: center; line-height: 26px; }
                input:checked + .slider { background-color: var(--toggle-active); }
                input:checked + .slider:before { transform: translateX(26px); content: "🌙"; }
                
                ul { list-style: none; padding: 0; }
                li { padding: 10px 0; border-bottom: 1px solid rgba(128,128,128,0.1); display: flex; justify-content: space-between; }
                a { color: #2196F3; text-decoration: none; font-weight: bold; }
            </style>
            <script>
                // 💡 Apply theme immediately before page renders to prevent "White Flash"
                const savedTheme = localStorage.getItem('theme') || 'light';
                document.documentElement.setAttribute('data-theme', savedTheme);
            </script>
        </head>
        <body>
            <div class="header">
                <h1>🚀 System Status</h1>
                <label class="switch">
                    <input type="checkbox" id="theme-checkbox" onchange="toggleTheme()">
                    <span class="slider"></span>
                </label>
            </div>

            <div style="display: flex; justify-content: space-between; margin-bottom: 20px; color: var(--text-color); opacity: 0.8;">
                <span>📅 Last Scan: <strong>${new Date().toLocaleString()}</strong></span>
                <span>⏰ Current Time: <strong id="live-clock">Loading...</strong></span>
            </div>

            <div class="card">
                <h2>📈 Latency History (Seconds)</h2>
                <div style="height: 300px;"><canvas id="latencyChart"></canvas></div>
            </div>

            <div class="card">
                <h2>🖥️ Server Health</h2>
                <p><strong>RAM Usage:</strong> ${(getSystemHealth().totalMem - getSystemHealth().freeMem).toFixed(2)} / ${getSystemHealth().totalMem} GB</p>
                <p><strong>System Uptime:</strong> ${getSystemHealth().uptime} Hours</p>
            </div>

            <div class="card">
                <h2>🌐 Current Status</h2>
                <ul>
                    ${currentResults.sites.map(s => `
                        <li>
                            <span>${s.status === 'UP' ? '✅' : '❌'} <a href="${s.url}" target="_blank">${s.url}</a></span>
                            <span style="font-family: monospace;">${s.latency.toFixed(3)}s</span>
                        </li>
                    `).join('')}
                </ul>
            </div>

            <script>
                // Sync checkbox with the current theme
                const checkbox = document.getElementById('theme-checkbox');
                if (localStorage.getItem('theme') === 'dark') checkbox.checked = true;

                function toggleTheme() {
                    const newTheme = checkbox.checked ? 'dark' : 'light';
                    document.documentElement.setAttribute('data-theme', newTheme);
                    localStorage.setItem('theme', newTheme);
                    // Reloading ensures Chart.js colors also refresh
                    location.reload(); 
                }

                function updateClock() {
                    document.getElementById('live-clock').innerText = new Date().toLocaleTimeString();
                }
                setInterval(updateClock, 1000);
                updateClock();

                // --- CHART.JS LOGIC ---
                const theme = localStorage.getItem('theme') || 'light';
                const chartColor = theme === 'dark' ? '#ffffff' : '#333333';
                const gridColor = theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';

                const ctx = document.getElementById('latencyChart').getContext('2d');
                new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: ${JSON.stringify(labels)},
                        datasets: ${JSON.stringify(datasets)}
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                            x: { ticks: { color: chartColor }, grid: { color: gridColor } },
                            y: { 
                                beginAtZero: false, 
                                ticks: { color: chartColor }, 
                                grid: { color: gridColor },
                                title: { display: true, text: 'Seconds', color: chartColor }
                            }
                        },
                        plugins: {
                            legend: { labels: { color: chartColor } },
                            tooltip: { mode: 'index', intersect: false }
                        }
                    }
                });
            </script>
        </body>
        </html>`;

    fs.writeFileSync(DASHBOARD_FILE, htmlContent);
    console.log("📊 Dashboard updated.");
}

checkSites();
