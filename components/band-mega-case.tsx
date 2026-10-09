'use client'

// components/band-mega-case.tsx — мегакейс главы банды-победителя: барабан ТОЛЬКО из банд-стикеров
// (без монет/гемов/пиццы). Исход решает сервер (claimBandMegaCase / openTestBandCase для админа).

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import Confetti from 'react-confetti'
import { useWindowSize } from 'react-use'
import { BAND_STICKER_BY_ID, pickBandSticker } from '@/lib/bandStickers'
import { BandStickerTile } from '@/components/band-sticker-tile'
import { CaseStars } from '@/components/CaseReel'
import { claimBandMegaCase, openTestBandCase, type BandCaseResult } from '@/actions/band-stickers'
import { playSound, preloadSound, CASE_PRIZE_SOUND, CHEST_DROP_SOUND } from '@/lib/sound'

const TILE = 96
const GAP = 10
const STRIP = 40
const TARGET = STRIP - 8
const SPIN_S = 6.5
const ROULETTE_SOUND = '/roulete.m4a'

const Reel = ({ test, onClose }: { test: boolean; onClose: () => void }) => {
    const { width, height } = useWindowSize()
    const [strip, setStrip] = useState<number[]>(() => Array.from({ length: STRIP }, () => pickBandSticker().id))
    const [phase, setPhase] = useState<'idle' | 'spinning' | 'done'>('idle')
    const [x, setX] = useState(0)
    const [result, setResult] = useState<Extract<BandCaseResult, { success: true }> | null>(null)
    const [error, setError] = useState<string | null>(null)
    const windowRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        preloadSound(ROULETTE_SOUND); preloadSound(CASE_PRIZE_SOUND); preloadSound(CHEST_DROP_SOUND)
        playSound(CHEST_DROP_SOUND)
    }, [])

    const spin = async () => {
        setPhase('spinning')
        const r = await (test ? openTestBandCase() : claimBandMegaCase()).catch(() => null)
        if (!r || !r.success) { setError(r && !r.success ? r.error : 'Что-то пошло не так'); setPhase('idle'); return }
        setStrip((s) => s.map((id, i) => (i === TARGET ? r.stickerId : id)))
        setResult(r)
        const w = windowRef.current?.clientWidth ?? 320
        const jitter = (Math.random() - 0.5) * TILE * 0.6
        setX(-(TARGET * (TILE + GAP) + TILE / 2 - w / 2 + jitter))
        playSound(ROULETTE_SOUND)
    }

    const st = result ? BAND_STICKER_BY_ID[result.stickerId] : null
    const legendary = st?.rarity === 'legendary'

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto" style={{ background: '#FF8A00' }}>
            <div className="pointer-events-none fixed inset-0" style={{ background: 'radial-gradient(circle at 50% 35%, rgba(255,255,255,0.35), transparent 45%), radial-gradient(circle at 50% 50%, transparent 40%, rgba(0,0,0,0.55) 100%)' }} />
            {phase === 'idle' && !result && <div className="pointer-events-none fixed inset-0 opacity-70"><CaseStars tier="mega" /></div>}
            {phase === 'done' && <Confetti width={width} height={height} recycle={false} numberOfPieces={legendary ? 600 : 300} />}
            <div className="relative z-10 mx-auto flex min-h-full max-w-xl flex-col items-center px-4 pb-10 pt-8">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/chests/mega0001.svg" alt="" className="h-36 w-36 animate-chest-idle-bounce" />
                <p className="mt-2 text-3xl font-black uppercase tracking-wide text-white drop-shadow-[0_3px_0_rgba(120,50,0,0.6)]">Мегакейс главы</p>
                <p className="text-sm font-bold text-white/85">Только банд-стикеры · золотые — большая редкость</p>

                <div ref={windowRef} className="relative mt-6 w-full overflow-hidden rounded-2xl border-4 border-[#FFE3A6] bg-[#141B1F]/85 py-3"
                    style={{ boxShadow: '0 6px 0 #9C4A00, 0 0 30px rgba(255,200,80,0.5)' }}>
                    <div className="pointer-events-none absolute inset-y-0 left-1/2 z-20 w-1 -translate-x-1/2 bg-[#FFE58A]" style={{ boxShadow: '0 0 10px #FFE58A' }} />
                    <motion.div className="flex" style={{ gap: GAP, paddingLeft: GAP }}
                        initial={false} animate={{ x }}
                        transition={{ duration: phase === 'spinning' ? SPIN_S : 0, ease: [0.12, 0.8, 0.18, 1] }}
                        onAnimationComplete={() => {
                            if (phase === 'spinning' && result) { setPhase('done'); playSound(CASE_PRIZE_SOUND) }
                        }}>
                        {strip.map((id, i) => (
                            <div key={i} className="shrink-0">
                                <BandStickerTile id={id} level={1} size={TILE} showStars={false} selected={phase === 'done' && i === TARGET} />
                            </div>
                        ))}
                    </motion.div>
                </div>

                {phase === 'done' && st && result ? (
                    <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', bounce: 0.5 }}
                        className="mt-6 flex flex-col items-center">
                        <BandStickerTile id={st.id} level={result.level} size={150} />
                        <p className="mt-3 text-2xl font-black text-white drop-shadow-[0_3px_0_rgba(120,50,0,0.6)]">
                            {legendary ? '✨ ЛЕГЕНДАРНЫЙ! ✨' : result.level > 1 ? `Уровень ${result.level}!` : 'Новый банд-стикер!'}
                        </p>
                        <p className="text-sm font-bold text-white/90">
                            {result.level > 1 ? 'Повтор — стикер прокачан, +★' : 'Его можно поставить картинкой банды'}
                        </p>
                        <button type="button" onClick={onClose}
                            className="mt-5 rounded-2xl bg-[#151F24] px-8 py-3 text-base font-black uppercase tracking-wide text-[#FFE3A6]"
                            style={{ boxShadow: '0 5px 0 #000' }}>
                            Забрать
                        </button>
                    </motion.div>
                ) : (
                    <button type="button" onClick={spin} disabled={phase !== 'idle'}
                        className="mt-6 w-full rounded-2xl bg-[#151F24] py-3.5 text-lg font-black uppercase tracking-wide text-[#FFE3A6] disabled:opacity-60"
                        style={{ boxShadow: '0 5px 0 #000' }}>
                        {phase === 'spinning' ? 'Крутим…' : 'Крутить'}
                    </button>
                )}
                {error && <p className="mt-3 rounded-xl bg-black/40 px-3 py-2 text-sm font-bold text-white">{error}</p>}
            </div>
        </div>
    )
}

