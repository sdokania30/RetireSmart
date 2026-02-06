import React, { useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { GlobalSettings, InvestmentProfile, ExpenseBucket, Milestone } from '../types';
import { InputField } from './ui/InputField';
import { Tooltip } from './ui/Tooltip';

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
  isZeroMode: boolean;
  setIsZeroMode: (v: boolean) => void;
}

export const InputSection: React.FC<InputSectionProps> = ({
  settings, setSettings,
  profile, setProfile,
  expenses, setExpenses,
  milestones, setMilestones,
  onAutoFillSIP,
  requiredSIP,
  errors,
  isZeroMode,
  setIsZeroMode
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

  // Auto-sync expense end ages with life expectancy
  useEffect(() => {
    const needsUpdate = expenses.some(e => e.endAge !== settings.lifeExpectancy);
    if (needsUpdate) {
      setExpenses(expenses.map(e => ({
        ...e,
        endAge: settings.lifeExpectancy
      })));
    }
  }, [settings.lifeExpectancy]);

  return (
    <div className="p-5 space-y-8 pb-20">

      {/* Zero Mode Toggle */}
      <div className="bg-gradient-to-r from-slate-50 to-slate-100 p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-slate-600 rounded-lg flex items-center justify-center">
            <span className="text-white text-xs font-bold">0%</span>
          </div>
          <div>
            <label className="text-sm font-bold text-slate-700 block">Zero Growth Mode</label>
            <p className="text-[10px] text-slate-500">Simulate without returns or inflation</p>
          </div>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            className="sr-only peer"
            checked={isZeroMode}
            onChange={(e) => setIsZeroMode(e.target.checked)}
          />
          <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-200 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-600 shadow-inner"></div>
        </label>
      </div>

      {/* 1. Global Assumptions */}
      <section className="space-y-4">
        <h3 className="text-base font-bold text-slate-800 border-b-2 border-slate-200 pb-3 flex items-center gap-2">
          <div className="w-1 h-5 bg-brand-600 rounded"></div>
          Scenario Configuration
        </h3>
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
            disabled={isZeroMode}
          />
        </div>
      </section>

      {/* 2. Investment Profile */}
      <section className="space-y-4">
        <h3 className="text-base font-bold text-slate-800 border-b-2 border-slate-200 pb-3 flex items-center gap-2">
          <div className="w-1 h-5 bg-emerald-600 rounded"></div>
          Assets & Savings
        </h3>
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
              disabled={isZeroMode}
            />
            <InputField
              label="SIP Step-Up %"
              value={profile.sipStepUp}
              onChange={v => handleProfileChange('sipStepUp', v)}
              disabled={isZeroMode}
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
        <div className="flex justify-between items-center border-b-2 border-slate-200 pb-3">
          <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <div className="w-1 h-5 bg-amber-600 rounded"></div>
            Monthly Expense Categories
          </h3>
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
                  disabled={isZeroMode}
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
        <div className="flex justify-between items-center border-b-2 border-slate-200 pb-3">
          <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <div className="w-1 h-5 bg-purple-600 rounded"></div>
            Life Milestones
          </h3>
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
                  disabled={isZeroMode}
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