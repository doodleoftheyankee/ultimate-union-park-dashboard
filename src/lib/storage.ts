import { MonthlyGoals, SpiffCar, WeeklyContestConfig, MonthlyArchive } from '@/types';

const GOALS_KEY = 'union-park-goals';
const SPIFFS_KEY = 'union-park-spiffs';
const SHEETS_CONFIG_KEY = 'union-park-sheets-config';
const INDIVIDUAL_GOALS_KEY = 'union-park-individual-goals';
const CONTESTS_KEY = 'union-park-contests';
const CELEBRATED_GOALS_KEY = 'union-park-celebrated-goals';
const ARCHIVE_KEY = 'union-park-monthly-archive';

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
  totalGrossGoal: 150000,
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
      totalGrossGoal: Number(parsed.totalGrossGoal) || defaultGoals.totalGrossGoal,
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

// Individual salesperson goals
export interface IndividualGoal {
  name: string;
  targetUnits: number;
  targetProfit: number;
  lastUpdated: string;
}

export function getIndividualGoals(): Record<string, IndividualGoal> {
  if (typeof window === 'undefined') return {};

  const stored = localStorage.getItem(INDIVIDUAL_GOALS_KEY);
  if (!stored) return {};

  try {
    return JSON.parse(stored);
  } catch {
    return {};
  }
}

export function saveIndividualGoal(name: string, goal: Partial<IndividualGoal>): void {
  if (typeof window === 'undefined') return;

  const goals = getIndividualGoals();
  goals[name] = {
    name,
    targetUnits: goal.targetUnits || 8,
    targetProfit: goal.targetProfit || 15000,
    lastUpdated: new Date().toISOString(),
  };
  localStorage.setItem(INDIVIDUAL_GOALS_KEY, JSON.stringify(goals));
}

export function getIndividualGoal(name: string): IndividualGoal | null {
  const goals = getIndividualGoals();
  return goals[name] || null;
}

// Contest storage functions
const defaultContests: WeeklyContestConfig[] = [
  {
    id: '1',
    name: 'Weekly Unit Leader',
    description: 'Most units sold this week wins!',
    bonusAmount: 250,
    metric: 'units',
    isActive: true,
    createdAt: new Date().toISOString(),
  },
];

export function getContests(): WeeklyContestConfig[] {
  if (typeof window === 'undefined') return defaultContests;

  const stored = localStorage.getItem(CONTESTS_KEY);
  if (!stored) {
    saveContests(defaultContests);
    return defaultContests;
  }

  try {
    return JSON.parse(stored);
  } catch {
    return defaultContests;
  }
}

export function saveContests(contests: WeeklyContestConfig[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(CONTESTS_KEY, JSON.stringify(contests));
}

export function addContest(contest: Omit<WeeklyContestConfig, 'id' | 'createdAt'>): WeeklyContestConfig {
  const newContest: WeeklyContestConfig = {
    ...contest,
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
  };
  const contests = getContests();
  contests.push(newContest);
  saveContests(contests);
  return newContest;
}

export function updateContest(id: string, updates: Partial<WeeklyContestConfig>): void {
  const contests = getContests();
  const index = contests.findIndex(c => c.id === id);
  if (index !== -1) {
    contests[index] = { ...contests[index], ...updates };
    saveContests(contests);
  }
}

export function deleteContest(id: string): void {
  const contests = getContests().filter(c => c.id !== id);
  saveContests(contests);
}

// Celebrated goals tracking - prevents celebrations from showing repeatedly
export interface CelebratedGoals {
  monthKey: string; // Format: "YYYY-MM" to reset celebrations each month
  gmcCelebrated: boolean;
  buickCelebrated: boolean;
  usedCelebrated: boolean;
  d2eCelebrated: boolean;
}

function getCurrentMonthKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export function getCelebratedGoals(): CelebratedGoals {
  const currentMonthKey = getCurrentMonthKey();
  const defaultCelebrated: CelebratedGoals = {
    monthKey: currentMonthKey,
    gmcCelebrated: false,
    buickCelebrated: false,
    usedCelebrated: false,
    d2eCelebrated: false,
  };

  if (typeof window === 'undefined') return defaultCelebrated;

  const stored = localStorage.getItem(CELEBRATED_GOALS_KEY);
  if (!stored) return defaultCelebrated;

  try {
    const parsed = JSON.parse(stored) as CelebratedGoals;
    // Reset if it's a new month
    if (parsed.monthKey !== currentMonthKey) {
      saveCelebratedGoals(defaultCelebrated);
      return defaultCelebrated;
    }
    return parsed;
  } catch {
    return defaultCelebrated;
  }
}

export function saveCelebratedGoals(celebrated: CelebratedGoals): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(CELEBRATED_GOALS_KEY, JSON.stringify(celebrated));
}

export function markGoalCelebrated(goal: 'gmc' | 'buick' | 'used' | 'd2e'): void {
  const celebrated = getCelebratedGoals();
  switch (goal) {
    case 'gmc':
      celebrated.gmcCelebrated = true;
      break;
    case 'buick':
      celebrated.buickCelebrated = true;
      break;
    case 'used':
      celebrated.usedCelebrated = true;
      break;
    case 'd2e':
      celebrated.d2eCelebrated = true;
      break;
  }
  saveCelebratedGoals(celebrated);
}

// Monthly Archive storage functions
export function getMonthlyArchives(): MonthlyArchive[] {
  if (typeof window === 'undefined') return [];

  const stored = localStorage.getItem(ARCHIVE_KEY);
  if (!stored) return [];

  try {
    const archives = JSON.parse(stored) as MonthlyArchive[];
    // Sort by date descending (most recent first)
    return archives.sort((a, b) => b.id.localeCompare(a.id));
  } catch {
    return [];
  }
}

export function saveMonthlyArchives(archives: MonthlyArchive[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ARCHIVE_KEY, JSON.stringify(archives));
}

export function addMonthlyArchive(archive: MonthlyArchive): void {
  const archives = getMonthlyArchives();
  // Check if this month already exists
  const existingIndex = archives.findIndex(a => a.id === archive.id);
  if (existingIndex >= 0) {
    // Update existing archive
    archives[existingIndex] = archive;
  } else {
    // Add new archive
    archives.push(archive);
  }
  saveMonthlyArchives(archives);
}

export function getMonthlyArchive(id: string): MonthlyArchive | null {
  const archives = getMonthlyArchives();
  return archives.find(a => a.id === id) || null;
}

export function deleteMonthlyArchive(id: string): void {
  const archives = getMonthlyArchives().filter(a => a.id !== id);
  saveMonthlyArchives(archives);
}

export function updateArchiveNotes(id: string, notes: string): void {
  const archives = getMonthlyArchives();
  const archive = archives.find(a => a.id === id);
  if (archive) {
    archive.notes = notes;
    saveMonthlyArchives(archives);
  }
}
