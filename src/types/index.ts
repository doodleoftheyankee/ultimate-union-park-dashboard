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
