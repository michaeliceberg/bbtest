'use client'

// Экран «N ответов подряд» внутри урока тренажёра (рубеж 3 — см.
// STREAK_MILESTONES в TQUIZ.tsx). Без кнопки (2026-09-26): крупный Lottie
// вместе с надписью прилетает слева с замедлением в центр, Lottie проигрывает
// один цикл, затем всё улетает вправо с ускорением, и экран сам закрывается
// (onNext → следующий вопрос). Два стиля фона: 'metal' (игровой) и 'cozy'
// (тёплый). Тест: /test-streak-screen.

import { useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { motion } from 'framer-motion'
import { COZY, type UiTheme } from '@/lib/cozyTheme'

const Lottie = dynamic(() => import('lottie-react'), { ssr: false })

interface StreakCelebrationScreenProps {
  animationData: any
  onNext: () => void
  milestone: number
  theme?: UiTheme
}

// Текст/акцент по рубежу серии.
const MILESTONE_COPY: Record<number, { title: string; subtitle: string; accent: string; cozyEdge: string }> = {
  3: { title: 'Молодец!', subtitle: 'ответа подряд!', accent: '#C386F8', cozyEdge: '#8E6FC7' },
  7: { title: 'Огонь!', subtitle: 'ответов подряд!', accent: '#EF9F27', cozyEdge: '#C77A3E' },
}

const ENTER_S = 0.2
const EXIT_S = 0.1
// Страховка: если Lottie не сообщит о конце цикла (не загрузился и т.п.).
const HOLD_FALLBACK_MS = 4000

type Phase = 'in' | 'hold' | 'out'

export const StreakCelebrationScreen = ({ animationData, onNext, milestone, theme = 'metal' }: StreakCelebrationScreenProps) => {
  const cozy = theme === 'cozy'
  const copy = MILESTONE_COPY[milestone] ?? MILESTONE_COPY[3]
  const [phase, setPhase] = useState<Phase>('in')
  const lottieRef = useRef<any>(null)
  const doneRef = useRef(false)
  const phaseRef = useRef<Phase>('in')
  phaseRef.current = phase

  const leave = () => setPhase((p) => (p === 'out' ? p : 'out'))

  // Прилетели в центр — один цикл Lottie с начала, потом улетаем.
  useEffect(() => {
    if (phase !== 'hold') return
    lottieRef.current?.goToAndPlay(0, true)
    const t = setTimeout(leave, HOLD_FALLBACK_MS)
    return () => clearTimeout(t)
  }, [phase])

  return (
    <div className="relative min-h-screen overflow-hidden text-[#F2F7FB]">
      {/* Фон */}
      <div className="pointer-events-none fixed inset-0 z-0" style={{ backgroundColor: cozy ? COZY.bg : '#131D22' }}>
        <div
          className="absolute inset-0"
          style={{
            background: cozy
              ? 'radial-gradient(ellipse at 50% 40%, #FFB67A26, transparent 60%)'
              : `radial-gradient(ellipse at 50% 40%, ${copy.accent}40, transparent 58%)`,
          }}
        />
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 50% 40%, transparent 35%, rgba(0,0,0,0.6) 100%)' }} />
      </div>

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4">
        <motion.div
          initial={{ x: '-110vw' }}
          animate={{ x: phase === 'out' ? '110vw' : 0 }}
          transition={phase === 'out' ? { duration: EXIT_S, ease: [0.55, 0, 1, 0.45] } : { duration: ENTER_S, ease: [0, 0.55, 0.45, 1] }}
          onAnimationComplete={() => {
            if (phase === 'in') setPhase('hold')
            else if (phase === 'out' && !doneRef.current) {
              doneRef.current = true
              onNext()
            }
          }}
          className="-mt-16 sm:-mt-20 flex flex-col items-center text-center"
        >
          <div className="relative aspect-square w-[min(94vw,30rem)]">
            {!cozy && (
              <div className="absolute inset-0 rounded-full" style={{ background: `radial-gradient(closest-side, ${copy.accent}55, transparent)` }} />
            )}
            <Lottie
              lottieRef={lottieRef}
              animationData={animationData}
              loop={false}
              autoplay={false}
              onComplete={() => phaseRef.current === 'hold' && leave()}
              className="relative h-full w-full"
            />
          </div>

          <div
            className="mt-8 text-9xl sm:text-[10rem] font-black leading-none"
            style={
              cozy
                ? { color: '#FFF1DC', textShadow: `0 5px 0 ${copy.cozyEdge}, 0 10px 0 rgba(0,0,0,0.3)` }
                : { color: '#FFFFFF', textShadow: `0 0 28px ${copy.accent}, 0 0 60px ${copy.accent}88` }
            }
          >
            {milestone}
          </div>
          <p className="mt-3 text-4xl sm:text-5xl font-black uppercase tracking-wide" style={{ color: cozy ? '#FFF1DC' : '#F2F7FB' }}>
            {copy.subtitle}
          </p>
          <p
            className="mt-4 text-4xl sm:text-5xl font-black"
            style={cozy ? { color: COZY.headline, textShadow: `0 3px 0 ${COZY.headlineShadow}` } : { color: copy.accent, textShadow: `0 0 16px ${copy.accent}AA` }}
          >
            {copy.title}
          </p>
        </motion.div>
      </div>
    </div>
  )
}
