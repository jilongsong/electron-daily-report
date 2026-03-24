import React, { useState } from 'react';
import { Copy, Check, RefreshCw, FileText, Download } from 'lucide-react';
import { ReportType, ReportTypeLabels } from '../types';

interface ReportViewProps {
  report: string;
  reportType: ReportType;
  dateRange: { since: string; until: string };
  onReset: () => void;
}

export const ReportView: React.FC<ReportViewProps> = ({ report, reportType, dateRange, onReset }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(report);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const handleExport = () => {
    const label = ReportTypeLabels[reportType];
    const filename = `${label}_${dateRange.since}_${dateRange.until}.txt`;
    const blob = new Blob([report], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const label = ReportTypeLabels[reportType];

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-500">
      <div className="flex items-center justify-between p-4 border-b border-slate-700 bg-surface">
        <div className="flex items-center gap-3">
          <h3 className="text-white font-medium flex items-center gap-2">
            <FileText className="w-4 h-4 text-accent" />
            {label}
          </h3>
          <span className="text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded">
            {dateRange.since} ~ {dateRange.until}
          </span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onReset}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-700 hover:bg-slate-600 rounded transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            返回编辑
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-700 hover:bg-slate-600 rounded transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            导出
          </button>
          <button
            onClick={handleCopy}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded transition-colors ${
              copied
                ? 'bg-green-600 text-white'
                : 'bg-primary hover:bg-blue-600 text-white'
            }`}
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5" /> 已复制
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" /> 复制报告
              </>
            )}
          </button>
        </div>
      </div>
      
      <div className="flex-1 p-6 overflow-y-auto bg-slate-900">
        <div className="max-w-3xl mx-auto bg-surface border border-slate-700 rounded-lg p-6 shadow-xl">
           <pre className="whitespace-pre-wrap font-sans text-slate-300 leading-relaxed text-sm">
             {report}
           </pre>
        </div>
      </div>
    </div>
  );
};