// components/account-linking.tsx
//
// "Способы входа": показывает, какие способы уже привязаны к аккаунту,
// и позволяет привязать недостающие. Привязка идёт через обычный вход
// (signIn) с callbackUrl на /api/account/link/finish?state=... — сервер
// сам решает, безопасно ли переприкрепить способ к текущему аккаунту.
// Если способ уже занят другим аккаунтом с реальным прогрессом, ничего
// не сливается молча — показываем, что там есть, и даём осознанно
// подтвердить перепривязку через /api/account/link/force.

'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { TelegramAuthTrigger } from '@/components/telegram-auth-trigger'
import { PhoneCallLogin } from '@/components/phone-call-login'
import { Loader2, TriangleAlert, Phone } from 'lucide-react'
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
    expired: { text: 'Время привязки истекло, попробуйте ещё раз', tone: 'error' },
    'not-authenticated': { text: 'Не удалось войти выбранным способом', tone: 'error' },
}

function declension(n: number, one: string, two: string, five: string): string {
    const mod10 = n % 10
    const mod100 = n % 100
    if (mod100 >= 11 && mod100 <= 19) return five
    if (mod10 === 1) return one
    if (mod10 >= 2 && mod10 <= 4) return two
    return five
}

async function requestLinkState(provider: Provider): Promise<string | null> {
    const res = await fetch('/api/account/link/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider }),
    })
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
    const [forceLoading, setForceLoading] = useState(false)
    const [forceDone, setForceDone] = useState(false)

    const linkStatus = searchParams.get('link')
    const conflictToken = searchParams.get('conflictToken')
    const isConflict = linkStatus === 'conflict' && !!conflictToken && !forceDone
    const statusMessage = linkStatus && !isConflict ? LINK_STATUS_MESSAGES[linkStatus] : null

    const conflictStats = {
        points: Number(searchParams.get('points')) || 0,
        gems: Number(searchParams.get('gems')) || 0,
        lessonsDone: Number(searchParams.get('lessonsDone')) || 0,
    }

    useEffect(() => {
        fetch('/api/account/linked-providers')
            .then((res) => res.json())
            .then((data) => setLinked(data.providers || []))
    }, [linkStatus, forceDone])

    useEffect(() => {
        if (!linked) return
        const missing = (['vk', 'telegram', 'phone-call'] as Provider[]).filter((p) => !linked.includes(p))
        missing.forEach(async (provider) => {
            const state = await requestLinkState(provider)
            if (state) setStates((prev) => ({ ...prev, [provider]: state }))
        })
    }, [linked])

    const handleVkLink = async () => {
        setVkLoading(true)
        const state = states.vk || (await requestLinkState('vk'))
        if (!state) {
            setVkLoading(false)
            return
        }
        signIn('vk', { callbackUrl: `/api/account/link/finish?state=${state}` })
    }

    const handleForceLink = async () => {
        setForceLoading(true)
        try {
            const res = await fetch('/api/account/link/force', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ conflictToken }),
            })
            if (res.ok) setForceDone(true)
        } finally {
            setForceLoading(false)
        }
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
            {forceDone && (
                <div className="rounded-xl px-4 py-3 text-sm bg-emerald-500/10 text-emerald-400">
                    Способ входа привязан к этому аккаунту
                </div>
            )}

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

            {isConflict && (
                <div className="rounded-xl px-4 py-3 bg-rose-500/10 text-sm flex flex-col gap-3">
                    <div className="flex items-start gap-2 text-rose-400">
                        <TriangleAlert className="h-4 w-4 flex-shrink-0 mt-0.5" />
                        <span>
                            Этот способ входа уже используется другим аккаунтом, у которого есть свой прогресс:{' '}
                            <b>{conflictStats.points}</b> {declension(conflictStats.points, 'очко', 'очка', 'очков')},{' '}
                            <b>{conflictStats.gems}</b> {declension(conflictStats.gems, 'кристалл', 'кристалла', 'кристаллов')},{' '}
                            <b>{conflictStats.lessonsDone}</b> {declension(conflictStats.lessonsDone, 'решённая задача', 'решённые задачи', 'решённых задач')}.
                        </span>
                    </div>
                    <p className="text-[#9AA7B0]">
                        Если всё равно привязать этот способ сюда, доступ к тому аккаунту и его прогрессу будет потерян навсегда.
                    </p>
                    <Button
                        size="sm"
                        variant="dangerOutline"
                        className="self-start"
                        disabled={forceLoading}
                        onClick={handleForceLink}
                    >
                        {forceLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Всё равно привязать сюда'}
                    </Button>
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
                                    <Button size="sm" variant="secondaryOutline" disabled>
                                        Привязан
                                    </Button>
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
