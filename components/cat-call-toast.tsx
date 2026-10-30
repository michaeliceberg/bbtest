'use client'

// components/cat-call-toast.tsx — «Зайди в ангар — там кто-то мяучит!» после первой верной задачи задачника
// (actions/challenge-progress.ts → catCalled). Тот же тёмный стиль, что у «+1 балл ЕГЭ» (components/ege-gain-toast.tsx):
// слева выглядывает котик (cat-peek), справа жёлтая кнопка «В ангар» → /learn?hangar=1 (ангар открывается сам).

import Link from 'next/link'
import { toast } from 'sonner'

export const showCatCall = () => {
    toast.custom((id) => (
        <Link
            href="/learn?hangar=1"
            onClick={() => toast.dismiss(id)}
            className="flex w-[340px] max-w-[calc(100vw-32px)] items-center gap-3 rounded-2xl border-2 px-3.5 py-2.5"
            style={{
                borderColor: '#F2C35B',
                background: 'linear-gradient(135deg, #3A2E12, #161F23 70%)',
                boxShadow: '0 5px 0 #7A5A12, 0 12px 24px rgba(0,0,0,0.45)',
            }}
        >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/hangar/life/cat-peek.webp" alt="" className="-my-1 h-14 w-12 shrink-0 object-contain" style={{ transform: 'scaleX(-1)', animation: 'cat-toast-peek 1.6s ease-in-out infinite', transformOrigin: '50% 100%' }} />
            <style>{`@keyframes cat-toast-peek{0%,100%{rotate:0deg}50%{rotate:-6deg}}`}</style>
            <span className="min-w-0 flex-1 leading-tight">
                <span className="block text-base font-black text-[#F2C35B]">Кто-то мяучит!</span>
                <span className="block text-xs font-bold text-[#C9D3D9]">Зайди в ангар — посмотри, кто там</span>
            </span>
            <span className="shrink-0 rounded-xl border-b-4 border-[#B8862E] bg-[#FFE58A] px-2.5 py-1.5 text-xs font-black uppercase text-[#3A2A08]">В ангар</span>
        </Link>
    ), { duration: 9000 })
}
