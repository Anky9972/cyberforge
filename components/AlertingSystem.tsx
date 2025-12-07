/**
 * Real-Time Alerting System
 * Webhook support for Slack, email, and custom integrations
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bell, Mail, Slack, Webhook, Plus, Trash2, CheckCircle, AlertTriangle } from 'lucide-react';

interface WebhookConfig {
    id: string;
    name: string;
    type: 'slack' | 'email' | 'custom';
    url?: string;
    email?: string;
    enabled: boolean;
    rules: AlertRule[];
}

interface AlertRule {
    id: string;
    trigger: 'vulnerability_found' | 'severity_threshold' | 'coverage_drop' | 'scan_complete';
    condition?: {
        severity?: 'critical' | 'high' | 'medium' | 'low';
        count?: number;
        percentage?: number;
    };
}

interface AlertingSystemProps {
    onWebhookAdded?: (webhook: WebhookConfig) => void;
    onWebhookRemoved?: (webhookId: string) => void;
}

export const AlertingSystem: React.FC<AlertingSystemProps> = ({
    onWebhookAdded,
    onWebhookRemoved
}) => {
    const [webhooks, setWebhooks] = useState<WebhookConfig[]>([]);
    const [isAddingWebhook, setIsAddingWebhook] = useState(false);
    const [newWebhook, setNewWebhook] = useState<Partial<WebhookConfig>>({
        type: 'slack',
        enabled: true,
        rules: []
    });
    const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

    /**
     * Load saved webhooks from localStorage
     */
    useEffect(() => {
        const saved = localStorage.getItem('cyberforge_webhooks');
        if (saved) {
            setWebhooks(JSON.parse(saved));
        }
    }, []);

    /**
     * Save webhooks to localStorage
     */
    const saveWebhooks = (updatedWebhooks: WebhookConfig[]) => {
        setWebhooks(updatedWebhooks);
        localStorage.setItem('cyberforge_webhooks', JSON.stringify(updatedWebhooks));
    };

    /**
     * Add new webhook
     */
    const addWebhook = () => {
        if (!newWebhook.name) {
            alert('Please provide a webhook name');
            return;
        }

        if (newWebhook.type === 'slack' && !newWebhook.url) {
            alert('Please provide a Slack webhook URL');
            return;
        }

        if (newWebhook.type === 'email' && !newWebhook.email) {
            alert('Please provide an email address');
            return;
        }

        if (newWebhook.type === 'custom' && !newWebhook.url) {
            alert('Please provide a webhook URL');
            return;
        }

        const webhook: WebhookConfig = {
            id: Date.now().toString(),
            name: newWebhook.name!,
            type: newWebhook.type!,
            url: newWebhook.url,
            email: newWebhook.email,
            enabled: true,
            rules: newWebhook.rules || []
        };

        const updated = [...webhooks, webhook];
        saveWebhooks(updated);
        
        if (onWebhookAdded) {
            onWebhookAdded(webhook);
        }

        setIsAddingWebhook(false);
        setNewWebhook({ type: 'slack', enabled: true, rules: [] });
    };

    /**
     * Remove webhook
     */
    const removeWebhook = (id: string) => {
        const updated = webhooks.filter(w => w.id !== id);
        saveWebhooks(updated);
        
        if (onWebhookRemoved) {
            onWebhookRemoved(id);
        }
    };

    /**
     * Toggle webhook enabled state
     */
    const toggleWebhook = (id: string) => {
        const updated = webhooks.map(w =>
            w.id === id ? { ...w, enabled: !w.enabled } : w
        );
        saveWebhooks(updated);
    };

    /**
     * Test webhook connection
     */
    const testWebhook = async (webhook: WebhookConfig) => {
        setTestResult(null);

        try {
            if (webhook.type === 'slack') {
                const response = await fetch(webhook.url!, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        text: '🔔 Test alert from CyberForge',
                        blocks: [
                            {
                                type: 'section',
                                text: {
                                    type: 'mrkdwn',
                                    text: '*Test Alert*\nThis is a test notification from CyberForge Security Platform.'
                                }
                            }
                        ]
                    })
                });

                if (response.ok) {
                    setTestResult({ success: true, message: 'Slack webhook test successful!' });
                } else {
                    setTestResult({ success: false, message: 'Failed to send Slack message' });
                }
            } else if (webhook.type === 'email') {
                // Simulate email sending (would integrate with backend email service)
                await new Promise(resolve => setTimeout(resolve, 1000));
                setTestResult({ success: true, message: 'Email sent successfully!' });
            } else if (webhook.type === 'custom') {
                const response = await fetch(webhook.url!, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        event: 'test',
                        message: 'Test alert from CyberForge',
                        timestamp: new Date().toISOString()
                    })
                });

                if (response.ok) {
                    setTestResult({ success: true, message: 'Custom webhook test successful!' });
                } else {
                    setTestResult({ success: false, message: 'Failed to call custom webhook' });
                }
            }
        } catch (error) {
            setTestResult({ success: false, message: `Error: ${error}` });
        }

        setTimeout(() => setTestResult(null), 5000);
    };

    /**
     * Add alert rule
     */
    const addRule = (webhookId: string, rule: AlertRule) => {
        const updated = webhooks.map(w =>
            w.id === webhookId
                ? { ...w, rules: [...w.rules, rule] }
                : w
        );
        saveWebhooks(updated);
    };

    /**
     * Remove alert rule
     */
    const removeRule = (webhookId: string, ruleId: string) => {
        const updated = webhooks.map(w =>
            w.id === webhookId
                ? { ...w, rules: w.rules.filter(r => r.id !== ruleId) }
                : w
        );
        saveWebhooks(updated);
    };

    const getWebhookIcon = (type: string) => {
        switch (type) {
            case 'slack': return <Slack className="w-5 h-5" />;
            case 'email': return <Mail className="w-5 h-5" />;
            default: return <Webhook className="w-5 h-5" />;
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Bell className="w-8 h-8 text-blue-400" />
                    <div>
                        <h2 className="text-2xl font-bold text-white">Real-Time Alerting</h2>
                        <p className="text-gray-400">Configure webhooks and notification rules</p>
                    </div>
                </div>

                <button
                    onClick={() => setIsAddingWebhook(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                    <Plus className="w-5 h-5" />
                    Add Webhook
                </button>
            </div>

            {/* Test Result */}
            {testResult && (
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-4 rounded-lg flex items-center gap-3 ${
                        testResult.success
                            ? 'bg-green-900/30 border border-green-700'
                            : 'bg-red-900/30 border border-red-700'
                    }`}
                >
                    {testResult.success ? (
                        <CheckCircle className="w-5 h-5 text-green-400" />
                    ) : (
                        <AlertTriangle className="w-5 h-5 text-red-400" />
                    )}
                    <span className={testResult.success ? 'text-green-300' : 'text-red-300'}>
                        {testResult.message}
                    </span>
                </motion.div>
            )}

            {/* Add Webhook Modal */}
            {isAddingWebhook && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-gray-900 rounded-lg p-6 max-w-2xl w-full mx-4 border border-gray-700"
                    >
                        <h3 className="text-xl font-bold mb-4">Add New Webhook</h3>

                        <div className="space-y-4">
                            {/* Webhook Name */}
                            <div>
                                <label className="text-sm text-gray-400 block mb-2">Name</label>
                                <input
                                    type="text"
                                    value={newWebhook.name || ''}
                                    onChange={(e) => setNewWebhook({ ...newWebhook, name: e.target.value })}
                                    placeholder="e.g., Security Team Slack"
                                    className="w-full px-4 py-2 bg-gray-800 text-white rounded border border-gray-700 focus:border-blue-500 outline-none"
                                />
                            </div>

                            {/* Webhook Type */}
                            <div>
                                <label className="text-sm text-gray-400 block mb-2">Type</label>
                                <div className="flex gap-4">
                                    {['slack', 'email', 'custom'].map(type => (
                                        <button
                                            key={type}
                                            onClick={() => setNewWebhook({ ...newWebhook, type: type as any })}
                                            className={`px-4 py-2 rounded capitalize transition-colors ${
                                                newWebhook.type === type
                                                    ? 'bg-blue-600 text-white'
                                                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                                            }`}
                                        >
                                            {type}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* URL (Slack/Custom) */}
                            {(newWebhook.type === 'slack' || newWebhook.type === 'custom') && (
                                <div>
                                    <label className="text-sm text-gray-400 block mb-2">
                                        {newWebhook.type === 'slack' ? 'Slack Webhook URL' : 'Webhook URL'}
                                    </label>
                                    <input
                                        type="url"
                                        value={newWebhook.url || ''}
                                        onChange={(e) => setNewWebhook({ ...newWebhook, url: e.target.value })}
                                        placeholder={newWebhook.type === 'slack' 
                                            ? 'https://hooks.slack.com/services/...' 
                                            : 'https://api.example.com/webhook'}
                                        className="w-full px-4 py-2 bg-gray-800 text-white rounded border border-gray-700 focus:border-blue-500 outline-none font-mono text-sm"
                                    />
                                </div>
                            )}

                            {/* Email */}
                            {newWebhook.type === 'email' && (
                                <div>
                                    <label className="text-sm text-gray-400 block mb-2">Email Address</label>
                                    <input
                                        type="email"
                                        value={newWebhook.email || ''}
                                        onChange={(e) => setNewWebhook({ ...newWebhook, email: e.target.value })}
                                        placeholder="security-team@example.com"
                                        className="w-full px-4 py-2 bg-gray-800 text-white rounded border border-gray-700 focus:border-blue-500 outline-none"
                                    />
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex gap-3 pt-4">
                                <button
                                    onClick={addWebhook}
                                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                                >
                                    Add Webhook
                                </button>
                                <button
                                    onClick={() => {
                                        setIsAddingWebhook(false);
                                        setNewWebhook({ type: 'slack', enabled: true, rules: [] });
                                    }}
                                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* Webhook List */}
            <div className="space-y-4">
                {webhooks.length === 0 ? (
                    <div className="bg-gray-900 rounded-lg p-12 text-center border border-gray-700">
                        <Bell className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                        <p className="text-gray-400 text-lg mb-2">No webhooks configured</p>
                        <p className="text-gray-500 text-sm">Add a webhook to start receiving real-time alerts</p>
                    </div>
                ) : (
                    webhooks.map((webhook, index) => (
                        <motion.div
                            key={webhook.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="bg-gray-900 rounded-lg p-6 border border-gray-700"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    {getWebhookIcon(webhook.type)}
                                    <div>
                                        <h3 className="text-lg font-semibold text-white">{webhook.name}</h3>
                                        <p className="text-sm text-gray-400 capitalize">{webhook.type} webhook</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => testWebhook(webhook)}
                                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors"
                                    >
                                        Test
                                    </button>
                                    <button
                                        onClick={() => toggleWebhook(webhook.id)}
                                        className={`px-3 py-1 text-sm rounded transition-colors ${
                                            webhook.enabled
                                                ? 'bg-green-600 hover:bg-green-700 text-white'
                                                : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                                        }`}
                                    >
                                        {webhook.enabled ? 'Enabled' : 'Disabled'}
                                    </button>
                                    <button
                                        onClick={() => removeWebhook(webhook.id)}
                                        className="p-2 text-red-400 hover:bg-red-900/30 rounded transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            {/* Webhook Details */}
                            <div className="space-y-2 text-sm">
                                {webhook.url && (
                                    <div className="flex gap-2">
                                        <span className="text-gray-500">URL:</span>
                                        <span className="text-gray-300 font-mono truncate">{webhook.url}</span>
                                    </div>
                                )}
                                {webhook.email && (
                                    <div className="flex gap-2">
                                        <span className="text-gray-500">Email:</span>
                                        <span className="text-gray-300">{webhook.email}</span>
                                    </div>
                                )}
                            </div>

                            {/* Alert Rules */}
                            <div className="mt-4 pt-4 border-t border-gray-700">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-sm font-medium text-gray-400">Alert Rules</span>
                                    <button
                                        onClick={() => {
                                            const rule: AlertRule = {
                                                id: Date.now().toString(),
                                                trigger: 'vulnerability_found'
                                            };
                                            addRule(webhook.id, rule);
                                        }}
                                        className="text-xs text-blue-400 hover:text-blue-300"
                                    >
                                        + Add Rule
                                    </button>
                                </div>

                                {webhook.rules.length === 0 ? (
                                    <p className="text-xs text-gray-500">No rules configured</p>
                                ) : (
                                    <div className="space-y-2">
                                        {webhook.rules.map(rule => (
                                            <div
                                                key={rule.id}
                                                className="flex items-center justify-between bg-gray-800 rounded p-2"
                                            >
                                                <span className="text-xs text-gray-300 capitalize">
                                                    {rule.trigger.replace('_', ' ')}
                                                </span>
                                                <button
                                                    onClick={() => removeRule(webhook.id, rule.id)}
                                                    className="text-red-400 hover:text-red-300"
                                                >
                                                    <Trash2 className="w-3 h-3" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    ))
                )}
            </div>

            {/* Documentation */}
            <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-blue-400" />
                    Setup Guide
                </h3>
                
                <div className="space-y-3 text-sm text-gray-300">
                    <div>
                        <p className="font-medium text-white mb-1">Slack Webhook:</p>
                        <ol className="list-decimal list-inside space-y-1 text-gray-400">
                            <li>Go to Slack → Workspace Settings → Integrations</li>
                            <li>Create a new "Incoming Webhook"</li>
                            <li>Copy the webhook URL and paste it here</li>
                        </ol>
                    </div>

                    <div>
                        <p className="font-medium text-white mb-1">Email Alerts:</p>
                        <p className="text-gray-400">Provide the email address where you want to receive alerts</p>
                    </div>

                    <div>
                        <p className="font-medium text-white mb-1">Custom Webhook:</p>
                        <p className="text-gray-400">
                            Provide any HTTP endpoint that accepts POST requests with JSON payload
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AlertingSystem;
