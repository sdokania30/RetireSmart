import React from 'react';
import { formatCompact, formatCurrency } from '../constants';
import { CalculationResult } from '../types';
import { AlertTriangle, CheckCircle, TrendingUp, Target } from 'lucide-react';

interface HeroSummaryProps {
  result: CalculationResult;
  plannedSIP: number;
}

export const HeroSummary: React.FC<HeroSummaryProps> = ({ result, plannedSIP }) => {
  const isShortfall = plannedSIP < result.requiredSIP;
  // If required SIP is close to 0, they are already FI.
  const isFI = result.requiredSIP <= 0;

  return (
    <div className="sticky top-0 z-40 bg-gradient-to-br from-white to-slate-50 border-b-2 border-slate-200 shadow-md p-5 lg:p-7 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
      <div className="flex flex-col">
        <div className="flex items-center gap-2 mb-2">
          <Target className="w-4 h-4 text-brand-600" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Target Corpus</span>
        </div>
        <div className="flex items-baseline gap-3">
          <h1 className="text-3xl lg:text-4xl font-extrabold text-slate-900 leading-none">
            {formatCompact(result.requiredCorpus)}
          </h1>
          <span className="text-xs text-slate-400 font-medium">@ Retirement</span>
        </div>
      </div>

      <div className="flex flex-col">
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp className="w-4 h-4 text-emerald-600" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Required Monthly SIP</span>
        </div>
        <div className={`text-3xl lg:text-4xl font-extrabold leading-none ${isShortfall && !isFI ? 'text-amber-600' : 'text-emerald-600'}`}>
          {isFI ? "Fully Funded ✓" : formatCurrency(result.requiredSIP)}
        </div>
      </div>

      <div className={`px-5 py-3 rounded-xl flex items-center gap-3 text-sm font-bold shadow-lg transition-all ${isShortfall && !isFI ? 'bg-gradient-to-br from-red-50 to-red-100 text-red-700 border-2 border-red-200' : 'bg-gradient-to-br from-green-50 to-green-100 text-green-700 border-2 border-green-200'}`}>
        {isShortfall && !isFI ? <AlertTriangle size={18} /> : <CheckCircle size={18} />}
        <div>
          <span className="block text-xs opacity-75 font-normal">Status</span>
          <span className="block">{isShortfall && !isFI ? 'Shortfall' : 'On Track'}</span>
        </div>
      </div>
    </div>
  );
};