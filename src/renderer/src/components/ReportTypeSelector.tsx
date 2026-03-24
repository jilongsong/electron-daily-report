import React, { useMemo } from 'react';
import { Calendar, FileText, CalendarDays, CalendarRange } from 'lucide-react';
import { ReportType, ReportTypeLabels } from '../types';

interface ReportTypeSelectorProps {
  reportType: ReportType;
  onReportTypeChange: (type: ReportType) => void;
  dateRange: { since: string; until: string };
  onDateRangeChange: (range: { since: string; until: string }) => void;
}

const typeIcons: Record<ReportType, React.ReactNode> = {
  [ReportType.DAILY]: <FileText className="w-4 h-4" />,
  [ReportType.WEEKLY]: <CalendarDays className="w-4 h-4" />,
  [ReportType.MONTHLY]: <CalendarRange className="w-4 h-4" />,
};

function getDefaultDateRange(type: ReportType): { since: string; until: string } {
  const now = new Date();
  const until = now.toISOString().slice(0, 10);

  switch (type) {
    case ReportType.DAILY: {
      return { since: until, until };
    }
    case ReportType.WEEKLY: {
      const weekAgo = new Date(now);
      weekAgo.setDate(weekAgo.getDate() - (now.getDay() === 0 ? 6 : now.getDay() - 1));
      return { since: weekAgo.toISOString().slice(0, 10), until };
    }
    case ReportType.MONTHLY: {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      return { since: monthStart.toISOString().slice(0, 10), until };
    }
  }
}

export { getDefaultDateRange };

export const ReportTypeSelector: React.FC<ReportTypeSelectorProps> = ({
  reportType,
  onReportTypeChange,
  dateRange,
  onDateRangeChange,
}) => {
  const handleTypeChange = (type: ReportType) => {
    onReportTypeChange(type);
    const defaultRange = getDefaultDateRange(type);
    onDateRangeChange(defaultRange);
  };

  const dayCount = useMemo(() => {
    const start = new Date(dateRange.since);
    const end = new Date(dateRange.until);
    const diff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return diff > 0 ? diff : 1;
  }, [dateRange]);

  return (
    <div className="flex flex-col gap-3 px-4 py-3 bg-surface/80 border-b border-slate-700/50">
      {/* Report Type Tabs */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-500 mr-1">报告类型</span>
        <div className="flex bg-slate-800 rounded-lg p-0.5 gap-0.5">
          {Object.values(ReportType).map((type) => (
            <button
              key={type}
              onClick={() => handleTypeChange(type)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                reportType === type
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700'
              }`}
            >
              {typeIcons[type]}
              {ReportTypeLabels[type]}
            </button>
          ))}
        </div>
      </div>

      {/* Date Range */}
      <div className="flex items-center gap-3 flex-wrap">
        <Calendar className="w-4 h-4 text-slate-500" />
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={dateRange.since}
            onChange={(e) => onDateRangeChange({ ...dateRange, since: e.target.value })}
            className="bg-slate-800 border border-slate-600 rounded-md px-2.5 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary transition-all"
          />
          <span className="text-xs text-slate-500">至</span>
          <input
            type="date"
            value={dateRange.until}
            onChange={(e) => onDateRangeChange({ ...dateRange, until: e.target.value })}
            className="bg-slate-800 border border-slate-600 rounded-md px-2.5 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary transition-all"
          />
        </div>
        <span className="text-[11px] text-slate-500 bg-slate-800 px-2 py-0.5 rounded">
          共 {dayCount} 天
        </span>
      </div>
    </div>
  );
};
