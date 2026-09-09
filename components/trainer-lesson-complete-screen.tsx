// components/trainer-lesson-complete-screen.tsx
//
// Экран завершения урока тренажёра — по прямой просьбе пользователя,
// редизайн по присланному скриншоту (Duolingo-style "серия" экран):
// персонаж сверху, заголовок "Вы запустили серию!" + подзаголовок с
// реальным числом верных ответов подряд, три карточки-статистики (очки
// опыта / серия / время) и одна главная кнопка снизу. Заменяет прежний
// плоский экран "Завершено! / Правильно X из Y".
//
// Все три цифры — честные, посчитанные в TQUIZ.tsx за время реальной
// попытки (maxStreakRef/xpForAmount(TRAINER_LESSON_TRAINING_PTS)/
// Date.now()-lessonStartRef.current), не выдуманные здесь.

'use client'

import dynamic from 'next/dynamic'
import { motion } from 'framer-motion'
import { Zap, Target, Timer } from 'lucide-react'
import { Button } from './ui/button'
import { declensionRu } from '@/usefulFunctions'

const Lottie = dynamic(() => import('lottie-react'), { ssr: false })

type Props = {
    lottieData: any
    streak: number
    xp: number
    elapsedSeconds: number
    primaryLabel: string
    onPrimary: () => void
    secondaryLabel?: string
    onSecondary?: () => void
}

const formatElapsed = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${String(s).padStart(2, '0')}`
}

// Карточка-статистика — цветная плашка-заголовок сверху ("ОЧКИ ОПЫТА" и
// т.п.) + бордер-бокс с иконкой и значением снизу, тем же цветом. Три
// цвета зафиксированы под конкретный смысл (жёлтый=опыт, синий=серия,
// зелёный=скорость), как на присланном скриншоте — не через общую
// tone-палитру проекта (TONE_STYLE в trainer-quest-rewards-screen.tsx),
// т.к. тут смысл карточек другой (не редкость награды, а тип метрики).
const StatCard = ({
    label, value, icon, color, delay,
}: { label: string; value: string; icon: React.ReactNode; color: string; delay: number }) => (
    <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay, duration: 0.35 }}
        className="flex-1 flex flex-col items-stretch rounded-2xl overflow-hidden"
        style={{ border: `2px solid ${color}` }}
    >
        <div className="text-center text-[10px] sm:text-xs font-black uppercase tracking-tight py-1.5" style={{ backgroundColor: color, color: '#151F24' }}>
            {label}
        </div>
        <div className="flex items-center justify-center gap-1.5 py-2.5" style={{ backgroundColor: `${color}1A` }}>
            <span style={{ color }}>{icon}</span>
            <span className="font-black text-lg sm:text-xl" style={{ color }}>{value}</span>
        </div>
    </motion.div>
)

export const TrainerLessonCompleteScreen = ({
    lottieData, streak, xp, elapsedSeconds, primaryLabel, onPrimary, secondaryLabel, onSecondary,
}: Props) => {
    const streakWord = declensionRu(streak, 'верный ответ', 'верных ответа', 'верных ответов')

    return (
        <div className="w-full max-w-xl mx-auto py-6 px-1 flex flex-col items-center">
            <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 260, damping: 18 }}
                className="w-52 h-52 sm:w-64 sm:h-64"
            >
                <Lottie animationData={lottieData} loop autoplay className="w-full h-full" />
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.35 }}
                className="text-center mt-2"
            >
                <h1 className="text-2xl sm:text-3xl font-extrabold" style={{ color: '#38BDF8' }}>
                    Вы запустили серию!
                </h1>
                <p className="text-base sm:text-lg text-[#F2F7FB] mt-2">
                    {streak} {streakWord} подряд? Так держать!
                </p>
            </motion.div>

            <div className="flex gap-3 w-full mt-6">
                <StatCard label="Очки опыта" value={`${xp}`} icon={<Zap className="w-5 h-5" fill="currentColor" />} color="#FBBF24" delay={0.3} />
                <StatCard label="Серия" value={`x${streak}`} icon={<Target className="w-5 h-5" />} color="#38BDF8" delay={0.4} />
                <StatCard label="Быстро" value={formatElapsed(elapsedSeconds)} icon={<Timer className="w-5 h-5" />} color="#34D399" delay={0.5} />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.35 }}
                className="w-full mt-8"
            >
                <Button onClick={onPrimary} variant="primary" className="w-full">
                    {primaryLabel}
                </Button>
                {secondaryLabel && onSecondary && (
                    <Button onClick={onSecondary} variant="primaryOutline" className="w-full mt-3">
                        {secondaryLabel}
                    </Button>
                )}
            </motion.div>
        </div>
    )
}
