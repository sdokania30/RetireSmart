import React, { useMemo, useState } from 'react';
import { DEFAULT_SETTINGS, DEFAULT_PROFILE, DEFAULT_EXPENSES, DEFAULT_MILESTONES } from './constants';
import { GlobalSettings, InvestmentProfile, ExpenseBucket, Milestone } from './types';
import { calculateScenario, simulatePlan } from './services/calculator';
import { formatCurrency } from './constants';
import { InputSection } from './components/InputSection';
import { HeroSummary } from './components/HeroSummary';
import { ChartSection } from './components/ChartSection';
import { LedgerTable } from './components/LedgerTable';
import { AlertTriangle, ShieldAlert, TrendingUp, Sparkles, ChevronDown, ChevronRight } from 'lucide-react';
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
  const [isZeroSummaryOpen, setIsZeroSummaryOpen] = useState(true);
  const [isFormulaOpen, setIsFormulaOpen] = useState(true);
  const [isChartOpen, setIsChartOpen] = useState(true);
  const [isLedgerOpen, setIsLedgerOpen] = useState(true);

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
        todayShortfall: 0,
        isFeasible: false,
        isSolvable: false,
        shortfall: 0
      };
    }
    return calculateScenario(effectiveSettings, effectiveProfile, effectiveExpenses, effectiveMilestones);
  }, [effectiveSettings, effectiveProfile, effectiveExpenses, effectiveMilestones, hasCriticalErrors]);

  // Handle Auto-fill
  const handleAutoFillSIP = (amount: number) => {
    if (!result.isSolvable) return;
    setProfile({
      ...profile,
      plannedSIP: Math.round(amount)
    });
  };

  // Warning for impossible plan (Inflation > Post-Retirement ROI)
  // Disable this check in Zero Mode since both are 0
  const isImpossible = !isZeroMode && settings.inflation > settings.postRetirementROI;
  const yearsToRetirement = Math.max(0, settings.retirementAge - settings.currentAge);

  const projectionSummary = useMemo(() => {
    if (hasCriticalErrors || result.ledger.length === 0) return null;

    const shortfallLedger = simulatePlan(
      effectiveSettings,
      { ...effectiveProfile, currentCorpus: effectiveProfile.currentCorpus + result.todayShortfall },
      effectiveExpenses,
      effectiveMilestones
    );
    const retirementRow = shortfallLedger.find((row) => row.age === settings.retirementAge);
    const preRetirementRows = shortfallLedger.filter((row) => row.age < settings.retirementAge);
    const postRetirementRows = shortfallLedger.filter((row) => row.age >= settings.retirementAge);
    const currentCorpusToday = effectiveProfile.currentCorpus;
    const todayShortfallAdded = result.todayShortfall;
    const preRetirementSipInflow = preRetirementRows.reduce((sum, row) => sum + row.investments, 0);
    const preRetirementGrowthInflow = preRetirementRows.reduce((sum, row) => sum + row.growth, 0);
    const retirementExpenses = postRetirementRows.reduce((sum, row) => sum + row.expenses, 0);
    const retirementMilestones = postRetirementRows.reduce((sum, row) => sum + row.milestones, 0);
    const postRetirementOutflows = retirementExpenses + retirementMilestones;

    return {
      targetCorpusAtRetirement: retirementRow ? retirementRow.openingBalance : 0,
      currentCorpusToday,
      todayShortfallAdded,
      preRetirementSipInflow,
      preRetirementGrowthInflow,
      inflowCorpusSipGrowth: currentCorpusToday + todayShortfallAdded + preRetirementSipInflow + preRetirementGrowthInflow,
      retirementExpenses,
      retirementMilestones,
      postRetirementOutflows,
    };
  }, [
    hasCriticalErrors,
    result,
    settings.retirementAge,
    effectiveSettings,
    effectiveProfile,
    effectiveExpenses,
    effectiveMilestones
  ]);

  const projectionExpenseFormulaRows = useMemo(() => {
    if (hasCriticalErrors) return [];

    return effectiveExpenses
      .map((bucket) => {
        const durationYears = Math.max(
          0,
          Math.min(bucket.endAge, settings.lifeExpectancy) - settings.retirementAge + 1
        );

        const startIndex = Math.max(0, settings.retirementAge - settings.currentAge);
        const endIndex = Math.max(0, Math.min(bucket.endAge, settings.lifeExpectancy) - settings.currentAge);

        let total = 0;
        for (let i = startIndex; i <= endIndex; i++) {
          total += bucket.currentMonthlyCost * Math.pow(1 + bucket.inflationRate / 100, i) * 12;
        }

        return {
          category: bucket.name,
          monthly: bucket.currentMonthlyCost,
          years: durationYears,
          inflationRate: bucket.inflationRate,
          total,
        };
      })
      .filter((row) => row.years > 0 && row.monthly > 0);
  }, [hasCriticalErrors, settings.retirementAge, settings.lifeExpectancy, settings.currentAge, effectiveExpenses]);

  const projectionMilestoneFormulaRows = useMemo(() => {
    if (hasCriticalErrors) return [];

    return effectiveMilestones
      .map((ms) => ({
        name: ms.name,
        yearsFromNow: ms.yearOffset,
        age: settings.currentAge + ms.yearOffset,
        inflationRate: ms.inflationRate,
        amount: ms.currentCost * Math.pow(1 + ms.inflationRate / 100, ms.yearOffset),
      }))
      .filter((ms) => ms.yearsFromNow >= 0 && ms.age <= settings.lifeExpectancy && ms.amount > 0)
      .sort((a, b) => a.age - b.age);
  }, [hasCriticalErrors, effectiveMilestones, settings.currentAge, settings.lifeExpectancy]);

  return (
    <div className="min-h-screen bg-slate-100 relative overflow-x-hidden">
      <div className="pointer-events-none absolute -top-24 -left-24 h-80 w-80 rounded-full bg-brand-100 blur-3xl opacity-80" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-96 w-96 rounded-full bg-emerald-100 blur-3xl opacity-70" />

      <div className="relative z-10 min-h-screen xl:h-screen p-3 md:p-5">
        <div className="min-h-full xl:h-full flex flex-col xl:flex-row gap-4">
          <aside className="flex flex-col xl:min-h-0 xl:w-[420px] xl:min-w-[340px] xl:max-w-[620px] xl:resize-x rounded-2xl border border-white/70 bg-white/90 backdrop-blur shadow-panel overflow-visible xl:overflow-hidden">
            <div className="p-5 border-b border-slate-200/80 bg-white/95 sticky top-0 z-20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-600 to-brand-700 text-white grid place-items-center">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div>
                    <h1 className="text-xl font-display font-bold tracking-tight text-slate-900">RetireSmart</h1>
                    <p className="text-[11px] text-slate-500">Retirement Scenario Workspace</p>
                  </div>
                </div>
                <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-2 py-1 rounded-md">v1.3</span>
              </div>
            </div>
            <div className="xl:flex-1 xl:overflow-y-auto">
              <InputSection
                settings={settings} setSettings={setSettings}
                profile={profile} setProfile={setProfile}
                expenses={expenses} setExpenses={setExpenses}
                milestones={milestones} setMilestones={setMilestones}
                onAutoFillSIP={handleAutoFillSIP}
                requiredSIP={result.requiredSIP}
                yearsToRetirement={yearsToRetirement}
                isSolvable={result.isSolvable}
                errors={validationErrors}
                isZeroMode={isZeroMode}
                setIsZeroMode={setIsZeroMode}
              />
            </div>
          </aside>

          <main className="flex-1 xl:min-h-0 rounded-2xl border border-white/70 bg-white/85 backdrop-blur shadow-panel overflow-visible xl:overflow-hidden flex flex-col">
            <div className="p-5 md:p-6 border-b border-slate-200/70 bg-white/95">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-2 text-slate-500">
                  <Sparkles className="w-4 h-4 text-brand-600" />
                  <span className="text-xs uppercase tracking-[0.16em] font-semibold">Smart Projection Dashboard</span>
                </div>
                <span className="text-xs text-slate-500">Plan horizon: Age {settings.currentAge} to {settings.lifeExpectancy}</span>
              </div>
              <HeroSummary
                result={result}
              />
            </div>

            <div className="p-5 md:p-6 pt-5 space-y-4 xl:flex-1 xl:overflow-y-auto">
              {hasCriticalErrors && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 text-red-900 shadow-sm">
                  <ShieldAlert className="shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-sm">Input Errors Detected</h4>
                    <p className="text-xs mt-1">
                      Please fix highlighted fields in the input panel to continue calculations.
                    </p>
                    <ul className="list-disc list-inside text-[11px] mt-1 opacity-80">
                      {Object.values(validationErrors).slice(0, 3).map((err, i) => (
                        <li key={i}>{err}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {isImpossible && !hasCriticalErrors && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3 text-amber-900 shadow-sm">
                  <AlertTriangle className="shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-sm">Negative Real Return Assumption</h4>
                    <p className="text-xs mt-1">
                      Post-retirement ROI ({settings.postRetirementROI}%) is below inflation ({settings.inflation}%).
                      Purchasing power declines year over year.
                    </p>
                  </div>
                </div>
              )}

              {isZeroMode && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-3 text-blue-900 shadow-sm">
                  <AlertTriangle className="shrink-0 mt-0.5 w-4 h-4" />
                  <div>
                    <h4 className="font-bold text-xs">Zero Growth Simulation Active</h4>
                    <p className="text-[11px] mt-1">
                      Investments and inflation are set to 0%, so results show raw money requirements in today&apos;s terms.
                    </p>
                  </div>
                </div>
              )}

              {projectionSummary && (
                <section className="bg-white rounded-xl border border-blue-100 shadow-sm overflow-hidden">
                  <div className="px-4 py-3 border-b border-blue-100 bg-blue-50/70 flex items-center justify-between gap-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-blue-900">
                      {isZeroMode ? 'Zero Growth Breakdown' : 'Projection Breakdown'}
                    </h4>
                    <button
                      onClick={() => setIsZeroSummaryOpen((v) => !v)}
                      className="text-blue-700 hover:text-blue-900 p-1 rounded"
                      aria-label="Toggle Zero Growth Breakdown"
                    >
                      {isZeroSummaryOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </button>
                  </div>
                  {isZeroSummaryOpen && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <tbody className="divide-y divide-slate-100">
                          <tr>
                            <td className="px-4 py-2 text-slate-600">Target Corpus (Start of Retirement)</td>
                            <td className="px-4 py-2 text-right font-semibold text-blue-900">{formatCurrency(projectionSummary.targetCorpusAtRetirement)}</td>
                          </tr>
                          <tr>
                            <td className="px-4 py-2 text-slate-600">Inflow (Corpus + SIP, Growth Adjusted)</td>
                            <td className="px-4 py-2 text-right font-semibold text-emerald-700">{formatCurrency(projectionSummary.inflowCorpusSipGrowth)}</td>
                          </tr>
                          <tr className="bg-slate-50/60">
                            <td className="px-6 py-2 text-slate-500 text-xs">Current Corpus (Today)</td>
                            <td className="px-4 py-2 text-right text-xs font-medium text-slate-700">{formatCurrency(projectionSummary.currentCorpusToday)}</td>
                          </tr>
                          <tr className="bg-slate-50/60">
                            <td className="px-6 py-2 text-slate-500 text-xs">One-time Shortfall Added Today</td>
                            <td className="px-4 py-2 text-right text-xs font-medium text-slate-700">{formatCurrency(projectionSummary.todayShortfallAdded)}</td>
                          </tr>
                          <tr className="bg-slate-50/60">
                            <td className="px-6 py-2 text-slate-500 text-xs">SIP Contributions (till retirement)</td>
                            <td className="px-4 py-2 text-right text-xs font-medium text-slate-700">{formatCurrency(projectionSummary.preRetirementSipInflow)}</td>
                          </tr>
                          <tr className="bg-slate-50/60">
                            <td className="px-6 py-2 text-slate-500 text-xs">Pre-Retirement Growth</td>
                            <td className="px-4 py-2 text-right text-xs font-medium text-slate-700">{formatCurrency(projectionSummary.preRetirementGrowthInflow)}</td>
                          </tr>
                          <tr>
                            <td className="px-4 py-2 text-slate-600">Expense (Inflation Adjusted)</td>
                            <td className="px-4 py-2 text-right font-semibold text-slate-900">{formatCurrency(projectionSummary.postRetirementOutflows)}</td>
                          </tr>
                          <tr className="bg-slate-50/60">
                            <td className="px-6 py-2 text-slate-500 text-xs">Retirement Expenses (Inflation Adjusted)</td>
                            <td className="px-4 py-2 text-right text-xs font-medium text-slate-700">{formatCurrency(projectionSummary.retirementExpenses)}</td>
                          </tr>
                          <tr className="bg-slate-50/60">
                            <td className="px-6 py-2 text-slate-500 text-xs">Retirement Milestones (Inflation Adjusted)</td>
                            <td className="px-4 py-2 text-right text-xs font-medium text-slate-700">{formatCurrency(projectionSummary.retirementMilestones)}</td>
                          </tr>
                        </tbody>
                      </table>
                      <div className="px-4 py-2 border-t border-slate-100 text-[11px] text-slate-500">
                        Inflow = Current Corpus + One-time Shortfall + SIP Contributions + Pre-Retirement Growth. Expense = Retirement Expenses + Retirement Milestones.
                      </div>
                    </div>
                  )}
                </section>
              )}

              {projectionSummary && (
                <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between gap-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Formula Breakdown</h4>
                    <button
                      onClick={() => setIsFormulaOpen((v) => !v)}
                      className="text-slate-600 hover:text-slate-900 p-1 rounded"
                      aria-label="Toggle Formula Breakdown"
                    >
                      {isFormulaOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </button>
                  </div>
                  {isFormulaOpen && (
                    <div className="p-4 space-y-5">
                    <div className="rounded-lg border border-slate-200 overflow-hidden">
                      <div className="px-3 py-2 bg-slate-50 border-b border-slate-200">
                        <h5 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Monthly Expense Categories</h5>
                      </div>
                      <div className="divide-y divide-slate-100">
                        {projectionExpenseFormulaRows.map((row, idx) => (
                          <div key={`exp-formula-${idx}`} className="px-3 py-2.5 flex items-start justify-between gap-4">
                            <div className="min-w-0">
                              <div className="text-sm font-medium text-slate-800">{idx + 1}. {row.category}</div>
                              <div className="text-xs text-slate-500 font-mono">
                                {formatCurrency(row.monthly)} PM {isZeroMode ? `x ${row.years} YR` : `@ ${row.inflationRate}% x ${row.years} YR`}
                              </div>
                            </div>
                            <div className="text-sm font-semibold text-slate-900 whitespace-nowrap">
                              {formatCurrency(row.total)}
                            </div>
                          </div>
                        ))}
                        {projectionExpenseFormulaRows.length === 0 && (
                          <div className="px-3 py-3 text-sm text-slate-500">No monthly categories contribute in retirement years.</div>
                        )}
                      </div>
                      <div className="px-3 py-2.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-sm">
                        <span className="font-semibold text-slate-600">Total {isZeroMode ? 'Raw' : 'Projected'} Expenses</span>
                        <span className="font-semibold text-slate-900">
                          {formatCurrency(projectionExpenseFormulaRows.reduce((sum, row) => sum + row.total, 0))}
                        </span>
                      </div>
                    </div>

                    <div className="rounded-lg border border-slate-200 overflow-hidden">
                      <div className="px-3 py-2 bg-slate-50 border-b border-slate-200">
                        <h5 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Life Milestones</h5>
                      </div>
                      <div className="divide-y divide-slate-100">
                        {projectionMilestoneFormulaRows.map((row, idx) => (
                          <div key={`ms-formula-${idx}`} className="px-3 py-2.5 flex items-start justify-between gap-4">
                            <div className="min-w-0">
                              <div className="text-sm font-medium text-slate-800">{row.name}</div>
                              <div className="text-xs text-slate-500 font-mono">
                                @ {row.yearsFromNow} YRS (Age {row.age}){!isZeroMode ? ` @ ${row.inflationRate}%` : ''}
                              </div>
                            </div>
                            <div className="text-sm font-semibold text-slate-900 whitespace-nowrap">
                              {formatCurrency(row.amount)}
                            </div>
                          </div>
                        ))}
                        {projectionMilestoneFormulaRows.length === 0 && (
                          <div className="px-3 py-3 text-sm text-slate-500">No milestones configured in the planning range.</div>
                        )}
                      </div>
                      <div className="px-3 py-2.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-sm">
                        <span className="font-semibold text-slate-600">Total Milestones</span>
                        <span className="font-semibold text-slate-900">
                          {formatCurrency(projectionMilestoneFormulaRows.reduce((sum, row) => sum + row.amount, 0))}
                        </span>
                      </div>
                    </div>

                    <div className="rounded-lg border border-blue-200 bg-blue-50/70 px-3 py-2.5 flex items-center justify-between text-sm">
                      <span className="font-semibold text-blue-900">Grand Total (Expenses + Milestones)</span>
                      <span className="font-bold text-blue-900">
                        {formatCurrency(
                          projectionExpenseFormulaRows.reduce((sum, row) => sum + row.total, 0) +
                          projectionMilestoneFormulaRows.reduce((sum, row) => sum + row.amount, 0)
                        )}
                      </span>
                    </div>
                    </div>
                  )}
                </section>
              )}

              {!hasCriticalErrors && (
                <>
                  <ChartSection
                    data={result.ledger}
                    settings={effectiveSettings}
                    isCollapsed={!isChartOpen}
                    onToggle={() => setIsChartOpen((v) => !v)}
                  />
                  <LedgerTable
                    data={result.ledger}
                    isCollapsed={!isLedgerOpen}
                    onToggle={() => setIsLedgerOpen((v) => !v)}
                  />
                </>
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default App;
