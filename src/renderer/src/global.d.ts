// src/global.d.ts

import type { Commit, ReportType, AIConfig, ReportHistoryItem, AppSettings, PromptTemplates } from './types'

export {}

interface ReportRequestData {
  commits: Commit[]
  manualContent: string
  reportType: ReportType
  dateRange: { since: string; until: string }
}

type GitCommitResult = Commit[] | { error: string }

declare global {
  interface Window {
    electronAPI: {
      getGitCommits: (path: string, since?: string, until?: string) => Promise<GitCommitResult>
      generateReport: (request: ReportRequestData, aiConfig: AIConfig, promptTemplate: string) => Promise<{ report?: string; error?: string }>
      loadSettings: () => Promise<Partial<AppSettings>>
      saveSettings: (settings: Partial<AppSettings>) => Promise<void>
      loadReportHistory: () => Promise<ReportHistoryItem[]>
      saveReportHistory: (history: ReportHistoryItem[]) => Promise<void>
    }
  }
}
