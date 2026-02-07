import React, { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { LedgerRow, GlobalSettings } from '../types';
import { formatCompact } from '../constants';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface ChartSectionProps {
  data: LedgerRow[];
  settings: GlobalSettings;
  isCollapsed?: boolean;
  onToggle?: () => void;
}

const CustomTooltip = ({ active, payload, label, isMobile }: any) => {
  if (active && payload && payload.length) {
    const val = payload[0].value;
    return (
      <div className={`text-white ${isMobile ? 'text-[11px] p-2.5' : 'text-xs p-3'} rounded-lg shadow-lg border max-w-[200px] ${val < 0 ? 'bg-red-800 border-red-700' : 'bg-slate-800 border-slate-700'}`}>
        <p className="font-bold mb-1">Age {label}</p>
        <p>Corpus: {formatCompact(val)}</p>
      </div>
    );
  }
  return null;
};

export const ChartSection: React.FC<ChartSectionProps> = ({ data, settings, isCollapsed = false, onToggle }) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);
  
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
    <section className="bg-white p-4 md:p-6 rounded-2xl border border-slate-200 shadow-sm">
      <div className="flex items-center justify-between gap-3 mb-3 md:mb-4">
        <h3 className="text-xs md:text-sm font-bold text-slate-500 uppercase tracking-wider">Corpus Glide Path</h3>
        <div className="flex items-center gap-2">
          {!isMobile && <span className="text-xs text-slate-500">Corpus value by age</span>}
          {onToggle && (
            <button
              onClick={onToggle}
              className="text-slate-600 hover:text-slate-900 p-1 rounded"
              aria-label="Toggle Corpus Glide Path"
            >
              {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>
      {!isCollapsed && (
        <>
      <div className={`${isMobile ? 'h-56' : 'h-72'} w-full`}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={isMobile ? { top: 8, right: 8, left: 0, bottom: 0 } : { top: 10, right: 24, left: 8, bottom: 0 }}
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
              tick={{fontSize: isMobile ? 10 : 12}} 
              tickMargin={isMobile ? 8 : 10} 
              interval="preserveStartEnd"
              minTickGap={isMobile ? 32 : 20}
            />
            <YAxis 
              tickFormatter={formatCompact} 
              stroke="#94a3b8" 
              tick={{fontSize: isMobile ? 10 : 12}}
              width={isMobile ? 62 : 74}
            />
            <Tooltip
              content={<CustomTooltip isMobile={isMobile} />}
              cursor={{ stroke: '#64748b', strokeDasharray: '3 3' }}
              allowEscapeViewBox={{ x: true, y: true }}
            />
            <ReferenceLine y={0} stroke="#cbd5e1" strokeDasharray="3 3" />
            
            {/* Retirement Line */}
            <ReferenceLine 
              x={settings.retirementAge} 
              stroke="#64748b" 
              strokeDasharray="3 3" 
              label={isMobile ? undefined : { value: 'Retirement', position: 'insideTopRight', fill: '#64748b', fontSize: 10 }} 
            />

            {/* Shortfall Line */}
            {shortfallAge && (
               <ReferenceLine 
               x={shortfallAge} 
               stroke="#ef4444" 
               strokeWidth={2}
               label={isMobile ? undefined : { value: 'Shortfall Starts', position: 'insideTopLeft', fill: '#ef4444', fontSize: 10 }} 
             />
            )}

            <Area
              type="monotone"
              dataKey="closingBalance"
              stroke="url(#splitStrokeY)"
              fill="url(#splitColorY)"
              strokeWidth={2}
              dot={isMobile ? false : { r: 2, fill: '#64748b', strokeWidth: 0 }}
              activeDot={{ r: isMobile ? 4 : 6, strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      
      {/* Legend */}
      <div className={`flex justify-center ${isMobile ? 'gap-4 mt-3 text-[11px]' : 'gap-6 mt-5 text-xs'} font-medium text-slate-600`}>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Positive
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span> Negative / Debt
        </div>
      </div>
        </>
      )}
    </section>
  );
};
