import React, { useState } from 'react';
import {
    CheckCircle,
    XCircle,
    AlertTriangle,
    AlertOctagon,
    ArrowRight,
    ChevronDown,
    ChevronUp,
    Download,
    Copy,
    ExternalLink
} from 'lucide-react';
import type { ScanResult } from '@/lib/analyzer';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface ResultsTableProps {
    results: ScanResult[];
}

export const ResultsTable: React.FC<ResultsTableProps> = ({ results }) => {
    if (results.length === 0) return null;

    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    Scan Results
                    <span className="text-xs font-mono font-normal text-gray-500 bg-gray-900 border border-white/5 px-2 py-0.5 rounded-full">
                        {results.length} PROCESSED
                    </span>
                </h3>
                <div className="flex gap-2">
                    {/* Actions handled in parent or here? Logic says component should be dumb but UI requested buttons. 
               We'll add placeholder buttons or logic later if needed properly. 
               For now just visual. */}
                </div>
            </div>

            <div className="w-full overflow-hidden rounded-xl border border-white/5 bg-black/40 backdrop-blur-sm shadow-2xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-white/5 bg-white/5 text-xs uppercase tracking-wider text-gray-400 font-mono">
                                <th className="p-4">Target URL</th>
                                <th className="p-4">Final Status</th>
                                <th className="p-4">Visible Content</th>
                                <th className="p-4">Redirects</th>
                                <th className="p-4">Verdict</th>
                                <th className="p-4">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {results.map((result, idx) => (
                                <ResultRow key={idx} result={result} />
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

const ResultRow = ({ result }: { result: ScanResult }) => {
    const [expanded, setExpanded] = useState(false);

    const getStatusColor = (code: number) => {
        if (code >= 200 && code < 300) return 'text-green-400 border-green-400/30 bg-green-400/10';
        if (code >= 300 && code < 400) return 'text-yellow-400 border-yellow-400/30 bg-yellow-400/10';
        if (code >= 400 && code < 600) return 'text-red-400 border-red-400/30 bg-red-400/10';
        return 'text-gray-400 border-gray-400/30 bg-gray-400/10'; // 0 or unknown
    };

    const isBlank = result.is_blank_page;

    return (
        <>
            <tr className={twMerge("group transition-colors hover:bg-white/5 text-sm", expanded ? "bg-white/[0.02]" : "")}>
                <td className="p-4 max-w-md">
                    <div className="flex flex-col">
                        <div className="font-mono text-white truncate max-w-[300px]" title={result.original_url}>
                            {result.original_url}
                        </div>
                        {result.redirected && (
                            <div className="text-xs text-gray-500 font-mono flex items-center gap-1 mt-1 truncate max-w-[300px]">
                                <ArrowRight className="w-3 h-3" />
                                {result.final_url}
                            </div>
                        )}
                    </div>
                </td>
                <td className="p-4">
                    <div className={clsx("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-bold font-mono", getStatusColor(result.status_code))}>
                        <div className={clsx("w-1.5 h-1.5 rounded-full animate-pulse", result.status_code === 200 ? "bg-green-400" : "bg-current")} />
                        {result.status_code || 'ERR'}
                    </div>
                </td>
                <td className="p-4 text-gray-400 font-mono text-xs">
                    <div>Length: {result.visible_text_length} chars</div>
                    <div className="text-[10px] text-gray-600">HTML: {result.content_length} bytes</div>
                </td>
                <td className="p-4">
                    {result.redirected ? (
                        <button
                            onClick={() => setExpanded(!expanded)}
                            className="flex items-center gap-1 text-xs text-yellow-500 hover:text-yellow-400 font-mono transition-colors"
                        >
                            {result.redirect_hops} HOPS
                            {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </button>
                    ) : (
                        <span className="text-xs text-gray-600 font-mono">-</span>
                    )}
                </td>
                <td className="p-4">
                    {isBlank ? (
                        <div className="flex items-center gap-2 text-cyan-400" title={result.blank_reason || 'Unknown'}>
                            <AlertOctagon className="w-4 h-4" />
                            <span className="font-bold tracking-wide text-xs bg-cyan-950/50 border border-cyan-500/30 px-2 py-1 rounded text-cyan-300">
                                BLANK
                            </span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 text-green-500">
                            <CheckCircle className="w-4 h-4" />
                            <span className="font-bold tracking-wide text-xs text-green-400">
                                VALID
                            </span>
                        </div>
                    )}
                </td>
                <td className="p-4">
                    <a href={result.final_url} target="_blank" rel="noopener noreferrer" className="p-2 text-gray-400 hover:text-white transition-colors">
                        <ExternalLink className="w-4 h-4" />
                    </a>
                </td>
            </tr>
            {expanded && result.redirect_chain && result.redirect_chain.length > 0 && (
                <tr>
                    <td colSpan={6} className="bg-black/20 p-4 border-b border-white/5 relative">
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-yellow-500/20"></div>
                        <div className="space-y-2">
                            <p className="text-xs font-mono text-gray-500 uppercase mb-2">Redirect Chain</p>
                            {result.redirect_chain.map((step, i) => (
                                <div key={i} className="flex items-center gap-3 text-xs font-mono">
                                    <span className="text-gray-600 w-6">#{i + 1}</span>
                                    <span className={clsx("px-1.5 py-0.5 rounded border text-[10px]", getStatusColor(step.status))}>
                                        {step.status}
                                    </span>
                                    <span className="text-gray-300">{step.url}</span>
                                </div>
                            ))}
                            <div className="flex items-center gap-3 text-xs font-mono mt-1 opacity-50">
                                <span className="text-gray-600 w-6">END</span>
                                <ArrowRight className="w-3 h-3 text-gray-600" />
                                <span className="text-gray-400">{result.final_url}</span>
                            </div>
                        </div>
                    </td>
                </tr>
            )}
            {/* Show detailed blank reason if blank */}
            {isBlank && (
                <tr className="bg-cyan-950/10">
                    <td colSpan={6} className="px-4 py-2 border-b border-cyan-500/10">
                        <div className="flex items-center gap-2 text-xs font-mono text-cyan-400/80">
                            <span className="font-bold">DETECTION REASON:</span>
                            {result.blank_reason}
                        </div>
                    </td>
                </tr>
            )}
        </>
    );
};
