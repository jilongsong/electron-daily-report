// src/global.d.ts
export {};

interface GitCommit {
  hash: string
  date: string
  message: string
  author_name: string
}

type GitCommitResult = GitCommit[] | { error: string }

declare global {
  interface Window {
    electronAPI: {
      getGitCommits: (path: string) => Promise<GitCommitResult>
      generateDailyReport: (commits: {
        hash: string
        date: string
        message: string
        author_name: string
        repo: string
      }[]) => Promise<{ report?: string; error?: string }>
    }
  }
}
