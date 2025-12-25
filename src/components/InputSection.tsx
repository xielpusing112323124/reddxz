import React, { useState } from 'react';
import { Play, Trash2, FileText, Loader2 } from 'lucide-react';

interface InputSectionProps {
    onScan: (urls: string[]) => void;
    isLoading: boolean;
}

export const InputSection: React.FC<InputSectionProps> = ({ onScan, isLoading }) => {
    const [input, setInput] = useState('');

    const handleScan = () => {
        if (!input.trim()) return;
        const urls = input.split(/[\n,]+/).map(u => u.trim()).filter(u => u.length > 0);
        if (urls.length > 0) {
            onScan(urls);
        }
    };

    const handleClear = () => {
        setInput('');
    };

    const lineCount = input.split('\n').length;
    const urlCount = input.split(/[\n,]+/).filter(u => u.trim().length > 0).length;

    return (
        <div className="w-full bg-black/40 border border-white/5 rounded-xl p-6 backdrop-blur-sm relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500/0 via-cyan-500/50 to-cyan-500/0 opacity-50 group-hover:opacity-100 transition-opacity" />

            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                    <FileText className="w-4 h-4 text-cyan-400" />
                    Target Input
                </h2>
                <span className="text-xs font-mono text-cyan-500/80 bg-cyan-950/30 px-2 py-1 rounded border border-cyan-900/50">
                    {urlCount} TARGET{urlCount !== 1 ? 'S' : ''} DETECTED
                </span>
            </div>

            <div className="relative">
                <div className="absolute left-0 top-0 bottom-0 w-8 bg-gray-900/50 border-r border-white/5 flex flex-col items-center pt-3 text-xs font-mono text-gray-600 select-none">
                    {Array.from({ length: Math.min(lineCount, 999) }).map((_, i) => (
                        <div key={i} className="h-[20px] leading-[20px]">{i + 1}</div>
                    ))}
                </div>
                <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Enter URLs (one per line)...&#10;example.com&#10;https://test.com/page"
                    className="w-full h-48 bg-gray-950/50 pl-10 pr-4 py-3 text-sm font-mono text-gray-300 border border-white/10 rounded-lg focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-all resize-y leading-[20px]"
                    spellCheck={false}
                />
            </div>

            <div className="flex gap-3 mt-4 justify-end">
                <button
                    onClick={handleClear}
                    disabled={isLoading || !input}
                    className="px-4 py-2 rounded-lg border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 hover:border-white/20 transition-all flex items-center gap-2 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Trash2 className="w-4 h-4" />
                    Clear
                </button>
                <button
                    onClick={handleScan}
                    disabled={isLoading || !input}
                    className="px-6 py-2 rounded-lg bg-cyan-500/10 border border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/20 hover:text-cyan-300 hover:border-cyan-400 hover:shadow-[0_0_15px_rgba(6,182,212,0.15)] transition-all flex items-center gap-2 text-sm font-bold tracking-wide disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden"
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            SCANNING...
                        </>
                    ) : (
                        <>
                            <Play className="w-4 h-4" />
                            CHECK NOW
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};
