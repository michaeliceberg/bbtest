// components/telegram-auth-trigger.tsx
//
// Кнопка "Привязать Telegram" в едином стиле с остальными кнопками приложения.
// Официальный виджет Telegram рисует свою собственную (нестилизуемую) кнопку —
// чтобы визуально не выбивалась, используем их же JS API Telegram.Login.auth(),
// который открывает то же окно авторизации, но по клику на любой свой элемент.

'use client'

import { useEffect, useState } from 'react'
import { signIn } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { FaTelegram } from 'react-icons/fa'
import { Loader2 } from 'lucide-react'

type TelegramAuthUser = {
    id: number
    first_name?: string
    last_name?: string
    username?: string
    photo_url?: string
    auth_date: number
    hash: string
}

declare global {
    interface Window {
        Telegram?: {
            Login: {
                auth: (
                    options: { bot_id: string; request_access?: string },
                    callback: (user: TelegramAuthUser | false) => void
                ) => void
            }
        }
    }
}

const TELEGRAM_BOT_ID = '7675525540'

type Props = {
    callbackUrl: string
}

export const TelegramAuthTrigger = ({ callbackUrl }: Props) => {
    const [isLoading, setIsLoading] = useState(false)
    const [scriptReady, setScriptReady] = useState(false)

    useEffect(() => {
        if (window.Telegram?.Login) {
            setScriptReady(true)
            return
        }
        const script = document.createElement('script')
        script.src = 'https://telegram.org/js/telegram-widget.js?22'
        script.async = true
        script.onload = () => setScriptReady(true)
        document.body.appendChild(script)
    }, [])

    const handleClick = () => {
        if (!window.Telegram?.Login) return
        setIsLoading(true)
        window.Telegram.Login.auth({ bot_id: TELEGRAM_BOT_ID, request_access: 'write' }, async (user) => {
            if (!user) {
                setIsLoading(false)
                return
            }
            await signIn('telegram', {
                id: String(user.id),
                first_name: user.first_name || '',
                last_name: user.last_name || '',
                username: user.username || '',
                photo_url: user.photo_url || '',
                auth_date: String(user.auth_date),
                hash: user.hash,
                callbackUrl,
            })
        })
    }

    return (
        <Button size="sm" variant="primaryOutline" disabled={!scriptReady || isLoading} onClick={handleClick}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                <span className="flex items-center gap-1.5">
                    <FaTelegram className="h-4 w-4" />
                    Привязать
                </span>
            )}
        </Button>
    )
}
