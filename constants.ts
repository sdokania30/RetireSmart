import { ExpenseBucket, GlobalSettings, InvestmentProfile, Milestone } from "./types";

export const DEFAULT_SETTINGS: GlobalSettings = {
  currentAge: 41,
  retirementAge: 42,
  lifeExpectancy: 75,
  postRetirementROI: 8.0,
  inflation: 6.0,
};

export const DEFAULT_PROFILE: InvestmentProfile = {
  currentCorpus: 20000000, // 2 Crores
  preRetirementROI: 8.0,
  plannedSIP: 150000, // 1.5 Lakhs
  sipStepUp: 1.0,
};

export const DEFAULT_EXPENSES: ExpenseBucket[] = [
  {
    id: '1',
    name: 'Living Expenses',
    currentMonthlyCost: 150000, // 1.5 Lakhs
    inflationRate: 6.0,
    endAge: 75,
  },
  {
    id: '2',
    name: 'HealthCare',
    currentMonthlyCost: 25000, // 0.25 Lakhs
    inflationRate: 10.0,
    endAge: 55,
  },
  {
    id: '3',
    name: 'Education (Monthly)',
    currentMonthlyCost: 50000, // 0.50 Lakhs
    inflationRate: 8.0,
    endAge: 52, 
  }
];

export const DEFAULT_MILESTONES: Milestone[] = [
  {
    id: 'm1',
    name: "Child 1 Higher Education",
    currentCost: 2000000, // 20 Lakhs
    inflationRate: 8.0,
    yearOffset: 5,
  },
  {
    id: 'm2',
    name: "Child 2 Higher Education",
    currentCost: 2000000, // 20 Lakhs
    inflationRate: 8.0,
    yearOffset: 8,
  },
  {
    id: 'm3',
    name: "Child 1 Wedding",
    currentCost: 2500000, // 25 Lakhs
    inflationRate: 7.0,
    yearOffset: 12,
  },
  {
    id: 'm4',
    name: "Child 2 Wedding",
    currentCost: 2500000, // 25 Lakhs
    inflationRate: 7.0,
    yearOffset: 15,
  }
];

export const formatCurrency = (amount: number): string => {
  if (amount === 0) return '₹ 0';
  const absAmount = Math.abs(amount);
  let val = '';
  
  // Indian Numbering System
  if (absAmount >= 10000000) {
    val = `${(absAmount / 10000000).toFixed(2)} Cr`;
  } else if (absAmount >= 100000) {
    val = `${(absAmount / 100000).toFixed(2)} L`;
  } else if (absAmount >= 1000) {
    val = `${(absAmount / 1000).toFixed(1)} k`;
  } else {
    val = absAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 });
  }
  
  return (amount < 0 ? '-' : '') + '₹ ' + val;
};

// Alias for chart usage where compact is preferred
export const formatCompact = formatCurrency;