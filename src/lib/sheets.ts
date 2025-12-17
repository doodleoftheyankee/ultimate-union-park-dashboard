import { getSheetsConfig } from './storage';

// Dashboard data structure matching your Google Apps Script
export interface DashboardData {
  timestamp: string;
  monthName: string;
  daysElapsed: number;
  daysRemaining: number;
  daysInMonth: number;
  percentComplete: number;
  errorMessage?: string;

  goals: {
    gmcNewGoal: number;
    buickNewGoal: number;
    usedGoal: number;
    totalGrossGoal: number;
  };

  dealership: {
    totalNewUnits: number;
    gmcSold: number;
    gmcGoal: number;
    gmcProgress: number;
    gmcRemaining: number;
    buickSold: number;
    buickGoal: number;
    buickProgress: number;
    buickRemaining: number;
    newProfit: number;
    avgNewProfit: number;
    totalUsedUnits: number;
    usedGoal: number;
    usedProgress: number;
    usedRemaining: number;
    usedProfit: number;
    avgUsedProfit: number;
    totalUnits: number;
    totalProfit: number;
    avgProfit: number;
    totalGrossGoal: number;
    bonusEligibleCount: number;
    teamSize: number;
  };

  salespeople: SalespersonMetrics[];
  recentSales: RecentSale[];

  pace: {
    gmc: PaceData;
    buick: PaceData;
    used: PaceData;
  };
}

export interface SalespersonMetrics {
  name: string;
  nickname: string;
  newUnits: number;
  usedUnits: number;
  totalUnits: number;
  gmcUnits: number;
  buickUnits: number;
  newProfit: number;
  usedProfit: number;
  totalProfit: number;
  avgNewProfit: number;
  avgUsedProfit: number;
  d2eGoal: number;
  meetsMinUnits: boolean;
  meetsD2EGoal: boolean;
  bonusEligible: boolean;
  bonusAmount: number;
  phoneCalls?: number;
  phoneGoalMet?: boolean;
  appointmentsSet?: number;
  appointmentGoalMet?: boolean;
}

export interface RecentSale {
  date: string;
  dealNumber: string;
  stockNumber: string;
  make: string;
  model: string;
  year: number;
  customerName: string;
  salesPerson: string;
  totalProfit: number;
}

export interface PaceData {
  sold: number;
  goal: number;
  needed: number;
  pacePerDay: number;
  onTrack: boolean;
}

