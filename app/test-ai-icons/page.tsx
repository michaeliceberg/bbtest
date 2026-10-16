// Тест: варианты иконки для кнопки «ИИ-помощник» на /trainer (вместо эмодзи 📸).
import { Sparkles, Bot, BrainCircuit, ScanLine, ScanSearch, Wand2, Camera, Lightbulb, ScanText } from 'lucide-react'

const OPTIONS = [
    { n: 1, name: 'Искры', Icon: Sparkles },
    { n: 2, name: 'Робот', Icon: Bot },
    { n: 3, name: 'Мозг-схема', Icon: BrainCircuit },
    { n: 4, name: 'Сканер', Icon: ScanLine },
    { n: 5, name: 'Скан с лупой', Icon: ScanSearch },
    { n: 6, name: 'Скан текста', Icon: ScanText },
    { n: 7, name: 'Волшебная палочка', Icon: Wand2 },
    { n: 8, name: 'Камера', Icon: Camera },
    { n: 9, name: 'Лампочка', Icon: Lightbulb },
]

export default function Page() {
    return (
        <div className="min-h-screen bg-[#131D22] px-4 py-6 flex flex-col gap-4 max-w-md mx-auto">
            {OPTIONS.map(({ n, name, Icon }) => (
                <div key={n} className="flex flex-col gap-1">
                    <div className="text-xs font-black text-[#7E8F99]">{n}. {name}</div>
                    <div className="flex items-center gap-3 rounded-2xl px-4 py-3"
                        style={{ background: 'linear-gradient(135deg, #1D3A52 0%, #1A2530 55%, #2A1F3D 100%)', boxShadow: 'inset 0 0 0 1.5px rgba(120,190,245,0.55), inset 0 1px 0 rgba(255,255,255,0.18), 0 4px 0 #0D1A24, 0 0 22px rgba(83,173,239,0.18)' }}>
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white"
                            style={{ background: 'linear-gradient(135deg, #53ADEF, #7C5CE0)', boxShadow: '0 3px 0 #2E4E8A' }}>
                            <Icon className="h-6 w-6" strokeWidth={2.4} />
                        </span>
                        <span className="flex-1 min-w-0">
                            <span className="block font-black text-white">ИИ-помощник</span>
                            <span className="block text-xs font-bold text-[#A9C3D6]">Пришли фото любой задачи — подскажу, какие уроки пройти</span>
                        </span>
                        <span className="text-lg font-black text-[#9FD3FA]">›</span>
                    </div>
                </div>
            ))}
        </div>
    )
}
