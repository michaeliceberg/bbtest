// components/avatar-reroll.tsx
//
// Аватарка в /account: показываем текущего персонажа и даём заменить его на
// нового случайного за AVATAR_REROLL_COST монет (списывает сервер,
// см. rerollUserAvatar).

'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { rerollUserAvatar } from '@/actions/user-profile'
import { AVATAR_REROLL_COST } from '@/lib/avatar'
import { Button } from '@/components/ui/button'
import { Loader2, Dices } from 'lucide-react'
import Lottie from '@/components/lottie-player'
import LottieCoins from '@/public/Lottie/LottieCoins.json'

type Props = {
    currentAvatar: string
    points: number
    // Контент между аватаркой и кнопкой перегенерации (позывной, звание…).
    children?: React.ReactNode
}

const fmt = (n: number) => n.toLocaleString('ru-RU')

// Анимированная монета вместо эмодзи 🪙 (та же, что в шапке приложения).
// Сама монета нарисована в нижней части холста Lottie и занимает лишь треть
// его высоты — поэтому поднимаем её на 14% и гасим лишнюю высоту отрицательным
// отступом, чтобы она стояла по центру строки с текстом.
const Coin = ({ size = 'h-10 w-10' }: { size?: string }) => (
    <Lottie animationData={LottieCoins} loop autoplay className={`${size} -my-3 -translate-y-[14%] shrink-0`} />
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

    return (
        <div className="flex flex-col items-center gap-4 w-full">
            {/* Аватарка с градиентным «игровым» кольцом и мягким свечением */}
            <div className="relative">
                <div className="absolute -inset-3 rounded-full bg-gradient-to-br from-[#C385F7]/40 via-[#53ADEF]/30 to-[#5CC99F]/40 blur-xl" />
                <div className="relative rounded-full p-[4px] bg-gradient-to-br from-[#C385F7] via-[#53ADEF] to-[#5CC99F]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={avatar} alt="" className="w-32 h-32 sm:w-36 sm:h-36 rounded-full bg-[#1B252B] object-cover border-4 border-[#151F23]" />
                </div>
            </div>
            {children}
            <div className="flex flex-col items-center gap-1.5 min-w-0 text-center">
                {!confirming ? (
                    <Button type="button" variant="primaryOutline" disabled={isPending} onClick={() => setConfirming(true)}>
                        <Dices className="h-4 w-4 mr-2" />
                        Новый аватар · {fmt(AVATAR_REROLL_COST)} <Coin size="h-10 w-10 ml-1" />
                    </Button>
                ) : (
                    <div className="flex flex-col gap-1.5">
                        <p className="text-sm text-[#F2F7FB]">
                            {canAfford
                                ? `Списать ${fmt(AVATAR_REROLL_COST)} монет и выдать новый случайный аватар?`
                                : `Не хватает монет: нужно ${fmt(AVATAR_REROLL_COST)}, у тебя ${fmt(balance)}.`}
                        </p>
                        <div className="flex gap-2 justify-center">
                            {canAfford && (
                                <Button type="button" variant="secondary" disabled={isPending} onClick={handleReroll}>
                                    {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Да, крутим!'}
                                </Button>
                            )}
                            <Button type="button" variant="primaryOutline" disabled={isPending} onClick={() => setConfirming(false)}>
                                {canAfford ? 'Не надо' : 'Понятно'}
                            </Button>
                        </div>
                    </div>
                )}
                <p className="text-xs text-[#9AA7B0] flex items-center gap-1">у тебя {fmt(balance)} <Coin size="h-8 w-8" /></p>
                {error && <p className="text-sm text-[#DC605B]">{error}</p>}
            </div>
        </div>
    )
}
