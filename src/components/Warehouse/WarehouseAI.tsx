import React, { useState } from 'react';
import { Send, Bot, Sparkles, BarChart2, AlertCircle, PackageSearch, Users, Copy, Check } from 'lucide-react';

interface Message {
    id: number;
    text: string;
    sender: 'user' | 'ai';
    timestamp: Date;
}

export const WarehouseAI: React.FC = () => {
    const [messages, setMessages] = useState<Message[]>([
        { id: 1, text: "Hello! I'm your Warehouse Assistant. I can help you analyze inventory, check stock levels, or predict shortages. How can I help today?", sender: 'ai', timestamp: new Date() }
    ]);
    const [inputValue, setInputValue] = useState('');

    const [copiedId, setCopiedId] = useState<number | null>(null);

    const handleCopy = (text: string, id: number) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const handleSend = () => {
        if (!inputValue.trim()) return;

        const newUserMsg: Message = {
            id: Date.now(),
            text: inputValue,
            sender: 'user',
            timestamp: new Date()
        };

        setMessages(prev => [...prev, newUserMsg]);
        setInputValue('');

        // Mock AI response for now
        setTimeout(() => {
            const aiResponse: Message = {
                id: Date.now() + 1,
                text: "I'm analyzing the inventory data... (This is a mock response)",
                sender: 'ai',
                timestamp: new Date()
            };
            setMessages(prev => [...prev, aiResponse]);
        }, 1000);
    };

    const handleSummarizeTeamChat = () => {
        const loadingMsg: Message = {
            id: Date.now(),
            text: "Fetching latest conversations from MS Teams channels...",
            sender: 'ai',
            timestamp: new Date()
        };
        setMessages(prev => [...prev, loadingMsg]);

        setTimeout(() => {
            const summaryMsg: Message = {
                id: Date.now() + 1,
                text: "**Team Chat Summary (Last 24h):**\n\n1. **Logistics Group**: Discussed delay in shipment #SH-992. Estimated arrival: 2 PM today.\n2. **Inventory Team**: Confirmed stock count for 'Electronics' category is complete.\n3. **General**: Meeting scheduled for Friday at 10 AM.\n\n*Generated Prompt for Report:* 'Summarize the delay in shipment #SH-992 and the completion of Electronics stock count.'",
                sender: 'ai',
                timestamp: new Date()
            };
            setMessages(prev => [...prev, summaryMsg]);
        }, 2000);
    };

    const QuickAction = ({ icon: Icon, label, onClick }: { icon: any, label: string, onClick: () => void }) => (
        <button
            onClick={onClick}
            className="flex flex-col items-center justify-center p-3 gap-2 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl hover:border-[var(--accent-primary)] hover:shadow-md hover:shadow-[var(--accent-primary)]/20 transition-all group"
        >
            <div className="p-2 bg-[var(--accent-surface)] text-[var(--accent-primary)] rounded-lg group-hover:bg-[var(--accent-primary)] group-hover:text-white transition-colors">
                <Icon size={20} />
            </div>
            <span className="text-xs font-medium text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]">{label}</span>
        </button>
    );

    return (
        <div className="bg-[var(--glass-surface)] backdrop-blur-md rounded-xl shadow-sm border border-[var(--border)] flex flex-col h-full overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-[var(--border)] flex items-center gap-3">
                <div className="p-2 bg-[var(--accent-primary)] text-white rounded-lg shadow-sm shadow-[var(--accent-primary)]/30">
                    <Bot size={20} />
                </div>
                <div>
                    <h3 className="font-semibold text-[var(--text-primary)]">Warehouse AI</h3>
                    <p className="text-xs text-[var(--text-muted)] flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--success)] animate-pulse"></span>
                        Online & Ready to analyze
                    </p>
                </div>
            </div>

            {/* Quick Actions Panel */}
            <div className="p-4 border-b border-[var(--border)] grid grid-cols-2 gap-3">
                <QuickAction icon={AlertCircle} label="Low Stock Alert" onClick={() => { }} />
                <QuickAction icon={Users} label="Summarize Team Chat" onClick={handleSummarizeTeamChat} />
                <QuickAction icon={BarChart2} label="Trend Analysis" onClick={() => { }} />
                <QuickAction icon={PackageSearch} label="Find Item" onClick={() => { }} />
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={`flex gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}
                    >
                        <div className={`
                            w-8 h-8 rounded-full flex items-center justify-center shrink-0
                            ${msg.sender === 'ai' ? 'bg-[var(--bg-secondary)] text-[var(--accent-primary)]' : 'bg-[var(--accent-secondary)] text-[var(--text-primary)]'}
                        `}>
                            {msg.sender === 'ai' ? <Sparkles size={16} /> : <div className="text-xs font-bold">You</div>}
                        </div>
                        <div className={`
                            max-w-[80%] p-3 rounded-2xl text-sm shadow-sm
                            ${msg.sender === 'ai'
                                ? 'bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-primary)] rounded-tl-none'
                                : 'bg-[var(--accent-primary)] text-white rounded-tr-none'
                            }
                        `}>
                            <div className="whitespace-pre-wrap font-sans">{msg.text}</div>
                            <div className={`flex items-center justify-between mt-2 ${msg.sender === 'ai' ? 'text-[var(--text-muted)]' : 'text-white/70'}`}>
                                <span className="text-[10px]">
                                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                                {msg.sender === 'ai' && (
                                    <button
                                        onClick={() => handleCopy(msg.text, msg.id)}
                                        className="p-1 hover:bg-[var(--bg-hover)] rounded transition-colors"
                                        title="Copy message"
                                    >
                                        {copiedId === msg.id ? <Check size={12} className="text-[var(--success)]" /> : <Copy size={12} />}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-[var(--border)] bg-[var(--bg-secondary)]/30">
                <div className="relative flex items-center gap-2">
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Ask AI about inventory query, check flow..."
                        className="flex-1 py-2.5 pl-4 pr-12 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/20 focus:border-[var(--accent-primary)] transition-all text-sm text-[var(--text-primary)] placeholder-[var(--text-placeholder)]"
                    />
                    <button
                        onClick={handleSend}
                        className="absolute right-1.5 p-1.5 bg-[var(--accent-primary)] text-white rounded-lg hover:bg-[var(--accent-hover)] hover:shadow-md hover:shadow-[var(--accent-primary)]/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={!inputValue.trim()}
                        title="Send message"
                        aria-label="Send message"
                    >
                        <Send size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
};
