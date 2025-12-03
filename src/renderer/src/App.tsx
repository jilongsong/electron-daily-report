import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { RepoSidebar } from './components/RepoSidebar';
import { CommitList } from './components/CommitList';
import { ManualInput } from './components/ManualInput';
import { ReportView } from './components/ReportView';
import { AppState, Commit, RepoEntry } from './types';
import { Sparkles, Loader2, Play } from 'lucide-react';

const App: React.FC = () => {
  // State: Repositories (Persisted in localStorage in a real app, keeping simple here for now)
  const [repos, setRepos] = useState<RepoEntry[]>(() => {
    const saved = localStorage.getItem('gitreport_repos');
    if (!saved) {
      return [];
    }

    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        if (parsed.length === 0) {
          return [];
        }

        if (typeof parsed[0] === 'string') {
          return parsed.map((path: string) => ({
            path,
            name: path.split(/[/\\]/).pop() || path,
          }));
        }

        if (typeof parsed[0] === 'object' && parsed[0]?.path) {
          return parsed as RepoEntry[];
        }
      }
    } catch (error) {
      console.error('Failed to parse repositories from storage:', error);
    }

    return [];
  });

  const MANUAL_NOTES_STORAGE_KEY = 'gitreport_manual_notes';
  const DEFAULT_REPO_KEY = '__all__';

  const loadStoredManualNotes = () => {
    try {
      const stored = localStorage.getItem(MANUAL_NOTES_STORAGE_KEY);
      return stored ? (JSON.parse(stored) as Record<string, string>) : {};
    } catch (error) {
      console.error('Failed to parse manual notes from storage:', error);
      return {};
    }
  };

  const initialManualNotes = loadStoredManualNotes();

  // State: Selection
  const [selectedRepo, setSelectedRepo] = useState<string | null>(null);
  const [selectedCommitHashes, setSelectedCommitHashes] = useState<Set<string>>(new Set());

  // State: Data
  const [commits, setCommits] = useState<Commit[]>([]);
  const [manualNotes, setManualNotes] = useState<Record<string, string>>(initialManualNotes);
  const [manualContent, setManualContent] = useState<string>(
    initialManualNotes[DEFAULT_REPO_KEY] ?? ''
  );
  const [generatedReport, setGeneratedReport] = useState<string>('');

  const hasFetchedAllRef = useRef(false);

  // State: UI
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [error, setError] = useState<string | null>(null);

  const persistManualNotes = useCallback(
    (nextNotes: Record<string, string>) => {
      setManualNotes(nextNotes);
      localStorage.setItem(MANUAL_NOTES_STORAGE_KEY, JSON.stringify(nextNotes));
    },
    []
  );

  // Persistence
  useEffect(() => {
    localStorage.setItem('gitreport_repos', JSON.stringify(repos));
  }, [repos]);

  const handleAddRepo = (entry: RepoEntry) => {
    if (!repos.some(repo => repo.path === entry.path)) {
      setRepos([...repos, entry]);
      hasFetchedAllRef.current = false;
    }
  };

  const handleRemoveRepo = (path: string) => {
    setRepos(repos.filter(r => r.path !== path));
    if (selectedRepo === path) setSelectedRepo(null);

    if (manualNotes[path]) {
      const nextNotes = { ...manualNotes };
      delete nextNotes[path];
      persistManualNotes(nextNotes);
    }

    hasFetchedAllRef.current = false;
  };

  const handleSelectRepo = useCallback((path: string | null) => {
    setSelectedRepo(path);
    setAppState(AppState.IDLE); // Reset view on repo change
    setCommits([]);
    hasFetchedAllRef.current = false;
  }, []);

  const getRepoStorageKey = useCallback(
    (repo: string | null) => {
      return repo ?? DEFAULT_REPO_KEY;
    },
    []
  );

  useEffect(() => {
    const repoKey = getRepoStorageKey(selectedRepo);
    const nextContent = manualNotes[repoKey] ?? '';
    setManualContent((current) => (current === nextContent ? current : nextContent));
  }, [selectedRepo, manualNotes, getRepoStorageKey]);

  const handleManualContentChange = useCallback(
    (value: string) => {
      setManualContent(value);
      const repoKey = getRepoStorageKey(selectedRepo);
      const nextNotes = { ...manualNotes, [repoKey]: value };
      persistManualNotes(nextNotes);
    },
    [selectedRepo, manualNotes, persistManualNotes, getRepoStorageKey]
  );

  const selectedRepoEntry = useMemo(
    () => (selectedRepo ? repos.find(repo => repo.path === selectedRepo) ?? null : null),
    [selectedRepo, repos]
  );

  const selectedRepoName = selectedRepoEntry?.name ?? 'All Repositories';

  const isAllRepositories = selectedRepo === null;

  const fetchCommits = useCallback(async () => {
    setAppState(AppState.FETCHING_COMMITS);
    setError(null);
    setCommits([]);
    setSelectedCommitHashes(new Set());

    try {
      let fetchedCommits: Commit[] = [];
      const targets = selectedRepo
        ? repos.filter(repo => repo.path === selectedRepo)
        : repos;

      if (targets.length === 0) {
        setError("No repositories selected.");
        setAppState(AppState.IDLE);
        return;
      }

      for (const repoEntry of targets) {
        const { path, name } = repoEntry;
        // Ensure window.electronAPI exists (it won't in standard browser dev)
        if (!window.electronAPI) {
          throw new Error("Electron API not found. Are you running in Electron?");
        }

        const result = await window.electronAPI.getGitCommits(path);

        if (Array.isArray(result)) {
          // Tag commits with their source repo for the UI
          const tagged = result.map(c => ({
            ...c,
            repo: path,
            repoName: name,
          }));
          fetchedCommits = [...fetchedCommits, ...tagged];
        } else if (result && 'error' in result) {
          console.error(`Error fetching ${path}:`, result.error);
          // We continue fetching others even if one fails
        }
      }

      // Sort descending by date
      fetchedCommits.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      setCommits(fetchedCommits);
      // Default: select all commits
      setSelectedCommitHashes(new Set(fetchedCommits.map(c => c.hash)));
      
      setAppState(AppState.READY_TO_GENERATE);
    } catch (e: any) {
      setError(e.message || "Failed to fetch commits");
      setAppState(AppState.IDLE);
    }
  }, [selectedRepo, repos]);

  useEffect(() => {
    if (repos.length === 0) {
      return;
    }

    let isCancelled = false;

    const runFetch = async () => {
      await fetchCommits();
      if (!isCancelled && selectedRepo === null) {
        hasFetchedAllRef.current = true;
      }
    };

    if (selectedRepo !== null) {
      runFetch();
      return () => {
        isCancelled = true;
      };
    }

    if (!hasFetchedAllRef.current) {
      runFetch();
    }

    return () => {
      isCancelled = true;
    };
  }, [selectedRepo, repos, fetchCommits]);

  useEffect(() => {
    if (selectedRepo === null) {
      return;
    }

    hasFetchedAllRef.current = false;
  }, [selectedRepo]);

  const generateReport = async () => {
    setAppState(AppState.GENERATING_REPORT);
    setError(null);

    try {
      const activeCommits = commits.filter(c => selectedCommitHashes.has(c.hash));
      
      // Allow generation if either commits exist OR manual content is provided
      if (activeCommits.length === 0 && !manualContent.trim()) {
        throw new Error("Please select at least one commit or enter manual notes.");
      }

      const result = await window.electronAPI.generateDailyReport(
        activeCommits as GitCommit[],
        manualContent.trim()
      );

      if (result.report) {
        setGeneratedReport(result.report);
        setAppState(AppState.SHOWING_REPORT);
      } else if (result.error) {
        throw new Error(result.error);
      }
    } catch (e: any) {
      setError(e.message || "Failed to generate report");
      setAppState(AppState.READY_TO_GENERATE);
    }
  };

  const handleToggleCommit = (hash: string) => {
    const newSet = new Set(selectedCommitHashes);
    if (newSet.has(hash)) newSet.delete(hash);
    else newSet.add(hash);
    setSelectedCommitHashes(newSet);
  };

  const handleToggleAll = (select: boolean) => {
    if (select) {
      setSelectedCommitHashes(new Set(commits.map(c => c.hash)));
    } else {
      setSelectedCommitHashes(new Set());
    }
  };

  // Main Content Render Helper
  const renderContent = () => {
    if (appState === AppState.SHOWING_REPORT) {
      return (
        <ReportView 
          report={generatedReport} 
          onReset={() => setAppState(AppState.READY_TO_GENERATE)} 
        />
      );
    }

    if (appState === AppState.FETCHING_COMMITS) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-slate-400">
           <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
           <p>Reading Git logs...</p>
        </div>
      );
    }
    
    // Empty state (IDLE with no commits fetched yet)
    if (appState === AppState.IDLE && commits.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                <div className="bg-surface p-6 rounded-full mb-6 ring-1 ring-slate-700">
                    <Sparkles className="w-12 h-12 text-accent" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Welcome to GitReport AI</h2>
                <p className="text-slate-400 max-w-md mb-8">
                    Select repositories on the left, then click the button below to fetch your work history and generate a beautifully formatted daily report.
                </p>
                
                {repos.length === 0 ? (
                    <div className="bg-blue-900/20 text-blue-200 px-4 py-2 rounded-md border border-blue-500/30 text-sm">
                        Start by adding a local repository path in the sidebar.
                    </div>
                ) : (
                    <button 
                        onClick={fetchCommits}
                        className="flex items-center gap-2 bg-primary hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium transition-all shadow-lg hover:shadow-blue-500/20"
                    >
                        <Play className="w-4 h-4 fill-current" />
                        Fetch Recent Commits
                    </button>
                )}
            </div>
        );
    }

    // Default view: Commit List + Manual Input
    return (
      <div className="flex flex-col h-full">
        {/* Scrollable container for Commit List */}
        <div className="flex-1 overflow-hidden relative">
          <CommitList 
            commits={commits}
            selectedCommitHashes={selectedCommitHashes}
            onToggleCommit={handleToggleCommit}
            onToggleAll={handleToggleAll}
          />
        </div>

        {/* Manual Input Section */}
        <ManualInput 
          value={manualContent}
          onChange={handleManualContentChange}
          contextLabel={selectedRepoName}
          isAllRepositories={isAllRepositories}
        />
        
        {/* Action Bar */}
        <div className="p-4 bg-surface border-t border-slate-700 flex justify-between items-center shadow-2xl z-10">
            <div className="text-xs text-slate-400 flex flex-col sm:flex-row gap-1">
               <span>{selectedCommitHashes.size} commits selected</span>
               {manualContent.trim() && (
                 <span className="text-accent">• Manual notes added</span>
               )}
            </div>
            
            <div className="flex gap-3">
                 <button 
                    onClick={fetchCommits}
                    className="px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-700 rounded transition-colors"
                >
                    Refresh
                </button>
                <button 
                    onClick={generateReport}
                    disabled={(selectedCommitHashes.size === 0 && !manualContent.trim()) || appState === AppState.GENERATING_REPORT}
                    className="flex items-center gap-2 bg-accent hover:bg-violet-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2 rounded-md font-medium transition-all shadow-lg shadow-violet-900/20"
                >
                    {appState === AppState.GENERATING_REPORT ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Thinking...
                        </>
                    ) : (
                        <>
                            <Sparkles className="w-4 h-4" />
                            Generate
                        </>
                    )}
                </button>
            </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-background font-sans text-slate-200 overflow-hidden">
      <RepoSidebar 
        repos={repos}
        selectedRepo={selectedRepo}
        onAddRepo={handleAddRepo}
        onRemoveRepo={handleRemoveRepo}
        onSelectRepo={handleSelectRepo}
      />
      
      <main className="flex-1 flex flex-col min-w-0">
        {/* Error Toast */}
        {error && (
            <div className="bg-red-900/80 border-b border-red-500/50 text-red-100 px-4 py-2 text-sm flex justify-between items-center animate-in slide-in-from-top">
                <span>{error}</span>
                <button onClick={() => setError(null)} className="hover:text-white">✕</button>
            </div>
        )}

        {renderContent()}
      </main>
    </div>
  );
};

export default App;