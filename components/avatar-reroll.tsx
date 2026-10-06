// components/avatar-reroll.tsx
//
// Аватарка в /account: большой портрет в градиентном кольце, а замена на
// нового случайного персонажа (AVATAR_REROLL_COST монет, списывает сервер —
// rerollUserAvatar) — маленькая «таблетка» на нижнем краю аватарки, чтобы не
// перетягивать на себя внимание. Не хватает монет — таблетка заперта.

'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { rerollUserAvatar } from '@/actions/user-profile'
import { AVATAR_REROLL_COST } from '@/lib/avatar'
import { Loader2, Dices, Lock } from 'lucide-react'
import Lottie from '@/components/lottie-player'
import LottieCoins from '@/public/Lottie/LottieCoins.json'

type Props = {
    currentAvatar: string
    points: number
    // Контент под аватаркой (имя, позывной, звание…).
    children?: React.ReactNode
}

const fmt = (n: number) => n.toLocaleString('ru-RU')

// Сама монета нарисована в нижней части холста Lottie и занимает лишь треть
// его высоты — поэтому поднимаем её на 14% и гасим лишнюю высоту отрицательным
// отступом, чтобы она стояла по центру строки с текстом.
const Coin = () => (
    <Lottie animationData={LottieCoins} loop autoplay className="h-8 w-8 -my-3 -translate-y-[14%] shrink-0" />
)

export const AvatarReroll = ({ currentAvatar, points, children }: Props) => {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()
    const [avatar, setAvatar] = useState(currentAvatar)
    const [balance, setBalance] = useState(points)
    const [error, setError] = useState<string | null>(null)
    const [confirming, setConfirming] = useState(false)

    const canAfford = balance >= AVATAR_REROLL_COST

    const handleReroll = () => {
        setError(null)
        startTransition(async () => {
            try {
                const res = await rerollUserAvatar()
                if (!res.success) {
                    setError(res.error ?? 'Не получилось')
                } else {
                    if (res.imageSrc) setAvatar(res.imageSrc)
                    setBalance((b) => b - AVATAR_REROLL_COST)
                    router.refresh()
                }
            } catch (e) {
                setError(e instanceof Error ? e.message : 'Не получилось')
            } finally {
                setConfirming(false)
            }
        })
    }

    const pillBase = 'absolute left-1/2 -bottom-4 -translate-x-1/2 h-8 rounded-full border-2 px-3 inline-flex items-center gap-1.5 text-xs font-extrabold whitespace-nowrap shadow-lg'

    return (
        <div className="flex flex-col items-center gap-5 w-full">
            <div className="relative mb-2">
                <div className="absolute -inset-3 rounded-full bg-gradient-to-br from-[#C385F7]/40 via-[#53ADEF]/30 to-[#5CC99F]/40 blur-xl" />
                <div className="relative rounded-full p-[4px] bg-gradient-to-br from-[#C385F7] via-[#53ADEF] to-[#5CC99F]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={avatar} alt="" className="w-32 h-32 sm:w-36 sm:h-36 rounded-full bg-[#1B252B] object-cover border-4 border-[#151F23]" />
                </div>

                {!confirming ? (
                    canAfford ? (
                        <button
                            type="button"
                            disabled={isPending}
                            onClick={() => setConfirming(true)}
                            title="Новый случайный аватар"
                            className={`${pillBase} border-[#3A464E] bg-[#1B252B] text-[#F2F7FB] hover:border-sky-400 transition-colors`}
                        >
                            <Dices className="h-4 w-4 text-sky-400" />
                            {fmt(AVATAR_REROLL_COST)}
                            <Coin />
                        </button>
                    ) : (
                        <button
                            type="button"
                            disabled
                            title={`Новый аватар стоит ${fmt(AVATAR_REROLL_COST)}, у тебя ${fmt(balance)}`}
                            className={`${pillBase} border-[#2A353B] bg-[#161F23] text-[#5C6B73] cursor-not-allowed`}
                        >
                            <Lock className="h-3.5 w-3.5" />
                            {fmt(AVATAR_REROLL_COST)}
                            <Coin />
                        </button>
                    )
                ) : (
                    <div className={`${pillBase} border-sky-400 bg-[#1B252B] text-[#F2F7FB]`}>
                        <span>Новый аватар?</span>
                        <button
                            type="button"
                            disabled={isPending}
                            onClick={handleReroll}
                            className="rounded-full bg-[#78C93C] px-2.5 py-0.5 text-[#0B1114] font-black"
                        >
                            {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Да'}
                        </button>
                        <button
                            type="button"
                            disabled={isPending}
                            onClick={() => setConfirming(false)}
                            className="rounded-full border border-[#3A464E] px-2.5 py-0.5 text-[#9AA7B0]"
                        >
                            Нет
                        </button>
                    </div>
                )}
            </div>
            {error && <p className="text-xs text-[#DC605B] -mt-2">{error}</p>}
            {children}
        </div>
    )
}
