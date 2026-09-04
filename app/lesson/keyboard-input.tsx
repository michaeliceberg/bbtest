// app/lesson/keyboard-input.tsx
//
// Тип задачи KEYBOARD: цифровая клавиатура для задач с открытым ответом
// (как в реальном ЕГЭ — ввод числа, а не выбор).
//
// Раньше набранное число всегда показывалось в отдельном "экранчике"
// (обособленный бокс с своим фоном/рамкой) над клавиатурой. По просьбе
// пользователя эта обособленная рамка убрана везде — введённое число
// теперь просто крупный текст без рамки-"дисплея". А там, где цифры
// подставляются НЕПОСРЕДСТВЕННО в нужное место (например, в формулу
// с пропуском — см. TangentialQuadWalkthrough.tsx), сам компонент
// вообще не показывает значение — `showDisplay={false}` оставляет
// только знак-минус и клавиатуру, а число печатает сам родитель прямо
// в месте подстановки (см. `doubleTyped` в TangentialQuadWalkthrough).

import { Delete } from 'lucide-react'
import { cn } from '@/lib/utils'

type Props = {
    value: string
    onChange: (value: string) => void
    disabled?: boolean
    showDisplay?: boolean
}

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', ',', '0', '⌫']

export const KeyboardInput = ({ value, onChange, disabled, showDisplay = true }: Props) => {
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
        <div className="flex flex-col items-center gap-2.5 w-full">
            <div className="w-full max-w-xs flex items-center gap-1.5">
                <button
                    type="button"
                    onClick={toggleSign}
                    disabled={disabled}
                    className={cn(
                        'flex-shrink-0 h-11 w-10 rounded-xl border-2 border-b-4 text-lg font-bold transition-colors',
                        isNegative
                            ? 'bg-sky-400 text-[#0B1114] border-sky-500'
                            : 'bg-[#161F23] text-[#F2F7FB] border-[#3A464E] hover:bg-[#232F34]'
                    )}
                >
                    &minus;
                </button>
                {showDisplay && (
                    <div className="flex-1 h-11 flex items-center justify-center px-3 overflow-x-auto">
                        <span className="text-xl md:text-2xl font-bold text-[#F2F7FB] tracking-wide whitespace-nowrap">
                            {value || <span className="text-[#5A6A72]">?</span>}
                        </span>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-3 gap-1.5 w-full max-w-xs">
                {KEYS.map((key) => (
                    <button
                        key={key}
                        type="button"
                        onClick={() => handleKey(key)}
                        disabled={disabled}
                        className="h-11 rounded-xl bg-[#161F23] border-2 border-b-4 border-[#3A464E] text-lg font-bold text-[#F2F7FB] hover:bg-[#232F34] active:border-b-2 transition-colors disabled:opacity-50 flex items-center justify-center"
                    >
                        {key === '⌫' ? <Delete className="h-4 w-4" /> : key}
                    </button>
                ))}
            </div>
        </div>
    )
}
