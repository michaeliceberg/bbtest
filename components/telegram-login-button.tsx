// components/telegram-login-button.tsx
//
// Обёртка над официальным Telegram Login Widget.
// Виджет рисует свою кнопку сам (скрипт с data-атрибутами), мы только
// подставляем колбэк, который передаёт подписанные данные в NextAuth.
//
// Важно: домен сайта должен быть привязан к боту через @BotFather →
// /setdomain, иначе виджет откажется работать.

'use client'

import { useEffect, useRef, useState } from 'react'
import { signIn } from 'next-auth/react'

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
        onTelegramAuth?: (user: TelegramAuthUser) => void
    }
}

type Props = {
    botUsername: string
    callbackUrl?: string
}

export const TelegramLoginButton = ({ botUsername, callbackUrl = '/learn' }: Props) => {
    const containerRef = useRef<HTMLDivElement>(null)
    const [isLoading, setIsLoading] = useState(false)

    useEffect(() => {
        window.onTelegramAuth = async (user: TelegramAuthUser) => {
            setIsLoading(true)
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
        }

        const script = document.createElement('script')
        script.src = 'https://telegram.org/js/telegram-widget.js?22'
        script.async = true
        script.setAttribute('data-telegram-login', botUsername)
        script.setAttribute('data-size', 'large')
        script.setAttribute('data-radius', '12')
        script.setAttribute('data-onauth', 'onTelegramAuth(user)')
        script.setAttribute('data-request-access', 'write')

        containerRef.current?.appendChild(script)

        return () => {
            delete window.onTelegramAuth
        }
    }, [botUsername, callbackUrl])

    return (
        <div className="flex flex-col items-center gap-2">
            <div ref={containerRef} />
            {isLoading && (
                <span className="text-xs text-[#9AA7B0]">Входим…</span>
            )}
        </div>
    )
}
