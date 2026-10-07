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
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        window.onTelegramAuth = async (user: TelegramAuthUser) => {
            setIsLoading(true)
            setError(null)
            // Telegram подписывает hash только по полям, которые реально
            // прислал (у части пользователей нет last_name/username/photo_url) —
            // отправлять их пустой строкой нельзя, иначе подпись не сойдётся.
            // redirect: false — при ошибке подписи не уводим на служебную страницу
            // NextAuth («Sign in failed…»), а показываем понятное сообщение здесь же.
            const res = await signIn('telegram', {
                redirect: false,
                id: String(user.id),
                first_name: user.first_name || '',
                ...(user.last_name ? { last_name: user.last_name } : {}),
                ...(user.username ? { username: user.username } : {}),
                ...(user.photo_url ? { photo_url: user.photo_url } : {}),
                auth_date: String(user.auth_date),
                hash: user.hash,
                callbackUrl,
            })
            if (res?.error || !res?.ok) {
                setIsLoading(false)
                setError('Не получилось войти через Telegram. Попробуйте ещё раз или войдите по звонку.')
                return
            }
            window.location.href = res.url || callbackUrl
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
        <div className="flex flex-col items-center gap-2 w-full min-w-0">
            <div ref={containerRef} className="max-w-full [&>iframe]:!max-w-full [&>iframe]:!rounded-full [&>iframe]:!overflow-hidden" />
            {isLoading && (
                <span className="text-xs text-[#9AA7B0]">Входим…</span>
            )}
            {error && (
                <span className="text-xs text-[#DC605B] text-center">{error}</span>
            )}
        </div>
    )
}
