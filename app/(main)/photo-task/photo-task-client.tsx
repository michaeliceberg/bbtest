'use client'

// Экран «Билд на задачу» (запасное название — «Гайд на задачу»): камера/галерея → фото ужимается в браузере до 1280 px (JPEG) → analyzeTaskPhoto → уроки.

import { useEffect, useRef, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Camera, ImageIcon, Loader2, Sparkles, RotateCcw, ChevronRight, Lightbulb, AlertTriangle, Gift, Lock, Check } from 'lucide-react'
import { analyzeTaskPhoto, premiumInterest, type PhotoTaskResult, type PhotoTaskLesson } from '@/actions/photo-task'
import { checkAchievements } from '@/lib/achievementsClient'
import { PREMIUM_PRICE_RUB } from '@/lib/pro'
import { cn } from '@/lib/utils'
import { MagicListenButton } from '@/components/magic-listen-button'

const MAX_SIDE = 1280
const THINKING = ['Сканирую босса…', 'Смотрю на чертёж…', 'Прикидываю, как его завалить…', 'Собираю билд…']

// Ужимаем фото в браузере: длинная сторона ≤ 1280 px, JPEG. Так запрос лёгкий и дешёвый.
const compress = (file: File) => new Promise<{ b64: string; preview: string }>((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
        const k = Math.min(1, MAX_SIDE / Math.max(img.width, img.height))
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(img.width * k)
        canvas.height = Math.round(img.height * k)
        const ctx = canvas.getContext('2d')
        if (!ctx) { reject(new Error('canvas')); return }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        URL.revokeObjectURL(url)
        let data = canvas.toDataURL('image/jpeg', 0.82)
        if (data.length > 1_300_000) data = canvas.toDataURL('image/jpeg', 0.6)
        resolve({ b64: data.split(',')[1], preview: data })
    }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('image')) }
    img.src = url
})

const ERRORS: Record<string, string> = {
    auth: 'Нужно войти в аккаунт.',
    not_configured: 'Разбор фото ещё не подключён (нет ключа API).',
    limit: 'На сегодня разборы закончились. Приходи завтра 😉',
    bad_image: 'Не получилось открыть фото. Попробуй другое.',
    failed: 'Не получилось разобрать фото. Попробуй ещё раз или сфоткай почётче.',
}

