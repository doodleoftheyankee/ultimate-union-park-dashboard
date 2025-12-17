'use client';

import { useEffect, useState, useCallback } from 'react';

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

// Hook to track goal achievements
export function useGoalCelebration(goals: { gmcHit: boolean; buickHit: boolean; usedHit: boolean }) {
  const [previousGoals, setPreviousGoals] = useState({ gmcHit: false, buickHit: false, usedHit: false });
  const [celebration, setCelebration] = useState<{ active: boolean; message: string }>({ active: false, message: '' });

  useEffect(() => {
    // Check if any goal was just hit
    if (goals.gmcHit && !previousGoals.gmcHit) {
      setCelebration({ active: true, message: 'GMC GOAL HIT!' });
    } else if (goals.buickHit && !previousGoals.buickHit) {
      setCelebration({ active: true, message: 'BUICK GOAL HIT!' });
    } else if (goals.usedHit && !previousGoals.usedHit) {
      setCelebration({ active: true, message: 'USED GOAL HIT!' });
    }

    // Check if both D2E goals hit
    if (goals.gmcHit && goals.buickHit && (!previousGoals.gmcHit || !previousGoals.buickHit)) {
      if (previousGoals.gmcHit || previousGoals.buickHit) {
        setCelebration({ active: true, message: 'D2E BONUS UNLOCKED!' });
      }
    }

    setPreviousGoals(goals);
  }, [goals, previousGoals]);

  const clearCelebration = useCallback(() => {
    setCelebration({ active: false, message: '' });
  }, []);

  return { celebration, clearCelebration };
}
