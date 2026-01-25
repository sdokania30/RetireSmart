import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { LedgerRow, GlobalSettings } from '../types';
import { formatCompact } from '../constants';

interface ChartSectionProps {
  data: LedgerRow[];
  settings: GlobalSettings;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const val = payload[0].value;
    return (
      <div className={`text-white text-xs p-2 rounded shadow-lg border ${val < 0 ? 'bg-red-800 border-red-700' : 'bg-slate-800 border-slate-700'}`}>
        <p className="font-bold mb-1">Age: {label}</p>
        <p>Corpus: {formatCompact(val)}</p>
      </div>
    );
  }
  return null;
};

export const ChartSection: React.FC<ChartSectionProps> = ({ data, settings }) => {
  
  // 1. Calculate the gradient offset for Y-axis (Positive vs Negative)
  const gradientOffset = () => {
    const dataMax = Math.max(...data.map((i) => i.closingBalance));
    const dataMin = Math.min(...data.map((i) => i.closingBalance));

    if (dataMax <= 0) {
      return 0;
    }
    if (dataMin >= 0) {
      return 1;
    }

    return dataMax / (dataMax - dataMin);
  };

  const off = gradientOffset();

  // 2. Find start of shortfall (first year balance goes negative)
  const shortfallRow = data.find(d => d.closingBalance < 0);
  const shortfallAge = shortfallRow ? shortfallRow.age : null;

  return (
    <div className="bg-white m-5 p-5 rounded-xl border shadow-sm">
      <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Corpus Glide Path</h3>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 10, right: 30, left: 20, bottom: 0 }}
          >
            <defs>
              <linearGradient id="splitColorY" x1="0" y1="0" x2="0" y2="1">
                <stop offset={off} stopColor="#10b981" stopOpacity={0.1} />
                <stop offset={off} stopColor="#ef4444" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="splitStrokeY" x1="0" y1="0" x2="0" y2="1">
                <stop offset={off} stopColor="#10b981" stopOpacity={1} />
                <stop offset={off} stopColor="#ef4444" stopOpacity={1} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis 
              dataKey="age" 
              stroke="#94a3b8" 
              tick={{fontSize: 12}} 
              tickMargin={10} 
              interval="preserveStartEnd"
              minTickGap={20}
            />
            <YAxis 
              tickFormatter={formatCompact} 
              stroke="#94a3b8" 
              tick={{fontSize: 12}}
              width={80}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={0} stroke="#cbd5e1" strokeDasharray="3 3" />
            
            {/* Retirement Line */}
            <ReferenceLine 
              x={settings.retirementAge} 
              stroke="#64748b" 
              strokeDasharray="3 3" 
              label={{ value: 'Retirement', position: 'insideTopRight', fill: '#64748b', fontSize: 10 }} 
            />

            {/* Shortfall Line */}
            {shortfallAge && (
               <ReferenceLine 
               x={shortfallAge} 
               stroke="#ef4444" 
               strokeWidth={2}
               label={{ value: 'Shortfall Starts', position: 'insideTopLeft', fill: '#ef4444', fontSize: 10 }} 
             />
            )}

            <Area
              type="monotone"
              dataKey="closingBalance"
              stroke="url(#splitStrokeY)"
              fill="url(#splitColorY)"
              strokeWidth={2}
              dot={{ r: 2, fill: '#64748b', strokeWidth: 0 }}
              activeDot={{ r: 6, strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      
      {/* Legend */}
      <div className="flex justify-center gap-6 mt-4 text-xs font-medium text-slate-600">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-emerald-500"></span> Positive Corpus
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-red-500"></span> Negative / Debt
        </div>
      </div>
    </div>
  );
};