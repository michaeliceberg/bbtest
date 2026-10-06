// components/name-editor.tsx
//
// Имя ученика под аватаркой: просто крупный текст с карандашом — по клику
// превращается в маленькое поле ввода на месте (Enter или галочка —
// сохранить, Esc — отмена).

'use client'

import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { updateUserName } from '@/actions/user-profile'
import { Check, Loader2, Pencil } from 'lucide-react'

type Props = {
    currentName: string
}

export const NameEditor = ({ currentName }: Props) => {
    const router = useRouter()
    const inputRef = useRef<HTMLInputElement>(null)
    const [editing, setEditing] = useState(false)
    const [name, setName] = useState(currentName)
    const [isPending, startTransition] = useTransition()
    const [error, setError] = useState<string | null>(null)

    const dirty = !!name.trim() && name.trim() !== currentName

    const startEdit = () => {
        setName(currentName)
        setError(null)
        setEditing(true)
        setTimeout(() => inputRef.current?.select(), 0)
    }

    const cancel = () => {
        setEditing(false)
        setError(null)
    }

    const save = () => {
        if (!dirty) return cancel()
        setError(null)
        startTransition(async () => {
            try {
                await updateUserName(name)
                setEditing(false)
                router.refresh()
            } catch (e) {
                setError(e instanceof Error ? e.message : 'Не удалось сохранить')
            }
        })
    }

    return (
        <div className="flex flex-col items-center gap-1">
            {!editing ? (
                <button
                    type="button"
                    onClick={startEdit}
                    title="Нажми, чтобы изменить имя"
                    className="group inline-flex items-center gap-2 rounded-xl px-3 py-1 -mx-3 transition-colors hover:bg-sky-400/10"
                >
                    <span className="font-black text-2xl sm:text-3xl text-[#F2F7FB] leading-tight border-b-2 border-dashed border-[#53ADEF]/50 group-hover:border-[#53ADEF] transition-colors">
                        {currentName}
                    </span>
                    <Pencil className="h-4 w-4 text-[#53ADEF] opacity-70 group-hover:opacity-100 transition-opacity" />
                </button>
            ) : (
                <div className="inline-flex items-center gap-2">
                    <input
                        ref={inputRef}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') save()
                            if (e.key === 'Escape') cancel()
                        }}
                        maxLength={40}
                        autoFocus
                        className="w-52 rounded-xl border-2 border-[#53ADEF] bg-[#161F23] px-3 py-1.5 text-center text-xl font-black text-[#F2F7FB] outline-none"
                    />
                    <button
                        type="button"
                        onClick={save}
                        disabled={isPending || !dirty}
                        aria-label="Сохранить имя"
                        className={`h-10 w-10 shrink-0 rounded-xl border-2 flex items-center justify-center transition-colors ${
                            dirty
                                ? 'border-sky-400 bg-sky-400/20 text-sky-300 shadow-[0_0_14px_rgba(56,189,248,0.45)]'
                                : 'border-[#3A464E] bg-[#161F23] text-[#5C6B73]'
                        }`}
                    >
                        {isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Check className="h-5 w-5" />}
                    </button>
                </div>
            )}
            {error && <p className="text-xs text-rose-400">{error}</p>}
        </div>
    )
}
