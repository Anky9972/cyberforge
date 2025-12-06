/**
 * WebSocket Live Monitoring Service
 * Provides real-time fuzzing metrics dashboard with live updates
 */
import { WebSocketServer, WebSocket } from 'ws';
import { EventEmitter } from 'events';
class WebSocketMonitoringService extends EventEmitter {
    wss = null;
    clients = new Map();
    metrics = new Map();
    metricsInterval = null;
    startTime = Date.now();
    /**
     * Initialize WebSocket server
     */
    initialize(server, path = '/ws') {
        this.wss = new WebSocketServer({
            server,
            path
        });
        this.wss.on('connection', (ws, req) => {
            this.handleConnection(ws, req);
        });
        this.wss.on('error', (error) => {
            console.error('WebSocket server error:', error);
        });
        // Start metrics broadcasting
        this.startMetricsBroadcast();
        console.log(`✅ WebSocket monitoring service initialized on ${path}`);
    }
    /**
     * Handle new WebSocket connection
     */
    handleConnection(ws, req) {
        const clientId = this.generateClientId();
        const client = {
            id: clientId,
            ws,
            subscriptions: new Set()
        };
        this.clients.set(clientId, client);
        console.log(`📡 Client connected: ${clientId} (Total: ${this.clients.size})`);
        // Send initial connection message
        this.sendToClient(clientId, {
            type: 'connected',
            clientId,
            timestamp: Date.now()
        });
        // Handle messages from client
        ws.on('message', (data) => {
            this.handleClientMessage(clientId, data);
        });
        // Handle client disconnect
        ws.on('close', () => {
            this.handleDisconnect(clientId);
        });
        // Handle errors
        ws.on('error', (error) => {
            console.error(`WebSocket error for client ${clientId}:`, error);
        });
        this.emit('clientConnected', { clientId });
    }
    /**
     * Handle messages from clients
     */
    handleClientMessage(clientId, data) {
        try {
            const message = JSON.parse(data.toString());
            const client = this.clients.get(clientId);
            if (!client)
                return;
            switch (message.type) {
                case 'subscribe':
                    if (message.sessionId) {
                        client.sessionId = message.sessionId;
                        client.subscriptions.add(message.sessionId);
                        // Send current metrics for this session
                        const metrics = this.metrics.get(message.sessionId);
                        if (metrics) {
                            this.sendToClient(clientId, {
                                type: 'metrics',
                                sessionId: message.sessionId,
                                data: metrics
                            });
                        }
                    }
                    break;
                case 'unsubscribe':
                    if (message.sessionId) {
                        client.subscriptions.delete(message.sessionId);
                    }
                    break;
                case 'ping':
                    this.sendToClient(clientId, {
                        type: 'pong',
                        timestamp: Date.now()
                    });
                    break;
            }
        }
        catch (error) {
            console.error(`Error handling message from client ${clientId}:`, error);
        }
    }
    /**
     * Handle client disconnect
     */
    handleDisconnect(clientId) {
        this.clients.delete(clientId);
        console.log(`📡 Client disconnected: ${clientId} (Total: ${this.clients.size})`);
        this.emit('clientDisconnected', { clientId });
    }
    /**
     * Update metrics for a session
     */
    updateMetrics(sessionId, metrics) {
        const current = this.metrics.get(sessionId) || this.getDefaultMetrics();
        this.metrics.set(sessionId, {
            ...current,
            ...metrics,
            uptime: Date.now() - this.startTime
        });
    }
    /**
     * Get default metrics
     */
    getDefaultMetrics() {
        return {
            execPerSec: 0,
            coverage: 0,
            crashes: 0,
            corpusSize: 0,
            activeWorkers: 0,
            uptime: 0,
            memoryUsage: 0
        };
    }
    /**
     * Start broadcasting metrics to clients
     */
    startMetricsBroadcast() {
        this.metricsInterval = setInterval(() => {
            this.broadcastMetrics();
        }, 1000); // Broadcast every second
    }
    /**
     * Broadcast metrics to all subscribed clients
     */
    broadcastMetrics() {
        for (const [clientId, client] of this.clients) {
            if (client.subscriptions.size === 0)
                continue;
            for (const sessionId of client.subscriptions) {
                const metrics = this.metrics.get(sessionId);
                if (metrics) {
                    this.sendToClient(clientId, {
                        type: 'metrics',
                        sessionId,
                        data: metrics,
                        timestamp: Date.now()
                    });
                }
            }
        }
    }
    /**
     * Broadcast event to all clients
     */
    broadcastEvent(event, data) {
        const message = {
            type: 'event',
            event,
            data,
            timestamp: Date.now()
        };
        for (const client of this.clients.values()) {
            if (client.ws.readyState === WebSocket.OPEN) {
                client.ws.send(JSON.stringify(message));
            }
        }
    }
    /**
     * Send message to specific client
     */
    sendToClient(clientId, data) {
        const client = this.clients.get(clientId);
        if (client && client.ws.readyState === WebSocket.OPEN) {
            try {
                client.ws.send(JSON.stringify(data));
            }
            catch (error) {
                console.error(`Error sending to client ${clientId}:`, error);
            }
        }
    }
    /**
     * Broadcast crash notification
     */
    notifyCrash(sessionId, crash) {
        const message = {
            type: 'crash',
            sessionId,
            data: crash,
            timestamp: Date.now()
        };
        for (const client of this.clients.values()) {
            if (client.subscriptions.has(sessionId)) {
                this.sendToClient(client.id, message);
            }
        }
    }
    /**
     * Broadcast coverage update
     */
    notifyCoverageIncrease(sessionId, newCoverage) {
        const message = {
            type: 'coverageIncrease',
            sessionId,
            data: { coverage: newCoverage },
            timestamp: Date.now()
        };
        for (const client of this.clients.values()) {
            if (client.subscriptions.has(sessionId)) {
                this.sendToClient(client.id, message);
            }
        }
    }
    /**
     * Generate unique client ID
     */
    generateClientId() {
        return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    /**
     * Get connection statistics
     */
    getStats() {
        return {
            totalClients: this.clients.size,
            activeSessions: this.metrics.size,
            uptime: Date.now() - this.startTime
        };
    }
    /**
     * Get metrics for a session
     */
    getSessionMetrics(sessionId) {
        return this.metrics.get(sessionId) || null;
    }
    /**
     * Clear metrics for a session
     */
    clearSessionMetrics(sessionId) {
        this.metrics.delete(sessionId);
    }
    /**
     * Shutdown WebSocket server
     */
    async shutdown() {
        if (this.metricsInterval) {
            clearInterval(this.metricsInterval);
        }
        // Close all client connections
        for (const client of this.clients.values()) {
            client.ws.close(1000, 'Server shutdown');
        }
        if (this.wss) {
            await new Promise((resolve) => {
                this.wss.close(() => {
                    console.log('✅ WebSocket server shut down');
                    resolve();
                });
            });
        }
        this.clients.clear();
        this.metrics.clear();
    }
}
export const wsMonitoringService = new WebSocketMonitoringService();
export default wsMonitoringService;
//# sourceMappingURL=wsMonitoringService.js.map