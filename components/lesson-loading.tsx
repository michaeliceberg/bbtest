'use client';

import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

const Lottie = dynamic(() => import('lottie-react'), { ssr: false });

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

        {/* Премиальный прогресс бар на основе SVG */}
        <motion.div
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="w-80"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 91 12"
            width="320"
            height="48"
            preserveAspectRatio="none"
            className="drop-shadow-lg"
          >
            <defs>
              <clipPath id="progressClip">
                <rect x="0" y="0" width={progress * 0.91} height="12" />
              </clipPath>
            </defs>

            {/* Фон (серая часть) */}
            <path
              fill="#3A464E"
              d="M 91.45 6.2 Q 91.45 5.15 91.15 4.2 90.7 2.85 89.7 1.75 88.2 0.2 85.8 0 L 7.25 0 Q 3.45 -0.15 1.65 1.9 0.7 2.9 0.3 4.2 0 5.15 0 6.2 0 8.9 1.9 10.8 2.1 11 2.25 11.15 4.15 12.45 8.55 12.6 L 84.8 12.6 Q 88.6 12.45 90 10.3 91.45 8.55 91.45 6.2"
            />

            {/* Зеленый прогресс с clipPath */}
            <g clipPath="url(#progressClip)">
              {/* Основной зеленый цвет */}
              <path
                fill="#94D233"
                d="M 91.45 6.2 Q 91.45 5.15 91.15 4.2 90.7 2.85 89.7 1.75 88.2 0.2 85.8 0 L 7.25 0 Q 3.45 -0.15 1.65 1.9 0.7 2.9 0.3 4.2 0 5.15 0 6.2 0 8.9 1.9 10.8 2.1 11 2.25 11.15 4.15 12.45 8.55 12.6 L 84.8 12.6 Q 88.6 12.45 90 10.3 91.45 8.55 91.45 6.2 M 86.95 3.15 Q 87.25 3.15 87.5 3.3 87.65 3.4 87.8 3.55 88.15 3.9 88.15 4.4 88.15 4.9 87.8 5.3 87.7 5.4 87.55 5.45 87.25 5.65 86.95 5.65 L 4.1 5.65 Q 3.75 5.65 3.5 5.5 3.35 5.4 3.2 5.25 2.85 4.9 2.85 4.4 2.85 3.9 3.2 3.5 3.3 3.4 3.45 3.35 3.75 3.15 4.1 3.15 L 86.95 3.15 Z"
              />

              {/* Блик внутри зеленого */}
              <path
                fill="#AADA64"
                d="M 87.5 3.3 Q 87.25 3.15 86.95 3.15 L 4.1 3.15 Q 3.75 3.15 3.45 3.35 3.3 3.4 3.2 3.5 2.85 3.9 2.85 4.4 2.85 4.9 3.2 5.25 3.35 5.4 3.5 5.5 3.75 5.65 4.1 5.65 L 86.95 5.65 Q 87.25 5.65 87.55 5.45 87.7 5.4 87.8 5.3 88.15 4.9 88.15 4.4 88.15 3.9 87.8 3.55 87.65 3.4 87.5 3.3 Z"
              />
            </g>
          </svg>
        </motion.div>
      </motion.div>
    </div>
  );
};
