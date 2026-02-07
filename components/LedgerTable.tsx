import React from 'react';
import { LedgerRow } from '../types';
import { formatCurrency } from '../constants';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface LedgerTableProps {
  data: LedgerRow[];
  isCollapsed?: boolean;
  onToggle?: () => void;
}

export const LedgerTable: React.FC<LedgerTableProps> = ({ data, isCollapsed = false, onToggle }) => {
  return (
    <section className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
      <div className="p-4 border-b bg-slate-50 flex items-center justify-between gap-2">
        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Detailed Ledger</h3>
        {onToggle && (
          <button
            onClick={onToggle}
            className="text-slate-600 hover:text-slate-900 p-1 rounded"
            aria-label="Toggle Detailed Ledger"
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        )}
      </div>
      {!isCollapsed && (
        <div className="overflow-auto max-h-[540px]">
        <table className="w-full text-right text-sm">
          <thead className="text-xs text-slate-500 bg-slate-50 uppercase font-semibold sticky top-0 z-10 shadow-sm">
            <tr>
              <th className="px-4 py-3 text-center sticky left-0 bg-slate-50 z-20 border-r">Age</th>
              <th className="px-4 py-3">Opening</th>
              <th className="px-4 py-3 text-emerald-600">(+) SIP</th>
              <th className="px-4 py-3 text-red-500">(-) Expenses</th>
              <th className="px-4 py-3 text-amber-600">(-) Milestones</th>
              <th className="px-4 py-3 text-blue-600">(+) Growth</th>
              <th className="px-4 py-3 font-bold">Closing</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.map((row) => (
              <tr key={row.age} className={`hover:bg-slate-50 group transition-colors ${row.closingBalance < 0 ? 'bg-red-50/70 hover:bg-red-100/70' : ''}`}>
                <td className="px-4 py-3 text-center font-bold text-slate-700 sticky left-0 bg-white group-hover:bg-slate-50 border-r z-10">
                  {row.age}
                </td>
                <td className="px-4 py-3 text-slate-600">{formatCurrency(row.openingBalance)}</td>
                <td className="px-4 py-3 text-emerald-600">{row.investments > 0 ? formatCurrency(row.investments) : '-'}</td>
                <td className="px-4 py-3 text-red-500">{row.expenses > 0 ? formatCurrency(row.expenses) : '-'}</td>
                <td className="px-4 py-3 text-amber-600">{row.milestones > 0 ? formatCurrency(row.milestones) : '-'}</td>
                <td className="px-4 py-3 text-blue-600">{formatCurrency(row.growth)}</td>
                <td className={`px-4 py-3 font-bold ${row.closingBalance < 0 ? 'text-red-600' : 'text-slate-800'}`}>
                  {formatCurrency(row.closingBalance)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      )}
    </section>
  );
};
