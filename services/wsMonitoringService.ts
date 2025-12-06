/**
 * WebSocket Live Monitoring Service
 * Provides real-time fuzzing metrics dashboard with live updates
 */

import { WebSocketServer, WebSocket } from 'ws';
import { EventEmitter } from 'events';
import { Server } from 'http';

interface FuzzingMetrics {
  execPerSec: number;
  coverage: number;
  crashes: number;
  corpusSize: number;
  activeWorkers: number;
  uptime: number;
  memoryUsage: number;
}

interface ClientConnection {
  id: string;
  ws: WebSocket;
  sessionId?: string;
  subscriptions: Set<string>;
}

class WebSocketMonitoringService extends EventEmitter {
  private wss: WebSocketServer | null = null;
  private clients: Map<string, ClientConnection> = new Map();
  private metrics: Map<string, FuzzingMetrics> = new Map();
  private metricsInterval: NodeJS.Timeout | null = null;
  private startTime: number = Date.now();

  /**
   * Initialize WebSocket server
   */
  initialize(server: Server, path: string = '/ws'): void {
    this.wss = new WebSocketServer({ 
      server,
      path
    });

    this.wss.on('connection', (ws: WebSocket, req) => {
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
  private handleConnection(ws: WebSocket, req: any): void {
    const clientId = this.generateClientId();
    
    const client: ClientConnection = {
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
    ws.on('message', (data: Buffer) => {
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
  private handleClientMessage(clientId: string, data: Buffer): void {
    try {
      const message = JSON.parse(data.toString());
      const client = this.clients.get(clientId);
      
      if (!client) return;

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
    } catch (error) {
      console.error(`Error handling message from client ${clientId}:`, error);
    }
  }

  /**
   * Handle client disconnect
   */
  private handleDisconnect(clientId: string): void {
    this.clients.delete(clientId);
    console.log(`📡 Client disconnected: ${clientId} (Total: ${this.clients.size})`);
    this.emit('clientDisconnected', { clientId });
  }

  /**
   * Update metrics for a session
   */
  updateMetrics(sessionId: string, metrics: Partial<FuzzingMetrics>): void {
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
  private getDefaultMetrics(): FuzzingMetrics {
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
  private startMetricsBroadcast(): void {
    this.metricsInterval = setInterval(() => {
      this.broadcastMetrics();
    }, 1000); // Broadcast every second
  }

  /**
   * Broadcast metrics to all subscribed clients
   */
  private broadcastMetrics(): void {
    for (const [clientId, client] of this.clients) {
      if (client.subscriptions.size === 0) continue;

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
  broadcastEvent(event: string, data: any): void {
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
  private sendToClient(clientId: string, data: any): void {
    const client = this.clients.get(clientId);
    
    if (client && client.ws.readyState === WebSocket.OPEN) {
      try {
        client.ws.send(JSON.stringify(data));
      } catch (error) {
        console.error(`Error sending to client ${clientId}:`, error);
      }
    }
  }

  /**
   * Broadcast crash notification
   */
  notifyCrash(sessionId: string, crash: any): void {
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
  notifyCoverageIncrease(sessionId: string, newCoverage: number): void {
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
  private generateClientId(): string {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get connection statistics
   */
  getStats(): {
    totalClients: number;
    activeSessions: number;
    uptime: number;
  } {
    return {
      totalClients: this.clients.size,
      activeSessions: this.metrics.size,
      uptime: Date.now() - this.startTime
    };
  }

  /**
   * Get metrics for a session
   */
  getSessionMetrics(sessionId: string): FuzzingMetrics | null {
    return this.metrics.get(sessionId) || null;
  }

  /**
   * Clear metrics for a session
   */
  clearSessionMetrics(sessionId: string): void {
    this.metrics.delete(sessionId);
  }

  /**
   * Shutdown WebSocket server
   */
  async shutdown(): Promise<void> {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
    }

    // Close all client connections
    for (const client of this.clients.values()) {
      client.ws.close(1000, 'Server shutdown');
    }

    if (this.wss) {
      await new Promise<void>((resolve) => {
        this.wss!.close(() => {
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
