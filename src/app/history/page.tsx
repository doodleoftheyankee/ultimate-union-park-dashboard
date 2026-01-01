'use client';

import { useState, useEffect, useCallback } from 'react';
import DashboardWrapper from '@/components/DashboardWrapper';
import { fetchDashboardData, fetchDashboardDataForMonth, DashboardData } from '@/lib/sheets';
import { getGoals, getMonthlyArchives, addMonthlyArchive, deleteMonthlyArchive, updateArchiveNotes } from '@/lib/storage';
import { MonthlyArchive } from '@/types';

export default function HistoryPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [archives, setArchives] = useState<MonthlyArchive[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedArchive, setSelectedArchive] = useState<MonthlyArchive | null>(null);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [archiveNotes, setArchiveNotes] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [archiveMode, setArchiveMode] = useState<'current' | 'previous'>('current');

  const loadData = useCallback(async () => {
    try {
      const dashboardData = await fetchDashboardData();
      setData(dashboardData);
      const storedArchives = getMonthlyArchives();
      setArchives(storedArchives);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const getMonthName = (month: number, year: number) => {
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
                    'July', 'August', 'September', 'October', 'November', 'December'];
    return `${months[month - 1]} ${year}`;
  };

  const [archiving, setArchiving] = useState(false);

  const handleArchiveMonth = async () => {
    if (!data) return;

    setArchiving(true);

    const goals = getGoals();
    const now = new Date();

    let targetYear = now.getFullYear();
    let targetMonth = now.getMonth() + 1;

    if (archiveMode === 'previous') {
      targetMonth = now.getMonth(); // Previous month (0-indexed becomes previous)
      if (targetMonth === 0) {
        targetMonth = 12;
        targetYear--;
      }
    }

    // Fetch the correct month's data
    let monthData: DashboardData;
    if (archiveMode === 'previous') {
      // Fetch previous month data from API
      monthData = await fetchDashboardDataForMonth(targetYear, targetMonth);
    } else {
      monthData = data;
    }

    const monthId = `${targetYear}-${String(targetMonth).padStart(2, '0')}`;
    const monthName = getMonthName(targetMonth, targetYear);

    const gmcGoalHit = monthData.dealership.gmcSold >= goals.gmcGoal;
    const buickGoalHit = monthData.dealership.buickSold >= goals.buickGoal;
    const usedGoalHit = monthData.dealership.totalUsedUnits >= goals.usedGoal;

    const archive: MonthlyArchive = {
      id: monthId,
      monthName: monthName,
      year: targetYear,
      month: targetMonth,
      archivedAt: new Date().toISOString(),
      goals: {
        gmcGoal: goals.gmcGoal,
        buickGoal: goals.buickGoal,
        usedGoal: goals.usedGoal,
        totalGrossGoal: goals.totalGrossGoal,
        bonusPerPerson: goals.bonusPerPerson,
        minVehiclesForBonus: goals.minVehiclesForBonus,
      },
      results: {
        gmcSold: monthData.dealership.gmcSold,
        buickSold: monthData.dealership.buickSold,
        usedSold: monthData.dealership.totalUsedUnits,
        totalNewUnits: monthData.dealership.totalNewUnits,
        totalUnits: monthData.dealership.totalUnits,
        totalProfit: monthData.dealership.totalProfit,
        totalFrontEnd: monthData.dealership.totalFrontEnd,
        totalBackEnd: monthData.dealership.totalBackEnd,
        avgProfit: monthData.dealership.avgProfit,
        gmcGoalHit,
        buickGoalHit,
        usedGoalHit,
        d2eBonusUnlocked: gmcGoalHit && buickGoalHit,
      },
      salespeople: monthData.salespeople.map(sp => ({
        name: sp.name,
        nickname: sp.nickname,
        newUnits: sp.newUnits,
        usedUnits: sp.usedUnits,
        totalUnits: sp.totalUnits,
        gmcUnits: sp.gmcUnits,
        buickUnits: sp.buickUnits,
        totalProfit: sp.totalProfit,
        frontEndProfit: sp.frontEndProfit,
        backEndProfit: sp.backEndProfit,
        bonusEligible: sp.bonusEligible,
        bonusAmount: sp.bonusAmount,
      })),
      notes: archiveNotes,
    };

    addMonthlyArchive(archive);
    setArchives(getMonthlyArchives());
    setShowArchiveModal(false);
    setArchiveNotes('');
    setArchiveMode('current');
    setArchiving(false);
  };

  const handleDeleteArchive = (id: string) => {
    deleteMonthlyArchive(id);
    setArchives(getMonthlyArchives());
    setConfirmDelete(null);
    if (selectedArchive?.id === id) {
      setSelectedArchive(null);
    }
  };

  const handleUpdateNotes = (id: string, notes: string) => {
    updateArchiveNotes(id, notes);
    setArchives(getMonthlyArchives());
    if (selectedArchive?.id === id) {
      setSelectedArchive({ ...selectedArchive, notes });
    }
  };

  if (loading) {
    return (
      <DashboardWrapper>
        <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-[#c41230] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-[#888]">Loading history...</p>
          </div>
        </div>
      </DashboardWrapper>
    );
  }

  return (
    <DashboardWrapper>
      <div className="max-w-[1920px] mx-auto px-6 py-8 pb-20">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Monthly History</h1>
            <p className="text-[#888] mt-1">Archive and view past month performance</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => { setArchiveMode('previous'); setShowArchiveModal(true); }}
              className="px-5 py-3 bg-[#2a2a2a] text-white rounded-lg font-semibold hover:bg-[#3a3a3a] transition-colors border border-[#444]"
            >
              Archive Previous Month
            </button>
            <button
              onClick={() => { setArchiveMode('current'); setShowArchiveModal(true); }}
              className="px-5 py-3 bg-[#c41230] text-white rounded-lg font-semibold hover:bg-[#9a0e26] transition-colors"
            >
              Archive Current Month
            </button>
          </div>
        </div>

        {/* Archive List */}
        {archives.length === 0 ? (
          <div className="dashboard-card p-12 text-center">
            <div className="text-6xl mb-4">📁</div>
            <h3 className="text-xl font-semibold mb-2">No Archives Yet</h3>
            <p className="text-[#888] mb-6">Archive your monthly data to track performance over time.</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => { setArchiveMode('previous'); setShowArchiveModal(true); }}
                className="px-5 py-3 bg-[#2a2a2a] text-white rounded-lg font-semibold hover:bg-[#3a3a3a] transition-colors border border-[#444]"
              >
                Archive Previous Month
              </button>
              <button
                onClick={() => { setArchiveMode('current'); setShowArchiveModal(true); }}
                className="px-5 py-3 bg-[#c41230] text-white rounded-lg font-semibold hover:bg-[#9a0e26] transition-colors"
              >
                Archive Current Month
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Archive Cards */}
            <div className="lg:col-span-1">
              <div className="dashboard-card overflow-hidden">
                <div className="p-4 border-b border-[#2a2a2a]">
                  <h2 className="text-lg font-semibold">Archived Months</h2>
                </div>
                <div className="divide-y divide-[#2a2a2a] max-h-[600px] overflow-y-auto">
                  {archives.map((archive) => (
                    <div
                      key={archive.id}
                      className={`p-4 cursor-pointer transition-colors hover:bg-[#2a2a2a] ${
                        selectedArchive?.id === archive.id ? 'bg-[#2a2a2a] border-l-4 border-[#c41230]' : ''
                      }`}
                      onClick={() => setSelectedArchive(archive)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold">{archive.monthName}</div>
                          <div className="text-sm text-[#888]">
                            Archived {new Date(archive.archivedAt).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {archive.results.d2eBonusUnlocked && (
                            <span className="px-2 py-1 bg-[#22c55e]/20 text-[#22c55e] text-xs rounded-full">
                              D2E
                            </span>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setConfirmDelete(archive.id);
                            }}
                            className="p-1 text-[#888] hover:text-[#ef4444] transition-colors"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                      <div className="flex gap-4 mt-2 text-sm">
                        <span className={archive.results.gmcGoalHit ? 'text-[#22c55e]' : 'text-[#888]'}>
                          GMC: {archive.results.gmcSold}/{archive.goals.gmcGoal}
                        </span>
                        <span className={archive.results.buickGoalHit ? 'text-[#22c55e]' : 'text-[#888]'}>
                          Buick: {archive.results.buickSold}/{archive.goals.buickGoal}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Selected Archive Details */}
            <div className="lg:col-span-2">
              {selectedArchive ? (
                <div className="space-y-6">
                  {/* Summary Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="dashboard-card p-4 text-center">
                      <div className="text-sm text-[#888]">Total Units</div>
                      <div className="text-3xl font-bold">{selectedArchive.results.totalUnits}</div>
                    </div>
                    <div className="dashboard-card p-4 text-center">
                      <div className="text-sm text-[#888]">Total Gross</div>
                      <div className="text-3xl font-bold text-[#22c55e]">
                        ${selectedArchive.results.totalProfit.toLocaleString()}
                      </div>
                    </div>
                    <div className="dashboard-card p-4 text-center">
                      <div className="text-sm text-[#888]">Avg Per Deal</div>
                      <div className="text-3xl font-bold">
                        ${Math.round(selectedArchive.results.avgProfit).toLocaleString()}
                      </div>
                    </div>
                    <div className="dashboard-card p-4 text-center">
                      <div className="text-sm text-[#888]">D2E Status</div>
                      <div className={`text-2xl font-bold ${selectedArchive.results.d2eBonusUnlocked ? 'text-[#22c55e]' : 'text-[#ef4444]'}`}>
                        {selectedArchive.results.d2eBonusUnlocked ? 'UNLOCKED' : 'NOT MET'}
                      </div>
                    </div>
                  </div>

                  {/* Goal Results */}
                  <div className="dashboard-card p-6">
                    <h3 className="text-lg font-semibold mb-4">Goal Results</h3>
                    <div className="grid grid-cols-3 gap-6">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[#c41230] font-medium">GMC</span>
                          <span className={selectedArchive.results.gmcGoalHit ? 'text-[#22c55e]' : 'text-[#ef4444]'}>
                            {selectedArchive.results.gmcGoalHit ? 'HIT' : 'MISSED'}
                          </span>
                        </div>
                        <div className="text-2xl font-bold">
                          {selectedArchive.results.gmcSold} / {selectedArchive.goals.gmcGoal}
                        </div>
                        <div className="progress-bar h-2 mt-2">
                          <div
                            className={`progress-fill h-full rounded-full ${selectedArchive.results.gmcGoalHit ? 'bg-[#22c55e]' : 'bg-[#c41230]'}`}
                            style={{ width: `${Math.min(100, (selectedArchive.results.gmcSold / selectedArchive.goals.gmcGoal) * 100)}%` }}
                          />
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[#002d62] font-medium">Buick</span>
                          <span className={selectedArchive.results.buickGoalHit ? 'text-[#22c55e]' : 'text-[#ef4444]'}>
                            {selectedArchive.results.buickGoalHit ? 'HIT' : 'MISSED'}
                          </span>
                        </div>
                        <div className="text-2xl font-bold">
                          {selectedArchive.results.buickSold} / {selectedArchive.goals.buickGoal}
                        </div>
                        <div className="progress-bar h-2 mt-2">
                          <div
                            className={`progress-fill h-full rounded-full ${selectedArchive.results.buickGoalHit ? 'bg-[#22c55e]' : 'bg-[#002d62]'}`}
                            style={{ width: `${Math.min(100, (selectedArchive.results.buickSold / selectedArchive.goals.buickGoal) * 100)}%` }}
                          />
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[#f59e0b] font-medium">Used</span>
                          <span className={selectedArchive.results.usedGoalHit ? 'text-[#22c55e]' : 'text-[#ef4444]'}>
                            {selectedArchive.results.usedGoalHit ? 'HIT' : 'MISSED'}
                          </span>
                        </div>
                        <div className="text-2xl font-bold">
                          {selectedArchive.results.usedSold} / {selectedArchive.goals.usedGoal}
                        </div>
                        <div className="progress-bar h-2 mt-2">
                          <div
                            className={`progress-fill h-full rounded-full ${selectedArchive.results.usedGoalHit ? 'bg-[#22c55e]' : 'bg-[#f59e0b]'}`}
                            style={{ width: `${Math.min(100, (selectedArchive.results.usedSold / selectedArchive.goals.usedGoal) * 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Salesperson Performance */}
                  <div className="dashboard-card overflow-hidden">
                    <div className="p-4 border-b border-[#2a2a2a]">
                      <h3 className="text-lg font-semibold">Salesperson Performance</h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="tv-table">
                        <thead>
                          <tr>
                            <th>Salesperson</th>
                            <th className="text-center">New</th>
                            <th className="text-center">Used</th>
                            <th className="text-center">Total</th>
                            <th className="text-right">Front</th>
                            <th className="text-right">Back</th>
                            <th className="text-right">Total Gross</th>
                            <th className="text-center">D2E Bonus</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedArchive.salespeople
                            .sort((a, b) => b.totalUnits - a.totalUnits)
                            .map((person, index) => (
                              <tr key={person.name}>
                                <td>
                                  <div className="flex items-center gap-2">
                                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                      index === 0 ? 'bg-[#c5a04f] text-black' :
                                      index === 1 ? 'bg-[#888] text-black' :
                                      index === 2 ? 'bg-[#cd7f32] text-black' :
                                      'bg-[#2a2a2a] text-white'
                                    }`}>
                                      {index + 1}
                                    </span>
                                    <div>
                                      <div className="font-semibold">{person.nickname}</div>
                                      <div className="text-xs text-[#888]">{person.name}</div>
                                    </div>
                                  </div>
                                </td>
                                <td className="text-center">{person.newUnits}</td>
                                <td className="text-center">{person.usedUnits}</td>
                                <td className="text-center font-bold">{person.totalUnits}</td>
                                <td className="text-right">${person.frontEndProfit.toLocaleString()}</td>
                                <td className="text-right">${person.backEndProfit.toLocaleString()}</td>
                                <td className="text-right text-[#22c55e] font-semibold">
                                  ${person.totalProfit.toLocaleString()}
                                </td>
                                <td className="text-center">
                                  {person.bonusEligible ? (
                                    <span className="text-[#22c55e] font-bold">${person.bonusAmount}</span>
                                  ) : (
                                    <span className="text-[#888]">-</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Notes Section */}
                  <div className="dashboard-card p-6">
                    <h3 className="text-lg font-semibold mb-4">Notes</h3>
                    <textarea
                      value={selectedArchive.notes || ''}
                      onChange={(e) => handleUpdateNotes(selectedArchive.id, e.target.value)}
                      placeholder="Add notes about this month..."
                      className="w-full h-24 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-3 text-white resize-none focus:outline-none focus:border-[#c41230]"
                    />
                  </div>
                </div>
              ) : (
                <div className="dashboard-card p-12 text-center">
                  <div className="text-6xl mb-4">👈</div>
                  <h3 className="text-xl font-semibold mb-2">Select a Month</h3>
                  <p className="text-[#888]">Click on an archived month to view details.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Archive Month Modal */}
        {showArchiveModal && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
            <div className="dashboard-card p-6 max-w-lg w-full mx-4">
              <h2 className="text-xl font-semibold mb-4">
                Archive {archiveMode === 'previous' ? 'Previous' : 'Current'} Month
              </h2>
              <p className="text-[#888] mb-4">
                This will save the current data as{' '}
                <span className="text-white font-semibold">
                  {archiveMode === 'previous'
                    ? getMonthName(
                        new Date().getMonth() === 0 ? 12 : new Date().getMonth(),
                        new Date().getMonth() === 0 ? new Date().getFullYear() - 1 : new Date().getFullYear()
                      )
                    : data?.monthName
                  }
                </span>{' '}
                to your history.
              </p>

              {data && (
                <div className="bg-[#1a1a1a] rounded-lg p-4 mb-4">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-sm text-[#888]">GMC</div>
                      <div className="text-xl font-bold">{data.dealership.gmcSold}</div>
                    </div>
                    <div>
                      <div className="text-sm text-[#888]">Buick</div>
                      <div className="text-xl font-bold">{data.dealership.buickSold}</div>
                    </div>
                    <div>
                      <div className="text-sm text-[#888]">Used</div>
                      <div className="text-xl font-bold">{data.dealership.totalUsedUnits}</div>
                    </div>
                  </div>
                </div>
              )}

              <div className="mb-4">
                <label className="block text-sm text-[#888] mb-2">Notes (optional)</label>
                <textarea
                  value={archiveNotes}
                  onChange={(e) => setArchiveNotes(e.target.value)}
                  placeholder="Add any notes about this month..."
                  className="w-full h-24 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-3 text-white resize-none focus:outline-none focus:border-[#c41230]"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowArchiveModal(false)}
                  disabled={archiving}
                  className="flex-1 px-4 py-3 bg-[#2a2a2a] text-white rounded-lg font-semibold hover:bg-[#3a3a3a] transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleArchiveMonth}
                  disabled={archiving}
                  className="flex-1 px-4 py-3 bg-[#22c55e] text-white rounded-lg font-semibold hover:bg-[#16a34a] transition-colors disabled:opacity-50"
                >
                  {archiving ? 'Fetching Data...' : 'Save Archive'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {confirmDelete && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
            <div className="dashboard-card p-6 max-w-md w-full mx-4">
              <h2 className="text-xl font-semibold mb-4">Delete Archive?</h2>
              <p className="text-[#888] mb-6">
                Are you sure you want to delete this archive? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmDelete(null)}
                  className="flex-1 px-4 py-3 bg-[#2a2a2a] text-white rounded-lg font-semibold hover:bg-[#3a3a3a] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteArchive(confirmDelete)}
                  className="flex-1 px-4 py-3 bg-[#ef4444] text-white rounded-lg font-semibold hover:bg-[#dc2626] transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardWrapper>
  );
}
