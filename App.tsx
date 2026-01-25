import React, { useState, useMemo } from 'react';
import { DEFAULT_SETTINGS, DEFAULT_PROFILE, DEFAULT_EXPENSES, DEFAULT_MILESTONES } from './constants';
import { GlobalSettings, InvestmentProfile, ExpenseBucket, Milestone } from './types';
import { calculateScenario } from './services/calculator';
import { InputSection } from './components/InputSection';
import { HeroSummary } from './components/HeroSummary';
import { ChartSection } from './components/ChartSection';
import { LedgerTable } from './components/LedgerTable';
import { AlertTriangle, ShieldAlert, TrendingUp } from 'lucide-react';

const App: React.FC = () => {
  // State
  const [settings, setSettings] = useState<GlobalSettings>(DEFAULT_SETTINGS);
  const [profile, setProfile] = useState<InvestmentProfile>(DEFAULT_PROFILE);
  const [expenses, setExpenses] = useState<ExpenseBucket[]>(DEFAULT_EXPENSES);
  const [milestones, setMilestones] = useState<Milestone[]>(DEFAULT_MILESTONES);

  // Validation
  const validationErrors = useMemo(() => {
    const errors: Record<string, string> = {};
    
    // Global Age Check
    if (settings.currentAge < 18 || settings.currentAge > 100) {
      errors.currentAge = "Age must be between 18 and 100";
    }
    if (settings.retirementAge <= settings.currentAge) {
      errors.retirementAge = "Must be greater than Current Age";
    }
    if (settings.lifeExpectancy <= settings.retirementAge) {
      errors.lifeExpectancy = "Must be greater than Retirement Age";
    }
    if (settings.postRetirementROI < 0 || settings.postRetirementROI > 30) {
      errors.postRetirementROI = "Realistic ROI is 0-30%";
    }

    // Expense Logic
    // Rule: Life Expectancy should be the max END AGE for all Expense Bucket.
    // If Life Expectancy is lower than any expense end age, flag error on Life Expectancy or the Expense?
    // User requirement: "Life Expectancy should be the max END AGE for all Expense Bucket"
    // We enforce: Life Expectancy >= all Expense End Ages.
    
    let maxExpenseAge = 0;

    expenses.forEach(e => {
      if (e.endAge > maxExpenseAge) maxExpenseAge = e.endAge;
      
      if (e.endAge > settings.lifeExpectancy) {
        errors[`exp_end_${e.id}`] = `Exceeds Life Expectancy (${settings.lifeExpectancy})`;
      }
      if (e.currentMonthlyCost < 0) {
        errors[`exp_cost_${e.id}`] = "Must be positive";
      }
    });

    if (maxExpenseAge > settings.lifeExpectancy) {
        errors.lifeExpectancy = `Must cover all expenses (max: ${maxExpenseAge})`;
    }

    // Milestone Logic
    milestones.forEach(m => {
      if (settings.currentAge + m.yearOffset > settings.lifeExpectancy) {
        errors[`ms_year_${m.id}`] = "Exceeds Life Expectancy";
      }
      if (m.currentCost < 0) {
        errors[`ms_cost_${m.id}`] = "Must be positive";
      }
    });

    return errors;
  }, [settings, expenses, milestones]);

  const hasCriticalErrors = Object.keys(validationErrors).some(k => 
    ['currentAge', 'retirementAge', 'lifeExpectancy', 'postRetirementROI'].includes(k)
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
    return calculateScenario(settings, profile, expenses, milestones);
  }, [settings, profile, expenses, milestones, hasCriticalErrors]);

  // Handle Auto-fill
  const handleAutoFillSIP = (amount: number) => {
    setProfile(prev => ({
      ...prev,
      plannedSIP: Math.round(amount)
    }));
  };

  // Warning for impossible plan (Inflation > Post-Retirement ROI)
  const isImpossible = settings.inflation > settings.postRetirementROI;

  return (
    <div className="flex flex-col lg:flex-row h-screen overflow-hidden bg-slate-100 font-sans">
      
      {/* Left Panel: Inputs */}
      <div className="w-full lg:w-4/12 xl:w-3/12 h-full overflow-y-auto bg-white border-r shadow-lg z-20">
        <div className="p-5 border-b sticky top-0 bg-white z-10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-brand-600" />
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">RetireSmart</h1>
          </div>
          <span className="text-[10px] font-mono bg-slate-100 text-slate-500 px-2 py-1 rounded">v1.2</span>
        </div>
        <InputSection 
          settings={settings} setSettings={setSettings}
          profile={profile} setProfile={setProfile}
          expenses={expenses} setExpenses={setExpenses}
          milestones={milestones} setMilestones={setMilestones}
          onAutoFillSIP={handleAutoFillSIP}
          requiredSIP={result.requiredSIP}
          errors={validationErrors}
        />
      </div>

      {/* Right Panel: Visualization */}
      <div className="w-full lg:w-8/12 xl:w-9/12 h-full overflow-y-auto relative flex flex-col">
        
        {/* Sticky Hero */}
        <HeroSummary result={result} plannedSIP={profile.plannedSIP} />

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
        </div>

        {/* Content */}
        {!hasCriticalErrors && (
          <div className="flex-1 pb-20">
            <ChartSection data={result.ledger} settings={settings} />
            <LedgerTable data={result.ledger} />
          </div>
        )}
      </div>
    </div>
  );
};

export default App;