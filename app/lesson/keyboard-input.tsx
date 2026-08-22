// app/lesson/keyboard-input.tsx
//
// Тип задачи KEYBOARD: вместо сетки вариантов — крупный editbox с
// введённым ответом и своя цифровая клавиатура снизу (для задач с
// открытым ответом, как в реальном ЕГЭ — ввод числа, а не выбор).

import { Delete } from 'lucide-react'
import { cn } from '@/lib/utils'

type Props = {
    value: string
    onChange: (value: string) => void
    disabled?: boolean
}

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', ',', '0', '⌫']

export const KeyboardInput = ({ value, onChange, disabled }: Props) => {
    const digitsOnly = value.replace('-', '')
    const isNegative = value.startsWith('-')

    const handleKey = (key: string) => {
        if (disabled) return

        if (key === '⌫') {
            onChange(value.slice(0, -1))
            return
        }
        if (key === ',') {
            if (digitsOnly.includes(',')) return
            onChange(value + ',')
            return
        }
        onChange(value + key)
    }

    const toggleSign = () => {
        if (disabled) return
        onChange(isNegative ? value.slice(1) : `-${value}`)
    }

    return (
        <div className="flex flex-col items-center gap-4 w-full">
            <div className="w-full max-w-xs flex items-center gap-2">
                <button
                    type="button"
                    onClick={toggleSign}
                    disabled={disabled}
                    className={cn(
                        'flex-shrink-0 h-14 w-12 rounded-xl border-2 border-b-4 text-xl font-bold transition-colors',
                        isNegative
                            ? 'bg-sky-400 text-[#0B1114] border-sky-500'
                            : 'bg-[#161F23] text-[#F2F7FB] border-[#3A464E] hover:bg-[#232F34]'
                    )}
                >
                    &minus;
                </button>
                <div className="flex-1 h-14 rounded-xl bg-[#232F34] border-2 border-[#3A464E] flex items-center justify-center px-3 overflow-x-auto">
                    <span className="text-2xl md:text-3xl font-bold text-[#F2F7FB] tracking-wide whitespace-nowrap">
                        {value || <span className="text-[#5A6A72]">?</span>}
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-2 w-full max-w-xs">
                {KEYS.map((key) => (
                    <button
                        key={key}
                        type="button"
                        onClick={() => handleKey(key)}
                        disabled={disabled}
                        className="h-14 rounded-xl bg-[#161F23] border-2 border-b-4 border-[#3A464E] text-xl font-bold text-[#F2F7FB] hover:bg-[#232F34] active:border-b-2 transition-colors disabled:opacity-50 flex items-center justify-center"
                    >
                        {key === '⌫' ? <Delete className="h-5 w-5" /> : key}
                    </button>
                ))}
            </div>
        </div>
    )
}
