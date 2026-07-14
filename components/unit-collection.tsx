// components/unit-collection.tsx

'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Crown, Flame, Lock, CheckCircle, Star, TrendingUp, Gift } from 'lucide-react';
import { Progress } from './ui/progress';

type UnitCard = {
    id: number;
    title: string;
    description: string;
    icon: string;
    rarity: 'common' | 'rare' | 'epic' | 'legendary';
    isUnlocked: boolean;
    isCompleted: boolean;
    completedLessons: number;
    totalLessons: number;
    percent: number;
    order: number;
};

type Props = {
    units: UnitCard[];
    onSelectUnit: (unitId: number) => void;
};

const rarityConfig = {
    common: {
        bg: 'from-gray-700 to-gray-800',
        border: 'border-gray-500',
        glow: 'shadow-gray-500/20',
        text: 'text-gray-300',
    },
    rare: {
        bg: 'from-blue-800 to-blue-900',
        border: 'border-blue-500',
        glow: 'shadow-blue-500/20',
        text: 'text-blue-300',
    },
    epic: {
        bg: 'from-purple-800 to-purple-900',
        border: 'border-purple-500',
        glow: 'shadow-purple-500/30',
        text: 'text-purple-300',
    },
    legendary: {
        bg: 'from-yellow-700 to-orange-800',
        border: 'border-yellow-500',
        glow: 'shadow-yellow-500/40',
        text: 'text-yellow-300',
    },
};

export const UnitCollection = ({ units, onSelectUnit }: Props) => {
    // Сортируем по порядку
    const sortedUnits = [...units].sort((a, b) => a.order - b.order);

    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {sortedUnits.map((unit, index) => {
                const config = rarityConfig[unit.rarity];
                const progressPercent = Math.round(unit.percent * 100);
                
                return (
                    <motion.div
                        key={unit.id}
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        whileHover={{ scale: 1.03, y: -5 }}
                        whileTap={{ scale: 0.98 }}
                        className={`
                            relative rounded-xl overflow-hidden cursor-pointer
                            bg-gradient-to-br ${config.bg}
                            border-2 ${config.border}
                            shadow-lg ${config.glow}
                            transition-all duration-200
                            ${!unit.isUnlocked && !unit.isCompleted ? 'opacity-60' : ''}
                        `}
                        onClick={() => (unit.isUnlocked || unit.isCompleted) && onSelectUnit(unit.id)}
                    >
                        {/* Легендарная рамка */}
                        {unit.rarity === 'legendary' && (
                            <div className="absolute -top-2 -right-2 z-10">
                                <div className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full p-1 shadow-lg animate-pulse">
                                    <Crown className="h-4 w-4 text-white" />
                                </div>
                            </div>
                        )}
                        
                        {/* Эпическая рамка */}
                        {unit.rarity === 'epic' && (
                            <div className="absolute -top-1 -right-1 z-10">
                                <div className="bg-purple-600 rounded-full p-0.5">
                                    <Star className="h-3 w-3 text-white" />
                                </div>
                            </div>
                        )}
                        
                        {/* Карточка */}
                        <div className="p-4">
                            {/* Иконка и заголовок */}
                            <div className="flex items-start justify-between mb-3">
                                <div className="text-5xl">{unit.icon}</div>
                                {unit.isCompleted && (
                                    <div className="bg-green-500 rounded-full p-1">
                                        <CheckCircle className="h-4 w-4 text-white" />
                                    </div>
                                )}
                                {!unit.isUnlocked && !unit.isCompleted && (
                                    <div className="bg-gray-700 rounded-full p-1">
                                        <Lock className="h-4 w-4 text-gray-400" />
                                    </div>
                                )}
                            </div>
                            
                            <h3 className="font-bold text-white text-lg mb-1">{unit.title}</h3>
                            <p className="text-xs text-gray-300 mb-3 line-clamp-2">{unit.description}</p>
                            
                            {/* Прогресс */}
                            <div className="mb-2">
                                <div className="flex justify-between text-xs text-gray-300 mb-1">
                                    <span>Прогресс</span>
                                    <span>{unit.completedLessons}/{unit.totalLessons}</span>
                                </div>
                                <Progress value={progressPercent} className="h-1.5 bg-gray-700" />
                            </div>
                            
                            {/* Статус */}
                            {unit.isCompleted ? (
                                <div className="text-xs text-green-400 flex items-center gap-1 mt-2">
                                    <CheckCircle className="h-3 w-3" />
                                    Завершён
                                </div>
                            ) : unit.isUnlocked ? (
                                <div className="text-xs text-yellow-400 flex items-center gap-1 mt-2">
                                    <Flame className="h-3 w-3" />
                                    Доступен
                                </div>
                            ) : (
                                <div className="text-xs text-gray-500 flex items-center gap-1 mt-2">
                                    <Lock className="h-3 w-3" />
                                    Заблокирован
                                </div>
                            )}
                        </div>
                        
                        {/* Нижняя полоса редкости */}
                        <div className={`h-1 w-full ${unit.rarity === 'legendary' ? 'bg-gradient-to-r from-yellow-400 to-orange-500' : `bg-${config.border.split('-')[1]}-500`}`} />
                    </motion.div>
                );
            })}
        </div>
    );
};