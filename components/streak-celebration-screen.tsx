'use client'

// Экран «N ответов подряд» внутри урока тренажёра (рубеж 3 — см.
// STREAK_MILESTONES в TQUIZ.tsx). Без кнопки (2026-09-26): крупный Lottie
// вместе с надписью прилетает слева с замедлением в центр, Lottie проигрывает
// 1,5 секунды (не весь цикл), затем всё улетает вправо с ускорением, и экран сам закрывается
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

// С такой вероятностью вместо Lottie играет ролик (Понасенков, gelatochocolato).
const VIDEO_CHANCE = 0.6
const VIDEO_SRC = '/video/ponasenkov-gelato.mp4'
const VIDEO_SAFETY_MS = 9000

const ENTER_S = 0.2
const EXIT_S = 0.1
// Сколько Lottie играет в центре — не ждём конца цикла (по просьбе пользователя).
const HOLD_MS = 1500

type Phase = 'in' | 'hold' | 'out'

export const StreakCelebrationScreen = ({ animationData, onNext, milestone, theme = 'metal' }: StreakCelebrationScreenProps) => {
  const cozy = theme === 'cozy'
  const copy = MILESTONE_COPY[milestone] ?? MILESTONE_COPY[3]
  const [phase, setPhase] = useState<Phase>('in')
  const lottieRef = useRef<any>(null)
  const doneRef = useRef(false)
  const [useVideo] = useState(() => milestone === 3 && Math.random() < VIDEO_CHANCE)
  const videoRef = useRef<HTMLVideoElement>(null)
  const finishVideo = () => {
    if (doneRef.current) return
    doneRef.current = true
    onNext()
  }
  useEffect(() => {
    if (!useVideo) return
    const v = videoRef.current
    // Экран открывается после клика по ответу — со звуком обычно разрешено; иначе без звука.
    if (v) v.play().catch(() => { v.muted = true; v.play().catch(() => {}) })
    const t = setTimeout(finishVideo, VIDEO_SAFETY_MS)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [useVideo])

  const leave = () => setPhase((p) => (p === 'out' ? p : 'out'))

  // Прилетели в центр — один цикл Lottie с начала, потом улетаем.
  useEffect(() => {
    if (phase !== 'hold') return
    lottieRef.current?.goToAndPlay(0, true)
    const t = setTimeout(leave, HOLD_MS)
    return () => clearTimeout(t)
  }, [phase])

  if (useVideo) {
    return (
      <div className="relative min-h-screen overflow-hidden text-[#F2F7FB]">
        <div className="pointer-events-none fixed inset-0 z-0" style={{ backgroundColor: cozy ? COZY.bg : '#0E1518' }}>
          <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse at 50% 35%, ${copy.accent}40, transparent 60%)` }} />
        </div>
        <div className="relative z-10 flex min-h-screen flex-col items-center justify-center gap-3 px-4 py-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 14 }}
            className="text-center font-black uppercase leading-none"
          >
            <div className="text-6xl sm:text-7xl" style={{ color: '#FFD84D', textShadow: '0 0 24px #FFB02088, 0 4px 0 #8A5A00' }}>УРАА!</div>
            <div className="mt-2 text-2xl sm:text-4xl" style={{ color: '#FFFFFF', textShadow: `0 0 18px ${copy.accent}` }}>3 правильных подряд!</div>
          </motion.div>
          <motion.video
            ref={videoRef}
            src={VIDEO_SRC}
            playsInline
            onEnded={finishVideo}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="max-h-[66vh] w-auto max-w-full rounded-2xl object-contain shadow-2xl"
            style={{ aspectRatio: '9 / 16', border: `3px solid ${copy.accent}` }}
          />
        </div>
      </div>
    )
  }

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
