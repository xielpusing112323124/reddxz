'use client';

import React, { useState } from 'react';
import { Header } from '@/components/Header';
import { InputSection } from '@/components/InputSection';
import { ResultsTable } from '@/components/ResultsTable';
import { ScanResult } from '@/lib/analyzer';
import { Download, FileText, AlertCircle } from 'lucide-react';

export default function Home() {
  const [results, setResults] = useState<ScanResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleScan = async (urls: string[]) => {
    setLoading(true);
    setError(null);
    setResults([]); // Clear previous results as requested ("Setiap kali user melakukan pengecekan baru: Semua hasil lama harus dihapus")

    try {
      const response = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urls }),
      });

      const contentType = response.headers.get("content-type");
      if (contentType && contentType.indexOf("application/json") !== -1) {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Scan failed');
        setResults(data as ScanResult[]);
      } else {
        const text = await response.text();
        throw new Error(`Server returned non-JSON error: ${text.substring(0, 100)}... (Status: ${response.status})`);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadJSON = () => {
    if (results.length === 0) return;
    const dataStr = JSON.stringify(results, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `scan_results_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadCSV = () => {
    if (results.length === 0) return;
    const headers = ['URL', 'Final URL', 'Status', 'Redirects', 'Content Length', 'Visible Text', 'Is Blank', 'Reason'];
    const rows = results.map(r => [
      r.original_url,
      r.final_url,
      r.status_code,
      r.redirect_hops,
      r.content_length,
      r.visible_text_length,
      r.is_blank_page,
      r.blank_reason || ''
    ]);
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `scan_results_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen pb-20 bg-[url('/grid.svg')] bg-fixed">
      <div className="fixed inset-0 bg-black/90 -z-10" />
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-cyan-900/10 via-black to-black -z-10" />

      <Header />

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* Error Banner */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/50 p-4 rounded-lg flex items-center gap-3 text-red-400 animate-in fade-in slide-in-from-top-2">
            <AlertCircle className="w-5 h-5" />
            <span className="font-mono text-sm">{error}</span>
          </div>
        )}

        <InputSection onScan={handleScan} isLoading={loading} />

        {results.length > 0 && (
          <div className="flex justify-end gap-3 animate-in fade-in">
            <button
              onClick={handleDownloadCSV}
              className="flex items-center gap-2 px-3 py-1.5 rounded border border-white/10 hover:bg-white/5 text-xs text-gray-400 hover:text-white transition-colors"
            >
              <FileText className="w-3 h-3" />
              Copy as CSV
            </button>
            <button
              onClick={handleDownloadJSON}
              className="flex items-center gap-2 px-3 py-1.5 rounded border border-white/10 hover:bg-white/5 text-xs text-gray-400 hover:text-white transition-colors"
            >
              <Download className="w-3 h-3" />
              Download JSON
            </button>
          </div>
        )}

        <ResultsTable results={results} />
      </main>

      {/* Footer watermark per user request */}
      <footer className="fixed bottom-4 right-4 z-50 pointer-events-none">
        <div className="text-[10px] font-mono text-cyan-500/30 select-none">
          Xielgansz System Security
        </div>
      </footer>
    </div>
  );
}
