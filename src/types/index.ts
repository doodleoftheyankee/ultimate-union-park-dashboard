// Sales data types
export interface SalesPerson {
  id: string;
  name: string;
  nickname: string;
  sales: number;
  buickSales: number;
  gmcSales: number;
  usedSales: number;
  totalProfit: number;
  avgProfit: number;
  deals: Deal[];
}

export interface Deal {
  id: string;
  stockNumber: string;
  vehicle: string;
  brand: 'Buick' | 'GMC' | string;
  saleDate: string;
  profit: number;
  frontGross: number;
  backGross: number;
  salesperson: string;
  isNew: boolean;
}

// Monthly goals types
export interface MonthlyGoals {
  id: string;
  month: string;
  year: number;
  buickGoal: number;
  buickCurrent: number;
  gmcGoal: number;
  gmcCurrent: number;
  usedGoal: number;
  usedCurrent: number;
  totalGrossGoal: number;
  bonusPerPerson: number;
  minVehiclesForBonus: number;
  lastUpdated: string;
}

// Spiff car types
export interface SpiffCar {
  id: string;
  stockNumber: string;
  vehicle: string;
  brand: 'Buick' | 'GMC';
  age: number;
  spiffAmount: number;
  msrp: number;
  notes?: string;
}

// Dashboard state
export interface DashboardState {
  currentPage: 'sales' | 'goals' | 'spiffs';
  isAutoRotate: boolean;
  rotateInterval: number;
  isTVMode: boolean;
  lastRefresh: string;
}

// Weekly Contest types
export interface WeeklyContestConfig {
  id: string;
  name: string;
  description: string;
  bonusAmount: number;
  metric: 'units' | 'gross' | 'frontEnd' | 'backEnd';
  isActive: boolean;
  startDate?: string;
  endDate?: string;
  winner?: string;
  createdAt: string;
}

// Monthly Archive - stores historical month data
export interface MonthlyArchive {
  id: string; // Format: "YYYY-MM"
  monthName: string; // "December 2024"
  year: number;
  month: number; // 1-12
  archivedAt: string; // ISO date string

  // Goals for the month
  goals: {
    gmcGoal: number;
    buickGoal: number;
    usedGoal: number;
    totalGrossGoal: number;
    bonusPerPerson: number;
    minVehiclesForBonus: number;
  };

  // Final results
  results: {
    gmcSold: number;
    buickSold: number;
    usedSold: number;
    totalNewUnits: number;
    totalUnits: number;
    totalProfit: number;
    totalFrontEnd: number;
    totalBackEnd: number;
    avgProfit: number;
    gmcGoalHit: boolean;
    buickGoalHit: boolean;
    usedGoalHit: boolean;
    d2eBonusUnlocked: boolean;
  };

  // Salesperson performance for the month
  salespeople: {
    name: string;
    nickname: string;
    newUnits: number;
    usedUnits: number;
    totalUnits: number;
    gmcUnits: number;
    buickUnits: number;
    totalProfit: number;
    frontEndProfit: number;
    backEndProfit: number;
    bonusEligible: boolean;
    bonusAmount: number;
  }[];

  // Optional notes
  notes?: string;
}
