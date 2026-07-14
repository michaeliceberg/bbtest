// components/mine-shop.tsx

'use client';

import { useState } from 'react';
import { Pickaxe, Gem, Star, TrendingUp, ChevronRight } from 'lucide-react';
// import { Button } from './ui/button';
import { toast } from 'sonner';
import { purchaseMine } from '@/actions/purchase-mine';
import { Button } from '@/components/ui/button';

type MineType = {
    id: number;
    name: string;
    gemPerDay: number;
    priceGems: number;
    pricePoints: number;
    imageSrc: string | null;
    requiredStreak: number | null;  // ← добавили | null
};

type Props = {
    mines: MineType[];
    userGems: number;
    userPoints: number;
    userStreak: number;
    onPurchase?: () => void;
};

export const MineShop = ({ mines, userGems, userPoints, userStreak, onPurchase }: Props) => {
    const [purchasing, setPurchasing] = useState<number | null>(null);
    
    const handlePurchase = async (mineId: number) => {
        setPurchasing(mineId);
        try {
            const result = await purchaseMine(mineId);
            if (result.success) {
                toast.success(`🎉 ${result.mineName} куплена! Теперь ты добываешь ${result.gemPerDay}💎 в день!`);
                onPurchase?.();
            } else {
                toast.error(result.error || 'Ошибка при покупке');
            }
        } catch {
            toast.error('Ошибка при покупке');
        } finally {
            setPurchasing(null);
        }
    };
    
    return (
        <div className="border-2 rounded-xl p-4 space-y-4 bg-gradient-to-br from-gray-800 to-gray-900 text-white">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Pickaxe className="h-5 w-5 text-amber-400" />
                    <h3 className="font-bold text-lg">Шахтерская лавка</h3>
                </div>
                <div className="flex items-center gap-3 text-sm">
                    <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-400" />
                        <span>{userPoints}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <Gem className="h-4 w-4 text-blue-400" />
                        <span>{userGems}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <TrendingUp className="h-4 w-4 text-orange-400" />
                        <span>{userStreak} дн.</span>
                    </div>
                </div>
            </div>
            
            <div className="space-y-3">
                {mines.map((mine) => {
                    const requiredStreak = mine.requiredStreak || 0;
                    const canAfford = userGems >= mine.priceGems || userPoints >= mine.pricePoints;
                    const streakOk = userStreak >= requiredStreak;
                    const canBuy = canAfford && streakOk;
                    
                    return (
                        <div key={mine.id} className="bg-white/10 rounded-xl p-3">
                            <div className="flex items-center gap-3">
                                <div className="text-3xl">⛏️</div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <h4 className="font-bold">{mine.name}</h4>
                                        <span className="text-xs bg-amber-500/30 px-2 py-0.5 rounded-full">
                                            +{mine.gemPerDay}💎/день
                                        </span>
                                    </div>
                                    {requiredStreak > 0 && (
                                        <p className="text-xs text-gray-300">
                                            🔥 Требуется стрик {requiredStreak} дней
                                        </p>
                                    )}
                                </div>
                                <Button
                                    size="sm"
                                    variant={canBuy ? 'default' : 'secondary'}
                                    onClick={() => handlePurchase(mine.id)}
                                    disabled={!canBuy || purchasing === mine.id}
                                    className={canBuy ? 'bg-amber-500 hover:bg-amber-600' : ''}
                                >
                                    {purchasing === mine.id ? '...' : `${mine.priceGems}💎 / ${mine.pricePoints}⭐`}
                                </Button>
                            </div>
                        </div>
                    );
                })}
            </div>
            
            <div className="text-center text-xs text-gray-400 pt-2">
                ⛏️ Шахты работают автономно. Не забывай собирать гемы каждый день!
            </div>
        </div>
    );
};