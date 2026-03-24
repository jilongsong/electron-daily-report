import React, { useState, useEffect } from 'react';
import { X, Settings, Eye, EyeOff, Save, RotateCcw, FileText, Cpu } from 'lucide-react';
import { AIConfig, DEFAULT_AI_CONFIG, PromptTemplates, DEFAULT_PROMPT_TEMPLATES, ReportType, ReportTypeLabels } from '../types';

type SettingsTab = 'ai' | 'prompts';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  aiConfig: AIConfig;
  promptTemplates: PromptTemplates;
  onSave: (config: AIConfig, templates: PromptTemplates) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  aiConfig,
  promptTemplates,
  onSave,
}) => {
  const [config, setConfig] = useState<AIConfig>(aiConfig);
  const [templates, setTemplates] = useState<PromptTemplates>(promptTemplates);
  const [showKey, setShowKey] = useState(false);
  const [activeTab, setActiveTab] = useState<SettingsTab>('ai');
  const [activePromptType, setActivePromptType] = useState<ReportType>(ReportType.DAILY);

  useEffect(() => {
    setConfig(aiConfig);
    setTemplates(promptTemplates);
  }, [aiConfig, promptTemplates, isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(config, templates);
    onClose();
  };

  const handleReset = () => {
    if (activeTab === 'ai') {
      setConfig(DEFAULT_AI_CONFIG);
    } else {
      setTemplates(DEFAULT_PROMPT_TEMPLATES);
    }
  };

  const handleResetSinglePrompt = () => {
    setTemplates({ ...templates, [activePromptType]: DEFAULT_PROMPT_TEMPLATES[activePromptType] });
  };

  const tabClass = (tab: SettingsTab) =>
    `flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
      activeTab === tab
        ? 'bg-slate-800 text-white border-b-2 border-primary'
        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
    }`;

  const promptTypeClass = (type: ReportType) =>
    `px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
      activePromptType === type
        ? 'bg-primary text-white'
        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
    }`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-800 border border-slate-600 rounded-xl w-full max-w-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-primary" />
            设置
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-6 pt-3 bg-slate-850">
          <button onClick={() => setActiveTab('ai')} className={tabClass('ai')}>
            <Cpu className="w-4 h-4" />
            AI 模型
          </button>
          <button onClick={() => setActiveTab('prompts')} className={tabClass('prompts')}>
            <FileText className="w-4 h-4" />
            提示词模板
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {activeTab === 'ai' ? (
            <div className="space-y-5">
              {/* API URL */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-300">API 地址</label>
                <input
                  type="text"
                  value={config.apiUrl}
                  onChange={(e) => setConfig({ ...config, apiUrl: e.target.value })}
                  placeholder="https://api.openai.com/v1/chat/completions"
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                />
                <p className="text-xs text-slate-500">支持 OpenAI 兼容接口，如 SiliconFlow、DeepSeek、Ollama 等</p>
              </div>

              {/* API Key */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-300">API Key</label>
                <div className="relative">
                  <input
                    type={showKey ? 'text' : 'password'}
                    value={config.apiKey}
                    onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                    placeholder="sk-xxxxxxxxxxxxxxxx"
                    className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2.5 pr-10 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                  >
                    {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Model Name */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-300">模型名称</label>
                <input
                  type="text"
                  value={config.model}
                  onChange={(e) => setConfig({ ...config, model: e.target.value })}
                  placeholder="gpt-4o / Qwen/Qwen3-32B / deepseek-chat"
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                />
                <p className="text-xs text-slate-500">输入你所使用的模型标识，例如 gpt-4o、deepseek-chat 等</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Prompt type selector */}
              <div className="flex items-center gap-2">
                {([ReportType.DAILY, ReportType.WEEKLY, ReportType.MONTHLY] as ReportType[]).map((type) => (
                  <button
                    key={type}
                    onClick={() => setActivePromptType(type)}
                    className={promptTypeClass(type)}
                  >
                    {ReportTypeLabels[type]}提示词
                  </button>
                ))}
                <div className="flex-1" />
                <button
                  onClick={handleResetSinglePrompt}
                  className="flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-slate-500 hover:text-white hover:bg-slate-700 rounded transition-colors"
                  title={`恢复${ReportTypeLabels[activePromptType]}提示词为默认值`}
                >
                  <RotateCcw className="w-3 h-3" />
                  恢复当前默认
                </button>
              </div>

              {/* Variable hints */}
              <div className="bg-slate-900/80 border border-slate-700 rounded-lg px-3 py-2.5 text-xs text-slate-400 space-y-1">
                <p className="text-slate-300 font-medium">可用变量（会在生成时自动替换）：</p>
                <div className="flex flex-wrap gap-x-4 gap-y-0.5">
                  <span><code className="text-primary">{'{{commits}}'}</code> — 按项目分组的提交记录</span>
                  <span><code className="text-primary">{'{{manual}}'}</code> — 额外手动记录</span>
                  <span><code className="text-primary">{'{{dateRange}}'}</code> — 时间范围</span>
                </div>
              </div>

              {/* Prompt textarea */}
              <textarea
                value={templates[activePromptType]}
                onChange={(e) => setTemplates({ ...templates, [activePromptType]: e.target.value })}
                rows={14}
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all font-mono leading-relaxed resize-y"
                placeholder="请输入提示词模板..."
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-700 bg-slate-800/50 rounded-b-xl">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-700 rounded-md transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            {activeTab === 'ai' ? '恢复默认配置' : '恢复所有默认提示词'}
          </button>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-blue-600 rounded-lg transition-colors shadow-lg shadow-blue-900/20"
            >
              <Save className="w-4 h-4" />
              保存
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