// Fetch data from your deployed Google Apps Script web app
export async function fetchDashboardData(): Promise<DashboardData> {
  const config = getSheetsConfig();

  // If web app URL is configured, fetch from there
  if (config.webAppUrl) {
    try {
      const response = await fetch(`${config.webAppUrl}?page=api`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data as DashboardData;
    } catch (error) {
      console.error('Error fetching from web app:', error);
      // Fall back to demo data
      return getMockDashboardData('Connection error: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  }

  // Return demo data if not configured
  return getMockDashboardData('Google Sheets not configured. Go to Settings to connect.');
}

// Mock data for demonstration
function getMockDashboardData(errorMessage?: string): DashboardData {
  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysElapsed = now.getDate();

  return {
    timestamp: now.toISOString(),
    monthName: now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
    daysElapsed,
    daysRemaining: daysInMonth - daysElapsed,
    daysInMonth,
    percentComplete: daysElapsed / daysInMonth,
    errorMessage,

    goals: {
      gmcNewGoal: 21,
      buickNewGoal: 9,
      usedGoal: 20,
      totalGrossGoal: 150000,
    },

    dealership: {
      totalNewUnits: 18,
      gmcSold: 12,
      gmcGoal: 21,
      gmcProgress: 12 / 21,
      gmcRemaining: 9,
      buickSold: 6,
      buickGoal: 9,
      buickProgress: 6 / 9,
      buickRemaining: 3,
      newProfit: 42500,
      avgNewProfit: 2361,
      totalUsedUnits: 14,
      usedGoal: 20,
      usedProgress: 14 / 20,
      usedRemaining: 6,
      usedProfit: 28000,
      avgUsedProfit: 2000,
      totalUnits: 32,
      totalProfit: 70500,
      avgProfit: 2203,
      totalGrossGoal: 150000,
      bonusEligibleCount: 4,
      teamSize: 7,
    },

    salespeople: [
      { name: 'ANDREA GUIDO', nickname: 'Andrea', newUnits: 5, usedUnits: 3, totalUnits: 8, gmcUnits: 3, buickUnits: 2, newProfit: 12500, usedProfit: 6000, totalProfit: 18500, avgNewProfit: 2500, avgUsedProfit: 2000, d2eGoal: 4, meetsMinUnits: true, meetsD2EGoal: true, bonusEligible: true, bonusAmount: 375 },
      { name: 'TOM GUIDO', nickname: 'Tom', newUnits: 4, usedUnits: 3, totalUnits: 7, gmcUnits: 3, buickUnits: 1, newProfit: 9200, usedProfit: 5800, totalProfit: 15000, avgNewProfit: 2300, avgUsedProfit: 1933, d2eGoal: 4, meetsMinUnits: true, meetsD2EGoal: true, bonusEligible: true, bonusAmount: 375 },
      { name: 'JIM VANDYKE', nickname: 'Jim', newUnits: 4, usedUnits: 2, totalUnits: 6, gmcUnits: 2, buickUnits: 2, newProfit: 8800, usedProfit: 4200, totalProfit: 13000, avgNewProfit: 2200, avgUsedProfit: 2100, d2eGoal: 4, meetsMinUnits: true, meetsD2EGoal: true, bonusEligible: true, bonusAmount: 375 },
      { name: 'SAM WILLIAMS', nickname: 'Sam', newUnits: 3, usedUnits: 2, totalUnits: 5, gmcUnits: 2, buickUnits: 1, newProfit: 6900, usedProfit: 4000, totalProfit: 10900, avgNewProfit: 2300, avgUsedProfit: 2000, d2eGoal: 4, meetsMinUnits: false, meetsD2EGoal: false, bonusEligible: false, bonusAmount: 0 },
      { name: 'CHRIS MEEKS', nickname: 'Chris', newUnits: 2, usedUnits: 2, totalUnits: 4, gmcUnits: 2, buickUnits: 0, newProfit: 5100, usedProfit: 4000, totalProfit: 9100, avgNewProfit: 2550, avgUsedProfit: 2000, d2eGoal: 4, meetsMinUnits: false, meetsD2EGoal: false, bonusEligible: false, bonusAmount: 0 },
      { name: 'JAVIER AVILES', nickname: 'Javier', newUnits: 0, usedUnits: 1, totalUnits: 1, gmcUnits: 0, buickUnits: 0, newProfit: 0, usedProfit: 2000, totalProfit: 2000, avgNewProfit: 0, avgUsedProfit: 2000, d2eGoal: 4, meetsMinUnits: false, meetsD2EGoal: false, bonusEligible: false, bonusAmount: 0 },
      { name: 'ALFONSO COLON', nickname: 'Alfonso', newUnits: 0, usedUnits: 1, totalUnits: 1, gmcUnits: 0, buickUnits: 0, newProfit: 0, usedProfit: 2000, totalProfit: 2000, avgNewProfit: 0, avgUsedProfit: 2000, d2eGoal: 4, meetsMinUnits: false, meetsD2EGoal: false, bonusEligible: false, bonusAmount: 0 },
    ],

    recentSales: [
      { date: '2024-12-16', dealNumber: '157021', stockNumber: 'G25042', make: 'GMC', model: 'SIERRA 1500 DENALI', year: 2025, customerName: 'JOHNSON, MICHAEL', salesPerson: 'ANDREA GUIDO', totalProfit: 3200 },
      { date: '2024-12-15', dealNumber: '157020', stockNumber: 'B25018', make: 'Buick', model: 'ENCLAVE AVENIR', year: 2025, customerName: 'SMITH, SARAH', salesPerson: 'TOM GUIDO', totalProfit: 2800 },
      { date: '2024-12-15', dealNumber: '157019', stockNumber: 'P12345', make: 'Toyota', model: 'Camry', year: 2022, customerName: 'DAVIS, ROBERT', salesPerson: 'JIM VANDYKE', totalProfit: 2100 },
      { date: '2024-12-14', dealNumber: '157018', stockNumber: 'G25041', make: 'GMC', model: 'YUKON DENALI', year: 2025, customerName: 'WILSON, JAMES', salesPerson: 'ANDREA GUIDO', totalProfit: 4500 },
      { date: '2024-12-14', dealNumber: '157017', stockNumber: 'G25040', make: 'GMC', model: 'TERRAIN DENALI', year: 2025, customerName: 'BROWN, EMILY', salesPerson: 'SAM WILLIAMS', totalProfit: 2200 },
    ],

    pace: {
      gmc: { sold: 12, goal: 21, needed: 9, pacePerDay: 0.6, onTrack: true },
      buick: { sold: 6, goal: 9, needed: 3, pacePerDay: 0.2, onTrack: true },
      used: { sold: 14, goal: 20, needed: 6, pacePerDay: 0.4, onTrack: true },
    },
  };
}
