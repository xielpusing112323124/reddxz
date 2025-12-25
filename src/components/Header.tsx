import React from 'react';
import { ShieldCheck } from 'lucide-react';

export const Header = () => {
    return (
        <header className="border-b border-white/10 bg-black/50 backdrop-blur-md sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                <div className="flex items-center gap-2 group cursor-default">
                    <div className="p-2 rounded-lg bg-cyan-950/30 border border-cyan-500/30 group-hover:border-cyan-400/60 transition-colors">
                        <ShieldCheck className="w-6 h-6 text-cyan-400 group-hover:text-cyan-300 transition-colors" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight text-white group-hover:text-cyan-50 transition-colors">
                            Blank Page <span className="text-cyan-400">Detector</span>
                        </h1>
                        <p className="text-[10px] text-gray-500 uppercase tracking-widest font-mono">
                            Web Integrity Analysis
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="hidden md:flex flex-col items-end">
                        <span className="text-xs text-cyan-400 font-mono">SYSTEM: ONLINE</span>
                        <span className="text-[10px] text-gray-600 font-mono">V1.0.0 STABLE</span>
                    </div>
                    <div className="h-8 w-[1px] bg-white/10" />
                    <div className="text-right">
                        <span className="text-xs text-gray-500 uppercase font-mono block">Powered By</span>
                        <span className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 text-glow">
                            Xielgansz
                        </span>
                    </div>
                </div>
            </div>
        </header>
    );
};
