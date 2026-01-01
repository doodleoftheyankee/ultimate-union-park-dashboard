'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavProps {
  isAutoRotate: boolean;
  onToggleAutoRotate: () => void;
  isTVMode: boolean;
  onToggleTVMode: () => void;
}

export default function Navigation({
  isAutoRotate,
  onToggleAutoRotate,
  isTVMode,
  onToggleTVMode
}: NavProps) {
  const pathname = usePathname();

  const navItems = [
    { href: '/', label: 'Sales Leaderboard', icon: '📊' },
    { href: '/goals', label: 'Monthly Goals', icon: '🎯' },
    { href: '/spiffs', label: 'Spiff Cars', icon: '🚗' },
    { href: '/manager', label: 'Manager', icon: '👔' },
    { href: '/history', label: 'History', icon: '📁' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-[#0a0a0a]/95 backdrop-blur-sm border-b border-[#2a2a2a]">
      <div className="max-w-[1920px] mx-auto px-6">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <div className="flex items-center gap-4">
            <div className="flex flex-col">
              <span className="text-2xl font-bold tracking-tight">UNION PARK</span>
              <div className="flex items-center gap-2 text-xs tracking-widest text-[#888]">
                <span className="text-[#002d62]">BUICK</span>
                <span className="text-[#888]">|</span>
                <span className="text-[#c41230]">GMC</span>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex items-center">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-link ${pathname === item.href ? 'active' : ''}`}
              >
                <span className="mr-2">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Controls */}
          <div className="flex items-center gap-3">
            {/* TV Mode Toggle */}
            <button
              onClick={onToggleTVMode}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                isTVMode
                  ? 'bg-[#c41230] text-white'
                  : 'bg-[#2a2a2a] text-[#888] hover:text-white'
              }`}
            >
              TV Mode
            </button>

            {/* Auto Rotate Toggle */}
            <button
              onClick={onToggleAutoRotate}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                isAutoRotate
                  ? 'bg-[#22c55e] text-white'
                  : 'bg-[#2a2a2a] text-[#888] hover:text-white'
              }`}
            >
              <span className={isAutoRotate ? 'animate-spin' : ''}>⟳</span>
              Auto-Rotate
            </button>

            {/* Settings Link */}
            <Link
              href="/settings"
              className="p-2 rounded-lg bg-[#2a2a2a] text-[#888] hover:text-white transition-colors"
              title="Settings"
            >
              ⚙️
            </Link>
          </div>
        </div>
      </div>

      {/* Professional Grade Bar */}
      <div className="h-1 bg-gradient-to-r from-[#002d62] via-[#c41230] to-[#c5a04f]" />
    </header>
  );
}
