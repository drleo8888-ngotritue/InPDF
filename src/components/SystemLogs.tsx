/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Terminal, Copy, Trash2, Download, Search, Check, AlertCircle } from 'lucide-react';
import { IPCLog } from '../types';

interface SystemLogsProps {
  logs: IPCLog[];
  onClearLogs: () => void;
}

export const SystemLogs: React.FC<SystemLogsProps> = ({ logs, onClearLogs }) => {
  const [filterSource, setFilterSource] = useState<'all' | 'Renderer' | 'Main' | 'PowerShell' | 'Spooler'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [copied, setCopied] = useState(false);
  const logTerminalRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new logs are added
  useEffect(() => {
    if (logTerminalRef.current) {
      logTerminalRef.current.scrollTop = logTerminalRef.current.scrollHeight;
    }
  }, [logs]);

  const filteredLogs = logs.filter((log) => {
    const matchesSource = filterSource === 'all' || log.source === filterSource;
    const matchesSearch = log.message.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          log.source.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSource && matchesSearch;
  });

  const handleCopyLogs = () => {
    const textToCopy = logs
      .map((log) => `[${log.timestamp}] [${log.source}] [${log.type.toUpperCase()}] ${log.message}`)
      .join('\n');
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadLogs = () => {
    const textToDownload = logs
      .map((log) => `[${log.timestamp}] [${log.source}] [${log.type.toUpperCase()}] ${log.message}`)
      .join('\n');
    const blob = new Blob([textToDownload], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `printer_spooler_logs_${new Date().toISOString().replace(/[:.]/g, '-')}.log`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getLogTypeColor = (type: IPCLog['type']) => {
    switch (type) {
      case 'success':
        return 'text-emerald-400';
      case 'warn':
        return 'text-amber-400';
      case 'error':
        return 'text-rose-400';
      default:
        return 'text-sky-300';
    }
  };

  const getSourceBadgeColor = (source: IPCLog['source']) => {
    switch (source) {
      case 'Renderer':
        return 'bg-blue-600/20 text-blue-300 border-blue-500/30';
      case 'Main':
        return 'bg-purple-600/20 text-purple-300 border-purple-500/30';
      case 'PowerShell':
        return 'bg-slate-700 text-slate-300 border-slate-600';
      case 'Spooler':
        return 'bg-amber-600/20 text-amber-300 border-amber-500/30';
    }
  };

  return (
    <div className="bg-[#0f172a] text-slate-200 rounded-xl border border-slate-800 p-5 shadow-2xl font-mono text-xs flex flex-col gap-4" id="system-spooler-logs">
      {/* Header Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Terminal className="w-5 h-5 text-indigo-400 animate-pulse" />
          <div>
            <h4 className="font-bold text-slate-100 text-sm">LOG CONSOLE (ELECTRON IPC & OS SPOOLER)</h4>
            <p className="text-[10px] text-slate-400">Kiểm tra thông số CLI và giao tiếp hệ điều hành</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Action buttons */}
          <button
            onClick={handleCopyLogs}
            className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-350 px-2.5 py-1.5 rounded border border-slate-700 transition"
            title="Copy logs to clipboard"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Sao chép'}</span>
          </button>
          <button
            onClick={handleDownloadLogs}
            className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-350 px-2.5 py-1.5 rounded border border-slate-700 transition"
            title="Download log file"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Tải file log</span>
          </button>
          <button
            onClick={onClearLogs}
            className="flex items-center gap-1 bg-rose-950/30 hover:bg-rose-905 border border-rose-900/40 text-rose-300 px-2.5 py-1.5 rounded transition"
            title="Clear logs"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Xóa log</span>
          </button>
        </div>
      </div>

      {/* Log Filters & Search */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 items-center bg-slate-900/50 p-2.5 rounded-lg border border-slate-850">
        <div className="md:col-span-4 flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded border border-slate-800">
          <Search className="w-4 h-4 text-slate-500 shrink-0" />
          <input
            type="text"
            placeholder="Tìm kiếm dòng log..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-transparent text-slate-200 text-xs w-full focus:outline-none placeholder-slate-500"
          />
        </div>

        <div className="md:col-span-8 flex flex-wrap gap-1.5 md:justify-end">
          <span className="text-[10px] text-slate-400 flex items-center mr-1">Bộ lọc:</span>
          {(['all', 'Renderer', 'Main', 'PowerShell', 'Spooler'] as const).map((source) => (
            <button
              key={source}
              onClick={() => setFilterSource(source)}
              className={`px-2 py-1 rounded text-[10px] border transition ${
                filterSource === source
                  ? 'bg-indigo-600/30 text-indigo-300 border-indigo-500/50 font-bold'
                  : 'bg-slate-850 text-slate-400 border-slate-800 hover:text-slate-300'
              }`}
            >
              {source === 'all' ? 'Tất cả ({' + logs.length + '})' : source}
            </button>
          ))}
        </div>
      </div>

      {/* Terminal Output */}
      <div 
        ref={logTerminalRef}
        className="h-56 overflow-y-auto bg-slate-950 rounded-xl border border-slate-900 p-4 font-mono text-[11px] leading-relaxed flex flex-col gap-1.5 select-text scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent scroll-smooth"
        id="logs-terminal-viewport"
      >
        {filteredLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-2">
            <AlertCircle className="w-5 h-5 text-slate-600" />
            <p>Không tìm thấy dòng log khớp điều kiện tìm kiếm.</p>
          </div>
        ) : (
          filteredLogs.map((log) => (
            <div key={log.id} className="flex flex-col md:flex-row md:items-start gap-1 pb-1 border-b border-slate-900/40">
              {/* Timestamp */}
              <span className="text-slate-500 select-none shrink-0" style={{ width: '64px' }}>
                {log.timestamp}
              </span>
              
              {/* Source Badge */}
              <span className={`px-1.5 py-0.2 md:-mt-0.5 rounded text-[9px] border shrink-0 font-medium ${getSourceBadgeColor(log.source)}`} style={{ textTransform: 'uppercase' }}>
                {log.source}
              </span>

              {/* Message */}
              <span className={`flex-1 break-all ${getLogTypeColor(log.type)}`}>
                {log.message}
              </span>
            </div>
          ))
        )}
      </div>

      {/* Bottom status */}
      <div className="flex justify-between items-center text-[10px] text-slate-500 border-t border-slate-900 pt-2 px-1">
        <span>ELECTRON IPC SPOOLER ENGINE v1.0.0</span>
        <span className="animate-pulse">🟢 Active Listening</span>
      </div>
    </div>
  );
};
