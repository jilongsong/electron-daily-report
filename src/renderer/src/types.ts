export interface RepoEntry {
  path: string;
  name: string;
}

export interface Commit {
  hash: string;
  date: string;
  message: string;
  author_name: string;
  repo?: string; // Raw path reference when available
  repoName?: string;
}

export interface DailyReportResponse {
  report?: string;
  error?: string;
}

export interface ElectronAPI {
  getGitCommits: (path: string) => Promise<Commit[] | { error: any }>;
  generateDailyReport: (commits: Commit[], manualContent: string) => Promise<DailyReportResponse>;
}

export enum AppState {
  IDLE = 'IDLE',
  FETCHING_COMMITS = 'FETCHING_COMMITS',
  READY_TO_GENERATE = 'READY_TO_GENERATE',
  GENERATING_REPORT = 'GENERATING_REPORT',
  SHOWING_REPORT = 'SHOWING_REPORT',
}