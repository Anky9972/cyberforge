/**
 * WebSocket Live Monitoring Service
 * Provides real-time fuzzing metrics dashboard with live updates
 */
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
declare class WebSocketMonitoringService extends EventEmitter {
    private wss;
    private clients;
    private metrics;
    private metricsInterval;
    private startTime;
    /**
     * Initialize WebSocket server
     */
    initialize(server: Server, path?: string): void;
    /**
     * Handle new WebSocket connection
     */
    private handleConnection;
    /**
     * Handle messages from clients
     */
    private handleClientMessage;
    /**
     * Handle client disconnect
     */
    private handleDisconnect;
    /**
     * Update metrics for a session
     */
    updateMetrics(sessionId: string, metrics: Partial<FuzzingMetrics>): void;
    /**
     * Get default metrics
     */
    private getDefaultMetrics;
    /**
     * Start broadcasting metrics to clients
     */
    private startMetricsBroadcast;
    /**
     * Broadcast metrics to all subscribed clients
     */
    private broadcastMetrics;
    /**
     * Broadcast event to all clients
     */
    broadcastEvent(event: string, data: any): void;
    /**
     * Send message to specific client
     */
    private sendToClient;
    /**
     * Broadcast crash notification
     */
    notifyCrash(sessionId: string, crash: any): void;
    /**
     * Broadcast coverage update
     */
    notifyCoverageIncrease(sessionId: string, newCoverage: number): void;
    /**
     * Generate unique client ID
     */
    private generateClientId;
    /**
     * Get connection statistics
     */
    getStats(): {
        totalClients: number;
        activeSessions: number;
        uptime: number;
    };
    /**
     * Get metrics for a session
     */
    getSessionMetrics(sessionId: string): FuzzingMetrics | null;
    /**
     * Clear metrics for a session
     */
    clearSessionMetrics(sessionId: string): void;
    /**
     * Shutdown WebSocket server
     */
    shutdown(): Promise<void>;
}
export declare const wsMonitoringService: WebSocketMonitoringService;
export default wsMonitoringService;
//# sourceMappingURL=wsMonitoringService.d.ts.map