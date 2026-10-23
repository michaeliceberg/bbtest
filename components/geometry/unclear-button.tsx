'use client'

// Кнопка «Непонятно» в пошаговых разборах (заменила стрелку «назад»).
// Нажал — модалка с Га-Га и полем, где уже написано начало: какой это этап и о чём он
// (берём текст текущей сцены из DOM: SceneWrapper помечает сцены data-wt-scene / data-wt-active).
// Ученик дописывает или отправляет как есть; в Telegram уходит только по кнопке «Отправить».
import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { reportUnclear } from '@/actions/report-unclear'
import { cn } from '@/lib/utils'
import { useAchievementUnlockStore } from '@/store/use-achievement-unlock-store'

// Свой значок: облачко-мысль с перекошенным «?» и капелькой пота — «я запутался»
export const UnclearIcon = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 32 32" className={className} fill="none" aria-hidden>
        <path d="M6 7.5C6 5.6 7.6 4 9.5 4h13C24.4 4 26 5.6 26 7.5v9c0 1.9-1.6 3.5-3.5 3.5H15l-5.2 4.2c-.5.4-1.2 0-1.1-.6l.6-3.6H9.5C7.6 20 6 18.4 6 16.5v-9Z"
            stroke="currentColor" strokeWidth={2.2} strokeLinejoin="round" />
        <path d="M13.2 9.6c.3-1.5 1.6-2.4 3.1-2.3 1.6.1 2.8 1.3 2.6 2.8-.2 1.3-1.2 1.8-2 2.3-.6.4-.9.8-.9 1.6"
            stroke="#F09B38" strokeWidth={2.2} strokeLinecap="round" />
        <circle cx={16} cy={16.6} r={1.25} fill="#F09B38" />
        <path d="M27.5 3.2c.9 1.3 1.6 2.3 1.6 3.1a1.6 1.6 0 0 1-3.2 0c0-.8.7-1.8 1.6-3.1Z" fill="#53ADEF" />
        <circle cx={6} cy={27.5} r={1.4} fill="currentColor" opacity={0.7} />
        <circle cx={3.3} cy={30} r={0.9} fill="currentColor" opacity={0.5} />
    </svg>
)

// Начало сообщения: «Мне непонятно на этапе N («начало текста этапа…»): »
const buildPrefix = () => {
    const scenes = Array.from(document.querySelectorAll<HTMLElement>('[data-wt-scene]'))
    const active = scenes.filter((s) => s.dataset.wtActive === '1').pop() ?? scenes[scenes.length - 1]
    if (!active) return 'Мне непонятно: '
    const n = scenes.indexOf(active) + 1
    // первая строка сцены (обычно её заголовок/вопрос); короткую дополняем второй
    const lines = (active.innerText || '').split('\n').map((l) => l.replace(/\s+/g, ' ').trim()).filter(Boolean)
    const firstSentence = lines[0] && lines[0].length < 20 && lines[1] ? `${lines[0]} — ${lines[1]}` : (lines[0] ?? '')
    const snippet = firstSentence.length > 70 ? `${firstSentence.slice(0, 70).trimEnd()}…` : firstSentence
    return snippet ? `Мне непонятно на этапе ${n} («${snippet}»): ` : `Мне непонятно на этапе ${n}: `
}

export const UnclearButton = ({ className, style }: { className?: string; style?: React.CSSProperties }) => {
    const [open, setOpen] = useState(false)
    const [text, setText] = useState('')
    const [prefix, setPrefix] = useState('')
    const [sending, setSending] = useState(false)
    const areaRef = useRef<HTMLTextAreaElement | null>(null)

    const openModal = () => {
        const p = buildPrefix()
        setPrefix(p)
        setText(p)
        setOpen(true)
        // курсор — в конец готового начала, чтобы сразу дописывать
        setTimeout(() => {
            const a = areaRef.current
            if (!a) return
            a.focus()
            a.setSelectionRange(a.value.length, a.value.length)
        }, 120)
    }
    const send = async () => {
        if (sending || !text.trim()) return
        setSending(true)
        try {
            await reportUnclear({ path: window.location.pathname, text, prefix })
            toast.success('Отправлено! Разберусь и поправлю этот этап 💜')
            setOpen(false)
            // ачивки за «Непонятно» сервер уже выдал — забираем непоказанные и показываем тост
            useAchievementUnlockStore.getState().check()
        } catch {
            toast.error('Не получилось отправить, попробуй ещё раз')
        } finally {
            setSending(false)
        }
    }

    return (
        <>
            <button type="button" onClick={openModal} title="Непонятно" aria-label="Непонятно" className={className} style={style}>
                <UnclearIcon className="w-6 h-6" />
            </button>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-w-[360px] gap-3 bg-[#161F23] border-[#3A464E]">
                    <DialogHeader className="gap-1 items-center text-center">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src="/gaga/gaga-oops.webp" alt="" className="w-24 h-24 object-contain -mt-1" />
                        <DialogTitle className="text-lg text-[#F2F7FB]">Непонятно? Спасибо, что сказал! 💜</DialogTitle>
                        <DialogDescription className="text-sm text-[#9AA7B0]">
                            Ты помогаешь сделать урок понятнее для всех. Допиши, что именно запутало, или просто отправь как есть.
                        </DialogDescription>
                    </DialogHeader>
                    <textarea ref={areaRef} value={text} onChange={(e) => setText(e.target.value.slice(0, 1500))} rows={5}
                        className="w-full rounded-xl bg-[#0F171B] border-2 border-[#3A464E] focus:border-[#F09B38] outline-none p-3 text-[15px] leading-snug text-[#F2F7FB] resize-none" />
                    <button type="button" onClick={send} disabled={sending || !text.trim()}
                        className={cn('w-full h-12 rounded-xl font-extrabold uppercase tracking-wide text-[#2A1A05] bg-[#F09B38] transition-all duration-100',
                            'shadow-[0_4px_0_#C07C2B] active:shadow-none active:translate-y-[4px]', sending ? 'opacity-60' : '')}>
                        {sending ? 'Отправляю…' : 'Отправить «непонятно»'}
                    </button>
                </DialogContent>
            </Dialog>
        </>
    )
}
