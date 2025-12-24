'use client';

import { RecentSale } from '@/lib/sheets';

interface ModelStats {
  model: string;
  make: string;
  count: number;
  totalProfit: number;
  avgProfit: number;
}

interface BestSellingModelsProps {
  recentSales: RecentSale[];
}

export default function BestSellingModels({ recentSales }: BestSellingModelsProps) {
  // Aggregate sales by model
  const modelMap: Record<string, ModelStats> = {};

  recentSales.forEach(sale => {
    const key = `${sale.make} ${sale.model}`;
    if (!modelMap[key]) {
      modelMap[key] = {
        model: sale.model,
        make: sale.make,
        count: 0,
        totalProfit: 0,
        avgProfit: 0
      };
    }
    modelMap[key].count++;
    modelMap[key].totalProfit += sale.totalProfit;
  });

  // Calculate averages and sort by count
  const models = Object.values(modelMap)
    .map(m => ({
      ...m,
      avgProfit: m.count > 0 ? Math.round(m.totalProfit / m.count) : 0
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  if (models.length === 0) {
    return null;
  }

  const getMakeColor = (make: string) => {
    const upperMake = make.toUpperCase();
    if (upperMake === 'GMC') return '#c41230';
    if (upperMake === 'BUICK') return '#002d62';
    return '#f59e0b'; // Used/other
  };

  const getRankEmoji = (index: number) => {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return `${index + 1}.`;
  };

  return (
    <div className="dashboard-card p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <span>🚗</span> Best Selling Models
      </h3>
      <div className="space-y-3">
        {models.map((model, index) => (
          <div
            key={`${model.make}-${model.model}`}
            className="flex items-center justify-between p-3 bg-[#1a1a1a] rounded-lg"
          >
            <div className="flex items-center gap-3">
              <span className="text-lg">{getRankEmoji(index)}</span>
              <div>
                <div className="font-semibold text-sm" style={{ color: getMakeColor(model.make) }}>
                  {model.make}
                </div>
                <div className="text-white text-sm">{model.model}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xl font-bold">{model.count}</div>
              <div className="text-xs text-[#888]">
                ${model.avgProfit.toLocaleString()} avg
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
