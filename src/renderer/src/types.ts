export interface RepoEntry {
  path: string;
  name: string;
}

export interface Commit {
  hash: string;
  date: string;
  message: string;
  body?: string;
  author_name: string;
  repo?: string;
  repoName?: string;
}

export enum ReportType {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
}

export const ReportTypeLabels: Record<ReportType, string> = {
  [ReportType.DAILY]: '日报',
  [ReportType.WEEKLY]: '周报',
  [ReportType.MONTHLY]: '月报',
};

export interface AIConfig {
  apiUrl: string;
  apiKey: string;
  model: string;
}

export const DEFAULT_AI_CONFIG: AIConfig = {
  apiUrl: 'https://api.siliconflow.cn/v1/chat/completions',
  apiKey: '',
  model: 'Qwen/Qwen3-32B',
};

export type PromptTemplates = Record<ReportType, string>;

export const DEFAULT_PROMPT_TEMPLATES: PromptTemplates = {
  [ReportType.DAILY]: `请根据以下按项目归类的Git提交记录以及额外手动记录生成一份日报。
时间范围: {{dateRange}}
要求:
1. 按项目名称对工作内容进行分组输出，将同一项目下的提交记录归类在一起
2. 仅总结提交记录及额外记录中实际体现的工作内容，不要臆测
3. 使用中文输出，保持专业、客观
4. 输出纯文本，不要包含 Markdown 标记
5. 简明扼要地列出当日完成的具体工作

按项目分类的提交记录:
{{commits}}

额外记录:
{{manual}}

请严格按照以下格式输出:
1. 今日工作内容:
  【项目名称】
    1. xxxxx
    2. xxxxx
  【项目名称】
    1. xxxxx
    2. xxxxx
2. 遇到的问题: 仅列出提交记录或额外记录中明确提到的问题或改进点`,
  [ReportType.WEEKLY]: `请根据以下按项目归类的Git提交记录以及额外手动记录生成一份周报。
时间范围: {{dateRange}}
要求:
1. 按项目名称对工作内容进行分组输出，将同一项目下的提交记录归类在一起
2. 仅总结提交记录及额外记录中实际体现的工作内容，不要臆测
3. 使用中文输出，保持专业、客观
4. 输出纯文本，不要包含 Markdown 标记
5. 对本周工作进行适当归纳总结，突出重点成果

按项目分类的提交记录:
{{commits}}

额外记录:
{{manual}}

请严格按照以下格式输出:
1. 本周工作内容:
  【项目名称】
    1. xxxxx
    2. xxxxx
  【项目名称】
    1. xxxxx
    2. xxxxx
2. 遇到的问题: 仅列出提交记录或额外记录中明确提到的问题或改进点
3. 本周总结与展望: 简要总结本周整体工作进展和下一步计划`,
  [ReportType.MONTHLY]: `请根据以下按项目归类的Git提交记录以及额外手动记录生成一份月报。
时间范围: {{dateRange}}
要求:
1. 按项目名称对工作内容进行分组输出，将同一项目下的提交记录归类在一起
2. 仅总结提交记录及额外记录中实际体现的工作内容，不要臆测
3. 使用中文输出，保持专业、客观
4. 输出纯文本，不要包含 Markdown 标记
5. 对本月工作进行系统性总结，提炼关键成果和里程碑

按项目分类的提交记录:
{{commits}}

额外记录:
{{manual}}

请严格按照以下格式输出:
1. 本月工作内容:
  【项目名称】
    1. xxxxx
    2. xxxxx
  【项目名称】
    1. xxxxx
    2. xxxxx
2. 遇到的问题: 仅列出提交记录或额外记录中明确提到的问题或改进点
3. 本月总结与展望: 简要总结本月整体工作进展和下一步计划`,
};

export interface ReportRequest {
  commits: Commit[];
  manualContent: string;
  reportType: ReportType;
  dateRange: { since: string; until: string };
}

export interface ReportResponse {
  report?: string;
  error?: string;
}

export interface ReportHistoryItem {
  id: string;
  reportType: ReportType;
  content: string;
  createdAt: string;
  dateRange: { since: string; until: string };
  repoNames: string[];
}

export interface AppSettings {
  aiConfig: AIConfig;
  promptTemplates: PromptTemplates;
}

export interface ElectronAPI {
  getGitCommits: (path: string, since?: string, until?: string) => Promise<Commit[] | { error: any }>;
  generateReport: (request: ReportRequest, aiConfig: AIConfig, promptTemplate: string) => Promise<ReportResponse>;
  loadSettings: () => Promise<Partial<AppSettings>>;
  saveSettings: (settings: Partial<AppSettings>) => Promise<void>;
  loadReportHistory: () => Promise<ReportHistoryItem[]>;
  saveReportHistory: (history: ReportHistoryItem[]) => Promise<void>;
}

export enum AppState {
  IDLE = 'IDLE',
  FETCHING_COMMITS = 'FETCHING_COMMITS',
  READY_TO_GENERATE = 'READY_TO_GENERATE',
  GENERATING_REPORT = 'GENERATING_REPORT',
  SHOWING_REPORT = 'SHOWING_REPORT',
}