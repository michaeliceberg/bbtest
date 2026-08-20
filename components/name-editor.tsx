// components/name-editor.tsx

'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { updateUserName } from '@/actions/user-profile'
import { Loader2 } from 'lucide-react'

type Props = {
    currentName: string
}

export const NameEditor = ({ currentName }: Props) => {
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

    return (
        <div className="flex flex-col gap-2">
            <div className="flex gap-2">
                <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    maxLength={40}
                    placeholder="Имя пользователя"
                />
                <Button
                    onClick={handleSave}
                    disabled={isPending || !name.trim() || name === currentName}
                    variant="primaryOutline"
                >
                    {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Сохранить'}
                </Button>
            </div>
            {error && <p className="text-xs text-rose-400">{error}</p>}
        </div>
    )
}
