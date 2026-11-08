'use client'

// Сравнение двух видов подсветки условия ЕГЭ: текстовыделитель и «остальное бледнеет».
import { useState } from 'react'
import { SceneRunner } from '@/components/geometry/scene-engine'
import { PIES_QUIZ, PIES_TEXT } from '@/lib/scene-lessons/probability'

export default function TestEgeFocusPage() {
    const [nonce, setNonce] = useState(0)
    return (
        <div className="min-h-screen bg-[#131D22] px-4 py-6">
            <div className="mx-auto mb-4 flex max-w-5xl items-center justify-between">
                <h1 className="text-xl font-black text-[#F2F7FB]">Подсветка условия ЕГЭ</h1>
                <button type="button" onClick={() => setNonce((n) => n + 1)}
                    className="rounded-xl border-2 border-b-4 active:border-b-0 border-[#3A464E] bg-[#161F23] px-4 py-2 font-black text-[#F2F7FB]">Заново</button>
            </div>
            <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-2">
                {(['marker', 'dim'] as const).map((mode) => (
                    <div key={`${mode}-${nonce}`} className="flex flex-col items-center gap-3">
                        <div className="text-lg font-black text-[#F2C35B]">{mode === 'marker' ? 'Вариант 1: текстовыделитель' : 'Вариант 2: остальное бледнеет'}</div>
                        <SceneRunner parts={[{ t: 'ege', num: 4, text: PIES_TEXT, quiz: PIES_QUIZ, focusMode: mode }]} />
                    </div>
                ))}
            </div>
        </div>
    )
}
