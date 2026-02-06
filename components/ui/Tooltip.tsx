import React from 'react';
import { HelpCircle } from 'lucide-react';

export const Tooltip = ({ text }: { text: string }) => (
  <div className="group relative flex items-center ml-1 inline-block">
    <HelpCircle className="w-3 h-3 text-slate-400 cursor-help" />
    <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block w-48 p-2 bg-slate-800 text-white text-xs rounded shadow-lg z-50 pointer-events-none">
      {text}
      <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-slate-800"></div>
    </div>
  </div>
);
