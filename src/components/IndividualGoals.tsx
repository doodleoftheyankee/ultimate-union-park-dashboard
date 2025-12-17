'use client';

import { useState, useEffect } from 'react';
import { SalespersonMetrics } from '@/lib/sheets';
import { getIndividualGoals, saveIndividualGoal, IndividualGoal } from '@/lib/storage';

interface IndividualGoalsProps {
  salespeople: SalespersonMetrics[];
  editable?: boolean;
}

export default function IndividualGoals({ salespeople, editable = false }: IndividualGoalsProps) {
  const [goals, setGoals] = useState<Record<string, IndividualGoal>>({});
  const [editingPerson, setEditingPerson] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<number>(8);

  useEffect(() => {
    setGoals(getIndividualGoals());
  }, []);

  const handleSaveGoal = (name: string) => {
    saveIndividualGoal(name, { targetUnits: editValue });
    setGoals(getIndividualGoals());
    setEditingPerson(null);
  };

  const getGoalForPerson = (name: string): number => {
    return goals[name]?.targetUnits || 8;
  };

  const sortedSalespeople = [...salespeople].sort((a, b) => b.totalUnits - a.totalUnits);

  return (
    <div className="dashboard-card overflow-hidden">
      <div className="p-4 border-b border-[#2a2a2a] flex items-center justify-between">
        <h3 className="text-lg font-semibold">Individual Goals</h3>
        {editable && (
          <span className="text-xs text-[#888]">Click target to edit</span>
        )}
      </div>
      <div className="divide-y divide-[#2a2a2a]">
        {sortedSalespeople.map((person) => {
          const goal = getGoalForPerson(person.name);
          const progress = (person.totalUnits / goal) * 100;
          const isOnTrack = progress >= 100;
          const isEditing = editingPerson === person.name;

          return (
            <div key={person.name} className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <span className="font-semibold">{person.nickname}</span>
                  {isOnTrack && (
                    <span className="text-xs px-2 py-0.5 bg-[#22c55e]/20 text-[#22c55e] rounded-full font-medium">
                      GOAL HIT!
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-bold">{person.totalUnits}</span>
                  <span className="text-[#888]">/</span>
                  {editable && isEditing ? (
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        value={editValue}
                        onChange={(e) => setEditValue(Number(e.target.value))}
                        className="w-16 px-2 py-1 bg-[#1a1a1a] border border-[#3a3a3a] rounded text-center text-lg font-bold"
                        min={1}
                        max={50}
                        autoFocus
                      />
                      <button
                        onClick={() => handleSaveGoal(person.name)}
                        className="px-2 py-1 bg-[#22c55e] text-white rounded text-xs font-medium"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingPerson(null)}
                        className="px-2 py-1 bg-[#2a2a2a] text-[#888] rounded text-xs"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <span
                      className={`text-lg font-bold ${editable ? 'cursor-pointer hover:text-[#c41230]' : ''}`}
                      onClick={() => {
                        if (editable) {
                          setEditingPerson(person.name);
                          setEditValue(goal);
                        }
                      }}
                    >
                      {goal}
                    </span>
                  )}
                </div>
              </div>
              <div className="progress-bar h-3">
                <div
                  className={`progress-fill h-full rounded-full transition-all duration-500 ${
                    isOnTrack ? 'bg-[#22c55e]' : 'gmc-gradient'
                  }`}
                  style={{ width: `${Math.min(100, progress)}%` }}
                />
              </div>
              <div className="flex justify-between mt-1 text-xs text-[#888]">
                <span>{Math.round(progress)}% complete</span>
                {!isOnTrack && <span>{goal - person.totalUnits} to go</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Compact version for the leaderboard sidebar
export function IndividualGoalsBadge({ person, goal }: { person: SalespersonMetrics; goal: number }) {
  const progress = (person.totalUnits / goal) * 100;
  const isOnTrack = progress >= 100;

  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-2 bg-[#1a1a1a] rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${isOnTrack ? 'bg-[#22c55e]' : 'bg-[#c41230]'}`}
          style={{ width: `${Math.min(100, progress)}%` }}
        />
      </div>
      <span className={`text-xs font-medium ${isOnTrack ? 'text-[#22c55e]' : 'text-[#888]'}`}>
        {person.totalUnits}/{goal}
      </span>
    </div>
  );
}
