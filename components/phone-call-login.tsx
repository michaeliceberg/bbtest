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
import { cn } from '@/lib/utils'
import { Phone, PhoneCall, Loader2 } from 'lucide-react'

type Step = 'enter-phone' | 'calling'

const POLL_INTERVAL_MS = 3000
const TIMEOUT_MS = 5 * 60 * 1000
const AREA_LEN = 3 // (916)
const LOCAL_LEN = 7 // 0991997
const DIGITS_COUNT = AREA_LEN + LOCAL_LEN // после фиксированной 8

type Props = {
    callbackUrl?: string
}

export const PhoneCallLogin = ({ callbackUrl = '/learn' }: Props) => {
    const [step, setStep] = useState<Step>('enter-phone')
    const [digits, setDigits] = useState<string[]>(Array(DIGITS_COUNT).fill(''))
    const [callPhonePretty, setCallPhonePretty] = useState('')
    const [callPhoneRaw, setCallPhoneRaw] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [isStarting, setIsStarting] = useState(false)

    const digitRefs = useRef<(HTMLInputElement | null)[]>([])
    const pollTimer = useRef<ReturnType<typeof setInterval> | null>(null)
    const timeoutTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

    const isComplete = digits.every((d) => d !== '')
    const phoneInput = '8' + digits.join('')

    const handleDigitChange = (index: number, rawValue: string) => {
        const char = rawValue.replace(/\D/g, '').slice(-1)
        setDigits((prev) => {
            const next = [...prev]
            next[index] = char
            return next
        })
        if (char && index < DIGITS_COUNT - 1) {
            digitRefs.current[index + 1]?.focus()
        }
    }

    const handleDigitKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace' && !digits[index] && index > 0) {
            digitRefs.current[index - 1]?.focus()
        }
    }

    const handleDigitPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        const pasted = e.clipboardData.getData('text').replace(/\D/g, '')
        if (!pasted) return
        e.preventDefault()
        // если скопировали номер целиком (с ведущей 8/7), отбрасываем её
        const cleaned = pasted.length > DIGITS_COUNT && /^[78]/.test(pasted)
            ? pasted.slice(1)
            : pasted
        const next = cleaned.slice(0, DIGITS_COUNT).split('')
        setDigits((prev) => {
            const merged = [...prev]
            next.forEach((d, i) => { merged[i] = d })
            return merged
        })
        const lastIndex = Math.min(next.length, DIGITS_COUNT) - 1
        if (lastIndex >= 0) digitRefs.current[lastIndex]?.focus()
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
        setDigits(Array(DIGITS_COUNT).fill(''))
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

    const boxClass = 'w-4 h-8 text-center bg-[#232F34] border border-[#3A464E] rounded-md text-white text-xs font-semibold focus:outline-none focus:border-sky-400 flex-shrink-0'
    const parenClass = 'text-[#9AA7B0] text-xs font-semibold flex-shrink-0 select-none'

    const renderDigitBox = (index: number) => (
        <input
            key={index}
            ref={(el) => { digitRefs.current[index] = el }}
            type="tel"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={1}
            value={digits[index]}
            onChange={(e) => handleDigitChange(index, e.target.value)}
            onKeyDown={(e) => handleDigitKeyDown(index, e)}
            onPaste={handleDigitPaste}
            className={boxClass}
        />
    )

    return (
        <div className="flex flex-col items-center gap-3 w-full min-w-0">
            <div className="flex items-center justify-center gap-0.5 w-full min-w-0 overflow-x-auto">
                <Phone className="h-4 w-4 text-[#9AA7B0] flex-shrink-0 mr-1" />
                <div className={cn(boxClass, 'flex items-center justify-center bg-[#1A2328] text-[#9AA7B0] select-none cursor-default')}>
                    8
                </div>
                <span className={parenClass}>(</span>
                {Array.from({ length: AREA_LEN }, (_, i) => renderDigitBox(i))}
                <span className={parenClass}>)</span>
                {Array.from({ length: LOCAL_LEN }, (_, i) => renderDigitBox(AREA_LEN + i))}
            </div>

            {error && <p className="text-xs text-rose-400">{error}</p>}
            <Button
                className={cn(
                    'w-full',
                    isComplete && !isStarting && 'bg-green-500 hover:bg-green-600 border-green-600 text-white'
                )}
                disabled={isStarting || !isComplete}
                onClick={handleStart}
            >
                {isStarting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Войти по звонку'}
            </Button>
        </div>
    )
}
