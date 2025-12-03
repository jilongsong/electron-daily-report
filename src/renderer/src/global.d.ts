// src/global.d.ts

export {}

declare global {
  interface GitCommit {
    hash: string
    date: string
    message: string
    author_name: string
    repo: string
    repoName?: string
  }

  type GitCommitResult = GitCommit[] | { error: string }

  interface Window {
    electronAPI: {
      getGitCommits: (path: string) => Promise<GitCommitResult>
      generateDailyReport: (commits: GitCommit[], manualContent: string) => Promise<{ report?: string; error?: string }>
    }
  }
}
