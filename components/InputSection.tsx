import React from 'react';
import { Plus, Trash2, HelpCircle, AlertCircle } from 'lucide-react';
import { GlobalSettings, InvestmentProfile, ExpenseBucket, Milestone } from '../types';

interface InputSectionProps {
  settings: GlobalSettings;
  setSettings: (s: GlobalSettings) => void;
  profile: InvestmentProfile;
  setProfile: (p: InvestmentProfile) => void;
  expenses: ExpenseBucket[];
  setExpenses: (e: ExpenseBucket[]) => void;
  milestones: Milestone[];
  setMilestones: (m: Milestone[]) => void;
  onAutoFillSIP: (amount: number) => void;
  requiredSIP: number;
  errors: Record<string, string>;
}

const Tooltip = ({ text }: { text: string }) => (
  <div className="group relative flex items-center ml-1 inline-block">
    <HelpCircle className="w-3 h-3 text-slate-400 cursor-help" />
    <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block w-48 p-2 bg-slate-800 text-white text-xs rounded shadow-lg z-50 pointer-events-none">
      {text}
      <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-slate-800"></div>
    </div>
  </div>
);

interface InputFieldProps {
  label: string;
  value: number;
  onChange: (val: string) => void;
  error?: string;
  tooltip?: string;
  className?: string;
  step?: string;
  isLakhs?: boolean;
}

const InputField: React.FC<InputFieldProps> = ({ 
  label, 
  value, 
  onChange, 
  error, 
  tooltip, 
  className, 
  step = "1", 
  isLakhs = false
}) => {
  
  // If isLakhs is true, we display value / 100000
  const displayValue = isLakhs ? (value / 100000) : value;
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (isLakhs) {
       // Allow user to type decimal points for lakhs
       const num = parseFloat(val);
       if (!isNaN(num)) {
         // Convert back to absolute rupees
         // Use Math.round to avoid float precision issues like 0.3 * 100000 = 30000.0000004
         onChange((Math.round(num * 100000)).toString());
       } else {
         onChange("0");
       }
    } else {
      onChange(val);
    }
  };

  return (
    <div className={className}>
      <div className="flex justify-between items-baseline mb-1">
        <label className="flex items-center text-xs font-medium text-slate-500">
          {label} {isLakhs && <span className="text-[10px] text-slate-400 font-normal ml-1">(₹ Lakhs)</span>}
          {tooltip && <Tooltip text={tooltip} />}
        </label>
      </div>
      <div className="relative">
        <input 
          type="number" 
          step={isLakhs ? "0.01" : step}
          value={displayValue === 0 ? '' : displayValue} 
          onChange={handleChange}
          placeholder="0"
          className={`w-full p-2 border rounded text-sm focus:ring-2 outline-none transition-all ${error ? 'border-red-400 focus:ring-red-200 bg-red-50' : 'border-slate-200 focus:ring-brand-500'}`} 
        />
        {error && <AlertCircle className="absolute right-2 top-2.5 text-red-500 w-4 h-4" />}
      </div>
      {error && <span className="text-[10px] text-red-600 mt-1 block">{error}</span>}
    </div>
  );
};

