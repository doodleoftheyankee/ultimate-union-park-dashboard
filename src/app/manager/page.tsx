'use client';

import { useState, useEffect, useCallback } from 'react';
import DashboardWrapper from '@/components/DashboardWrapper';
import CountdownTimer from '@/components/CountdownTimer';
import { fetchDashboardData, DashboardData } from '@/lib/sheets';
import { getSheetsConfig, getGoals } from '@/lib/storage';

export default function ManagerDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<string>('');

  const loadData = useCallback(async () => {
    try {
      const dashboardData = await fetchDashboardData();
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

  const goals = getGoals();

  if (loading) {
    return (
      <DashboardWrapper>
        <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-[#c41230] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-[#888]">Loading manager dashboard...</p>
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

  // Calculate key metrics
  const totalUnits = data.dealership.totalUnits;
  const daysElapsed = data.daysElapsed || 1;
  const unitsPerDay = totalUnits / daysElapsed;
  const projectedMonthEnd = Math.round(unitsPerDay * data.daysInMonth);

  const totalNewGoal = (goals.gmcGoal || 21) + (goals.buickGoal || 9);
  const totalGoal = totalNewGoal + (goals.usedGoal || 20);

  const gmcHit = data.dealership.gmcSold >= (goals.gmcGoal || 21);
  const buickHit = data.dealership.buickSold >= (goals.buickGoal || 9);
  const d2eUnlocked = gmcHit && buickHit;

  // Calculate bonus pool
  const bonusEligibleSalespeople = data.salespeople.filter(p => p.bonusEligible).length;
  const bonusPool = d2eUnlocked ? bonusEligibleSalespeople * (goals.bonusPerPerson || 375) : 0;

  return (
    <DashboardWrapper>
      <div className="max-w-[1920px] mx-auto px-6 py-8 pb-24">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Manager Dashboard</h1>
            <p className="text-[#888] mt-1">{data.monthName} Performance Overview</p>
          </div>
          <div className="text-right text-sm text-[#888]">
            <p>Last updated: {lastUpdate}</p>
            <button onClick={loadData} className="text-[#c41230] hover:underline">Refresh</button>
          </div>
        </div>

        {/* Top Row - Key Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Total Units */}
          <div className="dashboard-card p-6 text-center">
            <div className="text-xs text-[#888] uppercase tracking-wider mb-2">Total Units Sold</div>
            <div className="text-5xl font-black text-white">{totalUnits}</div>
            <div className="text-sm text-[#888] mt-2">Goal: {totalGoal}</div>
          </div>

          {/* Projected End */}
          <div className="dashboard-card p-6 text-center">
            <div className="text-xs text-[#888] uppercase tracking-wider mb-2">Projected Month End</div>
            <div className={`text-5xl font-black ${projectedMonthEnd >= totalGoal ? 'text-[#22c55e]' : 'text-[#f59e0b]'}`}>
              {projectedMonthEnd}
            </div>
            <div className="text-sm text-[#888] mt-2">{unitsPerDay.toFixed(1)} units/day avg</div>
          </div>

          {/* Total Gross */}
          <div className="dashboard-card p-6 text-center">
            <div className="text-xs text-[#888] uppercase tracking-wider mb-2">Total Gross Profit</div>
            <div className="text-4xl font-black text-[#22c55e]">${data.dealership.totalProfit.toLocaleString()}</div>
            <div className="text-sm text-[#888] mt-2">Avg: ${Math.round(data.dealership.avgProfit).toLocaleString()}/unit</div>
          </div>

          {/* Countdown Timer */}
          <CountdownTimer />
        </div>

        {/* D2E Bonus Status */}
        <div className={`dashboard-card p-6 mb-6 ${d2eUnlocked ? 'border-[#22c55e] animate-pulse-glow' : ''}`}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold mb-2">D2E Bonus Status</h2>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded-full ${gmcHit ? 'bg-[#22c55e]' : 'bg-[#2a2a2a]'}`} />
                  <span className={gmcHit ? 'text-[#22c55e]' : 'text-[#888]'}>
                    GMC: {data.dealership.gmcSold}/{goals.gmcGoal || 21}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded-full ${buickHit ? 'bg-[#22c55e]' : 'bg-[#2a2a2a]'}`} />
                  <span className={buickHit ? 'text-[#22c55e]' : 'text-[#888]'}>
                    Buick: {data.dealership.buickSold}/{goals.buickGoal || 9}
                  </span>
                </div>
              </div>
            </div>
            <div className="text-right">
              {d2eUnlocked ? (
                <div className="text-center">
                  <div className="text-3xl font-black text-[#22c55e]">UNLOCKED!</div>
                  <div className="text-lg text-[#c5a04f]">${bonusPool.toLocaleString()} Pool</div>
                  <div className="text-sm text-[#888]">{bonusEligibleSalespeople} eligible @ ${goals.bonusPerPerson || 375} each</div>
                </div>
              ) : (
                <div className="text-center">
                  <div className="text-2xl font-bold text-[#888]">LOCKED</div>
                  <div className="text-sm text-[#888]">Hit both GMC & Buick goals</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Goal Progress Cards */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-[#888] uppercase tracking-wider">Goal Progress</h3>

            {/* GMC Goal */}
            <div className={`dashboard-card p-6 ${gmcHit ? 'border-[#22c55e]' : ''}`}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-[#c41230] uppercase">GMC New</span>
                <span className="text-2xl font-bold">{data.dealership.gmcSold}/{goals.gmcGoal || 21}</span>
              </div>
              <div className="progress-bar h-4">
                <div
                  className={`progress-fill h-full rounded-full ${gmcHit ? 'bg-[#22c55e]' : 'gmc-gradient'}`}
                  style={{ width: `${Math.min(100, (data.dealership.gmcSold / (goals.gmcGoal || 21)) * 100)}%` }}
                />
              </div>
              <div className="flex justify-between mt-2 text-sm">
                <span className="text-[#888]">{Math.round((data.dealership.gmcSold / (goals.gmcGoal || 21)) * 100)}%</span>
                <span className={gmcHit ? 'text-[#22c55e] font-bold' : 'text-[#888]'}>
                  {gmcHit ? '✓ GOAL HIT!' : `${(goals.gmcGoal || 21) - data.dealership.gmcSold} to go`}
                </span>
              </div>
            </div>

            {/* Buick Goal */}
            <div className={`dashboard-card p-6 ${buickHit ? 'border-[#22c55e]' : ''}`}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-[#002d62] uppercase">Buick New</span>
                <span className="text-2xl font-bold">{data.dealership.buickSold}/{goals.buickGoal || 9}</span>
              </div>
              <div className="progress-bar h-4">
                <div
                  className={`progress-fill h-full rounded-full ${buickHit ? 'bg-[#22c55e]' : 'buick-gradient'}`}
                  style={{ width: `${Math.min(100, (data.dealership.buickSold / (goals.buickGoal || 9)) * 100)}%` }}
                />
              </div>
              <div className="flex justify-between mt-2 text-sm">
                <span className="text-[#888]">{Math.round((data.dealership.buickSold / (goals.buickGoal || 9)) * 100)}%</span>
                <span className={buickHit ? 'text-[#22c55e] font-bold' : 'text-[#888]'}>
                  {buickHit ? '✓ GOAL HIT!' : `${(goals.buickGoal || 9) - data.dealership.buickSold} to go`}
                </span>
              </div>
            </div>

            {/* Used Goal */}
            <div className={`dashboard-card p-6 ${data.dealership.totalUsedUnits >= (goals.usedGoal || 20) ? 'border-[#22c55e]' : ''}`}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-[#f59e0b] uppercase">Used Cars</span>
                <span className="text-2xl font-bold">{data.dealership.totalUsedUnits}/{goals.usedGoal || 20}</span>
              </div>
              <div className="progress-bar h-4">
                <div
                  className={`progress-fill h-full rounded-full ${data.dealership.totalUsedUnits >= (goals.usedGoal || 20) ? 'bg-[#22c55e]' : 'bg-[#f59e0b]'}`}
                  style={{ width: `${Math.min(100, (data.dealership.totalUsedUnits / (goals.usedGoal || 20)) * 100)}%` }}
                />
              </div>
              <div className="flex justify-between mt-2 text-sm">
                <span className="text-[#888]">{Math.round((data.dealership.totalUsedUnits / (goals.usedGoal || 20)) * 100)}%</span>
                <span className={data.dealership.totalUsedUnits >= (goals.usedGoal || 20) ? 'text-[#22c55e] font-bold' : 'text-[#888]'}>
                  {data.dealership.totalUsedUnits >= (goals.usedGoal || 20) ? '✓ GOAL HIT!' : `${(goals.usedGoal || 20) - data.dealership.totalUsedUnits} to go`}
                </span>
              </div>
            </div>
          </div>

          {/* Team Performance */}
          <div className="xl:col-span-2 space-y-4">
            <h3 className="text-lg font-semibold text-[#888] uppercase tracking-wider">Team Performance</h3>

            <div className="dashboard-card overflow-hidden">
              <table className="tv-table">
                <thead>
                  <tr>
                    <th>Salesperson</th>
                    <th className="text-center">New</th>
                    <th className="text-center">Used</th>
                    <th className="text-center">Total</th>
                    <th className="text-right">Gross</th>
                    <th className="text-center">Bonus</th>
                  </tr>
                </thead>
                <tbody>
                  {[...data.salespeople]
                    .sort((a, b) => b.totalUnits - a.totalUnits)
                    .map((person) => (
                      <tr key={person.name}>
                        <td>
                          <div className="font-semibold">{person.nickname}</div>
                          <div className="text-xs text-[#888]">
                            {person.gmcUnits} GMC | {person.buickUnits} Buick
                          </div>
                        </td>
                        <td className="text-center font-semibold">{person.newUnits}</td>
                        <td className="text-center font-semibold text-[#f59e0b]">{person.usedUnits}</td>
                        <td className="text-center font-bold text-lg">{person.totalUnits}</td>
                        <td className="text-right text-[#22c55e] font-semibold">${person.totalProfit.toLocaleString()}</td>
                        <td className="text-center">
                          {person.bonusEligible && d2eUnlocked ? (
                            <span className="inline-flex items-center px-3 py-1 rounded-full bg-[#22c55e]/20 text-[#22c55e] text-sm font-bold">
                              ${goals.bonusPerPerson || 375}
                            </span>
                          ) : person.bonusEligible ? (
                            <span className="inline-flex items-center px-3 py-1 rounded-full bg-[#f59e0b]/20 text-[#f59e0b] text-sm">
                              Eligible
                            </span>
                          ) : (
                            <span className="text-[#888] text-sm">
                              {person.newUnits}/{goals.minVehiclesForBonus || 4}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="dashboard-card p-4 text-center">
                <div className="text-xs text-[#888] uppercase tracking-wider mb-1">Team Size</div>
                <div className="text-3xl font-bold">{data.dealership.teamSize}</div>
              </div>
              <div className="dashboard-card p-4 text-center">
                <div className="text-xs text-[#888] uppercase tracking-wider mb-1">Bonus Eligible</div>
                <div className="text-3xl font-bold text-[#22c55e]">{bonusEligibleSalespeople}</div>
              </div>
              <div className="dashboard-card p-4 text-center">
                <div className="text-xs text-[#888] uppercase tracking-wider mb-1">Days Elapsed</div>
                <div className="text-3xl font-bold">{data.daysElapsed}</div>
              </div>
              <div className="dashboard-card p-4 text-center">
                <div className="text-xs text-[#888] uppercase tracking-wider mb-1">Days Left</div>
                <div className="text-3xl font-bold text-[#ef4444]">{data.daysRemaining}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardWrapper>
  );
}