// Карточка «тебя ждёт мегакейс» на странице банды (test — админская проверка без победы).
export const BandMegaCaseCard = ({ test = false }: { test?: boolean }) => {
    const router = useRouter()
    const [open, setOpen] = useState(false)
    if (open) return <Reel test={test} onClose={() => { setOpen(false); router.refresh() }} />
    return (
        <button type="button" onClick={() => setOpen(true)}
            className="flex w-full items-center gap-3 rounded-2xl border-2 p-3 text-left active:translate-y-[1px]"
            style={{ borderColor: '#FFB547', background: 'linear-gradient(135deg, rgba(255,138,0,0.25), #161F23 70%)', boxShadow: '0 4px 0 #6B3300' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/chests/mega0001.svg" alt="" className="h-14 w-14 shrink-0 animate-tile-float" />
            <span className="min-w-0 flex-1">
                <span className="block text-base font-black text-[#F2F7FB]">{test ? 'Тест: мегакейс главы' : 'Мегакейс главы банды!'}</span>
                <span className="block text-xs font-bold text-[#FFC978]">{test ? 'Только для админа — без победы' : 'За победу в битве — внутри банд-стикер'}</span>
            </span>
            <span className="shrink-0 rounded-xl px-3 py-1.5 text-sm font-black text-[#151F24]" style={{ backgroundColor: '#FF8A00', boxShadow: '0 4px 0 #9C4A00' }}>Открыть</span>
        </button>
    )
}
