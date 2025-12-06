import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, User, MessageSquare, AtSign, CheckCircle2 } from 'lucide-react';

interface Comment {
    id: string;
    user: string;
    avatar?: string;
    content: string;
    timestamp: Date;
}

interface CollaborationPanelProps {
    crashesFingerprint: string;
    onClose: () => void;
}

const MOCK_USERS = [
    { id: 'u1', name: 'Alice Security', avatar: 'https://i.pravatar.cc/150?u=alice' },
    { id: 'u2', name: 'Bob Developer', avatar: 'https://i.pravatar.cc/150?u=bob' },
    { id: 'u3', name: 'Charlie DevOps', avatar: 'https://i.pravatar.cc/150?u=charlie' },
];

export const CollaborationPanel: React.FC<CollaborationPanelProps> = ({ crashesFingerprint, onClose }) => {
    const [comments, setComments] = useState<Comment[]>([
        {
            id: 'c1',
            user: 'Alice Security',
            avatar: 'https://i.pravatar.cc/150?u=alice',
            content: 'I verified this locally. It seems to be a buffer overflow in the parsing logic.',
            timestamp: new Date(Date.now() - 3600000),
        },
    ]);
    const [newComment, setNewComment] = useState('');
    const [assignee, setAssignee] = useState<string | null>(null);

    const handleSend = () => {
        if (!newComment.trim()) return;

        setComments([
            ...comments,
            {
                id: `c${Date.now()}`,
                user: 'You',
                content: newComment,
                timestamp: new Date(),
            },
        ]);
        setNewComment('');
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="bg-gray-800 border border-gray-700 rounded-xl p-4 h-full flex flex-col"
        >
            <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-700">
                <h3 className="font-bold text-lg flex items-center gap-2">
                    <MessageSquare size={18} className="text-blue-400" />
                    Collaboration
                </h3>
                <button onClick={onClose} className="text-gray-400 hover:text-white">✕</button>
            </div>

            {/* Assignee Section */}
            <div className="mb-6">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 block">
                    Assignee
                </label>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        {assignee ? (
                            <img
                                src={MOCK_USERS.find(u => u.id === assignee)?.avatar}
                                alt="Assignee"
                                className="w-8 h-8 rounded-full border-2 border-green-500"
                            />
                        ) : (
                            <div className="w-8 h-8 rounded-full bg-gray-700 border-2 border-dashed border-gray-500 flex items-center justify-center">
                                <User size={14} className="text-gray-500" />
                            </div>
                        )}
                        {assignee && (
                            <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-0.5">
                                <CheckCircle2 size={10} className="text-white" />
                            </div>
                        )}
                    </div>
                    <select
                        className="bg-gray-700 text-sm text-white rounded-lg px-3 py-2 border-none focus:ring-2 focus:ring-blue-500 outline-none flex-1"
                        value={assignee || ''}
                        onChange={(e) => setAssignee(e.target.value)}
                    >
                        <option value="">Unassigned</option>
                        {MOCK_USERS.map(user => (
                            <option key={user.id} value={user.id}>{user.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Comments List */}
            <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2">
                {comments.map((comment) => (
                    <div key={comment.id} className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center shrink-0 overflow-hidden">
                            {comment.avatar ? (
                                <img src={comment.avatar} alt={comment.user} className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-xs font-bold text-indigo-400">{comment.user.charAt(0)}</span>
                            )}
                        </div>
                        <div>
                            <div className="flex items-baseline gap-2 mb-1">
                                <span className="font-semibold text-sm text-gray-200">{comment.user}</span>
                                <span className="text-xs text-gray-500">{comment.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <p className="text-sm text-gray-300 bg-gray-700/50 p-3 rounded-lg rounded-tl-none">
                                {comment.content}
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Input Area */}
            <div className="relative">
                <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment... (@ to mention)"
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg pl-3 pr-10 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none h-20"
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSend();
                        }
                    }}
                />
                <div className="absolute right-2 bottom-2 flex gap-1">
                    <button className="p-1.5 text-gray-400 hover:text-blue-400 transition-colors">
                        <AtSign size={16} />
                    </button>
                    <button
                        onClick={handleSend}
                        disabled={!newComment.trim()}
                        className="p-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <Send size={16} />
                    </button>
                </div>
            </div>
        </motion.div>
    );
};
