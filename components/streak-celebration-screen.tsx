'use client'

// Экран «N ответов подряд» внутри урока тренажёра (рубежи 3 и 7 — см.
// STREAK_MILESTONES в TQUIZ.tsx). Два стиля (2026-09-25): 'metal' (игровой)
// и 'cozy' (тёплый), общий каркас components/celebration-shell.tsx.
// Тест: /test-streak-screen.

import dynamic from 'next/dynamic'
import { motion } from 'framer-motion'
import { CelebrationShell } from '@/components/celebration-shell'
import type { LessonCaseTier } from '@/lib/caseRewards'
import { COZY, type UiTheme } from '@/lib/cozyTheme'

const Lottie = dynamic(() => import('lottie-react'), { ssr: false })

interface StreakCelebrationScreenProps {
  animationData: any
  onNext: () => void
  milestone: number
  theme?: UiTheme
}

// Текст/акцент по рубежу серии — 3 и 7 не должны выглядеть одинаково.
const MILESTONE_COPY: Record<number, { title: string; subtitle: string; accent: string; stars: LessonCaseTier; cozyFill: string; cozyEdge: string }> = {
  3: { title: 'Молодец!', subtitle: 'ответа подряд!', accent: '#C386F8', stars: 'mythic', cozyFill: '#C9AEF5', cozyEdge: '#8E6FC7' },
  7: { title: 'Огонь!', subtitle: 'ответов подряд!', accent: '#EF9F27', stars: 'mega', cozyFill: '#FFB67A', cozyEdge: '#C77A3E' },
}

export const StreakCelebrationScreen = ({ animationData, onNext, milestone, theme = 'metal' }: StreakCelebrationScreenProps) => {
  const cozy = theme === 'cozy'
  const copy = MILESTONE_COPY[milestone] ?? MILESTONE_COPY[3]

  return (
    <CelebrationShell
      theme={theme}
      accent={copy.accent}
      starsTier={copy.stars}
      buttonLabel="Далее"
      onButton={onNext}
      cozyButton={{ fill: copy.cozyFill, edge: copy.cozyEdge }}
    >
      {/* Персонаж */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', bounce: 0.5, duration: 0.7 }}
        className="relative h-52 w-52"
      >
        <div
          className={cozy ? 'absolute inset-0 rounded-3xl' : 'absolute inset-0 rounded-full'}
          style={
            cozy
              ? { background: COZY.card, border: `4px solid ${COZY.cardBorder}`, boxShadow: `0 8px 0 ${COZY.cardEdge}` }
              : { background: `radial-gradient(closest-side, ${copy.accent}55, transparent)` }
          }
        />
        <Lottie animationData={animationData} loop autoplay className="relative h-full w-full" />
      </motion.div>

      {/* Крупное число серии */}
      <motion.div
        initial={{ scale: 3, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', bounce: 0.6, duration: 0.8, delay: 0.25 }}
        className="mt-5 text-8xl font-black leading-none"
        style={
          cozy
            ? { color: '#FFF1DC', textShadow: `0 5px 0 ${copy.cozyEdge}, 0 10px 0 rgba(0,0,0,0.3)` }
            : { color: '#FFFFFF', textShadow: `0 0 28px ${copy.accent}, 0 0 60px ${copy.accent}88` }
        }
      >
        {milestone}
      </motion.div>

      <motion.p
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-2 text-2xl font-black uppercase tracking-wide"
        style={cozy ? { color: '#FFF1DC' } : { color: '#F2F7FB' }}
      >
        {copy.subtitle}
      </motion.p>

      <motion.p
        initial={{ y: 10, opacity: 0, scale: 0.9 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        transition={{ delay: 0.65, type: 'spring', bounce: 0.5 }}
        className="mt-3 text-3xl font-black"
        style={
          cozy
            ? { color: COZY.headline, textShadow: `0 3px 0 ${COZY.headlineShadow}` }
            : { color: copy.accent, textShadow: `0 0 16px ${copy.accent}AA` }
        }
      >
        {copy.title}
      </motion.p>
    </CelebrationShell>
  )
}
