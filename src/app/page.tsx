'use client';

import { useState, useEffect, useCallback } from 'react';
import DashboardWrapper from '@/components/DashboardWrapper';
import HotStreakTracker from '@/components/HotStreakTracker';
import IndividualGoals from '@/components/IndividualGoals';
import HeadToHead from '@/components/HeadToHead';
import { fetchDashboardData, DashboardData, SalespersonMetrics } from '@/lib/sheets';
import { getSheetsConfig, getGoals } from '@/lib/storage';

export default function SalesLeaderboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<string>('');

  const loadData = useCallback(async () => {
    try {
      const dashboardData = await fetchDashboardData();
      const goals = getGoals();

      // Override API goals with localStorage goals
      if (dashboardData) {
        dashboardData.dealership.gmcGoal = goals.gmcGoal;
        dashboardData.dealership.buickGoal = goals.buickGoal;
        dashboardData.dealership.usedGoal = goals.usedGoal;
        dashboardData.dealership.totalGrossGoal = goals.totalGrossGoal;

        // Recalculate progress and remaining
        dashboardData.dealership.gmcProgress = dashboardData.dealership.gmcSold / goals.gmcGoal;
        dashboardData.dealership.gmcRemaining = Math.max(0, goals.gmcGoal - dashboardData.dealership.gmcSold);
        dashboardData.dealership.buickProgress = dashboardData.dealership.buickSold / goals.buickGoal;
        dashboardData.dealership.buickRemaining = Math.max(0, goals.buickGoal - dashboardData.dealership.buickSold);
        dashboardData.dealership.usedProgress = dashboardData.dealership.totalUsedUnits / goals.usedGoal;
        dashboardData.dealership.usedRemaining = Math.max(0, goals.usedGoal - dashboardData.dealership.totalUsedUnits);

        // Recalculate pace data
        const daysRemaining = dashboardData.daysRemaining || 1;
        dashboardData.pace.gmc.goal = goals.gmcGoal;
        dashboardData.pace.gmc.needed = dashboardData.dealership.gmcRemaining;
        dashboardData.pace.gmc.pacePerDay = dashboardData.dealership.gmcRemaining / daysRemaining;
        dashboardData.pace.gmc.onTrack = dashboardData.dealership.gmcProgress >= dashboardData.percentComplete;

        dashboardData.pace.buick.goal = goals.buickGoal;
        dashboardData.pace.buick.needed = dashboardData.dealership.buickRemaining;
        dashboardData.pace.buick.pacePerDay = dashboardData.dealership.buickRemaining / daysRemaining;
        dashboardData.pace.buick.onTrack = dashboardData.dealership.buickProgress >= dashboardData.percentComplete;

        dashboardData.pace.used.goal = goals.usedGoal;
        dashboardData.pace.used.needed = dashboardData.dealership.usedRemaining;
        dashboardData.pace.used.pacePerDay = dashboardData.dealership.usedRemaining / daysRemaining;
        dashboardData.pace.used.onTrack = dashboardData.dealership.usedProgress >= dashboardData.percentComplete;
      }

      setData(dashboardData);
      setLastUpdate(new Date().toLocaleTimeString());
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const config = getSheetsConfig();
    const interval = setInterval(loadData, config.refreshInterval * 1000);
    return () => clearInterval(interval);
  }, [loadData]);

  if (loading) {
    return (
      <DashboardWrapper>
        <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-[#c41230] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-[#888]">Loading dashboard data...</p>
          </div>
        </div>
      </DashboardWrapper>
    );
  }

  if (!data) {
    return (
      <DashboardWrapper>
        <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
          <div className="text-center text-[#888]">
            <p>Unable to load dashboard data.</p>
            <button onClick={loadData} className="mt-4 px-6 py-2 bg-[#c41230] text-white rounded-lg">
              Retry
            </button>
          </div>
        </div>
      </DashboardWrapper>
    );
  }

  // Sort salespeople by total units
  const sortedSalespeople = [...data.salespeople].sort((a, b) => b.totalUnits - a.totalUnits);

  // Find top grosser (by total profit)
  const topGrosser = [...data.salespeople].sort((a, b) => b.totalProfit - a.totalProfit)[0]?.name;

  // Calculate today's deals
  const today = new Date().toISOString().split('T')[0];
  const todaysDeals = data.recentSales.filter(sale => sale.date === today).length;
  const todaysGross = data.recentSales
    .filter(sale => sale.date === today)
    .reduce((sum, sale) => sum + sale.totalProfit, 0);

  // Calculate average front/back per unit
  const avgFrontPerUnit = data.dealership.totalUnits > 0
    ? Math.round((data.dealership.totalFrontEnd || 0) / data.dealership.totalUnits)
    : 0;
  const avgBackPerUnit = data.dealership.totalUnits > 0
    ? Math.round((data.dealership.totalBackEnd || 0) / data.dealership.totalUnits)
    : 0;

  return (
    <DashboardWrapper>
      <div className="max-w-[1920px] mx-auto px-6 py-8 pb-20">
        {/* Error Banner */}
        {data.errorMessage && (
          <div className="mb-6 p-4 bg-[#f59e0b]/20 border border-[#f59e0b] rounded-lg text-[#f59e0b] text-center">
            {data.errorMessage}
          </div>
        )}

        {/* Hot Streak Banner */}
        {data.recentSales.length > 0 && (
          <div className="mb-6">
            <HotStreakTracker recentSales={data.recentSales} compact />
          </div>
        )}

        {/* Header Stats */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Sales Leaderboard</h1>
            <p className="text-[#888] mt-1">{data.monthName} | Day {data.daysElapsed} of {data.daysInMonth} ({data.daysRemaining} remaining)</p>
          </div>
          <div className="text-right text-sm text-[#888]">
            <p>Last updated: {lastUpdate}</p>
            <button onClick={loadData} className="text-[#c41230] hover:underline">Refresh</button>
          </div>
        </div>

        {/* Today's Deals Banner */}
        {todaysDeals > 0 && (
          <div className="mb-6 p-4 bg-gradient-to-r from-[#22c55e]/20 to-[#22c55e]/5 border border-[#22c55e]/50 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="text-4xl">🔥</div>
              <div>
                <div className="text-lg font-bold text-[#22c55e]">{todaysDeals} Deal{todaysDeals !== 1 ? 's' : ''} Today!</div>
                <div className="text-sm text-[#888]">${todaysGross.toLocaleString()} in gross profit</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-black text-[#22c55e]">${todaysGross.toLocaleString()}</div>
              <div className="text-xs text-[#888]">Avg: ${todaysDeals > 0 ? Math.round(todaysGross / todaysDeals).toLocaleString() : 0}/deal</div>
            </div>
          </div>
        )}

        {/* Top Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* GMC Progress */}
          <div className="dashboard-card p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-[#888] uppercase tracking-wide">GMC New</span>
              <span className="text-[#c41230] text-2xl font-bold">{data.dealership.gmcSold}/{data.dealership.gmcGoal}</span>
            </div>
            <div className="progress-bar h-3">
              <div
                className="progress-fill h-full gmc-gradient rounded-full"
                style={{ width: `${Math.min(100, data.dealership.gmcProgress * 100)}%` }}
              />
            </div>
            <p className="text-xs text-[#888] mt-2">Need {data.dealership.gmcRemaining} more</p>
          </div>

          {/* Buick Progress */}
          <div className="dashboard-card p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-[#888] uppercase tracking-wide">Buick New</span>
              <span className="text-[#002d62] text-2xl font-bold">{data.dealership.buickSold}/{data.dealership.buickGoal}</span>
            </div>
            <div className="progress-bar h-3">
              <div
                className="progress-fill h-full buick-gradient rounded-full"
                style={{ width: `${Math.min(100, data.dealership.buickProgress * 100)}%` }}
              />
            </div>
            <p className="text-xs text-[#888] mt-2">Need {data.dealership.buickRemaining} more</p>
          </div>

          {/* Used Progress */}
          <div className="dashboard-card p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-[#888] uppercase tracking-wide">Used Cars</span>
              <span className="text-[#f59e0b] text-2xl font-bold">{data.dealership.totalUsedUnits}/{data.dealership.usedGoal}</span>
            </div>
            <div className="progress-bar h-3">
              <div
                className="progress-fill h-full bg-[#f59e0b] rounded-full"
                style={{ width: `${Math.min(100, data.dealership.usedProgress * 100)}%` }}
              />
            </div>
            <p className="text-xs text-[#888] mt-2">Need {data.dealership.usedRemaining} more</p>
          </div>

          {/* Total Profit */}
          <div className="dashboard-card p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-[#888] uppercase tracking-wide">Total Gross</span>
              <span className="text-[#22c55e] text-2xl font-bold">${data.dealership.totalProfit.toLocaleString()}</span>
            </div>
            <div className="progress-bar h-3">
              <div
                className="progress-fill h-full bg-[#22c55e] rounded-full"
                style={{ width: `${Math.min(100, (data.dealership.totalProfit / data.dealership.totalGrossGoal) * 100)}%` }}
              />
            </div>
            <p className="text-xs text-[#888] mt-2">Goal: ${data.dealership.totalGrossGoal.toLocaleString()}</p>
          </div>
        </div>

        {/* Month Projection Card */}
        <div className="mb-8">
          <div className="dashboard-card p-6 bg-gradient-to-r from-[#1a1a1a] to-[#0d0d0d]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold uppercase tracking-wide text-[#888]">Month-End Projection</h3>
              <span className="text-xs text-[#888]">Based on {data.daysElapsed} day{data.daysElapsed !== 1 ? 's' : ''} of data</span>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Projected Units */}
              <div className="text-center">
                <div className="text-xs text-[#888] uppercase mb-1">Projected Units</div>
                <div className={`text-3xl font-black ${
                  Math.round((data.dealership.totalUnits / data.daysElapsed) * data.daysInMonth) >=
                  (data.dealership.gmcGoal + data.dealership.buickGoal + data.dealership.usedGoal)
                    ? 'text-[#22c55e]' : 'text-[#f59e0b]'
                }`}>
                  {Math.round((data.dealership.totalUnits / data.daysElapsed) * data.daysInMonth)}
                </div>
                <div className="text-xs text-[#888] mt-1">
                  {(data.dealership.totalUnits / data.daysElapsed).toFixed(1)} units/day
                </div>
              </div>
              {/* Projected Gross */}
              <div className="text-center">
                <div className="text-xs text-[#888] uppercase mb-1">Projected Gross</div>
                <div className={`text-3xl font-black ${
                  Math.round((data.dealership.totalProfit / data.daysElapsed) * data.daysInMonth) >= data.dealership.totalGrossGoal
                    ? 'text-[#22c55e]' : 'text-[#f59e0b]'
                }`}>
                  ${Math.round((data.dealership.totalProfit / data.daysElapsed) * data.daysInMonth).toLocaleString()}
                </div>
                <div className="text-xs text-[#888] mt-1">
                  ${Math.round(data.dealership.totalProfit / data.daysElapsed).toLocaleString()}/day
                </div>
              </div>
              {/* Daily Run Rate */}
              <div className="text-center">
                <div className="text-xs text-[#888] uppercase mb-1">Daily Run Rate</div>
                <div className="text-3xl font-black text-white">
                  {(data.dealership.totalUnits / data.daysElapsed).toFixed(1)}
                </div>
                <div className="text-xs text-[#888] mt-1">
                  Need {((data.dealership.gmcGoal + data.dealership.buickGoal + data.dealership.usedGoal - data.dealership.totalUnits) / data.daysRemaining).toFixed(1)}/day
                </div>
              </div>
              {/* Month Progress */}
              <div className="text-center">
                <div className="text-xs text-[#888] uppercase mb-1">Month Progress</div>
                <div className="text-3xl font-black text-white">
                  {Math.round(data.percentComplete * 100)}%
                </div>
                <div className="text-xs text-[#888] mt-1">
                  {data.daysRemaining} day{data.daysRemaining !== 1 ? 's' : ''} remaining
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Leaderboard Table */}
          <div className="xl:col-span-2 dashboard-card overflow-hidden">
            <div className="p-4 border-b border-[#2a2a2a]">
              <h2 className="text-xl font-semibold">Team Leaderboard</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="tv-table">
                <thead>
                  <tr>
                    <th className="w-16">Rank</th>
                    <th>Salesperson</th>
                    <th className="text-center">New</th>
                    <th className="text-center">Used</th>
                    <th className="text-center">Total</th>
                    <th className="text-right">Front</th>
                    <th className="text-right">Back</th>
                    <th className="text-right">Total $</th>
                    <th className="text-center">Bonus</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedSalespeople.map((person, index) => (
                    <SalespersonRow
                      key={person.name}
                      person={person}
                      rank={index + 1}
                      isTopGrosser={person.name === topGrosser}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Sidebar Stats */}
          <div className="space-y-6">
            {/* Dealership Summary */}
            <div className="dashboard-card p-6">
              <h3 className="text-lg font-semibold mb-4">Dealership Summary</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-[#2a2a2a]">
                  <span className="text-[#888]">Total Units</span>
                  <span className="text-2xl font-bold">{data.dealership.totalUnits}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-[#2a2a2a]">
                  <span className="text-[#888]">New Car Units</span>
                  <span className="text-xl font-semibold">{data.dealership.totalNewUnits}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-[#2a2a2a]">
                  <span className="text-[#888]">Used Car Units</span>
                  <span className="text-xl font-semibold">{data.dealership.totalUsedUnits}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-[#2a2a2a]">
                  <span className="text-[#888]">Total Front End</span>
                  <span className="text-xl font-semibold text-[#3b82f6]">${(data.dealership.totalFrontEnd || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-[#2a2a2a]">
                  <span className="text-[#888]">Total Back End</span>
                  <span className="text-xl font-semibold text-[#8b5cf6]">${(data.dealership.totalBackEnd || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-[#2a2a2a]">
                  <span className="text-[#888]">Avg Front/Unit</span>
                  <span className="text-xl font-semibold text-[#3b82f6]">${avgFrontPerUnit.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-[#2a2a2a]">
                  <span className="text-[#888]">Avg Back/Unit</span>
                  <span className="text-xl font-semibold text-[#8b5cf6]">${avgBackPerUnit.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-[#2a2a2a]">
                  <span className="text-[#888]">Avg Total/Unit</span>
                  <span className="text-xl font-semibold text-[#22c55e]">${Math.round(data.dealership.avgProfit).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-[#888]">Bonus Eligible</span>
                  <span className="text-xl font-semibold text-[#22c55e]">{data.dealership.bonusEligibleCount}/{data.dealership.teamSize}</span>
                </div>
              </div>
            </div>

            {/* Pace Status */}
            <div className="dashboard-card p-6">
              <h3 className="text-lg font-semibold mb-4">Pace to Goal</h3>
              <div className="space-y-4">
                <PaceCard label="GMC" data={data.pace.gmc} color="#c41230" />
                <PaceCard label="Buick" data={data.pace.buick} color="#002d62" />
                <PaceCard label="Used" data={data.pace.used} color="#f59e0b" />
              </div>
            </div>

            {/* Head-to-Head Battles */}
            <HeadToHead salespeople={data.salespeople} />

            {/* Individual Goals */}
            <IndividualGoals salespeople={data.salespeople} editable />

            {/* Recent Sales */}
            <div className="dashboard-card p-6">
              <h3 className="text-lg font-semibold mb-4">Recent Sales</h3>
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {data.recentSales.slice(0, 5).map((sale, index) => (
                  <div key={index} className="p-3 bg-[#1a1a1a] rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">{sale.year} {sale.make} {sale.model}</span>
                      <span className="text-[#22c55e] font-semibold">${sale.totalProfit.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-[#888]">{sale.salesPerson}</span>
                      <div className="flex gap-2 text-xs">
                        <span className="text-[#3b82f6]">F: ${(sale.frontEndProfit || 0).toLocaleString()}</span>
                        <span className="text-[#8b5cf6]">B: ${(sale.backEndProfit || 0).toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="text-xs text-[#888] mt-1">#{sale.stockNumber}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardWrapper>
  );
}

function SalespersonRow({ person, rank, isTopGrosser }: { person: SalespersonMetrics; rank: number; isTopGrosser?: boolean }) {
  const getRankClass = () => {
    if (rank === 1) return 'rank-1';
    if (rank === 2) return 'rank-2';
    if (rank === 3) return 'rank-3';
    return 'bg-[#2a2a2a] text-white';
  };

  return (
    <tr className="animate-fade-in" style={{ animationDelay: `${rank * 50}ms` }}>
      <td>
        <div className={`rank-badge ${getRankClass()}`}>
          {rank === 1 ? '👑' : rank}
        </div>
      </td>
      <td>
        <div>
          <div className="font-semibold flex items-center gap-2">
            {person.nickname}
            {isTopGrosser && rank !== 1 && (
              <span className="text-[#c5a04f] text-xs" title="Top Grosser">💰</span>
            )}
          </div>
          <div className="text-xs text-[#888]">
            <span className="text-[#c41230]">{person.gmcUnits} GMC</span>
            <span className="mx-1">|</span>
            <span className="text-[#002d62]">{person.buickUnits} Buick</span>
          </div>
        </div>
      </td>
      <td className="text-center">
        <span className="text-lg font-semibold">{person.newUnits}</span>
      </td>
      <td className="text-center">
        <span className="text-lg font-semibold text-[#f59e0b]">{person.usedUnits}</span>
      </td>
      <td className="text-center">
        <span className="text-xl font-bold">{person.totalUnits}</span>
      </td>
      <td className="text-right">
        <span className="text-[#3b82f6] font-semibold">${(person.frontEndProfit || 0).toLocaleString()}</span>
      </td>
      <td className="text-right">
        <span className="text-[#8b5cf6] font-semibold">${(person.backEndProfit || 0).toLocaleString()}</span>
      </td>
      <td className="text-right">
        <span className="text-[#22c55e] font-semibold">${person.totalProfit.toLocaleString()}</span>
      </td>
      <td className="text-center">
        {person.bonusEligible ? (
          <span className="inline-flex items-center px-3 py-1 rounded-full bg-[#22c55e]/20 text-[#22c55e] text-sm font-medium">
            ${person.bonusAmount}
          </span>
        ) : (
          <span className="text-[#888] text-sm">
            {person.newUnits}/{person.d2eGoal} new
          </span>
        )}
      </td>
    </tr>
  );
}

function PaceCard({ label, data, color }: { label: string; data: { sold: number; goal: number; needed: number; pacePerDay: number; onTrack: boolean }; color: string }) {
  return (
    <div className="flex items-center justify-between p-3 bg-[#1a1a1a] rounded-lg">
      <div>
        <span className="font-medium" style={{ color }}>{label}</span>
        <div className="text-xs text-[#888]">
          {data.pacePerDay.toFixed(1)}/day needed
        </div>
      </div>
      <div className="text-right">
        <span className="font-bold">{data.needed}</span>
        <span className="text-[#888] text-sm ml-1">to go</span>
        <div className={`text-xs ${data.onTrack ? 'text-[#22c55e]' : 'text-[#ef4444]'}`}>
          {data.onTrack ? 'On Track' : 'Behind Pace'}
        </div>
      </div>
    </div>
  );
}
