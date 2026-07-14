// components/trainer-cat-rescue.tsx

'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

type Props = {
    timeLeft: number; // оставшееся время в секундах
    isActive: boolean;
    onSave?: () => void;
};

export const TrainerCatRescue = ({ timeLeft, isActive, onSave }: Props) => {
    const [dangerLevel, setDangerLevel] = useState(0);
    const [lastSaveTime, setLastSaveTime] = useState(Date.now());
    const [showSaveAnimation, setShowSaveAnimation] = useState(false);
    
    // Уровень опасности зависит от оставшегося времени
    useEffect(() => {
        if (!isActive) return;
        
        // Максимальная опасность при timeLeft < 3 секунд
        const newDangerLevel = Math.max(0, Math.min(100, 
            timeLeft <= 0 ? 100 : 
            timeLeft < 3 ? 90 :
            timeLeft < 5 ? 70 :
            timeLeft < 10 ? 50 : 30
        ));
        setDangerLevel(newDangerLevel);
    }, [timeLeft, isActive]);
    
    // Анимация спасения при правильном ответе
    const handleSave = () => {
        setShowSaveAnimation(true);
        setDangerLevel(0);
        setLastSaveTime(Date.now());
        onSave?.();
        setTimeout(() => setShowSaveAnimation(false), 1500);
    };
    
    return (
        <div className="relative w-full h-32 bg-gradient-to-b from-blue-100 to-blue-200 rounded-xl overflow-hidden">
            {/* Небо и облака */}
            <div className="absolute inset-0">
                <div className="absolute top-2 left-4 text-xs text-blue-600">
                    {timeLeft > 0 ? `⏱️ ${timeLeft} сек` : '💀 Время вышло!'}
                </div>
            </div>
            
            {/* Кирпичи сверху (опасность) */}
            <div className="absolute top-0 left-0 right-0 h-16 overflow-hidden">
                {Array.from({ length: Math.ceil(dangerLevel / 10) }).map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute w-8 h-8"
                        style={{
                            left: `${(i * 17) % 100}%`,
                            top: `${Math.floor(i / 6) * -20}px`,
                        }}
                        animate={{
                            y: dangerLevel > 70 ? [0, 100] : [0, 50],
                        }}
                        transition={{
                            duration: 1,
                            repeat: Infinity,
                            delay: i * 0.1,
                        }}
                    >
                        <div className="w-8 h-8 bg-amber-700 rounded-lg shadow-md flex items-center justify-center">
                            🧱
                        </div>
                    </motion.div>
                ))}
            </div>
            
            {/* Котик */}
            <motion.div
                className="absolute bottom-0 left-1/2 transform -translate-x-1/2"
                animate={{
                    y: dangerLevel > 80 ? [0, -10, 0, -5, 0] : 0,
                    scale: dangerLevel > 90 ? [1, 0.9, 1] : 1,
                }}
                transition={{ duration: 0.5, repeat: dangerLevel > 80 ? Infinity : 0 }}
            >
                <div className="relative">
                    <Image
                        src={dangerLevel > 90 ? '/cat-scared.svg' : '/cat-happy.svg'}
                        alt='Котик'
                        width={60}
                        height={60}
                        className="drop-shadow-lg"
                    />
                    {/* Капельки пота при опасности */}
                    {dangerLevel > 70 && (
                        <motion.div
                            className="absolute -top-2 -right-2 text-lg"
                            animate={{ y: [0, -10, 0], opacity: [1, 0] }}
                            transition={{ duration: 0.5, repeat: Infinity }}
                        >
                            💦
                        </motion.div>
                    )}
                </div>
            </motion.div>
            
            {/* Защитный купол (при правильном ответе) */}
            <AnimatePresence>
                {showSaveAnimation && (
                    <motion.div
                        className="absolute inset-0 bg-yellow-400/30 rounded-xl flex items-center justify-center"
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.5 }}
                    >
                        <div className="text-center">
                            <div className="text-3xl animate-bounce">🛡️</div>
                            <p className="text-sm font-bold text-amber-700">Котик спасён! +10 очков</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
            
            {/* Полоска опасности */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-300">
                <div 
                    className="h-full bg-red-500 transition-all duration-300"
                    style={{ width: `${dangerLevel}%` }}
                />
            </div>
        </div>
    );
};