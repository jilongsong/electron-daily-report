import React from 'react';
import { Commit } from '../types';
import { CheckCircle2, Circle, GitCommit, Clock, User, Folder } from 'lucide-react';

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
  if (commits.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-500">
        <GitCommit className="w-12 h-12 mb-4 opacity-20" />
        <p>No commits found in the last 24 hours.</p>
      </div>
    );
  }

  const allSelected = commits.every((c) => selectedCommitHashes.has(c.hash));

  return (
    <div className="flex flex-col h-full bg-slate-900/50">
      <div className="flex items-center justify-between p-4 border-b border-slate-700/50">
        <div className="flex items-center gap-2">
           <h3 className="text-white font-medium">Commits Preview</h3>
           <span className="bg-slate-700 text-xs text-slate-300 px-2 py-0.5 rounded-full">{commits.length}</span>
        </div>
        <button
          onClick={() => onToggleAll(!allSelected)}
          className="text-xs text-primary hover:text-blue-400 font-medium"
        >
          {allSelected ? 'Deselect All' : 'Select All'}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {commits.map((commit) => {
          const isSelected = selectedCommitHashes.has(commit.hash);
          const repoLabel = commit.repoName || (commit.repo ? commit.repo.split(/[/\\]/).pop() : undefined);
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
                <p className={`text-sm font-medium leading-snug ${isSelected ? 'text-slate-200' : 'text-slate-400'}`}>
                  {commit.message}
                </p>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5">
                  <span className="flex items-center gap-1 text-xs text-slate-500 font-mono">
                    <Clock className="w-3 h-3" />
                    {new Date(commit.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
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
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};