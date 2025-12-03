import React from 'react';
import { PenLine } from 'lucide-react';

interface ManualInputProps {
  value: string;
  onChange: (value: string) => void;
}

export const ManualInput: React.FC<ManualInputProps> = ({ value, onChange }) => {
  return (
    <div className="flex flex-col bg-slate-900/30 border-t border-slate-700/50">
      <div className="flex items-center gap-2 px-4 py-3 bg-surface/50">
        <PenLine className="w-4 h-4 text-accent" />
        <h3 className="text-sm font-medium text-slate-300">Additional Activities & Notes</h3>
      </div>
      <div className="p-4 pt-0">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="- Planning meeting with design team&#10;- Code review for PR #123&#10;- Investigated production latency issue"
          className="w-full h-24 bg-slate-800/50 border border-slate-700/50 rounded-lg p-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50 transition-all resize-none scrollbar-thin"
        />
      </div>
    </div>
  );
};