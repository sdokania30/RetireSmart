import React from 'react';
import { formatCompact, formatCurrency } from '../constants';
import { CalculationResult } from '../types';
import { AlertTriangle, CheckCircle, TrendingUp, Target } from 'lucide-react';

interface HeroSummaryProps {
  result: CalculationResult;
  plannedSIP: number;
}

export const HeroSummary: React.FC<HeroSummaryProps> = ({ result, plannedSIP }) => {
  const isSolvable = result.isSolvable;
  const isShortfall = plannedSIP < result.requiredSIP;
  // If required SIP is close to 0, they are already FI.
  const isFI = result.requiredSIP <= 0;

  return (
    <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
      <div className="rounded-xl border border-slate-200 bg-gradient-to-b from-white to-slate-50 p-4">
        <div className="flex items-center gap-2 mb-2">
          <Target className="w-4 h-4 text-brand-600" />
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Target Corpus</span>
        </div>
        <h2 className="text-2xl md:text-3xl font-display font-bold text-slate-900 leading-none">{formatCompact(result.requiredCorpus)}</h2>
        <p className="mt-1 text-xs text-slate-500">At retirement start</p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-gradient-to-b from-white to-slate-50 p-4">
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp className="w-4 h-4 text-emerald-600" />
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Required Monthly SIP</span>
        </div>
        <div className={`text-2xl md:text-3xl font-display font-bold leading-none ${!isSolvable ? 'text-red-600' : isShortfall && !isFI ? 'text-amber-600' : 'text-emerald-600'}`}>
          {!isSolvable ? "Not Solvable" : isFI ? "Fully Funded ✓" : formatCurrency(result.requiredSIP)}
        </div>
        <p className="mt-1 text-xs text-slate-500">Compared to your current SIP</p>
      </div>

      <div className={`rounded-xl border p-4 flex items-center gap-3 text-sm font-bold transition-all ${
        !isSolvable
          ? 'bg-gradient-to-br from-red-50 to-red-100 text-red-700 border-red-200'
          : isShortfall && !isFI
          ? 'bg-gradient-to-br from-amber-50 to-amber-100 text-amber-700 border-amber-200'
          : 'bg-gradient-to-br from-green-50 to-green-100 text-green-700 border-green-200'
      }`}>
        {!isSolvable ? <AlertTriangle size={18} /> : isShortfall && !isFI ? <AlertTriangle size={18} /> : <CheckCircle size={18} />}
        <div>
          <span className="block text-xs opacity-75 font-semibold uppercase tracking-wider">Status</span>
          <span className="block text-base">{!isSolvable ? 'Cap Reached' : isShortfall && !isFI ? 'Shortfall' : 'On Track'}</span>
        </div>
      </div>
    </div>
  );
};
