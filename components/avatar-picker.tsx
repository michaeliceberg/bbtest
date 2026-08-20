// components/avatar-picker.tsx
//
// Набор весёлых мордочек от DiceBear (dicebear.com, бесплатно, MIT/CC0) —
// генерируются по seed через их публичный API, свои файлы не нужны.

'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { updateUserAvatar } from '@/actions/user-profile'
import { Check, Loader2 } from 'lucide-react'

const AVATAR_SEEDS = [
    'Felix', 'Aneka', 'Milo', 'Zoe', 'Leo', 'Nina',
    'Max', 'Luna', 'Kai', 'Mia', 'Rex', 'Ivy',
]

const avatarUrl = (seed: string) => `https://api.dicebear.com/9.x/big-smile/svg?seed=${encodeURIComponent(seed)}`

type Props = {
    currentAvatar: string
}

export const AvatarPicker = ({ currentAvatar }: Props) => {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()
    const [selected, setSelected] = useState(currentAvatar)
    const [pendingUrl, setPendingUrl] = useState<string | null>(null)

    const handlePick = (seed: string) => {
        const url = avatarUrl(seed)
        if (url === selected) return
        setPendingUrl(url)
        startTransition(async () => {
            await updateUserAvatar(url)
            setSelected(url)
            setPendingUrl(null)
            router.refresh()
        })
    }

    return (
        <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
            {AVATAR_SEEDS.map((seed) => {
                const url = avatarUrl(seed)
                const isSelected = selected === url
                const isLoadingThis = isPending && pendingUrl === url

                return (
                    <button
                        key={seed}
                        type="button"
                        onClick={() => handlePick(seed)}
                        disabled={isPending}
                        className={`relative aspect-square rounded-full overflow-hidden border-2 bg-[#232F34] transition-colors disabled:opacity-60 ${
                            isSelected ? 'border-sky-400' : 'border-transparent hover:border-[#3A464E]'
                        }`}
                    >
                        <img src={url} alt="" className="w-full h-full" />
                        {isSelected && !isLoadingThis && (
                            <div className="absolute bottom-0.5 right-0.5 bg-sky-400 rounded-full p-0.5">
                                <Check className="h-3 w-3 text-white" />
                            </div>
                        )}
                        {isLoadingThis && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                                <Loader2 className="h-4 w-4 animate-spin text-white" />
                            </div>
                        )}
                    </button>
                )
            })}
        </div>
    )
}
