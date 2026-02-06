import { CalculationResult, ExpenseBucket, GlobalSettings, InvestmentProfile, LedgerRow, Milestone } from "../types";

/**
 * Calculates the Future Value of a single expense bucket for a specific year.
 */
const calculateAnnualExpense = (
  bucket: ExpenseBucket,
  yearIndex: number,
  currentAge: number
): number => {
  if (currentAge > bucket.endAge) return 0;
  // FV = PMT * 12 * (1+r)^n
  const futureMonthly = bucket.currentMonthlyCost * Math.pow(1 + bucket.inflationRate / 100, yearIndex);
  return futureMonthly * 12;
};

/**
 * Generates the ledger for a specific scenario given a starting SIP.
 */
export const simulatePlan = (
  settings: GlobalSettings,
  profile: InvestmentProfile,
  expenses: ExpenseBucket[],
  milestones: Milestone[],
  overrideSIP?: number
): LedgerRow[] => {
  const ledger: LedgerRow[] = [];
  // Ensure we simulate at least the current year even if life expectancy < current age
  const yearsToSimulate = Math.max(0, settings.lifeExpectancy - settings.currentAge);

  let currentBalance = profile.currentCorpus;
  let currentSIP = overrideSIP !== undefined ? overrideSIP : profile.plannedSIP;

  for (let i = 0; i <= yearsToSimulate; i++) {
    const currentAge = settings.currentAge + i;
    const isAccumulation = currentAge < settings.retirementAge;

    // 1. Inflows (Investments)
    // Applied only if in accumulation phase.
    // Note: If currentAge == retirementAge, we assume retired at beginning of year, so no SIP this year.
    const annualSIP = isAccumulation ? currentSIP * 12 : 0;

    // 2. Outflows (Expenses)
    // Applied only if in decumulation phase (>= Retirement Age)
    let annualExpenses = 0;
    if (!isAccumulation) {
      annualExpenses = expenses.reduce((acc, bucket) => {
        return acc + calculateAnnualExpense(bucket, i, currentAge);
      }, 0);
    }

    // 3. Milestones
    // Check if any milestone falls in this year offset
    const annualMilestones = milestones.reduce((acc, ms) => {
      if (ms.yearOffset === i) {
        const cost = ms.currentCost * Math.pow(1 + ms.inflationRate / 100, i);
        return acc + cost;
      }
      return acc;
    }, 0);

    // 4. Growth (Mid-year convention)
    // Growth = (Opening + NetFlows / 2) * Rate
    const netFlows = annualSIP - annualExpenses - annualMilestones;
    const rate = isAccumulation ? profile.preRetirementROI : settings.postRetirementROI;

    // If balance goes negative mid-year, we still apply growth (debt interest) or lack of growth depending on model.
    // Here we assume debt accumulates at the same rate (simplified) or assets grow.
    // However, usually debt interest >> asset growth. keeping it simple:
    const growthBase = currentBalance + (netFlows / 2);
    const growth = growthBase * (rate / 100);

    const closingBalance = currentBalance + netFlows + growth;

    ledger.push({
      year: i,
      age: currentAge,
      openingBalance: currentBalance,
      investments: annualSIP,
      expenses: annualExpenses,
      milestones: annualMilestones,
      growth: growth,
      closingBalance: closingBalance,
      isRetirement: currentAge === settings.retirementAge
    });

    // Updates for next loop
    currentBalance = closingBalance;

    // Step up SIP for next year if still accumulating
    if (isAccumulation) {
      currentSIP = currentSIP * (1 + profile.sipStepUp / 100);
    }
  }

  return ledger;
};

/**
 * Binary search to find the SIP required to end with >= 0 balance at Life Expectancy.
 */
export const calculateScenario = (
  settings: GlobalSettings,
  profile: InvestmentProfile,
  expenses: ExpenseBucket[],
  milestones: Milestone[]
): CalculationResult => {

  // 1. Calculate Status Quo (Planned SIP)
  const userLedger = simulatePlan(settings, profile, expenses, milestones);

  // Defensive check: If ledger is empty (should be prevented by simulatePlan fix, but good practice)
  if (userLedger.length === 0) {
    return {
      ledger: [],
      requiredSIP: 0,
      requiredCorpus: 0,
      isFeasible: false,
      shortfall: 0
    };
  }

  const finalBalanceUser = userLedger[userLedger.length - 1].closingBalance;

  // 2. Solve for Required SIP
  // Range: 0 to 100 Crores/month (arbitrary high cap)
  let low = 0;
  let high = 1000000000;
  let requiredSIP = 0;
  let attempts = 0;
  let solved = false;

  // Optimization: If current plan already has surplus, check if we even need SIP
  if (finalBalanceUser >= 0) {
    // Try zero SIP first
    const zeroSIPSim = simulatePlan(settings, profile, expenses, milestones, 0);
    if (zeroSIPSim.length > 0 && zeroSIPSim[zeroSIPSim.length - 1].closingBalance >= 0) {
      requiredSIP = 0;
      solved = true;
    }
  }

  while (!solved && attempts < 100) {
    const mid = (low + high) / 2;
    const sim = simulatePlan(settings, profile, expenses, milestones, mid);

    // Safety check inside loop
    if (sim.length === 0) break;

    const finalBal = sim[sim.length - 1].closingBalance;

    // Improved tolerance: Rs 10,000 (more reasonable for large corpus values)
    if (Math.abs(finalBal) < 10000) {
      requiredSIP = mid;
      solved = true;
      break;
    }

    if (finalBal < 0) {
      low = mid;
    } else {
      high = mid;
    }
    attempts++;
  }

  if (!solved) requiredSIP = high; // Best estimate

  // 3. Determine Required Corpus
  // This is the corpus value at the start of the retirement year in the "Required" scenario
  const optimalLedger = simulatePlan(settings, profile, expenses, milestones, requiredSIP);
  const retirementRow = optimalLedger.find(r => r.age === settings.retirementAge);
  const requiredCorpus = retirementRow ? retirementRow.openingBalance : 0;

  return {
    ledger: userLedger, // We show the user's current path, but maybe we should show optimal? Usually user wants to see "If I change nothing..."
    // Spec implies "Calculate Shortfall/Surplus".
    // Let's return userLedger for visualization, but use requiredSIP for the "Hero" metric.
    requiredSIP,
    requiredCorpus,
    isFeasible: finalBalanceUser >= 0,
    shortfall: Math.max(0, requiredCorpus - (retirementRow ? userLedger.find(r => r.age === settings.retirementAge)?.openingBalance || 0 : 0))
  };
};