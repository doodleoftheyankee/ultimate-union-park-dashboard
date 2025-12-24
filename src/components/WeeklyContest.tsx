'use client';

import { SalespersonMetrics, RecentSale } from '@/lib/sheets';

interface WeeklyContestProps {
  salespeople: SalespersonMetrics[];
  recentSales: RecentSale[];
  bonusAmount?: number;
}

interface WeeklyStats {
  name: string;
  nickname: string;
  weeklyUnits: number;
  weeklyGross: number;
}

export default function WeeklyContest({
  salespeople,
  recentSales,
  bonusAmount = 250
}: WeeklyContestProps) {
  // Calculate this week's stats from recent sales
  const now = new Date();
  const dayOfWeek = now.getDay();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - dayOfWeek); // Sunday
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6); // Saturday
  endOfWeek.setHours(23, 59, 59, 999);

  // Get week number
  const weekStart = new Date(now.getFullYear(), 0, 1);
  const weekNumber = Math.ceil(((now.getTime() - weekStart.getTime()) / 86400000 + weekStart.getDay() + 1) / 7);

  // Filter sales to this week
  const weeklySales = recentSales.filter(sale => {
    const saleDate = new Date(sale.date);
    return saleDate >= startOfWeek && saleDate <= endOfWeek;
  });

  // Aggregate by salesperson
  const weeklyMap: Record<string, WeeklyStats> = {};

  salespeople.forEach(sp => {
    weeklyMap[sp.name.toUpperCase()] = {
      name: sp.name,
      nickname: sp.nickname,
      weeklyUnits: 0,
      weeklyGross: 0
    };
  });

  weeklySales.forEach(sale => {
    const name = sale.salesPerson.toUpperCase();
    if (weeklyMap[name]) {
      weeklyMap[name].weeklyUnits++;
      weeklyMap[name].weeklyGross += sale.totalProfit;
    }
  });

  // Sort by weekly units (primary) then gross (secondary)
  const weeklyLeaderboard = Object.values(weeklyMap)
    .sort((a, b) => {
      if (b.weeklyUnits !== a.weeklyUnits) return b.weeklyUnits - a.weeklyUnits;
      return b.weeklyGross - a.weeklyGross;
    });

  const leader = weeklyLeaderboard[0];
  const hasActivity = leader && leader.weeklyUnits > 0;

  // Calculate days left in week
  const daysLeftInWeek = 6 - dayOfWeek;

  const getDayName = () => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayOfWeek];
  };

  return (
    <div className="dashboard-card p-6 border-2 border-[#f59e0b]/30 bg-gradient-to-br from-[#1a1a1a] to-[#0d0d0d]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <span className="text-2xl">🏆</span>
          <span>Weekly Contest</span>
        </h3>
        <div className="text-right">
          <div className="text-[#f59e0b] font-black text-2xl">${bonusAmount}</div>
          <div className="text-xs text-[#888]">Week {weekNumber} Prize</div>
        </div>
      </div>

      {/* Current Leader */}
      {hasActivity ? (
        <div className="bg-gradient-to-r from-[#f59e0b]/20 to-transparent p-4 rounded-lg mb-4 border border-[#f59e0b]/30">
          <div className="text-xs text-[#f59e0b] uppercase tracking-wide mb-1">Current Leader</div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl">👑</span>
              <div>
                <div className="text-xl font-bold text-white">{leader.nickname}</div>
                <div className="text-sm text-[#888]">{leader.weeklyUnits} units this week</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-black text-[#22c55e]">
                ${leader.weeklyGross.toLocaleString()}
              </div>
              <div className="text-xs text-[#888]">weekly gross</div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-[#1a1a1a] p-4 rounded-lg mb-4 text-center">
          <div className="text-[#888]">No sales yet this week</div>
          <div className="text-sm text-[#f59e0b]">Be the first to lead!</div>
        </div>
      )}

      {/* Weekly Standings */}
      <div className="space-y-2">
        <div className="text-xs text-[#888] uppercase tracking-wide mb-2">This Week&apos;s Standings</div>
        {weeklyLeaderboard.slice(0, 5).map((person, index) => (
          <div
            key={person.name}
            className={`flex items-center justify-between p-2 rounded-lg ${
              index === 0 && hasActivity ? 'bg-[#f59e0b]/10' : 'bg-[#1a1a1a]'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className={`w-6 text-center font-bold ${
                index === 0 && hasActivity ? 'text-[#f59e0b]' : 'text-[#888]'
              }`}>
                {index + 1}
              </span>
              <span className={index === 0 && hasActivity ? 'text-white font-semibold' : 'text-[#888]'}>
                {person.nickname}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-white font-bold">{person.weeklyUnits}</span>
              <span className="text-[#22c55e] text-sm w-20 text-right">
                ${person.weeklyGross.toLocaleString()}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Week Info */}
      <div className="mt-4 pt-4 border-t border-[#2a2a2a] flex items-center justify-between text-xs text-[#888]">
        <span>{getDayName()} - {daysLeftInWeek} day{daysLeftInWeek !== 1 ? 's' : ''} left</span>
        <span>Winner announced Sunday</span>
      </div>
    </div>
  );
}
