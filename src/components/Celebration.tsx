'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { getCelebratedGoals, markGoalCelebrated } from '@/lib/storage';

interface CelebrationProps {
  trigger: boolean;
  message?: string;
  onComplete?: () => void;
}

export default function Celebration({ trigger, message = "GOAL HIT!", onComplete }: CelebrationProps) {
  const [isActive, setIsActive] = useState(false);
  const [particles, setParticles] = useState<Particle[]>([]);

  interface Particle {
    id: number;
    x: number;
    y: number;
    color: string;
    size: number;
    rotation: number;
    velocityX: number;
    velocityY: number;
  }

  const createParticles = useCallback(() => {
    const colors = ['#c41230', '#c5a04f', '#22c55e', '#002d62', '#f59e0b', '#ffffff'];
    const newParticles: Particle[] = [];

    for (let i = 0; i < 150; i++) {
      newParticles.push({
        id: i,
        x: Math.random() * 100,
        y: -10,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 10 + 5,
        rotation: Math.random() * 360,
        velocityX: (Math.random() - 0.5) * 3,
        velocityY: Math.random() * 3 + 2,
      });
    }

    setParticles(newParticles);
  }, []);

  useEffect(() => {
    if (trigger && !isActive) {
      setIsActive(true);
      createParticles();

      // Auto-hide after animation
      const timer = setTimeout(() => {
        setIsActive(false);
        setParticles([]);
        onComplete?.();
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [trigger, isActive, createParticles, onComplete]);

  if (!isActive) return null;

  return (
    <div className="fixed inset-0 z-50 pointer-events-none overflow-hidden">
      {/* Flash overlay */}
      <div className="absolute inset-0 bg-[#c5a04f] animate-flash" />

      {/* Message */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center animate-bounce-in">
          <div className="text-6xl md:text-8xl font-black text-white drop-shadow-[0_0_30px_rgba(196,18,48,0.8)] animate-pulse">
            {message}
          </div>
          <div className="text-2xl md:text-4xl text-[#c5a04f] font-bold mt-4 drop-shadow-lg">
            KEEP PUSHING!
          </div>
        </div>
      </div>

      {/* Confetti particles */}
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute animate-confetti"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: particle.size,
            height: particle.size,
            backgroundColor: particle.color,
            transform: `rotate(${particle.rotation}deg)`,
            '--velocity-x': particle.velocityX,
            '--velocity-y': particle.velocityY,
            animationDelay: `${Math.random() * 0.5}s`,
          } as React.CSSProperties}
        />
      ))}

      <style jsx>{`
        @keyframes flash {
          0% { opacity: 0.8; }
          100% { opacity: 0; }
        }

        .animate-flash {
          animation: flash 0.3s ease-out forwards;
        }

        @keyframes bounce-in {
          0% { transform: scale(0); opacity: 0; }
          50% { transform: scale(1.2); }
          100% { transform: scale(1); opacity: 1; }
        }

        .animate-bounce-in {
          animation: bounce-in 0.5s ease-out forwards;
        }

        @keyframes confetti {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) translateX(calc(var(--velocity-x) * 100px)) rotate(720deg);
            opacity: 0;
          }
        }

        .animate-confetti {
          animation: confetti 3s ease-out forwards;
        }
      `}</style>
    </div>
  );
}

// Hook to track goal achievements - persists to localStorage to prevent repeated celebrations
export function useGoalCelebration(goals: { gmcHit: boolean; buickHit: boolean; usedHit: boolean }) {
  const [celebration, setCelebration] = useState<{ active: boolean; message: string }>({ active: false, message: '' });
  const hasInitialized = useRef(false);
  const previousGoals = useRef<{ gmcHit: boolean; buickHit: boolean; usedHit: boolean } | null>(null);

  useEffect(() => {
    // Skip the very first render to allow data to load
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      previousGoals.current = goals;
      return;
    }

    // Get the persisted celebration state for this month
    const celebrated = getCelebratedGoals();
    const prev = previousGoals.current || { gmcHit: false, buickHit: false, usedHit: false };

    // Check if GMC goal was just hit (transition from false to true) and not already celebrated
    if (goals.gmcHit && !prev.gmcHit && !celebrated.gmcCelebrated) {
      setCelebration({ active: true, message: 'GMC GOAL HIT!' });
      markGoalCelebrated('gmc');
    }
    // Check if Buick goal was just hit and not already celebrated
    else if (goals.buickHit && !prev.buickHit && !celebrated.buickCelebrated) {
      setCelebration({ active: true, message: 'BUICK GOAL HIT!' });
      markGoalCelebrated('buick');
    }
    // Check if Used goal was just hit and not already celebrated
    else if (goals.usedHit && !prev.usedHit && !celebrated.usedCelebrated) {
      setCelebration({ active: true, message: 'USED GOAL HIT!' });
      markGoalCelebrated('used');
    }

    // Check if D2E bonus was just unlocked (both GMC and Buick hit) and not already celebrated
    const d2eNowUnlocked = goals.gmcHit && goals.buickHit;
    const d2eWasUnlocked = prev.gmcHit && prev.buickHit;
    if (d2eNowUnlocked && !d2eWasUnlocked && !celebrated.d2eCelebrated) {
      setCelebration({ active: true, message: 'D2E BONUS UNLOCKED!' });
      markGoalCelebrated('d2e');
    }

    previousGoals.current = goals;
  }, [goals]);

  const clearCelebration = useCallback(() => {
    setCelebration({ active: false, message: '' });
  }, []);

  return { celebration, clearCelebration };
}
