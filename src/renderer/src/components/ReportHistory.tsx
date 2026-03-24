import React, { useState } from 'react';
import { History, FileText, Trash2, Eye, Copy, Check, X, CalendarDays, CalendarRange } from 'lucide-react';
import { ReportHistoryItem, ReportType, ReportTypeLabels } from '../types';

interface ReportHistoryProps {
  isOpen: boolean;
  onClose: () => void;
  history: ReportHistoryItem[];
  onDelete: (id: string) => void;
  onView: (item: ReportHistoryItem) => void;
  onClearAll: () => void;
}

const typeIconMap: Record<ReportType, React.ReactNode> = {
  [ReportType.DAILY]: <FileText className="w-3.5 h-3.5" />,
  [ReportType.WEEKLY]: <CalendarDays className="w-3.5 h-3.5" />,
  [ReportType.MONTHLY]: <CalendarRange className="w-3.5 h-3.5" />,
};

const typeBgMap: Record<ReportType, string> = {
  [ReportType.DAILY]: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  [ReportType.WEEKLY]: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
  [ReportType.MONTHLY]: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
};

export const ReportHistory: React.FC<ReportHistoryProps> = ({
  isOpen,
  onClose,
  history,
  onDelete,
  onView,
  onClearAll,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = async (item: ReportHistoryItem) => {
    try {
      await navigator.clipboard.writeText(item.content);
      setCopiedId(item.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const sorted = [...history].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-800 border border-slate-600 rounded-xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <History className="w-5 h-5 text-accent" />
            历史报告
            <span className="text-xs text-slate-500 font-normal ml-1">({history.length} 份)</span>
          </h2>
          <div className="flex items-center gap-2">
            {history.length > 0 && (
              <button
                onClick={onClearAll}
                className="px-3 py-1.5 text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-md transition-colors"
              >
                清空全部
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-md hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4">
          {sorted.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-500">
              <History className="w-12 h-12 mb-3 opacity-20" />
              <p className="text-sm">暂无历史报告</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sorted.map((item) => (
                <div
                  key={item.id}
                  className="bg-slate-900 border border-slate-700 rounded-lg p-4 hover:border-slate-600 transition-colors group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      {/* Type badge + date */}
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border ${typeBgMap[item.reportType]}`}>
                          {typeIconMap[item.reportType]}
                          {ReportTypeLabels[item.reportType]}
                        </span>
                        <span className="text-xs text-slate-500">
                          {item.dateRange.since} ~ {item.dateRange.until}
                        </span>
                      </div>

                      {/* Preview */}
                      <p className="text-sm text-slate-400 line-clamp-2 leading-relaxed">
                        {item.content.slice(0, 150)}...
                      </p>

                      {/* Meta */}
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-[11px] text-slate-600">
                          生成于 {new Date(item.createdAt).toLocaleString('zh-CN')}
                        </span>
                        {item.repoNames.length > 0 && (
                          <span className="text-[11px] text-slate-600">
                            项目: {item.repoNames.join(', ')}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <button
                        onClick={() => onView(item)}
                        className="p-1.5 rounded-md hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                        title="查看"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleCopy(item)}
                        className="p-1.5 rounded-md hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                        title="复制"
                      >
                        {copiedId === item.id ? (
                          <Check className="w-4 h-4 text-green-400" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        onClick={() => onDelete(item.id)}
                        className="p-1.5 rounded-md hover:bg-red-900/30 text-slate-400 hover:text-red-400 transition-colors"
                        title="删除"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
