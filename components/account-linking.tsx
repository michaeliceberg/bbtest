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
import { TelegramAuthTrigger } from '@/components/telegram-auth-trigger'
import { PhoneCallLogin } from '@/components/phone-call-login'
import { Loader2, CheckCircle2, Phone } from 'lucide-react'
import { FaTelegram, FaVk } from 'react-icons/fa'

type Provider = 'vk' | 'telegram' | 'phone-call'

const PROVIDER_LABELS: Record<Provider, string> = {
    vk: 'ВКонтакте',
    telegram: 'Telegram',
    'phone-call': 'Телефон',
}

const PROVIDER_ICONS: Record<Provider, { Icon: React.ComponentType<{ className?: string }>; color: string }> = {
    vk: { Icon: FaVk, color: 'text-[#4C75A3]' },
    telegram: { Icon: FaTelegram, color: 'text-[#2AABEE]' },
    'phone-call': { Icon: Phone, color: 'text-emerald-400' },
}

const LINK_STATUS_MESSAGES: Record<string, { text: string; tone: 'success' | 'info' | 'error' }> = {
    linked: { text: 'Способ входа успешно привязан', tone: 'success' },
    'already-linked': { text: 'Этот способ уже был привязан к вашему аккаунту', tone: 'info' },
    conflict: { text: 'Этот способ входа уже используется другим аккаунтом с собственным прогрессом — привязать его сюда автоматически нельзя', tone: 'error' },
    expired: { text: 'Время привязки истекло, попробуйте ещё раз', tone: 'error' },
    'not-authenticated': { text: 'Не удалось войти выбранным способом', tone: 'error' },
}

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
    const [phoneOpen, setPhoneOpen] = useState(false)

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

    const providers: Provider[] = ['vk', 'telegram', 'phone-call']

    return (
        <div className="flex flex-col gap-4">
            {statusMessage && (
                <div
                    className={
                        'rounded-xl px-4 py-3 text-sm ' +
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

            <div className="rounded-2xl border border-[#3A464E] bg-[#1A252B] divide-y divide-[#232F34] overflow-hidden">
                {providers.map((provider) => {
                    const isLinked = linked.includes(provider)
                    const { Icon, color } = PROVIDER_ICONS[provider]
                    const state = states[provider]

                    return (
                        <div key={provider}>
                            <div className="flex items-center justify-between gap-3 px-5 py-4">
                                <div className="flex items-center gap-3">
                                    <Icon className={`h-5 w-5 flex-shrink-0 ${color}`} />
                                    <span className="text-sm font-medium text-[#F2F7FB]">{PROVIDER_LABELS[provider]}</span>
                                </div>

                                {isLinked ? (
                                    <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-400">
                                        <CheckCircle2 className="h-4 w-4" />
                                        Привязан
                                    </span>
                                ) : !state ? (
                                    <Loader2 className="h-4 w-4 animate-spin text-[#9AA7B0]" />
                                ) : provider === 'vk' ? (
                                    <Button size="sm" variant="primaryOutline" disabled={vkLoading} onClick={handleVkLink}>
                                        {vkLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Привязать'}
                                    </Button>
                                ) : provider === 'telegram' ? (
                                    <TelegramAuthTrigger callbackUrl={`/api/account/link/finish?state=${state}`} />
                                ) : (
                                    <Button size="sm" variant="primaryOutline" onClick={() => setPhoneOpen((open) => !open)}>
                                        Привязать
                                    </Button>
                                )}
                            </div>

                            {provider === 'phone-call' && !isLinked && phoneOpen && state && (
                                <div className="px-5 pb-5 pt-1">
                                    <PhoneCallLogin callbackUrl={`/api/account/link/finish?state=${state}`} />
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
