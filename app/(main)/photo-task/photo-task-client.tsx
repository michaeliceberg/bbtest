'use client'

// Экран «Билд на задачу» (запасное название — «Гайд на задачу»): камера/галерея → фото ужимается в браузере до 1280 px (JPEG) → analyzeTaskPhoto → уроки.

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Camera, ImageIcon, Loader2, RotateCcw, ChevronRight, Lightbulb, AlertTriangle, Gift, Lock, Check } from 'lucide-react'
import { analyzeTaskPhoto, premiumInterest, type PhotoTaskResult, type PhotoTaskLesson } from '@/actions/photo-task'
import { checkAchievements } from '@/lib/achievementsClient'
import { PREMIUM_PRICE_RUB } from '@/lib/pro'
import { cn } from '@/lib/utils'

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
        <div className="flex flex-col gap-5">
            <div className="text-center">
                <h1 className="text-2xl font-black text-white">⚔️ Билд на задачу</h1>
                <p className="mt-1 text-sm font-bold text-[#8FA3AE]">Сфоткай задачу — соберу билд: какие уроки пройти, чтобы её завалить</p>
                {left !== null && <p className="mt-1 text-xs font-bold text-[#5C6B73]">Сегодня осталось: {left} из {limit}</p>}
                {!configured && <p className="mt-2 text-xs font-black text-[#F2C35B]">Видно только админам: ключ API не настроен</p>}
            </div>

            <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden"
                onChange={(e) => { onFile(e.target.files?.[0]); e.target.value = '' }} />
            <input ref={galleryRef} type="file" accept="image/*" className="hidden"
                onChange={(e) => { onFile(e.target.files?.[0]); e.target.value = '' }} />

            {preview && (
                <div className="relative w-full overflow-hidden rounded-2xl border-2 border-[#2A363C] bg-[#0F171B]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={preview} alt="Фото задачи" className="w-full max-h-[300px] object-contain" />
                    {busy && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/55">
                            <Loader2 className="h-8 w-8 animate-spin text-white" />
                            <span className="font-black text-white">{THINKING[step]}</span>
                        </div>
                    )}
                </div>
            )}

            {!busy && !result && (
                <div className="grid grid-cols-2 gap-3">
                    <button type="button" disabled={outOfLimit} onClick={() => cameraRef.current?.click()}
                        className={cn('flex flex-col items-center gap-2 rounded-2xl border-2 border-b-4 px-3 py-5 font-black transition-colors',
                            outOfLimit ? 'border-[#2A363C] text-[#5C6B73]' : 'border-[#53ADEF] bg-[#53ADEF1A] text-white active:border-b-2')}>
                        <Camera className="h-8 w-8" /> Сфоткать
                    </button>
                    <button type="button" disabled={outOfLimit} onClick={() => galleryRef.current?.click()}
                        className={cn('flex flex-col items-center gap-2 rounded-2xl border-2 border-b-4 px-3 py-5 font-black transition-colors',
                            outOfLimit ? 'border-[#2A363C] text-[#5C6B73]' : 'border-[#3A464E] bg-[#161F23] text-white active:border-b-2')}>
                        <ImageIcon className="h-8 w-8" /> Из галереи
                    </button>
                </div>
            )}
            {outOfLimit && !result && <p className="text-center font-bold text-[#F2C35B]">{ERRORS.limit}</p>}

            {result && !result.ok && (
                <div className="flex items-start gap-3 rounded-2xl border-2 border-[#DC605B66] bg-[#DC605B1A] px-4 py-3 font-bold text-[#F2B5B2]">
                    <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" /> {ERRORS[result.error]}
                </div>
            )}

            {result && result.ok && (
                <motion.div className="flex flex-col gap-4" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    {!result.readable ? (
                        <div className="rounded-2xl border-2 border-[#F2C35B66] bg-[#F2C35B14] px-4 py-3 font-bold text-[#F2C35B]">
                            Не вижу на фото задачу по математике или физике 🤔 Сфоткай условие поближе и почётче.
                        </div>
                    ) : (
                        <>
                            <div className="rounded-2xl border-2 border-[#2A363C] bg-[#161F23] px-4 py-3">
                                <div className="text-xs font-black uppercase tracking-wide text-[#5C6B73]">Задача</div>
                                <p className="mt-1 text-[15px] font-bold leading-snug text-[#D7E0E5]">{result.problemText}</p>
                            </div>

                            {result.lessons.length > 0 && (
                                <div className="flex flex-col gap-2">
                                    <div className="text-sm font-black text-white">⚔️ Твой билд — пройди эти уроки:</div>
                                    {result.lessons.map((l, i) => <LessonRow key={l.id} l={l} badge={String(i + 1)} color="#78C93C" />)}
                                </div>
                            )}

                            {result.bonusLessons.length > 0 && (
                                <div className="flex flex-col gap-2">
                                    <div className="flex items-center gap-1.5 text-sm font-black text-[#C385F7]"><Gift className="h-4 w-4" /> Бонусный лут — прокачает тему шире:</div>
                                    {result.bonusLessons.map((l) => <LessonRow key={l.id} l={l} badge="🎁" color="#C385F7" />)}
                                </div>
                            )}

                            {result.missingTopics.length > 0 && (
                                <div className="rounded-2xl border-2 border-[#3A464E] bg-[#161F23] px-4 py-3 text-sm font-bold text-[#8FA3AE]">
                                    {result.lessons.length > 0 ? 'Ещё пригодится (уроков пока нет): ' : 'Уроков по этой теме у нас пока нет: '}
                                    <span className="text-[#D7E0E5]">{result.missingTopics.join(', ')}</span>. Скоро добавим 🛠️
                                </div>
                            )}

                            {result.hint && (
                                <div className="flex items-start gap-3 rounded-2xl border-2 border-[#F2C35B66] bg-[#F2C35B10] px-4 py-3">
                                    <Lightbulb className="mt-0.5 h-5 w-5 shrink-0 text-[#F2C35B]" />
                                    <p className="text-[15px] font-bold leading-snug text-[#F2E3B8]">{result.hint}</p>
                                </div>
                            )}
                        </>
                    )}
                    {result.readable && <PremiumDoor />}
                </motion.div>
            )}

            {result && !busy && (
                <button type="button" onClick={reset} disabled={outOfLimit && result.ok}
                    className="flex items-center justify-center gap-2 rounded-2xl border-2 border-b-4 border-[#3A464E] bg-[#161F23] px-4 py-3 font-black text-white disabled:opacity-40">
                    <RotateCcw className="h-5 w-5" /> Другая задача
                </button>
            )}
        </div>
    )
}

