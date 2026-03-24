import React from 'react';
import { PenLine } from 'lucide-react';

interface ManualInputProps {
  value: string;
  onChange: (value: string) => void;
  contextLabel: string;
  isAllRepositories: boolean;
}

export const ManualInput: React.FC<ManualInputProps> = ({ value, onChange, contextLabel, isAllRepositories }) => {
  return (
    <div className="flex flex-col bg-slate-900/30 border-t border-slate-700/50">
      <div className="flex items-center gap-2 px-4 py-3 bg-surface/50">
        <PenLine className="w-4 h-4 text-accent" />
        <div className="flex flex-col">
          <h3 className="text-sm font-medium text-slate-300">额外工作记录</h3>
          <span className="text-[11px] text-slate-500">范围: {contextLabel}{isAllRepositories ? '（应用于所有项目）' : ''}</span>
        </div>
      </div>
      <div className="p-4 pt-0">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="- 与设计团队进行需求评审会议&#10;- 审查 PR #123 代码&#10;- 排查线上延迟问题"
          className="w-full h-24 bg-slate-800/50 border border-slate-700/50 rounded-lg p-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50 transition-all resize-none scrollbar-thin"
        />
      </div>
    </div>
  );
};