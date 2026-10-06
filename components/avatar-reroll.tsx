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
}

const fmt = (n: number) => n.toLocaleString('ru-RU')

// Анимированная монета вместо эмодзи 🪙 (та же, что в шапке приложения).
const Coin = ({ size = 'h-7 w-7' }: { size?: string }) => (
    <Lottie animationData={LottieCoins} loop autoplay className={`${size} inline-block align-middle shrink-0`} />
)

export const AvatarReroll = ({ currentAvatar, points }: Props) => {
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
        <div className="flex items-center gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={avatar} alt="" className="w-20 h-20 rounded-full bg-[#232F34] flex-shrink-0 object-cover" />
            <div className="flex flex-col gap-1.5 min-w-0">
                {!confirming ? (
                    <Button type="button" variant="primaryOutline" disabled={isPending} onClick={() => setConfirming(true)}>
                        <Dices className="h-4 w-4 mr-2" />
                        Новый аватар · {fmt(AVATAR_REROLL_COST)} <Coin size="h-8 w-8 ml-1" />
                    </Button>
                ) : (
                    <div className="flex flex-col gap-1.5">
                        <p className="text-sm text-[#F2F7FB]">
                            {canAfford
                                ? `Списать ${fmt(AVATAR_REROLL_COST)} монет и выдать новый случайный аватар?`
                                : `Не хватает монет: нужно ${fmt(AVATAR_REROLL_COST)}, у тебя ${fmt(balance)}.`}
                        </p>
                        <div className="flex gap-2">
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
                <p className="text-xs text-[#9AA7B0] flex items-center gap-1">Твои монеты: {fmt(balance)} <Coin size="h-6 w-6" /></p>
                {error && <p className="text-sm text-[#DC605B]">{error}</p>}
            </div>
        </div>
    )
}
