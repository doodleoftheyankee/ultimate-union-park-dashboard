'use client';

import { useEffect, useState } from 'react';
import { RecentSale } from '@/lib/sheets';

interface DealTickerProps {
  deals: RecentSale[];
}

export default function DealTicker({ deals }: DealTickerProps) {
  const [isVisible, setIsVisible] = useState(true);

  // Hide ticker if no deals
  if (!deals || deals.length === 0) return null;

  return (
    <div className="fixed bottom-10 left-0 right-0 bg-gradient-to-r from-[#0a0a0a] via-[#141414] to-[#0a0a0a] border-t border-b border-[#2a2a2a] py-2 z-40 overflow-hidden">
      <div className="flex items-center">
        {/* Label */}
        <div className="flex-shrink-0 bg-[#c41230] px-4 py-1 mr-4">
          <span className="text-white font-bold text-sm uppercase tracking-wider">Recent Deals</span>
        </div>

        {/* Scrolling content */}
        <div className="overflow-hidden flex-1">
          <div className="ticker-scroll flex items-center gap-8 whitespace-nowrap">
            {/* Duplicate deals for seamless loop */}
            {[...deals, ...deals].map((deal, index) => (
              <DealItem key={`${deal.stockNumber}-${index}`} deal={deal} />
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        .ticker-scroll {
          animation: ticker 30s linear infinite;
        }

        .ticker-scroll:hover {
          animation-play-state: paused;
        }

        @keyframes ticker {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
      `}</style>
    </div>
  );
}

function DealItem({ deal }: { deal: RecentSale }) {
  const isGMC = deal.make?.toUpperCase().includes('GMC');
  const isBuick = deal.make?.toUpperCase().includes('BUICK');

  return (
    <div className="flex items-center gap-3 px-4 py-1 bg-[#1a1a1a] rounded-full border border-[#2a2a2a]">
      {/* Brand indicator */}
      <div className={`w-2 h-2 rounded-full ${isGMC ? 'bg-[#c41230]' : isBuick ? 'bg-[#002d62]' : 'bg-[#f59e0b]'}`} />

      {/* Vehicle info */}
      <span className="text-white font-medium">
        {deal.year} {deal.make} {deal.model}
      </span>

      {/* Salesperson */}
      <span className="text-[#888]">|</span>
      <span className="text-[#c5a04f]">{deal.salesPerson}</span>

      {/* Profit */}
      <span className="text-[#888]">|</span>
      <span className={`font-bold ${deal.totalProfit >= 0 ? 'text-[#22c55e]' : 'text-[#ef4444]'}`}>
        ${Math.abs(deal.totalProfit).toLocaleString()}
      </span>
    </div>
  );
}
