'use client'

// Экран «Сфоткай задачу»: камера/галерея → фото ужимается в браузере до 1280 px (JPEG) → analyzeTaskPhoto → уроки.

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Camera, ImageIcon, Loader2, RotateCcw, ChevronRight, Lightbulb, AlertTriangle } from 'lucide-react'
import { analyzeTaskPhoto, type PhotoTaskResult } from '@/actions/photo-task'
import { cn } from '@/lib/utils'

const MAX_SIDE = 1280
const THINKING = ['Читаю условие…', 'Смотрю на чертёж…', 'Прикидываю, как решать…', 'Подбираю уроки…']

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
                <h1 className="text-2xl font-black text-white">📸 Сфоткай задачу</h1>
                <p className="mt-1 text-sm font-bold text-[#8FA3AE]">Подскажу, какие уроки тренажёра пройти, чтобы её решить</p>
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
                                    <div className="text-sm font-black text-white">Пройди эти уроки:</div>
                                    {result.lessons.map((l, i) => (
                                        <Link key={l.id} href={`/t-lesson/${l.id}`}
                                            className="flex items-center gap-3 rounded-2xl border-2 border-b-4 border-[#78C93C] bg-[#78C93C14] px-4 py-3 active:border-b-2">
                                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#78C93C] font-black text-[#1B2A10]">{i + 1}</span>
                                            <span className="min-w-0 flex-1">
                                                <span className="block font-black leading-tight text-white">{l.lesson}</span>
                                                <span className="block text-xs font-bold text-[#8FA3AE]">{l.course} · {l.unit}</span>
                                            </span>
                                            <ChevronRight className="h-5 w-5 shrink-0 text-[#78C93C]" />
                                        </Link>
                                    ))}
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
