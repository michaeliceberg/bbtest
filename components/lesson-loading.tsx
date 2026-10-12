'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import Lottie from '@/components/lottie-player'

// Lottie грузится через общую обёртку (JSON — по URL, не в бандле)


const LOTTIE_LOADERS = [
  '/Lottie/LottieBearLoader1.json',
  '/Lottie/LottieBearLoader2.json',
  '/Lottie/LottieBearLoader3.json',
  '/Lottie/LottieBearLoader4.json',
  '/Lottie/LottieBearLoader5.json',
  '/Lottie/LottieBearLoader6.json',
];

// Кубическая easeOut функция для замедления
const easeOutCubic = (t: number): number => {
  return 1 - Math.pow(1 - t, 3);
};

type Props = {
  minDuration?: number;
  lottieFiles?: string[];
};

export const LessonLoading = ({ minDuration = 3000, lottieFiles = LOTTIE_LOADERS }: Props) => {
  const [progress, setProgress] = useState(0);
  const [animationData, setAnimationData] = useState<any>(null);

  useEffect(() => {
    // Выбираем случайный Lottie файл
    const randomLottie = lottieFiles[Math.floor(Math.random() * lottieFiles.length)];

    // Загружаем Lottie JSON
    fetch(encodeURI(randomLottie))
      .then(res => res.json())
      .then(data => setAnimationData(data))
      .catch(err => console.error('Failed to load Lottie:', err));

    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const normalizedTime = Math.min(elapsed / minDuration, 1);
      const easedProgress = easeOutCubic(normalizedTime) * 100;
      setProgress(easedProgress);
    }, 50);

    return () => clearInterval(interval);
  }, [minDuration, lottieFiles]);

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-[#0F1419] via-[#151F24] to-[#1A252B] flex flex-col items-center justify-center z-50 overflow-hidden">
      {/* Фоновые элементы */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.05, 0] }}
          transition={{ duration: 4, repeat: Infinity }}
          className="absolute top-0 left-1/2 w-96 h-96 bg-[#78C93C] rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"
        />
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.03, 0] }}
          transition={{ duration: 6, repeat: Infinity, delay: 1 }}
          className="absolute bottom-0 right-1/4 w-80 h-80 bg-[#5FA12F] rounded-full blur-3xl translate-y-1/2"
        />
      </div>

      {/* Центральный контент */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center gap-16 relative z-10"
      >
        {/* Lottie анимация */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="w-64 h-64"
        >
          {animationData && (
            <Lottie animationData={animationData} loop={true} />
          )}
        </motion.div>

        {/* Прогресс-бар в стиле шкалы «Прогресс по разделам» (/learn):
            тёмный жёлоб с внутренней тенью, сверху светлая полоса, снизу тёмная —
            и у пустой части, и у заполненной. Заливка — зелёный градиент с бегущим бликом. */}
        <motion.div
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="w-72 sm:w-80"
        >
          <div
            className="rounded-xl bg-[#0F171B] p-[4px]"
            style={{ boxShadow: 'inset 0 2px 0 rgba(0,0,0,0.35)' }}
          >
            <div className="relative h-6 overflow-hidden rounded-lg bg-[#26333B]">
              <div
                className="absolute inset-y-0 left-0 overflow-hidden rounded-lg"
                style={{
                  width: `${Math.max(progress, 4)}%`,
                  background: 'linear-gradient(180deg, #94D233, #60A12F)',
                }}
              >
                <div className="animate-progress-shine pointer-events-none absolute inset-y-0 left-0 w-1/3 opacity-40" />
              </div>
              {/* светлая полоса сверху / тёмная снизу — по всей длине */}
              <div className="pointer-events-none absolute inset-x-0 top-0 h-1/3 bg-white/10" />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/4 bg-black/15" />
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};
