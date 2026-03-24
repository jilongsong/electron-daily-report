import React, { useState } from 'react';
import { Commit } from '../types';
import { CheckCircle2, Circle, GitCommit, Clock, User, Folder, ChevronDown, ChevronRight } from 'lucide-react';

interface CommitListProps {
  commits: Commit[];
  selectedCommitHashes: Set<string>;
  onToggleCommit: (hash: string) => void;
  onToggleAll: (select: boolean) => void;
}

export const CommitList: React.FC<CommitListProps> = ({
  commits,
  selectedCommitHashes,
  onToggleCommit,
  onToggleAll,
}) => {
  const [expandedHashes, setExpandedHashes] = useState<Set<string>>(new Set());

  if (commits.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-500">
        <GitCommit className="w-12 h-12 mb-4 opacity-20" />
        <p>该时间范围内没有找到提交记录</p>
      </div>
    );
  }

  const allSelected = commits.every((c) => selectedCommitHashes.has(c.hash));

  const toggleExpand = (hash: string) => {
    setExpandedHashes((prev) => {
      const next = new Set(prev);
      if (next.has(hash)) next.delete(hash);
      else next.add(hash);
      return next;
    });
  };

  return (
    <div className="flex flex-col h-full bg-slate-900/50">
      <div className="flex items-center justify-between p-4 border-b border-slate-700/50">
        <div className="flex items-center gap-2">
           <h3 className="text-white font-medium">提交记录</h3>
           <span className="bg-slate-700 text-xs text-slate-300 px-2 py-0.5 rounded-full">{commits.length}</span>
        </div>
        <button
          onClick={() => onToggleAll(!allSelected)}
          className="text-xs text-primary hover:text-blue-400 font-medium"
        >
          {allSelected ? '取消全选' : '全选'}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {commits.map((commit) => {
          const isSelected = selectedCommitHashes.has(commit.hash);
          const isExpanded = expandedHashes.has(commit.hash);
          const hasBody = !!commit.body?.trim();
          const repoLabel = commit.repoName || (commit.repo ? commit.repo.split(/[/\\]/).pop() : undefined);
          const bodyLines = hasBody ? commit.body!.split('\n').filter((l) => l.trim()) : [];

          return (
            <div
              key={commit.hash}
              onClick={() => onToggleCommit(commit.hash)}
              className={`relative flex gap-4 p-3 rounded-lg border cursor-pointer transition-all ${
                isSelected
                  ? 'bg-slate-800/80 border-primary/30'
                  : 'bg-slate-900 border-slate-800 opacity-60 hover:opacity-80'
              }`}
            >
              <div className="pt-1">
                {isSelected ? (
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                ) : (
                  <Circle className="w-5 h-5 text-slate-600" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start gap-1.5">
                  <p className={`text-sm font-medium leading-snug flex-1 ${isSelected ? 'text-slate-200' : 'text-slate-400'}`}>
                    {commit.message}
                  </p>
                  {hasBody && (
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleExpand(commit.hash); }}
                      className="shrink-0 p-0.5 rounded hover:bg-slate-700 text-slate-500 hover:text-slate-300 transition-colors"
                      title={isExpanded ? '收起详情' : '展开详情'}
                    >
                      {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </button>
                  )}
                </div>

                {hasBody && isExpanded && (
                  <div className="mt-1.5 ml-0.5 pl-2.5 border-l-2 border-slate-700 space-y-0.5">
                    {bodyLines.map((line, i) => (
                      <p key={i} className="text-xs text-slate-500 leading-relaxed">{line}</p>
                    ))}
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5">
                  <span className="flex items-center gap-1 text-xs text-slate-500 font-mono">
                    <Clock className="w-3 h-3" />
                    {new Date(commit.date).toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' })}{' '}
                    {new Date(commit.date).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-slate-500">
                    <User className="w-3 h-3" />
                    {commit.author_name}
                  </span>
                   {repoLabel && (
                    <span className="flex items-center gap-1 text-xs text-accent/70 bg-accent/10 px-1.5 rounded">
                      <Folder className="w-3 h-3" />
                      {repoLabel}
                    </span>
                  )}
                  {hasBody && !isExpanded && (
                    <span className="text-[11px] text-slate-600 italic">
                      +{bodyLines.length} 行详情
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};