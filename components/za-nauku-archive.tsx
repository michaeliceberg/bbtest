'use client'

// Архив газеты МФТИ «За науку» в починенном компьютере ангара: вырезки на старой бумаге, листаются по одной,
// сверху выбор рубрики. Источник (номер газеты) — внизу каждой вырезки.

import { useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { ChevronLeft, ChevronRight, Shuffle, X } from 'lucide-react'
import { ZN_JOKES, ZN_RUBRIC_TITLE, znSource, type ZnRubric } from '@/lib/zaNauku'

const RUBRICS: (ZnRubric | 'all')[] = ['all', 'lecture', 'exam', 'task', 'news', 'dict', 'typo']

/** Одна вырезка на старой бумаге. Используется и в архиве, и отдельно. */
export function ZnClipping({ text, rubric, source, tilt = -1 }: { text: string; rubric: ZnRubric; source: string; tilt?: number }) {
    return (
        <div className="relative rounded-[3px] px-5 pb-4 pt-3 text-[#2B2118] shadow-[0_10px_24px_rgba(0,0,0,0.5)]"
            style={{
                rotate: `${tilt}deg`,
                background: 'radial-gradient(ellipse at 20% 15%, rgba(255,250,235,0.9), transparent 60%), radial-gradient(ellipse at 85% 90%, rgba(160,120,60,0.22), transparent 55%), linear-gradient(180deg, #F1E4C3, #E6D3A8)',
                fontFamily: 'Georgia, "Times New Roman", serif',
            }}>
            {/* шапка газеты */}
            <div className="flex items-end justify-between border-b-2 border-[#2B2118] pb-1">
                <span className="text-lg font-black tracking-tight" style={{ fontFamily: 'Arial Black, Arial, sans-serif' }}>ЗА|НАУКУ</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B5634]">{ZN_RUBRIC_TITLE[rubric]}</span>
            </div>
            <p className="mt-3 whitespace-pre-line text-[17px] leading-snug">{text}</p>
            <p className="mt-3 text-right text-[11px] italic text-[#6B5634]">{source}</p>
        </div>
    )
}

export function ZaNaukuArchive({ onClose }: { onClose: () => void }) {
    const [rubric, setRubric] = useState<ZnRubric | 'all'>('all')
    const list = useMemo(() => (rubric === 'all' ? ZN_JOKES : ZN_JOKES.filter((j) => j.rubric === rubric)), [rubric])
    const [i, setI] = useState(0)
    const idx = Math.min(i, list.length - 1)
    const j = list[idx]
    const go = (d: number) => setI((idx + d + list.length) % list.length)

    return createPortal(
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
            <div className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
                <div className="mb-3 flex items-center justify-between">
                    <span className="text-sm font-black uppercase tracking-wide text-[#9EE8B0]">Архив газеты «За науку»</span>
                    <button type="button" aria-label="Закрыть архив" onClick={onClose}
                        className="rounded-xl border-2 border-b-4 border-[#2A363C] bg-[#161F23] p-2 text-[#C9D3D9] active:border-b-0">
                        <X className="h-5 w-5" />
                    </button>
                </div>
                <div className="mb-4 flex flex-wrap gap-1.5">
                    {RUBRICS.map((r) => (
                        <button key={r} type="button" onClick={() => { setRubric(r); setI(0) }}
                            className={`rounded-full border px-2.5 py-1 text-xs font-bold ${rubric === r ? 'border-[#F2C35B] bg-[#F2C35B]/15 text-[#F2C35B]' : 'border-[#2C3A41] text-[#9AA7B0]'}`}>
                            {r === 'all' ? 'Все' : ZN_RUBRIC_TITLE[r]}
                        </button>
                    ))}
                </div>
                <ZnClipping key={`${rubric}-${idx}`} text={j.text} rubric={j.rubric} source={znSource(j)} tilt={idx % 2 ? 1 : -1} />
                <div className="mt-5 flex items-center gap-2">
                    <button type="button" aria-label="Назад" onClick={() => go(-1)}
                        className="rounded-xl border-2 border-b-4 border-[#2A363C] bg-[#161F23] p-3 text-[#C9D3D9] active:border-b-0"><ChevronLeft className="h-5 w-5" /></button>
                    <button type="button" onClick={() => setI(Math.floor(Math.random() * list.length))}
                        className="flex flex-1 items-center justify-center gap-2 rounded-xl border-b-4 px-3 py-3 text-sm font-black text-[#151F24] active:border-b-0"
                        style={{ background: 'linear-gradient(180deg,#FFD84D,#F2C35B)', borderBottomColor: '#B8862E' }}>
                        <Shuffle className="h-4 w-4" />Случайная · {idx + 1} из {list.length}
                    </button>
                    <button type="button" aria-label="Дальше" onClick={() => go(1)}
                        className="rounded-xl border-2 border-b-4 border-[#2A363C] bg-[#161F23] p-3 text-[#C9D3D9] active:border-b-0"><ChevronRight className="h-5 w-5" /></button>
                </div>
                <p className="mt-3 text-center text-[11px] font-bold text-[#7E8F99]">Шутки из газеты МФТИ «За науку», сборник «Время было такое»</p>
            </div>
        </div>,
        document.body,
    )
}
