// components/unit-card.tsx

'use client';

import { useState, useEffect } from 'react';
import { Lock, Flame, Crown, Gift, Star, Brain, TrendingUp } from 'lucide-react';
import { Button } from './ui/button';
import { getUnitProgress } from '@/lib/lesson-access';

type UnitWithProgress = {
    id: number;
    title: string;
    description: string;
    order: number;
    imageSrc: string;
    isUnlocked: boolean;
    isCompleted: boolean;
    lessonsCompleted: number;
    totalLessons: number;
    lessonsWithNextUnlocked: number;
    isNextUnitUnlocked: boolean;
};

type UnitProgress = {
    totalLessons: number;
    lessonsWithNextUnlocked: number;
    fullyMasteredLessons: number;
    percent: number;
    isEnoughToUnlockNextUnit: boolean;
    isUnitCompleted: boolean;
    needMoreLessons: number;
};

type Props = {
    unit: UnitWithProgress;
    userId: string;
    onClaimReward?: (unitId: number) => void;
};

export const UnitCard = ({ unit, userId, onClaimReward }: Props) => {
    const [unitProgress, setUnitProgress] = useState<UnitProgress | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    
    useEffect(() => {
        const loadProgress = async () => {
            try {
                const progress = await getUnitProgress(userId, unit.id);
                setUnitProgress(progress);
            } catch (error) {
                console.error('Failed to load unit progress:', error);
            } finally {
                setIsLoading(false);
            }
        };
        loadProgress();
    }, [userId, unit.id]);
    
    // Заблокированный юнит
    if (!unit.isUnlocked && !unit.isCompleted) {
        return (
            <div className="relative mb-10 opacity-60">
                <div className="bg-gray-100 rounded-xl p-6 border-2 border-dashed border-gray-300">
                    <div className="flex items-center gap-4">
                        <div className="bg-gray-300 rounded-full p-3">
                            <Lock className="h-8 w-8 text-gray-500" />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-bold text-xl text-gray-500">{unit.title}</h3>
                            <p className="text-gray-400 text-sm">{unit.description}</p>
                            {unitProgress && unitProgress.needMoreLessons > 0 && !isLoading && (
                                <div className="mt-2 flex items-center gap-2">
                                    <Flame className="h-4 w-4 text-orange-400" />
                                    <span className="text-sm text-gray-500">
                                        Нужно открыть ещё {unitProgress.needMoreLessons} уроков в предыдущем разделе
                                    </span>
                                </div>
                            )}
                            {isLoading && (
                                <div className="mt-2 flex items-center gap-2">
                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-400 border-t-transparent" />
                                    <span className="text-sm text-gray-400">Загрузка...</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }
    
    const progressPercent = unit.totalLessons > 0 
        ? Math.round((unit.lessonsWithNextUnlocked / unit.totalLessons) * 100) 
        : 0;
    
    const isFullyCompleted = unit.isCompleted || (unitProgress?.isUnitCompleted ?? false);
    
    return (
        <div className="mb-10 bg-white rounded-xl border shadow-sm overflow-hidden hover:shadow-md transition-shadow">
            {/* Шапка юнита */}
            <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
                <div className="flex justify-between items-start">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <TrendingUp className="h-5 w-5 text-blue-500" />
                            <span className="text-xs font-medium text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">
                                Раздел {unit.order}
                            </span>
                        </div>
                        <h3 className="font-bold text-2xl text-gray-800">{unit.title}</h3>
                        <p className="text-gray-500 text-sm mt-1">{unit.description}</p>
                    </div>
                    {isFullyCompleted && (
                        <div className="bg-gradient-to-br from-yellow-400 to-amber-500 rounded-full p-2 shadow-lg">
                            <Crown className="h-6 w-6 text-white" />
                        </div>
                    )}
                </div>
            </div>
            
            {/* Контент юнита */}
            <div className="p-6">
                <div className="space-y-4">
                    {/* Прогресс-бар */}
                    <div>
                        <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-600">Уроков открыто</span>
                            <span className="font-medium text-gray-800">
                                {unit.lessonsWithNextUnlocked}/{unit.totalLessons}
                            </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                            <div 
                                className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2.5 rounded-full transition-all duration-500"
                                style={{ width: `${progressPercent}%` }}
                            />
                        </div>
                    </div>
                    
                    {/* Статус следующего юнита */}
                    {unit.isNextUnitUnlocked && !isFullyCompleted && (
                        <div className="bg-green-50 rounded-lg p-3 flex items-center gap-2">
                            <div className="bg-green-500 rounded-full p-0.5">
                                <Star className="h-3 w-3 text-white" />
                            </div>
                            <p className="text-xs text-green-700">
                                ✅ Следующий раздел уже открыт! Продолжай покорять знания.
                            </p>
                        </div>
                    )}
                    
                    {!unit.isNextUnitUnlocked && unitProgress && unitProgress.needMoreLessons > 0 && !isLoading && (
                        <div className="bg-amber-50 rounded-lg p-3 flex items-center gap-2">
                            <Flame className="h-4 w-4 text-amber-500" />
                            <p className="text-xs text-amber-700">
                                🎯 Открой ещё {unitProgress.needMoreLessons} уроков, чтобы открыть следующий раздел!
                            </p>
                        </div>
                    )}
                    
                    {/* Бонус за завершение юнита */}
                    {isFullyCompleted && (
                        <div className="mt-4 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-lg p-4 border border-yellow-200">
                            <div className="flex items-center justify-between flex-wrap gap-3">
                                <div className="flex items-center gap-3">
                                    <div className="bg-gradient-to-br from-yellow-400 to-amber-500 rounded-full p-2">
                                        <Gift className="h-5 w-5 text-white" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-amber-800">Раздел завершён!</p>
                                        <p className="text-xs text-amber-600">Получи свой королевский сундук 👑</p>
                                    </div>
                                </div>
                                <Button 
                                    size="sm" 
                                    variant='dangerOutline' 
                                    className="border-amber-300 text-amber-700 hover:bg-amber-50"
                                    onClick={() => onClaimReward?.(unit.id)}
                                >
                                    Забрать награду
                                </Button>
                            </div>
                        </div>
                    )}
                    
                    {/* Детальная статистика */}
                    {unitProgress && !isLoading && (
                        <div className="flex gap-4 pt-2 text-xs text-gray-400 border-t">
                            <div className="flex items-center gap-1">
                                <Brain className="h-3 w-3" />
                                <span>Мастерство: {unitProgress.fullyMasteredLessons}/{unit.totalLessons}</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <Star className="h-3 w-3" />
                                <span>Прогресс: {Math.round(unitProgress.percent * 100)}%</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UnitCard;