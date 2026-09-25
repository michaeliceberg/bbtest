// components/celebration-shell.tsx
//
// Общий полноэкранный «праздничный» экран в двух стилях (2026-09-25):
// 'metal' — игровой (тёмный фон, свечение цвета акцента, взлетающие звёзды,
// кнопка в металлической рамке), 'cozy' — тёплый мультяшный (lib/cozyTheme.ts:
// тёплый фон, плоская кнопка с толстой нижней гранью, без неона).
// Используется экраном «Новый уровень» (level-up-screen.tsx) и экраном
// «N ответов подряд» (streak-celebration-screen.tsx).
// Анимации — только transform/opacity (см. «Производительность анимаций на iPhone»).

'use client'

import { motion } from 'framer-motion'
import Confetti from 'react-confetti'
import { useWindowSize } from 'react-use'
import { CaseStars } from '@/components/CaseReel'
import type { LessonCaseTier } from '@/lib/caseRewards'
import { COZY, type UiTheme } from '@/lib/cozyTheme'

type Props = {
    theme?: UiTheme
    // Цвет акцента (свечение фона, кнопка в игровом стиле).
    accent: string
    // Звёзды на фоне игрового стиля — цвет по «редкости» кейса.
    starsTier?: LessonCaseTier
    confetti?: boolean
    buttonLabel: string
    onButton: () => void
    // Кнопка тёплого стиля (по умолчанию — травяная).
    cozyButton?: { fill: string; edge: string }
    // fixed — поверх всего приложения (глобальный экран уровня); иначе
    // обычный блок во весь экран (экран внутри урока).
    overlay?: boolean
    children: React.ReactNode
}

export const CelebrationShell = ({
    theme = 'metal', accent, starsTier, confetti, buttonLabel, onButton, cozyButton, overlay, children,
}: Props) => {
    const cozy = theme === 'cozy'
    const { width, height } = useWindowSize()
    const btn = cozyButton ?? { fill: COZY.grass, edge: COZY.grassEdge }

    return (
        <div className={(overlay ? 'fixed inset-0 z-[70] ' : 'relative min-h-screen ') + 'flex flex-col overflow-hidden text-[#F2F7FB]'}>
            {/* Фон */}
            <div className="pointer-events-none absolute inset-0" style={{ backgroundColor: cozy ? '#221E1A' : '#131D22' }}>
                <div
                    className="absolute inset-0"
                    style={{
                        background: cozy
                            ? 'radial-gradient(ellipse at 50% 32%, #FFB67A30, transparent 60%)'
                            : `radial-gradient(ellipse at 50% 32%, ${accent}40, transparent 58%)`,
                    }}
                />
                {!cozy && starsTier && (
                    <div className="absolute inset-0 opacity-80">
                        <CaseStars tier={starsTier} />
                    </div>
                )}
                <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 50% 35%, transparent 35%, rgba(0,0,0,0.6) 100%)' }} />
            </div>

            {confetti && (
                <Confetti
                    width={width}
                    height={height}
                    numberOfPieces={240}
                    recycle={false}
                    gravity={0.25}
                    colors={cozy ? ['#FFE08A', '#F2C35B', '#FFB67A', '#7CC456', '#C9AEF5'] : ['#A78BFA', '#818CF8', '#F2F7FB', '#FBBF24', '#34D399']}
                />
            )}

            <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 text-center">{children}</div>

            <div className="relative z-10 flex justify-center px-4 pb-8 pt-2">
                <motion.div
                    initial={{ y: 24, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.9, duration: 0.4 }}
                    className="w-full max-w-sm"
                >
                    {cozy ? (
                        <motion.button
                            onClick={onButton}
                            whileTap={{ y: 5, boxShadow: `0 1px 0 ${btn.edge}` }}
                            className="w-full rounded-xl py-4 font-black text-lg uppercase tracking-[0.08em]"
                            style={{ background: btn.fill, color: COZY.darkText, boxShadow: `0 6px 0 ${btn.edge}` }}
                        >
                            {buttonLabel}
                        </motion.button>
                    ) : (
                        <motion.button
                            onClick={onButton}
                            whileTap={{ scale: 0.97, y: 2 }}
                            className="relative w-full rounded-2xl p-[2px] shadow-[0_10px_28px_rgba(0,0,0,0.5)]"
                            style={{ background: `linear-gradient(180deg, ${accent} 0%, #2A363C 55%, #141C20 100%)` }}
                        >
                            <span
                                aria-hidden
                                className="animate-glow-pulse pointer-events-none absolute inset-0 rounded-2xl"
                                style={{ boxShadow: `0 0 28px ${accent}AA` }}
                            />
                            <span
                                className="animate-shine-sweep relative block rounded-[14px] bg-gradient-to-b from-[#1C282E] to-[#0C1215] py-4 font-black text-lg uppercase tracking-[0.12em] shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]"
                                style={{ color: accent, textShadow: `0 0 12px ${accent}99` }}
                            >
                                {buttonLabel}
                            </span>
                        </motion.button>
                    )}
                </motion.div>
            </div>
        </div>
    )
}
