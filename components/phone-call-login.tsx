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
const MAX_DIGITS = 10 // после фиксированной 8: (916) 099-19-97

// 8 (916) 099-19-97 — собираем маску по мере ввода, не показывая
// разделители, до которых пользователь ещё не дошёл.
function formatPhoneDigits(digits: string): string {
    let out = ''
    if (digits.length > 0) out += '(' + digits.slice(0, 3)
    if (digits.length >= 3) out += ')'
    if (digits.length > 3) out += ' ' + digits.slice(3, 6)
    if (digits.length > 6) out += '-' + digits.slice(6, 8)
    if (digits.length > 8) out += '-' + digits.slice(8, 10)
    return out
}

type Props = {
    callbackUrl?: string
}

export const PhoneCallLogin = ({ callbackUrl = '/learn' }: Props) => {
    const [step, setStep] = useState<Step>('enter-phone')
    const [digits, setDigits] = useState('')
    const [callPhonePretty, setCallPhonePretty] = useState('')
    const [callPhoneRaw, setCallPhoneRaw] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [isStarting, setIsStarting] = useState(false)

    const inputRef = useRef<HTMLInputElement>(null)
    const pollTimer = useRef<ReturnType<typeof setInterval> | null>(null)
    const timeoutTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

    const isComplete = digits.length === MAX_DIGITS
    const phoneInput = '8' + digits

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value.replace(/\D/g, '').slice(0, MAX_DIGITS)
        setDigits(raw)
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        // сами решаем, что стереть — иначе backspace может удалить
        // разделитель маски " ) - " и визуально ничего не произойдёт
        if (e.key === 'Backspace') {
            e.preventDefault()
            setDigits((prev) => prev.slice(0, -1))
        }
    }

    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        const pasted = e.clipboardData.getData('text').replace(/\D/g, '')
        if (!pasted) return
        e.preventDefault()
        // если скопировали номер целиком (с ведущей 8/7), отбрасываем её
        const cleaned = pasted.length > MAX_DIGITS && /^[78]/.test(pasted)
            ? pasted.slice(1)
            : pasted
        setDigits(cleaned.slice(0, MAX_DIGITS))
    }

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
        setDigits('')
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
        <div className="flex flex-col items-center gap-3 w-full min-w-0">
            <div className="flex items-center gap-2 w-full min-w-0 bg-[#232F34] border border-[#3A464E] rounded-lg px-3 py-2.5 focus-within:border-sky-400">
                <span className="text-white text-base font-semibold flex-shrink-0 select-none">8</span>
                <input
                    ref={inputRef}
                    type="tel"
                    inputMode="numeric"
                    value={formatPhoneDigits(digits)}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    onPaste={handlePaste}
                    placeholder="(___) ___-__-__"
                    className="flex-1 min-w-0 bg-transparent text-white placeholder-[#5A6A72] text-base font-semibold tracking-wide focus:outline-none"
                />
            </div>

            {error && <p className="text-xs text-rose-400">{error}</p>}
            <Button className="w-full" disabled={isStarting || !isComplete} onClick={handleStart}>
                {isStarting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Войти по звонку'}
            </Button>
        </div>
    )
}
