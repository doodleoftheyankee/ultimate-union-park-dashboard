'use client';

import { RecentSale } from '@/lib/sheets';

interface HotStreak {
  name: string;
  nickname: string;
  deals: number;
  days: number;
  latestSale: string;
  isOnFire: boolean;
}

interface HotStreakTrackerProps {
  recentSales: RecentSale[];
  compact?: boolean;
}

export default function HotStreakTracker({ recentSales, compact = false }: HotStreakTrackerProps) {
  const streaks = calculateHotStreaks(recentSales);
  const hotSalespeople = streaks.filter(s => s.isOnFire);

  if (hotSalespeople.length === 0) {
    return null;
  }

  if (compact) {
    return (
      <div className="flex items-center gap-4 overflow-x-auto py-2">
        {hotSalespeople.map((streak) => (
          <div
            key={streak.name}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#ef4444]/20 to-[#f59e0b]/20 border border-[#ef4444]/50 rounded-full whitespace-nowrap animate-pulse"
          >
            <span className="text-2xl">🔥</span>
            <span className="font-bold text-white">{streak.nickname}</span>
            <span className="text-[#f59e0b] font-semibold">
              {streak.deals} deals in {streak.days} day{streak.days !== 1 ? 's' : ''}!
            </span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="dashboard-card p-6">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-2xl">🔥</span>
        <h3 className="text-lg font-semibold">Hot Streaks</h3>
      </div>
      <div className="space-y-3">
        {hotSalespeople.map((streak) => (
          <div
            key={streak.name}
            className="flex items-center justify-between p-4 bg-gradient-to-r from-[#ef4444]/10 to-[#f59e0b]/10 border border-[#ef4444]/30 rounded-lg"
          >
            <div className="flex items-center gap-3">
              <div className="text-3xl animate-bounce">🔥</div>
              <div>
                <div className="font-bold text-lg">{streak.nickname}</div>
                <div className="text-sm text-[#888]">Last sale: {formatDate(streak.latestSale)}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-black text-[#f59e0b]">{streak.deals} DEALS</div>
              <div className="text-sm text-[#888]">
                in {streak.days} day{streak.days !== 1 ? 's' : ''}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function calculateHotStreaks(recentSales: RecentSale[]): HotStreak[] {
  const now = new Date();
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

  // Group sales by salesperson within the last 3 days
  const salesByPerson: Record<string, { dates: Date[]; latestSale: string }> = {};

  recentSales.forEach((sale) => {
    const saleDate = new Date(sale.date);
    if (saleDate >= threeDaysAgo) {
      if (!salesByPerson[sale.salesPerson]) {
        salesByPerson[sale.salesPerson] = { dates: [], latestSale: sale.date };
      }
      salesByPerson[sale.salesPerson].dates.push(saleDate);
      if (new Date(sale.date) > new Date(salesByPerson[sale.salesPerson].latestSale)) {
        salesByPerson[sale.salesPerson].latestSale = sale.date;
      }
    }
  });

  // Calculate streaks
  const streaks: HotStreak[] = Object.entries(salesByPerson).map(([name, data]) => {
    const dates = data.dates.sort((a, b) => a.getTime() - b.getTime());
    const firstDate = dates[0];
    const lastDate = dates[dates.length - 1];
    const daySpan = Math.ceil((lastDate.getTime() - firstDate.getTime()) / (24 * 60 * 60 * 1000)) + 1;

    // Extract nickname (first name)
    const nickname = name.split(' ').pop() || name.split(',')[0] || name;
    const formattedNickname = nickname.charAt(0).toUpperCase() + nickname.slice(1).toLowerCase();

    return {
      name,
      nickname: formattedNickname,
      deals: data.dates.length,
      days: daySpan,
      latestSale: data.latestSale,
      isOnFire: data.dates.length >= 2, // 2+ deals in 3 days = hot streak
    };
  });

  // Sort by deals count descending
  return streaks.sort((a, b) => b.deals - a.deals);
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (24 * 60 * 60 * 1000));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// Export for use in header/banner
export function HotStreakBanner({ recentSales }: { recentSales: RecentSale[] }) {
  const streaks = calculateHotStreaks(recentSales);
  const hotSalespeople = streaks.filter(s => s.isOnFire);

  if (hotSalespeople.length === 0) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-[#ef4444]/20 via-[#f59e0b]/20 to-[#ef4444]/20 border-y border-[#ef4444]/30 py-2 px-4">
      <div className="flex items-center justify-center gap-6 overflow-x-auto">
        <span className="text-sm font-semibold text-[#888] uppercase tracking-wider shrink-0">Hot Streaks</span>
        {hotSalespeople.slice(0, 3).map((streak) => (
          <div key={streak.name} className="flex items-center gap-2 shrink-0">
            <span className="text-xl animate-pulse">🔥</span>
            <span className="font-bold">{streak.nickname}</span>
            <span className="text-[#f59e0b]">
              {streak.deals} in {streak.days}d
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
