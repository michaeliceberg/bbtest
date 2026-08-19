// components/account-linking.tsx
//
// "Способы входа": показывает, какие способы уже привязаны к аккаунту,
// и позволяет привязать недостающие. Привязка идёт через обычный вход
// (signIn) с callbackUrl на /api/account/link/finish?state=... — сервер
// сам решает, безопасно ли переприкрепить способ к текущему аккаунту,
// или он уже занят другим (реальным) аккаунтом.

'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { TelegramLoginButton } from '@/components/telegram-login-button'
import { PhoneCallLogin } from '@/components/phone-call-login'
import { Loader2, CheckCircle2 } from 'lucide-react'

type Provider = 'vk' | 'telegram' | 'phone-call'

const PROVIDER_LABELS: Record<Provider, string> = {
    vk: 'ВКонтакте',
    telegram: 'Telegram',
    'phone-call': 'Телефон (звонок)',
}

const LINK_STATUS_MESSAGES: Record<string, { text: string; tone: 'success' | 'info' | 'error' }> = {
    linked: { text: 'Способ входа успешно привязан', tone: 'success' },
    'already-linked': { text: 'Этот способ уже был привязан к вашему аккаунту', tone: 'info' },
    conflict: { text: 'Этот способ входа уже используется другим аккаунтом с собственным прогрессом — привязать его сюда автоматически нельзя', tone: 'error' },
    expired: { text: 'Время привязки истекло, попробуйте ещё раз', tone: 'error' },
    'not-authenticated': { text: 'Не удалось войти выбранным способом', tone: 'error' },
}

const TELEGRAM_BOT_USERNAME = 'brickbrain007_bot'

async function requestLinkState(): Promise<string | null> {
    const res = await fetch('/api/account/link/start', { method: 'POST' })
    if (!res.ok) return null
    const data = await res.json()
    return data.state as string
}

export const AccountLinking = () => {
    const searchParams = useSearchParams()
    const [linked, setLinked] = useState<Provider[] | null>(null)
    const [states, setStates] = useState<Partial<Record<Provider, string>>>({})
    const [vkLoading, setVkLoading] = useState(false)

    const linkStatusParam = searchParams.get('link')
    const statusMessage = linkStatusParam ? LINK_STATUS_MESSAGES[linkStatusParam] : null

    useEffect(() => {
        fetch('/api/account/linked-providers')
            .then((res) => res.json())
            .then((data) => setLinked(data.providers || []))
    }, [linkStatusParam])

    useEffect(() => {
        if (!linked) return
        const missing = (['vk', 'telegram', 'phone-call'] as Provider[]).filter((p) => !linked.includes(p))
        missing.forEach(async (provider) => {
            const state = await requestLinkState()
            if (state) setStates((prev) => ({ ...prev, [provider]: state }))
        })
    }, [linked])

    const handleVkLink = async () => {
        setVkLoading(true)
        const state = states.vk || (await requestLinkState())
        if (!state) {
            setVkLoading(false)
            return
        }
        signIn('vk', { callbackUrl: `/api/account/link/finish?state=${state}` })
    }

    if (!linked) {
        return (
            <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-[#9AA7B0]" />
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-4">
            {statusMessage && (
                <div
                    className={
                        'rounded-lg px-4 py-3 text-sm ' +
                        (statusMessage.tone === 'success'
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : statusMessage.tone === 'error'
                              ? 'bg-rose-500/10 text-rose-400'
                              : 'bg-sky-500/10 text-sky-400')
                    }
                >
                    {statusMessage.text}
                </div>
            )}

            {(['vk', 'telegram', 'phone-call'] as Provider[]).map((provider) => {
                const isLinked = linked.includes(provider)
                return (
                    <div
                        key={provider}
                        className="flex flex-col gap-3 rounded-lg border border-[#3A464E] bg-[#1A252B] px-4 py-4"
                    >
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-[#F2F7FB]">{PROVIDER_LABELS[provider]}</span>
                            {isLinked && (
                                <span className="flex items-center gap-1 text-xs text-emerald-400">
                                    <CheckCircle2 className="h-4 w-4" />
                                    Привязан
                                </span>
                            )}
                        </div>

                        {!isLinked && provider === 'telegram' && (
                            states.telegram ? (
                                <TelegramLoginButton botUsername={TELEGRAM_BOT_USERNAME} callbackUrl={`/api/account/link/finish?state=${states.telegram}`} />
                            ) : (
                                <Loader2 className="h-4 w-4 animate-spin text-[#9AA7B0] mx-auto" />
                            )
                        )}

                        {!isLinked && provider === 'phone-call' && (
                            states['phone-call'] ? (
                                <PhoneCallLogin callbackUrl={`/api/account/link/finish?state=${states['phone-call']}`} />
                            ) : (
                                <Loader2 className="h-4 w-4 animate-spin text-[#9AA7B0] mx-auto" />
                            )
                        )}

                        {!isLinked && provider === 'vk' && (
                            <Button className="w-full" disabled={vkLoading} onClick={handleVkLink}>
                                {vkLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Привязать ВКонтакте'}
                            </Button>
                        )}
                    </div>
                )
            })}
        </div>
    )
}
