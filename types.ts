export interface GlobalSettings {
  currentAge: number;
  retirementAge: number;
  lifeExpectancy: number;
  postRetirementROI: number; // Percentage
  inflation: number; // Base inflation for safety/defaults
}

export interface InvestmentProfile {
  currentCorpus: number;
  preRetirementROI: number; // Percentage
  plannedSIP: number;
  sipStepUp: number; // Percentage
}

export interface ExpenseBucket {
  id: string;
  name: string;
  currentMonthlyCost: number;
  inflationRate: number; // Percentage
  endAge: number;
}

export interface Milestone {
  id: string;
  name: string;
  currentCost: number;
  inflationRate: number; // Percentage
  yearOffset: number;
}

export interface LedgerRow {
  year: number;
  age: number;
  openingBalance: number;
  investments: number;
  expenses: number;
  milestones: number;
  growth: number;
  closingBalance: number;
  isRetirement: boolean;
}

export interface CalculationResult {
  ledger: LedgerRow[];
  requiredSIP: number;
  requiredCorpus: number; // Corpus needed at retirement
  todayShortfall: number; // Lumpsum needed today with current SIP plan
  isFeasible: boolean;
  isSolvable: boolean; // Whether required SIP is achievable within caps
  shortfall: number;
}
