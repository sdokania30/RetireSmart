import React from 'react';
import { formatCompact } from '../constants';
import { CalculationResult } from '../types';
import { AlertTriangle, CheckCircle, Target } from 'lucide-react';

interface HeroSummaryProps {
  result: CalculationResult;
}

export const HeroSummary: React.FC<HeroSummaryProps> = ({ result }) => {
  const isSolvable = result.isSolvable;
  const hasTodayShortfall = result.todayShortfall > 0;
  // If today shortfall is close to 0, plan is funded.
  const isFI = result.todayShortfall <= 0;

  return (
    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
      <div className="rounded-xl border border-slate-200 bg-gradient-to-b from-white to-slate-50 p-4">
        <div className="flex items-center gap-2 mb-2">
          <Target className="w-4 h-4 text-brand-600" />
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Today Shortfall</span>
        </div>
        <h2 className="text-2xl md:text-3xl font-display font-bold text-slate-900 leading-none">{formatCompact(result.todayShortfall)}</h2>
        <p className="mt-1 text-xs text-slate-500">One-time amount needed today</p>
      </div>

      <div className={`rounded-xl border p-4 flex items-center gap-3 text-sm font-bold transition-all ${
        !isSolvable
          ? 'bg-gradient-to-br from-red-50 to-red-100 text-red-700 border-red-200'
          : hasTodayShortfall && !isFI
          ? 'bg-gradient-to-br from-amber-50 to-amber-100 text-amber-700 border-amber-200'
          : 'bg-gradient-to-br from-green-50 to-green-100 text-green-700 border-green-200'
      }`}>
        {!isSolvable ? <AlertTriangle size={18} /> : hasTodayShortfall && !isFI ? <AlertTriangle size={18} /> : <CheckCircle size={18} />}
        <div>
          <span className="block text-xs opacity-75 font-semibold uppercase tracking-wider">Status</span>
          <span className="block text-base">{!isSolvable ? 'Cap Reached' : hasTodayShortfall && !isFI ? 'Shortfall' : 'On Track'}</span>
        </div>
      </div>
    </div>
  );
};