const LessonRow = ({ l, badge, color }: { l: PhotoTaskLesson; badge: string; color: string }) => (
    <Link href={`/t-lesson/${l.id}`}
        className="flex items-center gap-3 rounded-2xl border-2 border-b-4 px-4 py-3 active:border-b-2"
        style={{ borderColor: color, backgroundColor: `${color}14` }}>
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-black text-[#1B2A10]" style={{ backgroundColor: color }}>{badge}</span>
        <span className="min-w-0 flex-1">
            <span className="block font-black leading-tight text-white">{l.lesson}</span>
            <span className="block text-xs font-bold text-[#8FA3AE]">{l.course} · {l.unit}</span>
        </span>
        <ChevronRight className="h-5 w-5 shrink-0" style={{ color }} />
    </Link>
)

// Premium «Полное решение по шагам» — пока «фейковая дверь»: экран цены + «Хочу», денег не берём.
const PremiumDoor = () => {
    const [open, setOpen] = useState(false)
    const [state, setState] = useState<'idle' | 'sending' | 'done'>('idle')
    if (!open) return (
        <button type="button" onClick={() => { setOpen(true); premiumInterest('view').catch(() => {}) }}
            className="flex items-center gap-3 rounded-2xl border-2 border-b-4 border-[#F2C35B] bg-gradient-to-r from-[#F2C35B22] to-[#C385F722] px-4 py-3 text-left active:border-b-2">
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
                    className="rounded-2xl border-b-4 border-[#B8862E] bg-[#F2C35B] px-4 py-3 font-black text-[#2B1D05] active:border-b-0 disabled:opacity-60">
                    Хочу Premium 💎
                </button>
            )}
        </motion.div>
    )
}
