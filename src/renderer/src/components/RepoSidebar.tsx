import React, { useState } from 'react';
import { FolderPlus, Trash2, GitBranch, Folder, Tags } from 'lucide-react';
import { RepoEntry } from '../types';

interface RepoSidebarProps {
  repos: RepoEntry[];
  selectedRepo: string | null;
  onAddRepo: (repo: RepoEntry) => void;
  onRemoveRepo: (path: string) => void;
  onSelectRepo: (path: string | null) => void;
}

export const RepoSidebar: React.FC<RepoSidebarProps> = ({
  repos,
  selectedRepo,
  onAddRepo,
  onRemoveRepo,
  onSelectRepo,
}) => {
  const [newPath, setNewPath] = useState('');
  const [newName, setNewName] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedPath = newPath.trim();
    if (!trimmedPath) {
      return;
    }

    const derivedName = trimmedPath.split(/[/\\]/).pop() || trimmedPath;
    const finalName = newName.trim() || derivedName;

    onAddRepo({ path: trimmedPath, name: finalName });
    setNewPath('');
    setNewName('');
    setIsAdding(false);
  };

  return (
    <div className="w-64 bg-surface border-r border-slate-700 flex flex-col h-screen">
      <div className="p-4 border-b border-slate-700">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <GitBranch className="text-primary w-5 h-5" />
          GitReport AI
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        <button
          onClick={() => onSelectRepo(null)}
          className={`w-full text-left px-3 py-2 rounded-md transition-colors flex items-center gap-2 text-sm font-medium ${
            selectedRepo === null
              ? 'bg-primary/20 text-primary border border-primary/30'
              : 'text-slate-400 hover:bg-slate-700 hover:text-white'
          }`}
        >
          <FolderPlus className="w-4 h-4" />
          All Repositories
        </button>

        <div className="my-2 border-t border-slate-700/50" />
        
        {repos.map((repo) => {
           const { path, name } = repo;
           const folderName = name || path.split(/[/\\]/).pop() || path;
           
           return (
            <div
              key={path}
              className={`group flex items-center justify-between rounded-md px-3 py-2 transition-colors text-sm ${
                selectedRepo === path
                  ? 'bg-slate-700 text-white shadow-sm'
                  : 'text-slate-400 hover:bg-slate-700/50 hover:text-slate-200'
              }`}
            >
              <button
                onClick={() => onSelectRepo(path)}
                className="flex-1 text-left truncate flex items-center gap-2"
                title={path}
              >
                <Folder className="w-4 h-4 opacity-50" />
                <span className="truncate">{folderName}</span>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveRepo(path);
                }}
                className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition-opacity"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>

      <div className="p-4 border-t border-slate-700 bg-surface">
        {isAdding ? (
          <form onSubmit={handleSubmit} className="flex flex-col gap-2">
            <div className="flex flex-col gap-2">
              <input
                autoFocus
                type="text"
                placeholder="/path/to/repo"
                value={newPath}
                onChange={(e) => setNewPath(e.target.value)}
                className="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-primary"
              />
              <div className="flex items-center gap-2">
                <Tags className="w-3.5 h-3.5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Optional display name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="flex-1 bg-slate-900 border border-slate-600 rounded px-2 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-primary"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 bg-primary hover:bg-blue-600 text-white text-xs py-1 rounded transition-colors"
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white text-xs py-1 rounded transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setIsAdding(true)}
            className="w-full flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 text-white py-2 rounded-md text-sm transition-colors"
          >
            <FolderPlus className="w-4 h-4" /> Add Repository
          </button>
        )}
      </div>
    </div>
  );
};