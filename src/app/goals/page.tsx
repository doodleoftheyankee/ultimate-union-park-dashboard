'use client';

import { useState, useEffect, useCallback } from 'react';
import DashboardWrapper from '@/components/DashboardWrapper';
import { fetchDashboardData, DashboardData, SalespersonMetrics } from '@/lib/sheets';
import { getGoals, saveGoals } from '@/lib/storage';
import { MonthlyGoals } from '@/types';

export default function GoalsPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [localGoals, setLocalGoals] = useState<MonthlyGoals | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [editGoals, setEditGoals] = useState({
    gmcGoal: 21,
    buickGoal: 9,
    usedGoal: 20,
    bonusPerPerson: 375,
    minVehiclesForBonus: 4,
  });

  // Load local goals FIRST before API data
  useEffect(() => {
    const goals = getGoals();
    setLocalGoals(goals);
    setEditGoals({
      gmcGoal: goals.gmcGoal,
      buickGoal: goals.buickGoal,
      usedGoal: goals.usedGoal,
      bonusPerPerson: goals.bonusPerPerson,
      minVehiclesForBonus: goals.minVehiclesForBonus,
    });
  }, []);

  const loadData = useCallback(async () => {
    try {
      const dashboardData = await fetchDashboardData();
      setData(dashboardData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSaveGoals = () => {
    if (!localGoals) return;

    const updatedGoals: MonthlyGoals = {
      ...localGoals,
      gmcGoal: editGoals.gmcGoal,
      buickGoal: editGoals.buickGoal,
      usedGoal: editGoals.usedGoal,
      bonusPerPerson: editGoals.bonusPerPerson,
      minVehiclesForBonus: editGoals.minVehiclesForBonus,
    };

    saveGoals(updatedGoals);
    setLocalGoals(updatedGoals);
    setIsEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  if (loading || !data) {
    return (
      <DashboardWrapper>
        <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-[#c41230] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-[#888]">Loading goals data...</p>
          </div>
        </div>
      </DashboardWrapper>
    );
  }

  // Use LOCAL goals for targets, API data for current sold numbers
  const gmcGoal = editGoals.gmcGoal;
  const buickGoal = editGoals.buickGoal;
  const usedGoal = editGoals.usedGoal;

  const gmcSold = data.dealership.gmcSold;
  const buickSold = data.dealership.buickSold;
  const usedSold = data.dealership.totalUsedUnits;

  // Calculate progress using LOCAL goals
  const gmcProgress = gmcGoal > 0 ? gmcSold / gmcGoal : 0;
  const buickProgress = buickGoal > 0 ? buickSold / buickGoal : 0;
  const usedProgress = usedGoal > 0 ? usedSold / usedGoal : 0;

  // Calculate D2E status using LOCAL goals
  const bonusRequirements = {
    gmcHit: gmcSold >= gmcGoal,
    buickHit: buickSold >= buickGoal,
  };
  const bothGoalsHit = bonusRequirements.gmcHit && bonusRequirements.buickHit;

  return (
    <DashboardWrapper>
      <div className="max-w-[1920px] mx-auto px-6 py-8 pb-20">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Monthly Goals</h1>
            <p className="text-[#888] mt-1">{data.monthName} | D2E Bonus Tracking</p>
          </div>
          <div className="flex items-center gap-4">
            {saved && (
              <span className="text-[#22c55e] font-medium animate-fade-in">Goals saved!</span>
            )}
            <button
              onClick={() => setIsEditing(!isEditing)}
              className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                isEditing
                  ? 'bg-[#888] text-white'
                  : 'bg-[#c41230] text-white hover:bg-[#9a0e26]'
              }`}
            >
              {isEditing ? 'Cancel' : 'Edit Goals'}
            </button>
          </div>
        </div>

        {/* D2E Status Banner */}
        <div className={`mb-8 p-6 rounded-xl ${bothGoalsHit ? 'bg-[#22c55e]/20 border-2 border-[#22c55e]' : 'bg-[#f59e0b]/20 border-2 border-[#f59e0b]'}`}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className={`text-2xl font-bold ${bothGoalsHit ? 'text-[#22c55e]' : 'text-[#f59e0b]'}`}>
                {bothGoalsHit ? 'D2E BONUS UNLOCKED!' : 'D2E BONUS STATUS'}
              </h2>
              <p className="text-[#888] mt-1">
                {bothGoalsHit
                  ? `Salespeople with ${editGoals.minVehiclesForBonus}+ new car units qualify for $${editGoals.bonusPerPerson} bonus!`
                  : 'Must hit BOTH GMC and Buick goals to unlock D2E bonus'
                }
              </p>
            </div>
            <div className="flex gap-4">
              <div className={`px-6 py-3 rounded-lg ${bonusRequirements.gmcHit ? 'bg-[#22c55e]' : 'bg-[#2a2a2a]'}`}>
                <div className="text-sm font-medium">GMC Goal</div>
                <div className="text-xl font-bold">{bonusRequirements.gmcHit ? 'HIT' : 'NOT HIT'}</div>
              </div>
              <div className={`px-6 py-3 rounded-lg ${bonusRequirements.buickHit ? 'bg-[#22c55e]' : 'bg-[#2a2a2a]'}`}>
                <div className="text-sm font-medium">Buick Goal</div>
                <div className="text-xl font-bold">{bonusRequirements.buickHit ? 'HIT' : 'NOT HIT'}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Goals Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* GMC Goal */}
          <div className="dashboard-card p-6 border-l-4 border-[#c41230]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-[#c41230]">GMC New Cars</h3>
              {isEditing && (
                <input
                  type="number"
                  value={editGoals.gmcGoal}
                  onChange={(e) => setEditGoals({ ...editGoals, gmcGoal: parseInt(e.target.value) || 0 })}
                  className="edit-input w-20 text-center"
                />
              )}
            </div>
            <div className="text-5xl font-bold mb-2">
              {gmcSold}
              <span className="text-2xl text-[#888]">/{gmcGoal}</span>
            </div>
            <div className="progress-bar h-4 mb-3">
              <div
                className={`progress-fill h-full gmc-gradient rounded-full ${gmcProgress >= 1 ? 'animate-pulse-glow' : ''}`}
                style={{ width: `${Math.min(100, gmcProgress * 100)}%` }}
              />
            </div>
            <p className="text-[#888]">
              {gmcGoal - gmcSold > 0
                ? `${gmcGoal - gmcSold} more to hit goal`
                : 'Goal achieved!'}
            </p>
          </div>

          {/* Buick Goal */}
          <div className="dashboard-card p-6 border-l-4 border-[#002d62]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-[#002d62]">Buick New Cars</h3>
              {isEditing && (
                <input
                  type="number"
                  value={editGoals.buickGoal}
                  onChange={(e) => setEditGoals({ ...editGoals, buickGoal: parseInt(e.target.value) || 0 })}
                  className="edit-input w-20 text-center"
                />
              )}
            </div>
            <div className="text-5xl font-bold mb-2">
              {buickSold}
              <span className="text-2xl text-[#888]">/{buickGoal}</span>
            </div>
            <div className="progress-bar h-4 mb-3">
              <div
                className={`progress-fill h-full buick-gradient rounded-full ${buickProgress >= 1 ? 'animate-pulse-glow' : ''}`}
                style={{ width: `${Math.min(100, buickProgress * 100)}%` }}
              />
            </div>
            <p className="text-[#888]">
              {buickGoal - buickSold > 0
                ? `${buickGoal - buickSold} more to hit goal`
                : 'Goal achieved!'}
            </p>
          </div>

          {/* Used Goal */}
          <div className="dashboard-card p-6 border-l-4 border-[#f59e0b]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-[#f59e0b]">Used Cars</h3>
              {isEditing && (
                <input
                  type="number"
                  value={editGoals.usedGoal}
                  onChange={(e) => setEditGoals({ ...editGoals, usedGoal: parseInt(e.target.value) || 0 })}
                  className="edit-input w-20 text-center"
                />
              )}
            </div>
            <div className="text-5xl font-bold mb-2">
              {usedSold}
              <span className="text-2xl text-[#888]">/{usedGoal}</span>
            </div>
            <div className="progress-bar h-4 mb-3">
              <div
                className={`progress-fill h-full bg-[#f59e0b] rounded-full ${usedProgress >= 1 ? 'animate-pulse-glow' : ''}`}
                style={{ width: `${Math.min(100, usedProgress * 100)}%` }}
              />
            </div>
            <p className="text-[#888]">
              {usedGoal - usedSold > 0
                ? `${usedGoal - usedSold} more to hit goal`
                : 'Goal achieved!'}
            </p>
          </div>
        </div>

        {/* Edit Controls */}
        {isEditing && (
          <div className="dashboard-card p-6 mb-8">
            <h3 className="text-lg font-semibold mb-4">D2E Bonus Settings</h3>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm text-[#888] mb-2">Bonus Amount Per Person</label>
                <div className="flex items-center">
                  <span className="text-[#22c55e] text-xl mr-2">$</span>
                  <input
                    type="number"
                    value={editGoals.bonusPerPerson}
                    onChange={(e) => setEditGoals({ ...editGoals, bonusPerPerson: parseInt(e.target.value) || 0 })}
                    className="edit-input flex-1"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-[#888] mb-2">Minimum New Car Units for Bonus</label>
                <input
                  type="number"
                  value={editGoals.minVehiclesForBonus}
                  onChange={(e) => setEditGoals({ ...editGoals, minVehiclesForBonus: parseInt(e.target.value) || 0 })}
                  className="edit-input w-full"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={handleSaveGoals}
                className="px-8 py-3 bg-[#22c55e] text-white rounded-lg font-semibold hover:bg-[#16a34a] transition-colors"
              >
                Save Goals
              </button>
            </div>
          </div>
        )}

        {/* Salesperson Bonus Eligibility */}
        <div className="dashboard-card overflow-hidden">
          <div className="p-4 border-b border-[#2a2a2a] flex items-center justify-between">
            <h2 className="text-xl font-semibold">D2E Bonus Eligibility</h2>
            <div className="text-sm text-[#888]">
              Requires: {editGoals.minVehiclesForBonus}+ new car units + both goals hit = ${editGoals.bonusPerPerson}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="tv-table">
              <thead>
                <tr>
                  <th>Salesperson</th>
                  <th className="text-center">New Units</th>
                  <th className="text-center">Goal</th>
                  <th className="text-center">Progress</th>
                  <th className="text-center">Eligible</th>
                  <th className="text-right">Bonus</th>
                </tr>
              </thead>
              <tbody>
                {data.salespeople.map((person) => (
                  <BonusRow
                    key={person.name}
                    person={person}
                    bonusAmount={editGoals.bonusPerPerson}
                    minUnits={editGoals.minVehiclesForBonus}
                    goalsHit={bothGoalsHit}
                  />
                ))}
              </tbody>
            </table>
          </div>

          {/* Summary Footer */}
          <div className="p-4 border-t border-[#2a2a2a] bg-[#1a1a1a]">
            <div className="flex items-center justify-between">
              <div className="text-[#888]">
                <span className="text-white font-semibold">
                  {data.salespeople.filter(sp => sp.newUnits >= editGoals.minVehiclesForBonus).length}
                </span> of {data.salespeople.length} salespeople meet unit requirement
              </div>
              <div className="text-right">
                <span className="text-[#888]">Total Bonus Payout:</span>
                <span className="text-[#22c55e] text-2xl font-bold ml-3">
                  ${(bothGoalsHit
                    ? data.salespeople.filter(sp => sp.newUnits >= editGoals.minVehiclesForBonus).length * editGoals.bonusPerPerson
                    : 0
                  ).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardWrapper>
  );
}

function BonusRow({
  person,
  bonusAmount,
  minUnits,
  goalsHit
}: {
  person: SalespersonMetrics;
  bonusAmount: number;
  minUnits: number;
  goalsHit: boolean;
}) {
  const meetsUnits = person.newUnits >= minUnits;
  const eligible = meetsUnits && goalsHit;
  const progress = Math.min(100, (person.newUnits / minUnits) * 100);

  return (
    <tr>
      <td>
        <div className="font-semibold">{person.nickname}</div>
        <div className="text-xs text-[#888]">{person.name}</div>
      </td>
      <td className="text-center">
        <span className="text-2xl font-bold">{person.newUnits}</span>
      </td>
      <td className="text-center text-[#888]">{minUnits}</td>
      <td className="text-center">
        <div className="w-full max-w-[120px] mx-auto">
          <div className="progress-bar h-2">
            <div
              className={`progress-fill h-full rounded-full ${
                progress >= 100 ? 'bg-[#22c55e]' : progress >= 75 ? 'bg-[#f59e0b]' : 'bg-[#888]'
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="text-xs text-[#888] mt-1">{Math.round(progress)}%</div>
        </div>
      </td>
      <td className="text-center">
        {meetsUnits ? (
          goalsHit ? (
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-[#22c55e]/20 text-[#22c55e] text-sm font-medium">
              Eligible
            </span>
          ) : (
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-[#f59e0b]/20 text-[#f59e0b] text-sm font-medium">
              Waiting
            </span>
          )
        ) : (
          <span className="text-[#888] text-sm">
            Need {minUnits - person.newUnits} more
          </span>
        )}
      </td>
      <td className="text-right">
        {eligible ? (
          <span className="text-[#22c55e] text-xl font-bold">${bonusAmount}</span>
        ) : (
          <span className="text-[#888]">$0</span>
        )}
      </td>
    </tr>
  );
}
