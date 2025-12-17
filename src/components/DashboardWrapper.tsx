'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Navigation from './Navigation';
import DealTicker from './DealTicker';
import Celebration, { useGoalCelebration } from './Celebration';
import { fetchDashboardData, RecentSale } from '@/lib/sheets';
import { getGoals, getSheetsConfig } from '@/lib/storage';

const PAGES = ['/', '/goals', '/spiffs', '/manager'];
const ROTATE_INTERVAL = 15000; // 15 seconds per page

interface DashboardWrapperProps {
  children: React.ReactNode;
}

export default function DashboardWrapper({ children }: DashboardWrapperProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAutoRotate, setIsAutoRotate] = useState(false);
  const [isTVMode, setIsTVMode] = useState(false);
  const [recentDeals, setRecentDeals] = useState<RecentSale[]>([]);
  const [goalStatus, setGoalStatus] = useState({ gmcHit: false, buickHit: false, usedHit: false });

  // Fetch data for deal ticker and goal tracking
  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await fetchDashboardData();
        const goals = getGoals();

        if (data) {
          setRecentDeals(data.recentSales || []);
          setGoalStatus({
            gmcHit: data.dealership.gmcSold >= (goals.gmcGoal || 21),
            buickHit: data.dealership.buickSold >= (goals.buickGoal || 9),
            usedHit: data.dealership.totalUsedUnits >= (goals.usedGoal || 20),
          });
        }
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      }
    };

    loadData();
    const config = getSheetsConfig();
    const interval = setInterval(loadData, config.refreshInterval * 1000);
    return () => clearInterval(interval);
  }, []);

  // Track goal celebrations
  const { celebration, clearCelebration } = useGoalCelebration(goalStatus);

  // Handle auto-rotation
  useEffect(() => {
    if (!isAutoRotate) return;

    const interval = setInterval(() => {
      const currentIndex = PAGES.indexOf(pathname);
      const nextIndex = (currentIndex + 1) % PAGES.length;
      router.push(PAGES[nextIndex]);
    }, ROTATE_INTERVAL);

    return () => clearInterval(interval);
  }, [isAutoRotate, pathname, router]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Press 'R' to toggle auto-rotate
      if (e.key === 'r' || e.key === 'R') {
        setIsAutoRotate(prev => !prev);
      }
      // Press 'T' to toggle TV mode
      if (e.key === 't' || e.key === 'T') {
        setIsTVMode(prev => !prev);
      }
      // Arrow keys to navigate
      if (e.key === 'ArrowRight') {
        const currentIndex = PAGES.indexOf(pathname);
        const nextIndex = (currentIndex + 1) % PAGES.length;
        router.push(PAGES[nextIndex]);
      }
      if (e.key === 'ArrowLeft') {
        const currentIndex = PAGES.indexOf(pathname);
        const prevIndex = (currentIndex - 1 + PAGES.length) % PAGES.length;
        router.push(PAGES[prevIndex]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pathname, router]);

  const toggleAutoRotate = useCallback(() => {
    setIsAutoRotate(prev => !prev);
  }, []);

  const toggleTVMode = useCallback(() => {
    setIsTVMode(prev => !prev);
  }, []);

  // Don't show navigation on settings page
  const showNav = pathname !== '/settings';

  return (
    <div className={isTVMode ? 'tv-mode' : ''}>
      {showNav && (
        <Navigation
          isAutoRotate={isAutoRotate}
          onToggleAutoRotate={toggleAutoRotate}
          isTVMode={isTVMode}
          onToggleTVMode={toggleTVMode}
        />
      )}
      <main className="min-h-[calc(100vh-84px)]">
        {children}
      </main>

      {/* Deal Ticker */}
      {recentDeals.length > 0 && <DealTicker deals={recentDeals} />}

      {/* Celebration Animation */}
      <Celebration
        trigger={celebration.active}
        message={celebration.message}
        onComplete={clearCelebration}
      />

      {/* Auto-rotate indicator */}
      {isAutoRotate && (
        <div className="fixed bottom-14 right-4 bg-[#22c55e] text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg animate-pulse z-50">
          Auto-rotating...
        </div>
      )}

      {/* Footer with current time */}
      <footer className="fixed bottom-0 left-0 right-0 bg-[#0a0a0a]/90 backdrop-blur-sm border-t border-[#2a2a2a] py-2 px-6 z-30">
        <div className="max-w-[1920px] mx-auto flex items-center justify-between text-sm text-[#888]">
          <span>UNION PARK BUICK GMC | Professional Grade Dashboard</span>
          <CurrentTime />
        </div>
      </footer>
    </div>
  );
}

function CurrentTime() {
  const [time, setTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      setTime(new Date().toLocaleString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      }));
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return <span>{time}</span>;
}
