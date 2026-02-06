import React, { useMemo, useState } from 'react';
import { DEFAULT_SETTINGS, DEFAULT_PROFILE, DEFAULT_EXPENSES, DEFAULT_MILESTONES } from './constants';
import { GlobalSettings, InvestmentProfile, ExpenseBucket, Milestone } from './types';
import { calculateScenario } from './services/calculator';
import { InputSection } from './components/InputSection';
import { HeroSummary } from './components/HeroSummary';
import { ChartSection } from './components/ChartSection';
import { LedgerTable } from './components/LedgerTable';
import { AlertTriangle, ShieldAlert, TrendingUp } from 'lucide-react';
import { usePersistentState } from './hooks/usePersistentState';
import { useScenarioValidation } from './hooks/useScenarioValidation';

const App: React.FC = () => {
  // State (Persistent)
  const [settings, setSettings] = usePersistentState<GlobalSettings>('rs_settings', DEFAULT_SETTINGS);
  const [profile, setProfile] = usePersistentState<InvestmentProfile>('rs_profile', DEFAULT_PROFILE);
  const [expenses, setExpenses] = usePersistentState<ExpenseBucket[]>('rs_expenses', DEFAULT_EXPENSES);
  const [milestones, setMilestones] = usePersistentState<Milestone[]>('rs_milestones', DEFAULT_MILESTONES);

  // UI State (Ephemeral)
  const [isZeroMode, setIsZeroMode] = useState(false);

  // Derived State for Zero Mode
  const effectiveSettings = useMemo(() => isZeroMode ? {
    ...settings,
    postRetirementROI: 0,
    inflation: 0
  } : settings, [settings, isZeroMode]);

  const effectiveProfile = useMemo(() => isZeroMode ? {
    ...profile,
    preRetirementROI: 0,
    sipStepUp: 0
  } : profile, [profile, isZeroMode]);

  const effectiveExpenses = useMemo(() => isZeroMode ? expenses.map(e => ({
    ...e,
    inflationRate: 0
  })) : expenses, [expenses, isZeroMode]);

  const effectiveMilestones = useMemo(() => isZeroMode ? milestones.map(m => ({
    ...m,
    inflationRate: 0
  })) : milestones, [milestones, isZeroMode]);

  // Validation
  const { errors: validationErrors, hasCriticalErrors } = useScenarioValidation(
    effectiveSettings,
    effectiveExpenses,
    effectiveMilestones,
    isZeroMode
  );

  // Calculation (Memoized for performance)
  const result = useMemo(() => {
    // Prevent calculation crashes if critical inputs are invalid
    if (hasCriticalErrors) {
      return {
        ledger: [],
        requiredSIP: 0,
        requiredCorpus: 0,
        isFeasible: false,
        shortfall: 0
      };
    }
    return calculateScenario(effectiveSettings, effectiveProfile, effectiveExpenses, effectiveMilestones);
  }, [effectiveSettings, effectiveProfile, effectiveExpenses, effectiveMilestones, hasCriticalErrors]);

  // Handle Auto-fill
  const handleAutoFillSIP = (amount: number) => {
    setProfile({
      ...profile,
      plannedSIP: Math.round(amount)
    });
  };

  // Warning for impossible plan (Inflation > Post-Retirement ROI)
  // Disable this check in Zero Mode since both are 0
  const isImpossible = !isZeroMode && settings.inflation > settings.postRetirementROI;

  return (
    <div className="flex flex-col lg:flex-row h-screen overflow-hidden bg-slate-100 font-sans">

      {/* Left Panel: Inputs */}
      <div className="w-full lg:w-5/12 xl:w-2/5 h-full overflow-y-auto bg-white border-r shadow-lg z-20">
        <div className="p-5 border-b sticky top-0 bg-white z-10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-brand-600" />
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">RetireSmart</h1>
          </div>
          <span className="text-[10px] font-mono bg-slate-100 text-slate-500 px-2 py-1 rounded">v1.3</span>
        </div>
        <InputSection
          settings={settings} setSettings={setSettings}
          profile={profile} setProfile={setProfile}
          expenses={expenses} setExpenses={setExpenses}
          milestones={milestones} setMilestones={setMilestones}
          onAutoFillSIP={handleAutoFillSIP}
          requiredSIP={result.requiredSIP}
          errors={validationErrors}
          isZeroMode={isZeroMode}
          setIsZeroMode={setIsZeroMode}
        />
      </div>

      {/* Right Panel: Visualization */}
      <div className="w-full lg:w-7/12 xl:w-3/5 h-full overflow-y-auto relative flex flex-col">

        {/* Sticky Hero */}
        <HeroSummary result={result} plannedSIP={effectiveProfile.plannedSIP} />

        {/* Warnings */}
        <div className="space-y-2 p-5 pb-0">
          {hasCriticalErrors && (
            <div className="p-4 bg-red-100 border border-red-300 rounded-lg flex items-start gap-3 text-red-900 shadow-sm">
              <ShieldAlert className="shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-sm">Input Errors Detected</h4>
                <p className="text-xs mt-1">
                  Please fix the highlighted errors in the input panel to proceed with the calculation.
                </p>
                <ul className="list-disc list-inside text-[10px] mt-1 opacity-80">
                  {Object.values(validationErrors).slice(0, 3).map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {isImpossible && !hasCriticalErrors && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3 text-amber-800 shadow-sm">
              <AlertTriangle className="shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-sm">Negative Real Return Detected</h4>
                <p className="text-xs mt-1">
                  Your post-retirement return ({settings.postRetirementROI}%) is lower than inflation ({settings.inflation}% implicit).
                  Your money is losing purchasing power every year.
                </p>
              </div>
            </div>
          )}

          {isZeroMode && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-3 text-blue-900 shadow-sm">
              <AlertTriangle className="shrink-0 mt-0.5 w-4 h-4" />
              <div>
                <h4 className="font-bold text-xs">Zero Growth Simulation Active</h4>
                <p className="text-[10px] mt-1">
                  You are viewing a "Raw" scenario where all investments grow at 0% and expenses do not inflate.
                  This shows the absolute sum of money needed in today's terms without any market forces.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        {!hasCriticalErrors && (
          <div className="flex-1 pb-20">
            <ChartSection data={result.ledger} settings={effectiveSettings} />
            <LedgerTable data={result.ledger} />
          </div>
        )}
      </div>
    </div>
  );
};

export default App;