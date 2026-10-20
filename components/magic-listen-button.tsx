'use client'

// «Послушать» (перенесено из Garaggio): озвучивает текст голосом браузера (speechSynthesis, бесплатно, без сервера).
// Состояния: idle — «Послушать», busy — «Колдуем…» (голос ещё не начал), playing — эквалайзер и «Стоп».

import { useEffect, useRef, useState } from 'react'
import { Sparkles } from 'lucide-react'

// Формулы в тексте приходят в LaTeX — читаем их по-человечески, без «доллар обратный слеш».
const speakable = (s: string) => s
    .replace(/\\frac\{([^{}]*)\}\{([^{}]*)\}/g, '$1 делить на $2')
    .replace(/\\sqrt\{([^{}]*)\}/g, 'корень из $1')
    .replace(/\\(cdot|times)/g, ' умножить на ')
    .replace(/\\pi/g, ' пи ').replace(/\\alpha/g, ' альфа ').replace(/\\le(q)?/g, ' меньше или равно ').replace(/\\ge(q)?/g, ' больше или равно ')
    .replace(/\^\{?2\}?/g, ' в квадрате').replace(/\^\{([^{}]*)\}/g, ' в степени $1').replace(/\^(\w)/g, ' в степени $1')
    .replace(/_\{([^{}]*)\}/g, ' $1').replace(/\\[a-zA-Z]+/g, ' ').replace(/[${}\\]/g, ' ')
    .replace(/\s+/g, ' ').trim()

const pickRuVoice = () => {
    const voices = window.speechSynthesis.getVoices()
    return voices.find((v) => v.lang?.toLowerCase().startsWith('ru')) ?? null
}

export const MagicListenButton = ({ text, className }: { text: string; className?: string }) => {
    const [state, setState] = useState<'idle' | 'busy' | 'playing'>('idle')
    const [supported, setSupported] = useState(false)
    const uttRef = useRef<SpeechSynthesisUtterance | null>(null)

    useEffect(() => {
        setSupported(typeof window !== 'undefined' && 'speechSynthesis' in window)
        return () => { if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel() }
    }, [])

    if (!supported) return null

    const click = () => {
        const synth = window.speechSynthesis
        if (state !== 'idle') { synth.cancel(); setState('idle'); return }
        synth.cancel()
        const u = new SpeechSynthesisUtterance(speakable(text))
        u.lang = 'ru-RU'
        const voice = pickRuVoice()
        if (voice) u.voice = voice
        u.rate = 1
        u.onstart = () => setState('playing')
        u.onend = () => { if (uttRef.current === u) setState('idle') }
        u.onerror = () => { if (uttRef.current === u) setState('idle') }
        uttRef.current = u
        setState('busy')
        synth.speak(u)
    }

    return (
        <button type="button" onClick={click} className={`btn-magic ${className ?? ''}`}
            data-state={state} aria-label={state === 'idle' ? 'Послушать голосом' : 'Остановить'}>
            {[18, 42, 66, 86].map((left, i) => <span key={left} className="magic-spark" style={{ left: `${left}%`, animationDelay: `${i * 0.45}s` }} />)}
            {state === 'playing'
                ? <span className="magic-bars" aria-hidden><i /><i /><i /><i /></span>
                : <Sparkles size={20} className="magic-icon" />}
            {state === 'busy' ? 'Колдуем…' : state === 'playing' ? 'Стоп' : 'Послушать'}
        </button>
    )
}
