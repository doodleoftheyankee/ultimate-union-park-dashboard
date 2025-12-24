'use client';

import { SalespersonMetrics } from '@/lib/sheets';

interface HeadToHeadProps {
  salespeople: SalespersonMetrics[];
}

interface Matchup {
  player1: SalespersonMetrics;
  player2: SalespersonMetrics;
  leader: 'player1' | 'player2' | 'tie';
  metric: 'units' | 'gross';
}

export default function HeadToHead({ salespeople }: HeadToHeadProps) {
  // Create matchups - pair salespeople by rank
  const sorted = [...salespeople].sort((a, b) => b.totalUnits - a.totalUnits);

  const matchups: Matchup[] = [];

  // Create exciting matchups
  if (sorted.length >= 2) {
    // Top 2 battle
    matchups.push({
      player1: sorted[0],
      player2: sorted[1],
      leader: sorted[0].totalUnits > sorted[1].totalUnits ? 'player1' :
              sorted[1].totalUnits > sorted[0].totalUnits ? 'player2' : 'tie',
      metric: 'units'
    });
  }

  if (sorted.length >= 4) {
    // Middle matchup
    matchups.push({
      player1: sorted[2],
      player2: sorted[3],
      leader: sorted[2].totalUnits > sorted[3].totalUnits ? 'player1' :
              sorted[3].totalUnits > sorted[2].totalUnits ? 'player2' : 'tie',
      metric: 'units'
    });
  }

  // Gross profit battle (top 2 by gross)
  const byGross = [...salespeople].sort((a, b) => b.totalProfit - a.totalProfit);
  if (byGross.length >= 2) {
    matchups.push({
      player1: byGross[0],
      player2: byGross[1],
      leader: byGross[0].totalProfit > byGross[1].totalProfit ? 'player1' :
              byGross[1].totalProfit > byGross[0].totalProfit ? 'player2' : 'tie',
      metric: 'gross'
    });
  }

  if (matchups.length === 0) {
    return null;
  }

  return (
    <div className="dashboard-card p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <span>⚔️</span> Head-to-Head Battles
      </h3>
      <div className="space-y-4">
        {matchups.map((matchup, index) => (
          <MatchupCard key={index} matchup={matchup} />
        ))}
      </div>
    </div>
  );
}

function MatchupCard({ matchup }: { matchup: Matchup }) {
  const { player1, player2, leader, metric } = matchup;

  const getValue = (player: SalespersonMetrics) => {
    return metric === 'units' ? player.totalUnits : player.totalProfit;
  };

  const formatValue = (value: number) => {
    return metric === 'units' ? value.toString() : `$${value.toLocaleString()}`;
  };

  const p1Value = getValue(player1);
  const p2Value = getValue(player2);
  const total = p1Value + p2Value || 1;
  const p1Percent = (p1Value / total) * 100;
  const p2Percent = (p2Value / total) * 100;

  return (
    <div className="bg-[#1a1a1a] rounded-lg p-4">
      <div className="text-xs text-[#888] uppercase tracking-wide mb-3 text-center">
        {metric === 'units' ? '🏆 Units Battle' : '💰 Gross Battle'}
      </div>

      <div className="flex items-center justify-between mb-2">
        {/* Player 1 */}
        <div className={`text-left ${leader === 'player1' ? 'text-[#22c55e]' : 'text-white'}`}>
          <div className="font-bold flex items-center gap-2">
            {leader === 'player1' && <span>👑</span>}
            {player1.nickname}
          </div>
          <div className="text-2xl font-black">{formatValue(p1Value)}</div>
        </div>

        {/* VS */}
        <div className="text-[#888] text-xl font-bold px-4">VS</div>

        {/* Player 2 */}
        <div className={`text-right ${leader === 'player2' ? 'text-[#22c55e]' : 'text-white'}`}>
          <div className="font-bold flex items-center justify-end gap-2">
            {player2.nickname}
            {leader === 'player2' && <span>👑</span>}
          </div>
          <div className="text-2xl font-black">{formatValue(p2Value)}</div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="flex h-3 rounded-full overflow-hidden bg-[#2a2a2a]">
        <div
          className={`transition-all duration-500 ${leader === 'player1' ? 'bg-[#22c55e]' : 'bg-[#3b82f6]'}`}
          style={{ width: `${p1Percent}%` }}
        />
        <div
          className={`transition-all duration-500 ${leader === 'player2' ? 'bg-[#22c55e]' : 'bg-[#8b5cf6]'}`}
          style={{ width: `${p2Percent}%` }}
        />
      </div>

      {leader === 'tie' && (
        <div className="text-center text-[#f59e0b] text-xs mt-2 font-semibold">
          🤝 TIED!
        </div>
      )}
    </div>
  );
}
