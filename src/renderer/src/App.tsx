import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { RepoSidebar } from './components/RepoSidebar';
import { CommitList } from './components/CommitList';
import { ManualInput } from './components/ManualInput';
import { ReportView } from './components/ReportView';
import { ReportTypeSelector, getDefaultDateRange } from './components/ReportTypeSelector';
import { SettingsModal } from './components/SettingsModal';
import { ReportHistory } from './components/ReportHistory';
import {
  AppState,
  Commit,
  RepoEntry,
  ReportType,
  ReportTypeLabels,
  AIConfig,
  DEFAULT_AI_CONFIG,
  ReportHistoryItem,
  PromptTemplates,
  DEFAULT_PROMPT_TEMPLATES,
} from './types';
import { Sparkles, Loader2, Play, AlertTriangle } from 'lucide-react';

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

  // State: Report Type & Date Range
  const [reportType, setReportType] = useState<ReportType>(ReportType.DAILY);
  const [dateRange, setDateRange] = useState<{ since: string; until: string }>(
    getDefaultDateRange(ReportType.DAILY)
  );

  // State: AI Config & Prompt Templates
  const [aiConfig, setAiConfig] = useState<AIConfig>(DEFAULT_AI_CONFIG);
  const [promptTemplates, setPromptTemplates] = useState<PromptTemplates>(DEFAULT_PROMPT_TEMPLATES);

  // State: Data
  const [commits, setCommits] = useState<Commit[]>([]);
  const [manualNotes, setManualNotes] = useState<Record<string, string>>(initialManualNotes);
  const [manualContent, setManualContent] = useState<string>(
    initialManualNotes[DEFAULT_REPO_KEY] ?? ''
  );
  const [generatedReport, setGeneratedReport] = useState<string>('');

  // State: History
  const [reportHistory, setReportHistory] = useState<ReportHistoryItem[]>([]);

  const lastFetchKeyRef = useRef<string>('');

  // State: UI
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [error, setError] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  // --- Load settings & history from main process on mount ---
  useEffect(() => {
    (async () => {
      try {
        if (!window.electronAPI) return;
        const settings = await window.electronAPI.loadSettings();
        if (settings?.aiConfig) {
          setAiConfig((prev) => ({ ...prev, ...settings.aiConfig }));
        }
        if (settings?.promptTemplates) {
          setPromptTemplates((prev) => ({ ...prev, ...settings.promptTemplates }));
        }
        const history = await window.electronAPI.loadReportHistory();
        if (Array.isArray(history)) {
          setReportHistory(history);
        }
      } catch (err) {
        console.error('Failed to load settings/history:', err);
      }
    })();
  }, []);

  const persistManualNotes = useCallback(
    (nextNotes: Record<string, string>) => {
      setManualNotes(nextNotes);
      localStorage.setItem(MANUAL_NOTES_STORAGE_KEY, JSON.stringify(nextNotes));
    },
    []
  );

  // Persistence: repos
  useEffect(() => {
    localStorage.setItem('gitreport_repos', JSON.stringify(repos));
  }, [repos]);

  // --- Settings save (AI Config + Prompt Templates) ---
  const handleSaveSettings = useCallback(async (config: AIConfig, templates: PromptTemplates) => {
    setAiConfig(config);
    setPromptTemplates(templates);
    try {
      if (window.electronAPI) {
        await window.electronAPI.saveSettings({ aiConfig: config, promptTemplates: templates });
      }
    } catch (err) {
      console.error('Failed to save settings:', err);
    }
  }, []);

  // --- History helpers ---
  const persistHistory = useCallback(async (newHistory: ReportHistoryItem[]) => {
    setReportHistory(newHistory);
    try {
      if (window.electronAPI) {
        await window.electronAPI.saveReportHistory(newHistory);
      }
    } catch (err) {
      console.error('Failed to save history:', err);
    }
  }, []);

  const handleDeleteHistory = useCallback((id: string) => {
    persistHistory(reportHistory.filter((h) => h.id !== id));
  }, [reportHistory, persistHistory]);

  const handleClearHistory = useCallback(() => {
    persistHistory([]);
  }, [persistHistory]);

  const handleViewHistory = useCallback((item: ReportHistoryItem) => {
    setGeneratedReport(item.content);
    setReportType(item.reportType);
    setDateRange(item.dateRange);
    setAppState(AppState.SHOWING_REPORT);
    setHistoryOpen(false);
  }, []);

  // --- Repo management ---
  const handleAddRepo = (entry: RepoEntry) => {
    if (!repos.some(repo => repo.path === entry.path)) {
      setRepos([...repos, entry]);
      lastFetchKeyRef.current = '';
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
    lastFetchKeyRef.current = '';
  };

  const handleSelectRepo = useCallback((path: string | null) => {
    setSelectedRepo(path);
    setAppState(AppState.IDLE);
    setCommits([]);
    lastFetchKeyRef.current = '';
  }, []);

  const getRepoStorageKey = useCallback(
    (repo: string | null) => repo ?? DEFAULT_REPO_KEY,
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

  const selectedRepoName = selectedRepoEntry?.name ?? '所有仓库';
  const isAllRepositories = selectedRepo === null;

  // --- Fetch commits with date range ---
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
        setError('请先添加仓库');
        setAppState(AppState.IDLE);
        return;
      }

      if (!window.electronAPI) {
        throw new Error('Electron API 未找到，请确保在 Electron 环境中运行');
      }

      for (const repoEntry of targets) {
        const { path, name } = repoEntry;
        const result = await window.electronAPI.getGitCommits(path, dateRange.since, dateRange.until);

        if (Array.isArray(result)) {
          const tagged = result.map(c => ({
            ...c,
            repo: path,
            repoName: name,
          }));
          fetchedCommits = [...fetchedCommits, ...tagged];
        } else if (result && 'error' in result) {
          console.error(`获取 ${path} 提交记录失败:`, result.error);
        }
      }

      fetchedCommits.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setCommits(fetchedCommits);
      setSelectedCommitHashes(new Set(fetchedCommits.map(c => c.hash)));
      setAppState(AppState.READY_TO_GENERATE);
    } catch (e: any) {
      setError(e.message || '获取提交记录失败');
      setAppState(AppState.IDLE);
    }
  }, [selectedRepo, repos, dateRange]);

  // Auto-fetch on repo/dateRange change
  useEffect(() => {
    if (repos.length === 0) return;

    const fetchKey = `${selectedRepo}|${dateRange.since}|${dateRange.until}|${repos.length}`;
    if (lastFetchKeyRef.current === fetchKey) return;
    lastFetchKeyRef.current = fetchKey;

    fetchCommits();
  }, [selectedRepo, repos, dateRange, fetchCommits]);

  // --- Generate Report ---
  const generateReport = async () => {
    setAppState(AppState.GENERATING_REPORT);
    setError(null);

    try {
      if (!aiConfig.apiKey) {
        throw new Error('请先在设置中配置 API Key（点击左上角齿轮图标）');
      }

      const activeCommits = commits.filter(c => selectedCommitHashes.has(c.hash));

      if (activeCommits.length === 0 && !manualContent.trim()) {
        throw new Error('请至少选择一条提交记录或填写额外工作记录');
      }

      const result = await window.electronAPI.generateReport(
        {
          commits: activeCommits,
          manualContent: manualContent.trim(),
          reportType: reportType,
          dateRange,
        },
        aiConfig,
        promptTemplates[reportType]
      );

      if (result.report) {
        setGeneratedReport(result.report);
        setAppState(AppState.SHOWING_REPORT);

        // Save to history
        const repoNames = [...new Set(activeCommits.map(c => c.repoName || '').filter(Boolean))];
        const newItem: ReportHistoryItem = {
          id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
          reportType,
          content: result.report,
          createdAt: new Date().toISOString(),
          dateRange,
          repoNames,
        };
        persistHistory([newItem, ...reportHistory]);
      } else if (result.error) {
        throw new Error(result.error);
      }
    } catch (e: any) {
      setError(e.message || '生成报告失败');
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

  const needsApiKey = !aiConfig.apiKey;

  // Main Content Render Helper
  const renderContent = () => {
    if (appState === AppState.SHOWING_REPORT) {
      return (
        <ReportView
          report={generatedReport}
          reportType={reportType}
          dateRange={dateRange}
          onReset={() => setAppState(AppState.READY_TO_GENERATE)}
        />
      );
    }

    if (appState === AppState.FETCHING_COMMITS) {
      return (
        <div className="flex flex-col h-full">
          <ReportTypeSelector
            reportType={reportType}
            onReportTypeChange={setReportType}
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
          />
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
            <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
            <p>正在读取 Git 提交记录...</p>
          </div>
        </div>
      );
    }

    // Empty state
    if (appState === AppState.IDLE && commits.length === 0) {
      return (
        <div className="flex flex-col h-full">
          <ReportTypeSelector
            reportType={reportType}
            onReportTypeChange={setReportType}
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
          />
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="bg-surface p-6 rounded-full mb-6 ring-1 ring-slate-700">
              <Sparkles className="w-12 h-12 text-accent" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">GitReport AI</h2>
            <p className="text-slate-400 max-w-md mb-6">
              在左侧添加 Git 仓库，选择报告类型和时间范围，即可自动获取提交记录并生成工作报告。
            </p>

            {needsApiKey && (
              <div className="bg-amber-900/20 text-amber-200 px-4 py-2.5 rounded-md border border-amber-500/30 text-sm flex items-center gap-2 mb-4">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                请先点击左上角设置图标配置 AI 模型的 API Key
              </div>
            )}

            {repos.length === 0 ? (
              <div className="bg-blue-900/20 text-blue-200 px-4 py-2 rounded-md border border-blue-500/30 text-sm">
                请先在左侧栏添加一个本地仓库路径
              </div>
            ) : (
              <button
                onClick={fetchCommits}
                className="flex items-center gap-2 bg-primary hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium transition-all shadow-lg hover:shadow-blue-500/20"
              >
                <Play className="w-4 h-4 fill-current" />
                获取提交记录
              </button>
            )}
          </div>
        </div>
      );
    }

    // Default view: Commit List + Manual Input
    return (
      <div className="flex flex-col h-full">
        <ReportTypeSelector
          reportType={reportType}
          onReportTypeChange={setReportType}
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
        />

        <div className="flex-1 overflow-hidden relative">
          <CommitList
            commits={commits}
            selectedCommitHashes={selectedCommitHashes}
            onToggleCommit={handleToggleCommit}
            onToggleAll={handleToggleAll}
          />
        </div>

        <ManualInput
          value={manualContent}
          onChange={handleManualContentChange}
          contextLabel={selectedRepoName}
          isAllRepositories={isAllRepositories}
        />

        {/* Action Bar */}
        <div className="p-4 bg-surface border-t border-slate-700 flex justify-between items-center shadow-2xl z-10">
          <div className="text-xs text-slate-400 flex flex-col sm:flex-row gap-1">
            <span>已选 {selectedCommitHashes.size} 条提交</span>
            {manualContent.trim() && (
              <span className="text-accent">· 已添加额外记录</span>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={fetchCommits}
              className="px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-700 rounded transition-colors"
            >
              刷新
            </button>
            <button
              onClick={generateReport}
              disabled={
                (selectedCommitHashes.size === 0 && !manualContent.trim()) ||
                appState === AppState.GENERATING_REPORT ||
                needsApiKey
              }
              className="flex items-center gap-2 bg-accent hover:bg-violet-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2 rounded-md font-medium transition-all shadow-lg shadow-violet-900/20"
              title={needsApiKey ? '请先配置 API Key' : undefined}
            >
              {appState === AppState.GENERATING_REPORT ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  生成中...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  生成{ReportTypeLabels[reportType]}
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
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenHistory={() => setHistoryOpen(true)}
      />

      <main className="flex-1 flex flex-col min-w-0">
        {error && (
          <div className="bg-red-900/80 border-b border-red-500/50 text-red-100 px-4 py-2 text-sm flex justify-between items-center animate-in slide-in-from-top">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="hover:text-white">✕</button>
          </div>
        )}
        {renderContent()}
      </main>

      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        aiConfig={aiConfig}
        promptTemplates={promptTemplates}
        onSave={handleSaveSettings}
      />

      <ReportHistory
        isOpen={historyOpen}
        onClose={() => setHistoryOpen(false)}
        history={reportHistory}
        onDelete={handleDeleteHistory}
        onView={handleViewHistory}
        onClearAll={handleClearHistory}
      />
    </div>
  );
};

export default App;