export const InputSection: React.FC<InputSectionProps> = ({
  settings, setSettings,
  profile, setProfile,
  expenses, setExpenses,
  milestones, setMilestones,
  onAutoFillSIP,
  requiredSIP,
  errors
}) => {

  const handleSettingChange = (key: keyof GlobalSettings, val: string) => {
    setSettings({ ...settings, [key]: Number(val) });
  };

  const handleProfileChange = (key: keyof InvestmentProfile, val: string) => {
    setProfile({ ...profile, [key]: Number(val) });
  };

  // Expense Handlers
  const addExpense = () => {
    setExpenses([...expenses, {
      id: Math.random().toString(36).substr(2, 9),
      name: 'New Category',
      currentMonthlyCost: 0,
      inflationRate: 6,
      endAge: settings.lifeExpectancy
    }]);
  };

  const updateExpense = (id: string, field: keyof ExpenseBucket, val: string | number) => {
    setExpenses(expenses.map(e => e.id === id ? { ...e, [field]: val } : e));
  };

  const removeExpense = (id: string) => {
    setExpenses(expenses.filter(e => e.id !== id));
  };

  // Milestone Handlers
  const addMilestone = () => {
    setMilestones([...milestones, {
      id: Math.random().toString(36).substr(2, 9),
      name: 'New Milestone',
      currentCost: 0,
      inflationRate: 6,
      yearOffset: 5
    }]);
  };

  const updateMilestone = (id: string, field: keyof Milestone, val: string | number) => {
    setMilestones(milestones.map(m => m.id === id ? { ...m, [field]: val } : m));
  };

  const removeMilestone = (id: string) => {
    setMilestones(milestones.filter(m => m.id !== id));
  };

  return (
    <div className="p-5 space-y-8 pb-20">
      
      {/* 1. Global Assumptions */}
      <section className="space-y-4">
        <h3 className="text-lg font-semibold text-slate-800 border-b pb-2">Scenario Config</h3>
        <div className="grid grid-cols-2 gap-4">
          <InputField 
            label="Current Age" 
            value={settings.currentAge} 
            onChange={v => handleSettingChange('currentAge', v)}
            error={errors.currentAge}
          />
          <InputField 
            label="Retirement Age" 
            value={settings.retirementAge} 
            onChange={v => handleSettingChange('retirementAge', v)}
            error={errors.retirementAge}
          />
          <InputField 
            label="Life Expectancy" 
            value={settings.lifeExpectancy} 
            onChange={v => handleSettingChange('lifeExpectancy', v)}
            error={errors.lifeExpectancy}
          />
          <InputField 
            label="Post-Ret. ROI %" 
            value={settings.postRetirementROI} 
            onChange={v => handleSettingChange('postRetirementROI', v)}
            tooltip="Expected annual return on corpus after retirement"
          />
        </div>
      </section>

      {/* 2. Investment Profile */}
      <section className="space-y-4">
        <h3 className="text-lg font-semibold text-slate-800 border-b pb-2">Assets & Savings</h3>
        <div className="space-y-3">
          <InputField 
            label="Current Corpus" 
            value={profile.currentCorpus} 
            onChange={v => handleProfileChange('currentCorpus', v)}
            isLakhs={true}
          />
          <div className="grid grid-cols-2 gap-4">
            <InputField 
              label="Pre-Ret. ROI %" 
              value={profile.preRetirementROI} 
              onChange={v => handleProfileChange('preRetirementROI', v)}
            />
            <InputField 
              label="SIP Step-Up %" 
              value={profile.sipStepUp} 
              onChange={v => handleProfileChange('sipStepUp', v)}
            />
          </div>
          <div className="p-3 bg-brand-50 rounded-lg border border-brand-100">
            <div className="flex justify-between items-end mb-1">
              <label className="block text-xs font-bold text-brand-800">Planned Monthly SIP (₹ Lakhs)</label>
              <button onClick={() => onAutoFillSIP(requiredSIP)} className="text-[10px] text-brand-600 hover:underline uppercase font-bold tracking-wide">
                Auto-Fill Required
              </button>
            </div>
            <div className="relative">
              <input 
                type="number"
                step="0.01"
                value={profile.plannedSIP > 0 ? profile.plannedSIP / 100000 : ''} 
                onChange={e => handleProfileChange('plannedSIP', (Math.round(Number(e.target.value) * 100000)).toString())} 
                placeholder="0"
                className="w-full p-2 border border-brand-200 rounded focus:ring-2 focus:ring-brand-500 outline-none text-brand-900 font-bold" 
              />
            </div>
          </div>
        </div>
      </section>

      {/* 3. Expense Buckets */}
      <section className="space-y-4">
        <div className="flex justify-between items-center border-b pb-2">
          <h3 className="text-lg font-semibold text-slate-800">Expense Buckets</h3>
          <button onClick={addExpense} className="p-1 hover:bg-slate-100 rounded-full text-brand-600 transition-colors">
            <Plus size={18} />
          </button>
        </div>
        <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
          {expenses.map((exp) => (
            <div key={exp.id} className="p-3 bg-white border rounded-lg shadow-sm space-y-2 group relative">
              <div className="flex justify-between items-start">
                <input 
                  type="text" 
                  value={exp.name} 
                  onChange={e => updateExpense(exp.id, 'name', e.target.value)}
                  className="font-medium text-sm border-b border-transparent hover:border-slate-300 focus:border-brand-500 focus:outline-none w-2/3"
                />
                <button onClick={() => removeExpense(exp.id)} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Trash2 size={14} />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <InputField 
                  label="Cost"
                  value={exp.currentMonthlyCost} 
                  onChange={v => updateExpense(exp.id, 'currentMonthlyCost', Number(v))}
                  className="w-full"
                  isLakhs={true}
                />
                <InputField 
                  label="Infl. %"
                  value={exp.inflationRate} 
                  onChange={v => updateExpense(exp.id, 'inflationRate', Number(v))}
                  className="w-full"
                />
                <InputField 
                  label="End Age"
                  value={exp.endAge} 
                  onChange={v => updateExpense(exp.id, 'endAge', Number(v))}
                  className="w-full"
                  error={errors[`exp_end_${exp.id}`]}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. Milestones */}
      <section className="space-y-4">
        <div className="flex justify-between items-center border-b pb-2">
          <h3 className="text-lg font-semibold text-slate-800">Life Milestones</h3>
          <button onClick={addMilestone} className="p-1 hover:bg-slate-100 rounded-full text-brand-600 transition-colors">
            <Plus size={18} />
          </button>
        </div>
        <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
          {milestones.map((ms) => (
            <div key={ms.id} className="p-3 bg-white border rounded-lg shadow-sm space-y-2 group">
              <div className="flex justify-between items-start">
                <input 
                  type="text" 
                  value={ms.name} 
                  onChange={e => updateMilestone(ms.id, 'name', e.target.value)}
                  className="font-medium text-sm border-b border-transparent hover:border-slate-300 focus:border-brand-500 focus:outline-none w-2/3"
                />
                <button onClick={() => removeMilestone(ms.id)} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Trash2 size={14} />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <InputField 
                  label="Cost"
                  value={ms.currentCost} 
                  onChange={v => updateMilestone(ms.id, 'currentCost', Number(v))}
                  className="w-full"
                  isLakhs={true}
                />
                <InputField 
                  label="Infl. %"
                  value={ms.inflationRate} 
                  onChange={v => updateMilestone(ms.id, 'inflationRate', Number(v))}
                  className="w-full"
                />
                <InputField 
                  label="In Years"
                  value={ms.yearOffset} 
                  onChange={v => updateMilestone(ms.id, 'yearOffset', Number(v))}
                  className="w-full"
                  error={errors[`ms_year_${ms.id}`]}
                />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};