const WebSocket = require('ws');

let wss = null;
const clients = new Map();

function initWebSocket(server) {
    wss = new WebSocket.Server({ server, path: '/ws' });

    wss.on('connection', (ws, req) => {
        const clientId = `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        clients.set(clientId, { ws, connectedAt: new Date(), lastPing: Date.now() });

        console.log(`WebSocket client connected: ${clientId}, total: ${clients.size}`);

        ws.send(JSON.stringify({
            type: 'connected',
            message: '实时通知服务已连接',
            timestamp: new Date().toISOString(),
            clientId
        }));

        ws.on('message', (data) => {
            try {
                const msg = JSON.parse(data.toString());
                if (msg.type === 'ping') {
                    ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
                    const client = clients.get(clientId);
                    if (client) client.lastPing = Date.now();
                } else if (msg.type === 'subscribe') {
                    const client = clients.get(clientId);
                    if (client) {
                        client.channels = msg.channels || ['all'];
                        ws.send(JSON.stringify({ type: 'subscribed', channels: client.channels }));
                    }
                }
            } catch (e) {
                console.error('WebSocket message parse error:', e.message);
            }
        });

        ws.on('close', () => {
            clients.delete(clientId);
            console.log(`WebSocket client disconnected: ${clientId}, total: ${clients.size}`);
        });

        ws.on('error', (err) => {
            console.error(`WebSocket client error ${clientId}:`, err.message);
            clients.delete(clientId);
        });

        // Heartbeat check
        ws.isAlive = true;
        ws.on('pong', () => { ws.isAlive = true; });
    });

    // Periodic heartbeat and cleanup
    const heartbeatInterval = setInterval(() => {
        wss.clients.forEach((ws) => {
            if (!ws.isAlive) {
                ws.terminate();
                return;
            }
            ws.isAlive = false;
            ws.ping();
        });

        // Cleanup stale clients
        const now = Date.now();
        for (const [id, client] of clients.entries()) {
            if (now - client.lastPing > 120000) {
                if (client.ws.readyState === WebSocket.OPEN) {
                    client.ws.terminate();
                }
                clients.delete(id);
            }
        }
    }, 30000);

    wss.on('close', () => {
        clearInterval(heartbeatInterval);
    });

    return wss;
}

function broadcast(message, channel = 'all') {
    if (!wss) return;
    const payload = JSON.stringify({
        ...message,
        timestamp: new Date().toISOString()
    });

    let sent = 0;
    wss.clients.forEach((ws) => {
        if (ws.readyState === WebSocket.OPEN) {
            const client = Array.from(clients.values()).find(c => c.ws === ws);
            if (!client || !client.channels || client.channels.includes(channel) || client.channels.includes('all')) {
                ws.send(payload);
                sent++;
            }
        }
    });
    return sent;
}

function notifyUser(userId, message) {
    if (!wss) return;
    const payload = JSON.stringify({
        ...message,
        timestamp: new Date().toISOString()
    });

    let sent = 0;
    for (const client of clients.values()) {
        if (client.ws.readyState === WebSocket.OPEN && client.userId === userId) {
            client.ws.send(payload);
            sent++;
        }
    }
    return sent;
}

function getStats() {
    return {
        totalClients: clients.size,
        openConnections: Array.from(wss?.clients || []).filter(ws => ws.readyState === WebSocket.OPEN).length
    };
}

module.exports = { initWebSocket, broadcast, notifyUser, getStats };
