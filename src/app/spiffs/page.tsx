'use client';

import { useState, useEffect } from 'react';
import DashboardWrapper from '@/components/DashboardWrapper';
import { getSpiffs, saveSpiffs, getContests, saveContests } from '@/lib/storage';
import { SpiffCar, WeeklyContestConfig } from '@/types';

export default function SpiffsPage() {
  const [spiffs, setSpiffs] = useState<SpiffCar[]>([]);
  const [contests, setContests] = useState<WeeklyContestConfig[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingContestId, setEditingContestId] = useState<string | null>(null);
  const [newSpiff, setNewSpiff] = useState<Partial<SpiffCar>>({
    stockNumber: '',
    vehicle: '',
    brand: 'GMC',
    age: 0,
    spiffAmount: 0,
    msrp: 0,
    notes: '',
  });
  const [newContest, setNewContest] = useState<Partial<WeeklyContestConfig>>({
    name: '',
    description: '',
    bonusAmount: 250,
    metric: 'units',
    isActive: true,
  });

  useEffect(() => {
    setSpiffs(getSpiffs());
    setContests(getContests());
  }, []);

  // Contest handlers
  const handleAddContest = () => {
    if (!newContest.name) return;

    const contest: WeeklyContestConfig = {
      id: Date.now().toString(),
      name: newContest.name || '',
      description: newContest.description || '',
      bonusAmount: newContest.bonusAmount || 250,
      metric: newContest.metric || 'units',
      isActive: newContest.isActive ?? true,
      createdAt: new Date().toISOString(),
    };

    const updated = [...contests, contest];
    setContests(updated);
    saveContests(updated);
    setNewContest({
      name: '',
      description: '',
      bonusAmount: 250,
      metric: 'units',
      isActive: true,
    });
  };

  const handleSaveContest = (contest: WeeklyContestConfig) => {
    const updated = contests.map((c) => (c.id === contest.id ? contest : c));
    setContests(updated);
    saveContests(updated);
    setEditingContestId(null);
  };

  const handleDeleteContest = (id: string) => {
    const updated = contests.filter((c) => c.id !== id);
    setContests(updated);
    saveContests(updated);
  };

  const handleToggleContest = (id: string) => {
    const updated = contests.map((c) =>
      c.id === id ? { ...c, isActive: !c.isActive } : c
    );
    setContests(updated);
    saveContests(updated);
  };

  const handleSaveSpiff = (spiff: SpiffCar) => {
    const updated = spiffs.map((s) => (s.id === spiff.id ? spiff : s));
    setSpiffs(updated);
    saveSpiffs(updated);
    setEditingId(null);
  };

  const handleAddSpiff = () => {
    if (!newSpiff.stockNumber || !newSpiff.vehicle) return;

    const spiff: SpiffCar = {
      id: Date.now().toString(),
      stockNumber: newSpiff.stockNumber || '',
      vehicle: newSpiff.vehicle || '',
      brand: (newSpiff.brand as 'GMC' | 'Buick') || 'GMC',
      age: newSpiff.age || 0,
      spiffAmount: newSpiff.spiffAmount || 0,
      msrp: newSpiff.msrp || 0,
      notes: newSpiff.notes,
    };

    const updated = [...spiffs, spiff];
    setSpiffs(updated);
    saveSpiffs(updated);
    setNewSpiff({
      stockNumber: '',
      vehicle: '',
      brand: 'GMC',
      age: 0,
      spiffAmount: 0,
      msrp: 0,
      notes: '',
    });
    setIsEditing(false);
  };

  const handleDeleteSpiff = (id: string) => {
    const updated = spiffs.filter((s) => s.id !== id);
    setSpiffs(updated);
    saveSpiffs(updated);
  };

  // Sort by age (oldest first)
  const sortedSpiffs = [...spiffs].sort((a, b) => b.age - a.age);

  return (
    <DashboardWrapper>
      <div className="max-w-[1920px] mx-auto px-6 py-8 pb-20">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Spiff Cars</h1>
            <p className="text-[#888] mt-1">Old age inventory with bonus incentives</p>
          </div>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              isEditing
                ? 'bg-[#888] text-white'
                : 'bg-[#c41230] text-white hover:bg-[#9a0e26]'
            }`}
          >
            {isEditing ? 'Done' : 'Edit Spiffs'}
          </button>
        </div>

        {/* Spiff Info Banner */}
        <div className="mb-8 p-6 rounded-xl bg-gradient-to-r from-[#c41230]/20 to-[#c5a04f]/20 border border-[#c41230]/50">
          <div className="flex items-center gap-4">
            <div className="text-4xl">💰</div>
            <div>
              <h2 className="text-xl font-bold text-[#c5a04f]">SPIFF BONUS PROGRAM</h2>
              <p className="text-[#888]">
                Sell these aged units and earn EXTRA cash on top of your regular commission!
              </p>
            </div>
          </div>
        </div>

        {/* Weekly Contests Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <span>🏆</span> Weekly Contests
            </h2>
          </div>

          {/* Active Contests */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-6">
            {contests.filter(c => c.isActive).map((contest) => (
              <div
                key={contest.id}
                className="dashboard-card p-6 border-2 border-[#f59e0b]/30 bg-gradient-to-br from-[#1a1a1a] to-[#0d0d0d]"
              >
                {editingContestId === contest.id ? (
                  <ContestEditForm
                    contest={contest}
                    onSave={handleSaveContest}
                    onCancel={() => setEditingContestId(null)}
                  />
                ) : (
                  <>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-bold text-[#f59e0b]">{contest.name}</h3>
                      <div className="text-2xl font-black text-[#22c55e]">${contest.bonusAmount}</div>
                    </div>
                    <p className="text-[#888] text-sm mb-4">{contest.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs px-3 py-1 rounded-full bg-[#f59e0b]/20 text-[#f59e0b] uppercase font-bold">
                        {contest.metric === 'units' ? '📊 Most Units' :
                         contest.metric === 'gross' ? '💰 Highest Gross' :
                         contest.metric === 'frontEnd' ? '🔵 Best Front End' :
                         '🟣 Best Back End'}
                      </span>
                      {isEditing && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => setEditingContestId(contest.id)}
                            className="text-xs px-3 py-1 bg-[#2a2a2a] rounded hover:bg-[#3a3a3a]"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleToggleContest(contest.id)}
                            className="text-xs px-3 py-1 bg-[#888] text-white rounded hover:bg-[#666]"
                          >
                            Pause
                          </button>
                          <button
                            onClick={() => handleDeleteContest(contest.id)}
                            className="text-xs px-3 py-1 bg-[#ef4444] text-white rounded hover:bg-[#dc2626]"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            ))}

            {/* Add New Contest Card (when editing) */}
            {isEditing && (
              <div className="dashboard-card p-6 border-2 border-dashed border-[#2a2a2a]">
                <h3 className="text-lg font-semibold mb-4 text-[#888]">Add New Contest</h3>
                <div className="space-y-3">
                  <input
                    type="text"
                    value={newContest.name}
                    onChange={(e) => setNewContest({ ...newContest, name: e.target.value })}
                    placeholder="Contest Name"
                    className="edit-input w-full"
                  />
                  <input
                    type="text"
                    value={newContest.description}
                    onChange={(e) => setNewContest({ ...newContest, description: e.target.value })}
                    placeholder="Description"
                    className="edit-input w-full"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-[#888]">Bonus $</label>
                      <input
                        type="number"
                        value={newContest.bonusAmount}
                        onChange={(e) => setNewContest({ ...newContest, bonusAmount: parseInt(e.target.value) || 0 })}
                        className="edit-input w-full"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-[#888]">Metric</label>
                      <select
                        value={newContest.metric}
                        onChange={(e) => setNewContest({ ...newContest, metric: e.target.value as 'units' | 'gross' | 'frontEnd' | 'backEnd' })}
                        className="edit-input w-full"
                      >
                        <option value="units">Most Units</option>
                        <option value="gross">Highest Gross</option>
                        <option value="frontEnd">Best Front End</option>
                        <option value="backEnd">Best Back End</option>
                      </select>
                    </div>
                  </div>
                  <button
                    onClick={handleAddContest}
                    disabled={!newContest.name}
                    className="w-full py-2 bg-[#22c55e] text-white rounded-lg font-semibold hover:bg-[#16a34a] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Add Contest
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Paused Contests (when editing) */}
          {isEditing && contests.filter(c => !c.isActive).length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm text-[#888] uppercase tracking-wide mb-3">Paused Contests</h4>
              <div className="flex flex-wrap gap-3">
                {contests.filter(c => !c.isActive).map((contest) => (
                  <div key={contest.id} className="flex items-center gap-2 px-4 py-2 bg-[#1a1a1a] rounded-lg">
                    <span className="text-[#888]">{contest.name}</span>
                    <button
                      onClick={() => handleToggleContest(contest.id)}
                      className="text-xs px-2 py-1 bg-[#22c55e] text-white rounded"
                    >
                      Activate
                    </button>
                    <button
                      onClick={() => handleDeleteContest(contest.id)}
                      className="text-xs px-2 py-1 bg-[#ef4444] text-white rounded"
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {contests.length === 0 && !isEditing && (
            <div className="text-center py-8 text-[#888]">
              <p>No active contests. Click &quot;Edit Spiffs&quot; to add one!</p>
            </div>
          )}
        </div>

        {/* Add New Spiff Form */}
        {isEditing && (
          <div className="dashboard-card p-6 mb-8">
            <h3 className="text-lg font-semibold mb-4">Add New Spiff Car</h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm text-[#888] mb-2">Stock Number</label>
                <input
                  type="text"
                  value={newSpiff.stockNumber}
                  onChange={(e) => setNewSpiff({ ...newSpiff, stockNumber: e.target.value })}
                  placeholder="G25001"
                  className="edit-input w-full"
                />
              </div>
              <div className="lg:col-span-2">
                <label className="block text-sm text-[#888] mb-2">Vehicle</label>
                <input
                  type="text"
                  value={newSpiff.vehicle}
                  onChange={(e) => setNewSpiff({ ...newSpiff, vehicle: e.target.value })}
                  placeholder="2024 GMC Sierra 1500 Denali"
                  className="edit-input w-full"
                />
              </div>
              <div>
                <label className="block text-sm text-[#888] mb-2">Brand</label>
                <select
                  value={newSpiff.brand}
                  onChange={(e) => setNewSpiff({ ...newSpiff, brand: e.target.value as 'GMC' | 'Buick' })}
                  className="edit-input w-full"
                >
                  <option value="GMC">GMC</option>
                  <option value="Buick">Buick</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-[#888] mb-2">Age (Days)</label>
                <input
                  type="number"
                  value={newSpiff.age}
                  onChange={(e) => setNewSpiff({ ...newSpiff, age: parseInt(e.target.value) || 0 })}
                  className="edit-input w-full"
                />
              </div>
              <div>
                <label className="block text-sm text-[#888] mb-2">Spiff Amount</label>
                <div className="flex items-center">
                  <span className="text-[#22c55e] text-lg mr-2">$</span>
                  <input
                    type="number"
                    value={newSpiff.spiffAmount}
                    onChange={(e) => setNewSpiff({ ...newSpiff, spiffAmount: parseInt(e.target.value) || 0 })}
                    className="edit-input flex-1"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-[#888] mb-2">MSRP</label>
                <div className="flex items-center">
                  <span className="text-[#888] text-lg mr-2">$</span>
                  <input
                    type="number"
                    value={newSpiff.msrp}
                    onChange={(e) => setNewSpiff({ ...newSpiff, msrp: parseInt(e.target.value) || 0 })}
                    className="edit-input flex-1"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-[#888] mb-2">Notes</label>
                <input
                  type="text"
                  value={newSpiff.notes}
                  onChange={(e) => setNewSpiff({ ...newSpiff, notes: e.target.value })}
                  placeholder="Optional notes..."
                  className="edit-input w-full"
                />
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={handleAddSpiff}
                disabled={!newSpiff.stockNumber || !newSpiff.vehicle}
                className="px-6 py-2 bg-[#22c55e] text-white rounded-lg font-semibold hover:bg-[#16a34a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Spiff Car
              </button>
            </div>
          </div>
        )}

        {/* Spiff Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {sortedSpiffs.map((spiff, index) => (
            <SpiffCard
              key={spiff.id}
              spiff={spiff}
              rank={index + 1}
              isEditing={isEditing}
              isEditingThis={editingId === spiff.id}
              onEdit={() => setEditingId(spiff.id)}
              onSave={handleSaveSpiff}
              onDelete={() => handleDeleteSpiff(spiff.id)}
              onCancel={() => setEditingId(null)}
            />
          ))}
        </div>

        {spiffs.length === 0 && (
          <div className="text-center py-20 text-[#888]">
            <div className="text-6xl mb-4">🚗</div>
            <p className="text-xl">No spiff cars configured</p>
            <p className="mt-2">Click &quot;Edit Spiffs&quot; to add aged inventory with bonus incentives</p>
          </div>
        )}
      </div>
    </DashboardWrapper>
  );
}

function SpiffCard({
  spiff,
  rank,
  isEditing,
  isEditingThis,
  onEdit,
  onSave,
  onDelete,
  onCancel,
}: {
  spiff: SpiffCar;
  rank: number;
  isEditing: boolean;
  isEditingThis: boolean;
  onEdit: () => void;
  onSave: (spiff: SpiffCar) => void;
  onDelete: () => void;
  onCancel: () => void;
}) {
  const [editData, setEditData] = useState(spiff);

  useEffect(() => {
    setEditData(spiff);
  }, [spiff]);

  const getAgeColor = () => {
    if (spiff.age >= 120) return 'text-[#ef4444]';
    if (spiff.age >= 90) return 'text-[#f59e0b]';
    return 'text-[#eab308]';
  };

  const getAgeBadgeColor = () => {
    if (spiff.age >= 120) return 'bg-[#ef4444]';
    if (spiff.age >= 90) return 'bg-[#f59e0b]';
    return 'bg-[#eab308]';
  };

  if (isEditingThis) {
    return (
      <div className="spiff-card p-6">
        <div className="space-y-4">
          <input
            type="text"
            value={editData.stockNumber}
            onChange={(e) => setEditData({ ...editData, stockNumber: e.target.value })}
            className="edit-input w-full text-lg font-bold"
            placeholder="Stock Number"
          />
          <input
            type="text"
            value={editData.vehicle}
            onChange={(e) => setEditData({ ...editData, vehicle: e.target.value })}
            className="edit-input w-full"
            placeholder="Vehicle"
          />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-[#888]">Age (Days)</label>
              <input
                type="number"
                value={editData.age}
                onChange={(e) => setEditData({ ...editData, age: parseInt(e.target.value) || 0 })}
                className="edit-input w-full"
              />
            </div>
            <div>
              <label className="text-xs text-[#888]">Spiff $</label>
              <input
                type="number"
                value={editData.spiffAmount}
                onChange={(e) => setEditData({ ...editData, spiffAmount: parseInt(e.target.value) || 0 })}
                className="edit-input w-full"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => onSave(editData)}
              className="flex-1 py-2 bg-[#22c55e] text-white rounded-lg font-semibold"
            >
              Save
            </button>
            <button
              onClick={onCancel}
              className="flex-1 py-2 bg-[#2a2a2a] text-white rounded-lg"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="spiff-card p-6 relative animate-fade-in" style={{ animationDelay: `${rank * 100}ms` }}>
      {/* Rank Badge */}
      <div className="absolute -top-3 -left-3 w-10 h-10 rounded-full bg-[#c41230] flex items-center justify-center text-white font-bold text-lg shadow-lg">
        #{rank}
      </div>

      {/* Age Badge */}
      <div className={`absolute -top-3 -right-3 px-3 py-1 rounded-full ${getAgeBadgeColor()} text-white text-sm font-bold shadow-lg`}>
        {spiff.age} DAYS
      </div>

      {/* Brand Badge */}
      <div className={`inline-block px-3 py-1 rounded-full text-xs font-bold mb-3 ${
        spiff.brand === 'GMC' ? 'bg-[#c41230]/20 text-[#c41230]' : 'bg-[#002d62]/20 text-[#c5a04f]'
      }`}>
        {spiff.brand}
      </div>

      {/* Stock Number */}
      <div className="text-2xl font-bold text-[#c5a04f] mb-2">#{spiff.stockNumber}</div>

      {/* Vehicle */}
      <div className="text-lg font-semibold mb-4 leading-tight">{spiff.vehicle}</div>

      {/* Spiff Amount */}
      <div className="bg-[#22c55e]/20 border border-[#22c55e] rounded-lg p-4 text-center mb-4">
        <div className="text-sm text-[#22c55e] font-medium">SPIFF BONUS</div>
        <div className="text-4xl font-bold text-[#22c55e]">${spiff.spiffAmount}</div>
      </div>

      {/* Details */}
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-[#888]">MSRP</span>
          <span className="font-semibold">${spiff.msrp.toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[#888]">Age</span>
          <span className={`font-semibold ${getAgeColor()}`}>{spiff.age} days</span>
        </div>
        {spiff.notes && (
          <div className="pt-2 border-t border-[#2a2a2a]">
            <p className="text-[#888] text-xs">{spiff.notes}</p>
          </div>
        )}
      </div>

      {/* Edit Controls */}
      {isEditing && (
        <div className="mt-4 pt-4 border-t border-[#2a2a2a] flex gap-2">
          <button
            onClick={onEdit}
            className="flex-1 py-2 bg-[#2a2a2a] text-white rounded-lg text-sm hover:bg-[#3a3a3a] transition-colors"
          >
            Edit
          </button>
          <button
            onClick={onDelete}
            className="px-4 py-2 bg-[#ef4444] text-white rounded-lg text-sm hover:bg-[#dc2626] transition-colors"
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
}

function ContestEditForm({
  contest,
  onSave,
  onCancel,
}: {
  contest: WeeklyContestConfig;
  onSave: (contest: WeeklyContestConfig) => void;
  onCancel: () => void;
}) {
  const [editData, setEditData] = useState(contest);

  return (
    <div className="space-y-3">
      <input
        type="text"
        value={editData.name}
        onChange={(e) => setEditData({ ...editData, name: e.target.value })}
        placeholder="Contest Name"
        className="edit-input w-full font-bold"
      />
      <input
        type="text"
        value={editData.description}
        onChange={(e) => setEditData({ ...editData, description: e.target.value })}
        placeholder="Description"
        className="edit-input w-full"
      />
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-[#888]">Bonus $</label>
          <input
            type="number"
            value={editData.bonusAmount}
            onChange={(e) => setEditData({ ...editData, bonusAmount: parseInt(e.target.value) || 0 })}
            className="edit-input w-full"
          />
        </div>
        <div>
          <label className="text-xs text-[#888]">Metric</label>
          <select
            value={editData.metric}
            onChange={(e) => setEditData({ ...editData, metric: e.target.value as 'units' | 'gross' | 'frontEnd' | 'backEnd' })}
            className="edit-input w-full"
          >
            <option value="units">Most Units</option>
            <option value="gross">Highest Gross</option>
            <option value="frontEnd">Best Front End</option>
            <option value="backEnd">Best Back End</option>
          </select>
        </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => onSave(editData)}
          className="flex-1 py-2 bg-[#22c55e] text-white rounded-lg font-semibold"
        >
          Save
        </button>
        <button
          onClick={onCancel}
          className="flex-1 py-2 bg-[#2a2a2a] text-white rounded-lg"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
