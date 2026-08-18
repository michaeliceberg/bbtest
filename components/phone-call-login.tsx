// components/phone-call-login.tsx
//
// Вход по звонку: пользователь вводит номер, получает номер для звонка,
// сам звонит и сразу сбрасывает — код вводить не нужно. Пока ждём,
// периодически пытаемся войти через provider 'phone-call'; сервер каждый
// раз сам перепроверяет статус звонка у SMS.ru.

'use client'

import { useCallback, useRef, useState } from 'react'
import { signIn } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { PhoneCall, Loader2 } from 'lucide-react'

type Step = 'enter-phone' | 'calling'

const POLL_INTERVAL_MS = 3000
const TIMEOUT_MS = 5 * 60 * 1000

type Props = {
    callbackUrl?: string
}

export const PhoneCallLogin = ({ callbackUrl = '/learn' }: Props) => {
    const [step, setStep] = useState<Step>('enter-phone')
    const [phoneInput, setPhoneInput] = useState('')
    const [callPhonePretty, setCallPhonePretty] = useState('')
    const [callPhoneRaw, setCallPhoneRaw] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [isStarting, setIsStarting] = useState(false)

    const pollTimer = useRef<ReturnType<typeof setInterval> | null>(null)
    const timeoutTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

    const stopPolling = useCallback(() => {
        if (pollTimer.current) clearInterval(pollTimer.current)
        if (timeoutTimer.current) clearTimeout(timeoutTimer.current)
        pollTimer.current = null
        timeoutTimer.current = null
    }, [])

    const startPolling = useCallback((checkId: string) => {
        pollTimer.current = setInterval(async () => {
            const result = await signIn('phone-call', { checkId, redirect: false })
            if (result?.ok) {
                stopPolling()
                window.location.href = callbackUrl
            }
        }, POLL_INTERVAL_MS)

        timeoutTimer.current = setTimeout(() => {
            stopPolling()
            setStep('enter-phone')
            setError('Время ожидания истекло. Попробуйте ещё раз.')
        }, TIMEOUT_MS)
    }, [callbackUrl, stopPolling])

    const handleStart = async () => {
        setError(null)
        setIsStarting(true)
        try {
            const res = await fetch('/api/auth/phone-call/start', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone: phoneInput }),
            })
            const data = await res.json()

            if (!res.ok) {
                setError(data.error || 'Не удалось начать проверку')
                return
            }

            setCallPhonePretty(data.callPhonePretty)
            setCallPhoneRaw(data.callPhone)
            setStep('calling')
            startPolling(data.checkId)
        } catch {
            setError('Ошибка сети, попробуйте снова')
        } finally {
            setIsStarting(false)
        }
    }

    const handleCancel = () => {
        stopPolling()
        setStep('enter-phone')
        setError(null)
    }

    if (step === 'calling') {
        return (
            <div className="flex flex-col items-center gap-3 text-center py-2">
                <PhoneCall className="h-8 w-8 text-sky-400 animate-pulse" />
                <p className="text-sm text-[#F2F7FB]">
                    Позвоните на этот номер и сразу сбросьте — звонок бесплатный:
                </p>
                <a href={`tel:${callPhoneRaw}`} className="text-xl font-bold text-sky-400">
                    {callPhonePretty}
                </a>
                <p className="text-xs text-[#9AA7B0]">Ждём звонка… вход произойдёт автоматически</p>
                <Button variant="ghost" size="sm" onClick={handleCancel}>
                    Отмена
                </Button>
            </div>
        )
    }

    return (
        <div className="flex flex-col items-center gap-2 w-full">
            <input
                type="tel"
                placeholder="+7 900 123-45-67"
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
                className="w-full bg-[#232F34] border border-[#3A464E] rounded-lg px-3 py-2 text-white placeholder-[#5A6A72] text-sm text-center"
            />
            {error && <p className="text-xs text-rose-400">{error}</p>}
            <Button className="w-full" disabled={isStarting || !phoneInput} onClick={handleStart}>
                {isStarting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Войти по звонку'}
            </Button>
        </div>
    )
}
