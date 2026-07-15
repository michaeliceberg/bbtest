// components/game-header.tsx
'use client';

import { Shield, Coins, Heart, TrendingUp, Award } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GameHeaderProps {
  mmr: number;
  gems: number;
  hearts: number;
  streak: number;
  rank: string;
}

export const GameHeader = ({ mmr, gems, hearts, streak, rank }: GameHeaderProps) => {
  const ranks = ['Новичок', 'Боец', 'Ветеран', 'Мастер', 'Легенда', 'Бессмертный'];
  
  return (
    <div className="bg-gradient-to-r from-[#0a0e27] to-[#141834] border-b border-[#2a2f4a] px-4 py-2">
      <div className="container mx-auto flex items-center justify-between">
        {/* Лого */}
        <div className="flex items-center gap-2">
          <div className="text-2xl font-bold bg-gradient-to-r from-[#ffd700] to-[#ff8c00] bg-clip-text text-transparent">
            GGEGE
          </div>
          <div className="text-xs text-gray-400">| Бета</div>
        </div>
        
        {/* Игровой счёт */}
        <div className="flex items-center gap-6">
          {/* MMR */}
          <div className="flex items-center gap-2 bg-[#1a1f3a] px-3 py-1.5 rounded-lg">
            <TrendingUp className="w-4 h-4 text-yellow-400" />
            <span className="text-sm font-bold">{mmr}</span>
            <span className="text-xs text-gray-400">MMR</span>
          </div>
          
          {/* Гемы */}
          <div className="flex items-center gap-2 bg-[#1a1f3a] px-3 py-1.5 rounded-lg">
            <Coins className="w-4 h-4 text-yellow-400" />
            <span className="text-sm font-bold">{gems}</span>
          </div>
          
          {/* Сердца (HP) */}
          <div className="flex items-center gap-1 bg-[#1a1f3a] px-3 py-1.5 rounded-lg">
            {[...Array(5)].map((_, i) => (
              <Heart 
                key={i} 
                className={cn(
                  "w-4 h-4",
                  i < hearts ? "text-red-500 fill-red-500" : "text-[#9AA7B0]"
                )} 
              />
            ))}
          </div>
          
          {/* Стрик */}
          {streak > 0 && (
            <div className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-red-500 px-3 py-1.5 rounded-lg animate-pulse">
              <span className="text-sm font-bold">🔥 {streak}</span>
              <span className="text-xs">стрик</span>
            </div>
          )}
          
          {/* Ранг */}
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-1.5 rounded-lg">
            <span className="text-sm font-bold">{rank}</span>
          </div>
        </div>
      </div>
    </div>
  );
};