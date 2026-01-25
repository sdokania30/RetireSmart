import React from 'react';
import { formatCompact, formatCurrency } from '../constants';
import { CalculationResult } from '../types';
import { AlertTriangle, CheckCircle } from 'lucide-react';

interface HeroSummaryProps {
  result: CalculationResult;
  plannedSIP: number;
}

export const HeroSummary: React.FC<HeroSummaryProps> = ({ result, plannedSIP }) => {
  const isShortfall = plannedSIP < result.requiredSIP;
  // If required SIP is close to 0, they are already FI.
  const isFI = result.requiredSIP <= 0;

  return (
    <div className="sticky top-0 z-40 bg-white border-b shadow-sm p-4 lg:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div className="flex flex-col">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Target Corpus</span>
        <div className="flex items-baseline gap-2">
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 leading-none">
            {formatCompact(result.requiredCorpus)}
          </h1>
          <span className="text-xs text-slate-400">@ Retirement</span>
        </div>
      </div>

      <div className="flex flex-col">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Required Monthly SIP</span>
        <div className={`text-2xl lg:text-3xl font-bold leading-none ${isShortfall && !isFI ? 'text-amber-600' : 'text-emerald-600'}`}>
           {isFI ? "Fully Funded" : formatCurrency(result.requiredSIP)}
        </div>
      </div>

      <div className={`px-4 py-2 rounded-full flex items-center gap-2 text-sm font-bold shadow-sm ${isShortfall && !isFI ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-green-50 text-green-700 border border-green-100'}`}>
        {isShortfall && !isFI ? <AlertTriangle size={16} /> : <CheckCircle size={16} />}
        <span>{isShortfall && !isFI ? 'Shortfall Detected' : 'Plan On Track'}</span>
      </div>
    </div>
  );
};