export const PhotoTaskClient = ({ configured, left: initialLeft, limit }: { configured: boolean; left: number | null; limit: number }) => {
    const cameraRef = useRef<HTMLInputElement>(null)
    const galleryRef = useRef<HTMLInputElement>(null)
    const [preview, setPreview] = useState<string | null>(null)
    const [busy, setBusy] = useState(false)
    const [step, setStep] = useState(0)
    const [result, setResult] = useState<PhotoTaskResult | null>(null)
    const [left, setLeft] = useState(initialLeft)

    useEffect(() => {
        if (!busy) return
        const t = setInterval(() => setStep((s) => (s + 1) % THINKING.length), 1600)
        return () => clearInterval(t)
    }, [busy])

    const onFile = async (file?: File) => {
        if (!file) return
        setResult(null)
        try {
            const { b64, preview } = await compress(file)
            setPreview(preview)
            setBusy(true); setStep(0)
            const r = await analyzeTaskPhoto(b64, 'image/jpeg')
            setResult(r)
            if (r.left !== undefined) setLeft(r.left)
            if (r.ok) checkAchievements()
        } catch {
            setResult({ ok: false, error: 'bad_image' })
        } finally {
            setBusy(false)
        }
    }
    const reset = () => { setPreview(null); setResult(null) }
    const outOfLimit = left !== null && left <= 0

    return (
        <div className="relative flex flex-col gap-5">
            {/* Фон: мягкие свечения (без blur — плавно на iPhone) */}
            <div aria-hidden className="pointer-events-none absolute -top-16 left-1/2 h-[360px] w-[460px] -translate-x-1/2 -z-10"
                style={{ background: 'radial-gradient(ellipse at 30% 40%, rgba(83,173,239,0.22), transparent 60%), radial-gradient(ellipse at 75% 55%, rgba(167,92,240,0.2), transparent 62%)' }} />

            <div className="flex flex-col items-center text-center">
                <div className="relative mb-3">
                    <div aria-hidden className="animate-glow-pulse absolute inset-[-30%] rounded-full" style={{ background: 'radial-gradient(circle, rgba(124,92,224,0.5), transparent 65%)' }} />
                    <div className="animate-chest-idle-bounce relative flex h-20 w-20 items-center justify-center rounded-3xl text-4xl"
                        style={{ background: 'linear-gradient(135deg, #53ADEF 0%, #7C5CE0 60%, #C385F7 100%)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.35), 0 5px 0 #2E2F6E, 0 0 30px rgba(124,92,224,0.45)' }}>
                        <Sparkles className="h-10 w-10 text-white" strokeWidth={2.3} />
                    </div>
                </div>
                <h1 className="text-[1.9rem] font-black leading-tight text-white">
                    <span className="bg-gradient-to-r from-[#7FC6F7] to-[#C9A2FA] bg-clip-text text-transparent">ИИ</span>-помощник
                </h1>
                <p className="mt-1.5 max-w-xs text-sm font-bold text-[#A9B8C2]">Пришли фото любой задачи или примера — подскажу, с чего начать и какие уроки пройти</p>
                {left !== null && (
                    <div className="mt-3 flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-black text-[#D5DEE5]"
                        style={{ background: 'rgba(22,31,35,0.8)', boxShadow: 'inset 0 0 0 1px #34424A' }}>
                        <span>Сегодня</span>
                        {Array.from({ length: limit }, (_, i) => (
                            <span key={i} className="h-2.5 w-2.5 rounded-full" style={{ background: i < left ? 'linear-gradient(135deg,#7FC6F7,#C9A2FA)' : '#2A363C' }} />
                        ))}
                        <span className="text-[#8FA3AE]">{left} из {limit}</span>
                    </div>
                )}
                {!configured && <p className="mt-2 text-xs font-black text-[#F2C35B]">Видно только админам: ключ API не настроен</p>}
            </div>

            <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden"
                onChange={(e) => { onFile(e.target.files?.[0]); e.target.value = '' }} />
            <input ref={galleryRef} type="file" accept="image/*" className="hidden"
                onChange={(e) => { onFile(e.target.files?.[0]); e.target.value = '' }} />

            {preview && (
                <div className="relative w-full overflow-hidden rounded-2xl p-[2px]"
                    style={{ background: 'linear-gradient(135deg, #7FC6F7, #3A464E 45%, #C9A2FA)' }}>
                    <div className="relative overflow-hidden rounded-[14px] bg-[#0F171B]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={preview} alt="Фото задачи" className="w-full max-h-[300px] object-contain" />
                        {busy && (
                            <>
                                <div aria-hidden className="animate-photo-scan pointer-events-none absolute inset-x-0 top-0 h-[10%]"
                                    style={{ background: 'linear-gradient(180deg, transparent, rgba(127,198,247,0.55), transparent)' }} />
                                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/45">
                                    <Loader2 className="h-8 w-8 animate-spin text-white" />
                                    <span className="rounded-full bg-black/50 px-3 py-1 font-black text-white">{THINKING[step]}</span>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {!busy && !result && (
                <div className="grid grid-cols-2 gap-3">
                    <BigButton disabled={outOfLimit} onClick={() => cameraRef.current?.click()} primary icon={<Camera className="h-8 w-8" />} label="Сфоткать" />
                    <BigButton disabled={outOfLimit} onClick={() => galleryRef.current?.click()} icon={<ImageIcon className="h-8 w-8" />} label="Из галереи" />
                </div>
            )}
            {outOfLimit && !result && <p className="text-center font-bold text-[#F2C35B]">{ERRORS.limit}</p>}

            {result && !result.ok && (
                <div className="flex items-start gap-3 rounded-2xl px-4 py-3 font-bold text-[#F2B5B2]"
                    style={{ background: 'linear-gradient(180deg, #2A1C1E, #1D1517)', boxShadow: 'inset 0 0 0 1.5px rgba(220,96,91,0.55)' }}>
                    <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" /> {ERRORS[result.error]}
                </div>
            )}

            {result && result.ok && (
                <motion.div className="flex flex-col gap-4" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    {!result.readable ? (
                        <GlassCard tone="#F2C35B">
                            <p className="font-bold text-[#F2C35B]">Не вижу на фото задачу по математике или физике 🤔 Сфоткай условие поближе и почётче.</p>
                        </GlassCard>
                    ) : (
                        <>
                            <GlassCard tone="#7FC6F7">
                                <div className="text-[11px] font-black uppercase tracking-[0.12em] text-[#7E8F99]">👾 Босс</div>
                                <p className="mt-1 text-[15px] font-bold leading-snug text-[#E2EAF0]">{result.problemText}</p>
                            </GlassCard>

                            {result.lessons.length > 0 && (
                                <div className="flex flex-col gap-2">
                                    <SectionTitle color="#A1D151">⚔️ Твой билд — пройди эти уроки</SectionTitle>
                                    {result.lessons.map((l, i) => <LessonRow key={l.id} l={l} badge={String(i + 1)} color="#78C93C" i={i} />)}
                                </div>
                            )}

                            {result.bonusLessons.length > 0 && (
                                <div className="flex flex-col gap-2">
                                    <SectionTitle color="#C9A2FA"><Gift className="h-4 w-4" /> Бонусный лут — прокачает тему шире</SectionTitle>
                                    {result.bonusLessons.map((l, i) => <LessonRow key={l.id} l={l} badge="🎁" color="#C385F7" i={result.lessons.length + i} />)}
                                </div>
                            )}

                            {result.missingTopics.length > 0 && (
                                <GlassCard tone="#5C6B73">
                                    <p className="text-sm font-bold text-[#8FA3AE]">
                                        {result.lessons.length > 0 ? 'Ещё пригодится (уроков пока нет): ' : 'Уроков по этой теме у нас пока нет: '}
                                        <span className="text-[#D7E0E5]">{result.missingTopics.join(', ')}</span>. Скоро добавим 🛠️
                                    </p>
                                </GlassCard>
                            )}

                            {result.hint && (
                                <GlassCard tone="#F2C35B">
                                    <div className="flex items-start gap-3">
                                        <Lightbulb className="mt-0.5 h-5 w-5 shrink-0 text-[#F2C35B]" />
                                        <p className="text-[15px] font-bold leading-snug text-[#F2E3B8]">{result.hint}</p>
                                    </div>
                                    <MagicListenButton className="mt-3 w-full" text={`Задача. ${result.problemText}. Подсказка. ${result.hint}`} />
                                </GlassCard>
                            )}
                        </>
                    )}
                    {result.readable && <PremiumDoor />}
                </motion.div>
            )}

            {result && !busy && (
                <button type="button" onClick={reset} disabled={outOfLimit && result.ok}
                    className="flex items-center justify-center gap-2 rounded-2xl px-4 py-3 font-black text-white transition-transform active:translate-y-[4px] disabled:opacity-40"
                    style={{ background: 'linear-gradient(180deg, #24313A, #1A252B)', boxShadow: 'inset 0 0 0 1.5px #3A4A53, inset 0 1px 0 rgba(255,255,255,0.08), 0 4px 0 #0C1215' }}>
                    <RotateCcw className="h-5 w-5" /> Другая задача
                </button>
            )}
        </div>
    )
}

// Объём — boxShadow + translate при нажатии (высота не меняется, ничего ниже не прыгает).
const BigButton = ({ disabled, onClick, primary, icon, label }: { disabled: boolean; onClick: () => void; primary?: boolean; icon: ReactNode; label: string }) => (
    <button type="button" disabled={disabled} onClick={onClick}
        className={cn('shine-sweep relative flex flex-col items-center gap-2 overflow-hidden rounded-2xl px-3 py-5 font-black text-white transition-transform active:translate-y-[4px]', disabled && 'opacity-40')}
        style={primary
            ? { background: 'linear-gradient(135deg, #3E8FD0 0%, #6A4FD0 100%)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3), 0 4px 0 #2B2F6B, 0 0 24px rgba(106,79,208,0.35)' }
            : { background: 'linear-gradient(180deg, #24313A, #1A252B)', boxShadow: 'inset 0 0 0 1.5px #3A4A53, inset 0 1px 0 rgba(255,255,255,0.08), 0 4px 0 #0C1215' }}>
        {icon} {label}
    </button>
)

const GlassCard = ({ tone, children }: { tone: string; children: ReactNode }) => (
    <div className="rounded-2xl px-4 py-3"
        style={{ background: 'linear-gradient(180deg, rgba(36,49,58,0.92), rgba(24,34,40,0.92))', boxShadow: `inset 0 0 0 1.5px ${tone}55, inset 0 1px 0 rgba(255,255,255,0.06)` }}>
        {children}
    </div>
)

const SectionTitle = ({ color, children }: { color: string; children: ReactNode }) => (
    <div className="flex items-center gap-1.5 px-1 text-sm font-black" style={{ color }}>{children}</div>
)

const LessonRow = ({ l, badge, color, i }: { l: PhotoTaskLesson; badge: string; color: string; i: number }) => (
    <motion.div initial={{ x: -24, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.15 + i * 0.12, duration: 0.3 }}>
        <Link href={`/t-lesson/${l.id}`}
            className="flex items-center gap-3 rounded-2xl px-4 py-3 transition-transform active:translate-y-[4px]"
            style={{ background: `linear-gradient(135deg, ${color}26, rgba(24,34,40,0.95) 60%)`, boxShadow: `inset 0 0 0 1.5px ${color}99, inset 0 1px 0 rgba(255,255,255,0.08), 0 4px 0 #0C1215` }}>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl font-black text-[#1B2A10]"
                style={{ background: `linear-gradient(135deg, ${color}, ${color}CC)`, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.4)' }}>{badge}</span>
            <span className="min-w-0 flex-1">
                <span className="block font-black leading-tight text-white">{l.lesson}</span>
                <span className="block text-xs font-bold text-[#8FA3AE]">{l.course} · {l.unit}</span>
            </span>
            <ChevronRight className="h-5 w-5 shrink-0" style={{ color }} />
        </Link>
    </motion.div>
)

// Premium «Полное решение по шагам» — пока «фейковая дверь»: экран цены + «Хочу», денег не берём.
const PremiumDoor = () => {
    const [open, setOpen] = useState(false)
    const [state, setState] = useState<'idle' | 'sending' | 'done'>('idle')
    if (!open) return (
        <button type="button" onClick={() => { setOpen(true); premiumInterest('view').catch(() => {}) }}
            className="shine-sweep relative flex items-center gap-3 overflow-hidden rounded-2xl bg-gradient-to-r from-[#F2C35B22] to-[#C385F722] px-4 py-3 text-left transition-transform active:translate-y-[4px]" style={{ boxShadow: 'inset 0 0 0 1.5px #F2C35BCC, 0 4px 0 #5A4214' }}>
            <Lock className="h-5 w-5 shrink-0 text-[#F2C35B]" />
            <span className="min-w-0 flex-1">
                <span className="block font-black text-white">Полное решение по шагам</span>
                <span className="block text-xs font-bold text-[#F2C35B]">💎 Premium</span>
            </span>
            <ChevronRight className="h-5 w-5 shrink-0 text-[#F2C35B]" />
        </button>
    )
    return (
        <motion.div className="rounded-2xl border-2 border-[#F2C35B] bg-[#161F23] px-4 py-4 flex flex-col gap-3"
            initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}>
            <div className="text-center">
                <div className="text-xl font-black text-[#F2C35B]">💎 Premium</div>
                <div className="text-3xl font-black text-white mt-1">{PREMIUM_PRICE_RUB} ₽<span className="text-base text-[#8FA3AE]"> / мес</span></div>
            </div>
            <ul className="flex flex-col gap-1.5 text-sm font-bold text-[#D7E0E5]">
                {['Полное решение любой задачи по фото — по шагам, каждый шаг открываешь сам', 'Сколько угодно билдов в день', 'Всё, что будет в PRO'].map((t) => (
                    <li key={t} className="flex gap-2"><Check className="h-4 w-4 shrink-0 mt-0.5 text-[#78C93C]" /> {t}</li>
                ))}
            </ul>
            {state === 'done' ? (
                <div className="rounded-xl bg-[#78C93C1A] px-3 py-2 text-center font-bold text-[#A1D151]">Ты в списке! Скоро запуск — первым скидка 50% 🔥</div>
            ) : (
                <button type="button" disabled={state === 'sending'}
                    onClick={async () => { setState('sending'); await premiumInterest('want').catch(() => {}); setState('done') }}
                    className="rounded-2xl bg-[#F2C35B] px-4 py-3 font-black text-[#2B1D05] transition-transform active:translate-y-[4px] disabled:opacity-60" style={{ boxShadow: '0 4px 0 #B8862E' }}>
                    Хочу Premium 💎
                </button>
            )}
        </motion.div>
    )
}
