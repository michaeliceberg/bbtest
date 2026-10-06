// components/name-editor.tsx

'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { updateUserName } from '@/actions/user-profile'
import { Loader2, Save } from 'lucide-react'

type Props = {
    currentName: string
    // Весёлый позывной, который ученику когда-то сгенерировали (user_progress.nickname).
    callsign?: string | null
}

export const NameEditor = ({ currentName, callsign }: Props) => {
    const router = useRouter()
    const [name, setName] = useState(currentName)
    const [isPending, startTransition] = useTransition()
    const [error, setError] = useState<string | null>(null)

    const handleSave = () => {
        setError(null)
        startTransition(async () => {
            try {
                await updateUserName(name)
                router.refresh()
            } catch (e) {
                setError(e instanceof Error ? e.message : 'Не удалось сохранить')
            }
        })
    }

    const dirty = !!name.trim() && name !== currentName

    return (
        <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                <div className="flex gap-2 flex-1 min-w-[14rem]">
                    <Input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        maxLength={40}
                        placeholder="Имя пользователя"
                    />
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={isPending || !dirty}
                        title={dirty ? 'Сохранить имя' : 'Имя не менялось'}
                        aria-label="Сохранить имя"
                        className={`shrink-0 h-10 w-10 rounded-lg border-2 flex items-center justify-center transition-colors ${
                            dirty
                                ? 'border-sky-400 bg-sky-400/20 text-sky-300 shadow-[0_0_14px_rgba(56,189,248,0.45)] hover:bg-sky-400/30'
                                : 'border-[#3A464E] bg-[#161F23] text-[#5C6B73] cursor-default'
                        }`}
                    >
                        {isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                    </button>
                </div>
                {callsign && (
                    <div className="flex flex-col leading-tight" title="Твой позывной">
                        <span className="text-[11px] uppercase tracking-wide text-[#9AA7B0]">Позывной</span>
                        <span className="font-black text-base bg-gradient-to-r from-[#C385F7] via-[#53ADEF] to-[#5CC99F] bg-clip-text text-transparent">
                            {callsign}
                        </span>
                    </div>
                )}
            </div>
            {error && <p className="text-xs text-rose-400">{error}</p>}
        </div>
    )
}
