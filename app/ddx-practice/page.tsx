// app/ddx-practice/page.tsx — тренировка паззла «абонемент в DDX»: все 9 кусочков сразу, без входа и без сохранения.
import Link from 'next/link'
import { DdxSandbox } from '@/components/ddx-sandbox'
import { DDX_PIECES } from '@/lib/ddxConst'

export const metadata = { title: 'Собери абонемент в DDX — тренировка' }

const ALL = Array.from({ length: DDX_PIECES }, (_, piece) => ({ piece, qty: 1, placed: false }))

export default function DdxPracticePage() {
    return (
        <div className="min-h-screen bg-[#131F24] text-[#F2F7FB]">
            <div className="w-full max-w-[560px] mx-auto px-4 py-3 flex flex-col gap-3">
                <div>
                    <Link href="/trainer" className="text-xs font-bold text-[#9AA7B0] hover:text-[#F2F7FB]">‹ В тренажёр</Link>
                    <h1 className="text-xl font-black">Тренировка: собери абонемент 🏋️</h1>
                    <p className="text-xs text-[#9AA7B0]">Перетащи все 9 кусочков на свои места в рамке. «Перемешать» — начать заново.</p>
                </div>
                <DdxSandbox pieces={ALL} promoCode={null} demo />
            </div>
        </div>
    )
}
