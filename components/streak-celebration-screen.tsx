'use client'

// Экран «N ответов подряд» внутри урока тренажёра (рубеж 3: 50% ролик Понасенкова, 50% гусь Га-Га «Радость» влетает слева — GooseStreakScreen; см.
// STREAK_MILESTONES в TQUIZ.tsx). Без кнопки (2026-09-26): крупный Lottie
// вместе с надписью прилетает слева с замедлением в центр, Lottie проигрывает
// 1,5 секунды (не весь цикл), затем всё улетает вправо с ускорением, и экран сам закрывается
// (onNext → следующий вопрос). Два стиля фона: 'metal' (игровой) и 'cozy'
// (тёплый). Тест: /test-streak-screen.

import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { COZY, type UiTheme } from '@/lib/cozyTheme'
import Lottie from '@/components/lottie-player'

// Lottie грузится через общую обёртку (JSON — по URL, не в бандле)

type Variant = 'video' | 'goose' | 'lottie'

interface StreakCelebrationScreenProps {
  animationData: any
  onNext: () => void
  milestone: number
  theme?: UiTheme
  // Для тестовой страницы: принудительно показать вариант. Иначе на рубеже 3 — 50/50 Понасенков / гусь.
  variant?: Variant
}

// Текст/акцент по рубежу серии.
const MILESTONE_COPY: Record<number, { title: string; subtitle: string; accent: string; cozyEdge: string }> = {
  3: { title: 'Молодец!', subtitle: 'ответа подряд!', accent: '#C386F8', cozyEdge: '#8E6FC7' },
  7: { title: 'Огонь!', subtitle: 'ответов подряд!', accent: '#EF9F27', cozyEdge: '#C77A3E' },
}

// Рубеж 3: с такой вероятностью ролик (Понасенков, gelatochocolato), иначе влетает гусь Га-Га «Радость».
const VIDEO_CHANCE = 0.5
const VIDEO_SRC = '/video/ponasenkov-gelato.mp4'
const VIDEO_SAFETY_MS = 9000

const ENTER_S = 0.2
const EXIT_S = 0.1
// Сколько Lottie играет в центре — не ждём конца цикла (по просьбе пользователя).
const HOLD_MS = 1500

type Phase = 'in' | 'hold' | 'out'

export const StreakCelebrationScreen = (props: StreakCelebrationScreenProps) => {
  const [picked] = useState<Variant>(() =>
    props.variant ?? (props.milestone === 3 ? (Math.random() < VIDEO_CHANCE ? 'video' : 'goose') : 'lottie'))
  if (picked === 'goose') return <GooseStreakScreen onNext={props.onNext} theme={props.theme} />
  return <LottieOrVideoScreen {...props} useVideo={picked === 'video'} />
}

