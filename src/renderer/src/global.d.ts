// src/global.d.ts

export {}

declare global {
  interface GitCommit {
    hash: string
    date: string
    message: string
    author_name: string
    repo: string
  }

  type GitCommitResult = GitCommit[] | { error: string }

  interface Window {
    electronAPI: {
      getGitCommits: (path: string) => Promise<GitCommitResult>
      generateDailyReport: (commits: GitCommit[]) => Promise<{ report?: string; error?: string }>
    }
  }
}
