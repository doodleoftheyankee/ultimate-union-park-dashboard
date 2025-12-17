import { MonthlyGoals, SpiffCar } from '@/types';

const GOALS_KEY = 'union-park-goals';
const SPIFFS_KEY = 'union-park-spiffs';
const SHEETS_CONFIG_KEY = 'union-park-sheets-config';

// Default goals data
const defaultGoals: MonthlyGoals = {
  id: '1',
  month: new Date().toLocaleString('default', { month: 'long' }),
  year: new Date().getFullYear(),
  buickGoal: 9,
  buickCurrent: 0,
  gmcGoal: 21,
  gmcCurrent: 0,
  usedGoal: 20,
  usedCurrent: 0,
  bonusPerPerson: 375,
  minVehiclesForBonus: 4,
  lastUpdated: new Date().toISOString(),
};

// Default spiff cars
const defaultSpiffs: SpiffCar[] = [
  {
    id: '1',
    stockNumber: 'G25001',
    vehicle: '2024 GMC Sierra 1500 Denali',
    brand: 'GMC',
    age: 120,
    spiffAmount: 500,
    msrp: 68500,
    notes: 'Fully loaded, leather interior',
  },
  {
    id: '2',
    stockNumber: 'B25002',
    vehicle: '2024 Buick Enclave Avenir',
    brand: 'Buick',
    age: 95,
    spiffAmount: 400,
    msrp: 58900,
    notes: 'Premium package included',
  },
  {
    id: '3',
    stockNumber: 'G25003',
    vehicle: '2024 GMC Yukon AT4',
    brand: 'GMC',
    age: 88,
    spiffAmount: 350,
    msrp: 72500,
  },
  {
    id: '4',
    stockNumber: 'B25004',
    vehicle: '2024 Buick Envista Sport Touring',
    brand: 'Buick',
    age: 75,
    spiffAmount: 250,
    msrp: 28400,
  },
];

// Goals storage functions
export function getGoals(): MonthlyGoals {
  if (typeof window === 'undefined') return defaultGoals;

  const stored = localStorage.getItem(GOALS_KEY);
  if (!stored) {
    saveGoals(defaultGoals);
    return defaultGoals;
  }

  try {
    const parsed = JSON.parse(stored);
    // Merge with defaults to ensure all fields exist
    return {
      ...defaultGoals,
      ...parsed,
      // Ensure these fields are always numbers
      gmcGoal: Number(parsed.gmcGoal) || defaultGoals.gmcGoal,
      buickGoal: Number(parsed.buickGoal) || defaultGoals.buickGoal,
      usedGoal: Number(parsed.usedGoal) || defaultGoals.usedGoal,
      bonusPerPerson: Number(parsed.bonusPerPerson) || defaultGoals.bonusPerPerson,
      minVehiclesForBonus: Number(parsed.minVehiclesForBonus) || defaultGoals.minVehiclesForBonus,
    };
  } catch {
    return defaultGoals;
  }
}

export function saveGoals(goals: MonthlyGoals): void {
  if (typeof window === 'undefined') return;

  goals.lastUpdated = new Date().toISOString();
  localStorage.setItem(GOALS_KEY, JSON.stringify(goals));
}

// Spiffs storage functions
export function getSpiffs(): SpiffCar[] {
  if (typeof window === 'undefined') return defaultSpiffs;

  const stored = localStorage.getItem(SPIFFS_KEY);
  if (!stored) {
    saveSpiffs(defaultSpiffs);
    return defaultSpiffs;
  }

  try {
    return JSON.parse(stored);
  } catch {
    return defaultSpiffs;
  }
}

export function saveSpiffs(spiffs: SpiffCar[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SPIFFS_KEY, JSON.stringify(spiffs));
}

// Sheets config storage
export interface SheetsConfig {
  webAppUrl: string;
  refreshInterval: number; // in seconds
}

const defaultSheetsConfig: SheetsConfig = {
  webAppUrl: '',
  refreshInterval: 60,
};

export function getSheetsConfig(): SheetsConfig {
  if (typeof window === 'undefined') return defaultSheetsConfig;

  const stored = localStorage.getItem(SHEETS_CONFIG_KEY);
  if (!stored) return defaultSheetsConfig;

  try {
    return { ...defaultSheetsConfig, ...JSON.parse(stored) };
  } catch {
    return defaultSheetsConfig;
  }
}

export function saveSheetsConfig(config: SheetsConfig): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SHEETS_CONFIG_KEY, JSON.stringify(config));
}