const LottieOrVideoScreen = ({ animationData, onNext, milestone, theme = 'metal', useVideo }: StreakCelebrationScreenProps & { useVideo: boolean }) => {
  const cozy = theme === 'cozy'
  const copy = MILESTONE_COPY[milestone] ?? MILESTONE_COPY[3]
  const [phase, setPhase] = useState<Phase>('in')
  const lottieRef = useRef<any>(null)
  const doneRef = useRef(false)
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

// ── Гусь Га-Га «Радость»: влетает слева направо (отражён), замедляется в центре, «ТРИ ПОДРЯД!» снизу,
// лучи, линии скорости и разлёт звёздочек. Потом с ускорением улетает вправо и экран сам закрывается.
// Только transform/opacity (плавно на телефоне).
const GOOSE_SRC = '/miguel/miguel-dance.webp'
const G_ENTER_S = 0.75
const G_HOLD_MS = 1900
const G_EXIT_S = 0.35
const BURST = Array.from({ length: 16 }, (_, i) => {
  const a = (i / 16) * Math.PI * 2
  const d = 150 + (i % 3) * 45
  const colors = ['#FFD84D', '#C385F7', '#5CC99F', '#53ADEF', '#FF7AB6', '#FFFFFF']
  return { x: Math.cos(a) * d, y: Math.sin(a) * d * 0.8, c: colors[i % colors.length], star: i % 2 === 0, s: 14 + (i % 3) * 5 }
})
const SPEED_LINES = [-120, -70, -25, 25, 70, 120]

const GooseStreakScreen = ({ onNext, theme = 'metal' }: { onNext: () => void; theme?: UiTheme }) => {
  const cozy = theme === 'cozy'
  const [phase, setPhase] = useState<Phase>('in')
  const doneRef = useRef(false)
  useEffect(() => {
    const i = new Image(); i.src = GOOSE_SRC
  }, [])
  useEffect(() => {
    if (phase !== 'hold') return
    const t = setTimeout(() => setPhase('out'), G_HOLD_MS)
    return () => clearTimeout(t)
  }, [phase])
  const arrived = phase !== 'in'

  return (
    <div className="relative min-h-screen overflow-hidden text-[#F2F7FB]">
      <div className="pointer-events-none fixed inset-0 z-0" style={{ backgroundColor: cozy ? COZY.bg : '#131D22' }}>
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 50% 42%, #FFD84D33, transparent 60%)' }} />
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 50% 42%, transparent 35%, rgba(0,0,0,0.6) 100%)' }} />
      </div>

      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4">
        {/* Лучи за гусём — появляются, когда он долетел, медленно крутятся */}
        {/* центрирование — на статичной обёртке: framer перезаписывает transform у motion.div */}
        <div className="pointer-events-none absolute left-1/2 top-[42%] -translate-x-1/2 -translate-y-1/2">
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={arrived && phase !== 'out' ? { scale: 1, opacity: 1 } : { scale: arrived ? 1.3 : 0, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 160, damping: 14 }}
        >
          <svg viewBox="-100 -100 200 200" className="w-[min(140vw,46rem)] h-[min(140vw,46rem)] animate-[spin_14s_linear_infinite]">
            {Array.from({ length: 14 }, (_, i) => (
              <path key={i} d="M0,0 L-9,-100 L9,-100 Z" fill={i % 2 ? '#FFD84D' : '#C385F7'} opacity={0.16} transform={`rotate(${(i * 360) / 14})`} />
            ))}
          </svg>
        </motion.div>
        </div>

        {/* Разлёт звёздочек и точек в момент прилёта */}
        {arrived && (
          <div className="pointer-events-none absolute left-1/2 top-[42%]" style={{ width: 0, height: 0 }}>
            {BURST.map((b, i) => (
              <motion.span key={i} className="absolute block" style={{ left: -b.s / 2, top: -b.s / 2 }}
                initial={{ x: 0, y: 0, scale: 0, opacity: 0, rotate: 0 }}
                animate={{ x: b.x, y: b.y, scale: [0, 1.3, 0.8], opacity: [0, 1, 0], rotate: 120 }}
                transition={{ duration: 1.1, ease: 'easeOut', delay: (i % 4) * 0.04 }}>
                {b.star
                  ? <svg viewBox="-5 -5 10 10" width={b.s} height={b.s}><path d="M0,-5 L1.4,-1.4 L5,0 L1.4,1.4 L0,5 L-1.4,1.4 L-5,0 L-1.4,-1.4 Z" fill={b.c} /></svg>
                  : <span className="block rounded-full" style={{ width: b.s * 0.55, height: b.s * 0.55, backgroundColor: b.c }} />}
              </motion.span>
            ))}
          </div>
        )}

        {/* Гусь: влетает слева с замедлением, в центре подпрыгивает, улетает вправо с ускорением */}
        <motion.div
          className="relative -mt-10"
          initial={{ x: '-110vw', rotate: -12 }}
          animate={phase === 'out' ? { x: '115vw', rotate: 10 } : { x: 0, rotate: 0 }}
          transition={phase === 'out' ? { duration: G_EXIT_S, ease: [0.55, 0, 1, 0.45] } : { duration: G_ENTER_S, ease: [0.12, 0.9, 0.3, 1] }}
          onAnimationComplete={() => {
            if (phase === 'in') setPhase('hold')
            else if (phase === 'out' && !doneRef.current) { doneRef.current = true; onNext() }
          }}
        >
          {/* Линии скорости позади (слева) — видны в полёте, гаснут при остановке */}
          <motion.div className="pointer-events-none absolute right-[78%] top-1/2" style={{ width: 0, height: 0 }}
            animate={{ opacity: phase === 'hold' ? 0 : 1 }} transition={{ duration: 0.3 }}>
            {SPEED_LINES.map((y, i) => (
              <span key={i} className="absolute block h-[6px] rounded-full"
                style={{ right: 0, top: y, width: 90 + (i % 3) * 50, background: 'linear-gradient(90deg, transparent, #FFFFFFAA)' }} />
            ))}
          </motion.div>
          <motion.div
            animate={phase === 'hold' ? { y: [0, -22, 0, -12, 0], scaleY: [1, 1.04, 0.96, 1.02, 1] } : { y: 0 }}
            transition={phase === 'hold' ? { duration: 1.1, ease: 'easeOut' } : undefined}
          >
            {/* отражён по горизонтали — летит вправо лицом вперёд */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={GOOSE_SRC} alt="Команданте Мигель" draggable={false}
              className="w-[min(78vw,24rem)] h-[min(78vw,24rem)] object-contain select-none drop-shadow-[0_14px_28px_rgba(0,0,0,0.55)]"
              style={{ transform: 'scaleX(-1)' }} />
          </motion.div>
        </motion.div>

        {/* «ТРИ ПОДРЯД!» — выпрыгивает снизу, когда гусь остановился */}
        <motion.div
          className="mt-2 text-center font-black uppercase leading-none"
          initial={{ y: 60, scale: 0.4, opacity: 0 }}
          animate={phase === 'in' ? { y: 60, scale: 0.4, opacity: 0 } : phase === 'out' ? { y: 0, scale: 1, opacity: 0 } : { y: 0, scale: 1, opacity: 1 }}
          transition={phase === 'hold' ? { type: 'spring', stiffness: 320, damping: 11, delay: 0.1 } : { duration: 0.2 }}
        >
          <div className="text-6xl sm:text-7xl tracking-wide"
            style={cozy
              ? { color: '#FFF1DC', textShadow: '0 5px 0 #8E6FC7, 0 10px 0 rgba(0,0,0,0.3)' }
              : { color: '#FFD84D', textShadow: '0 0 26px #FFB020AA, 0 5px 0 #8A5A00' }}>
            ТРИ ПОДРЯД!
          </div>
        </motion.div>
      </div>
    </div>
  )
}
