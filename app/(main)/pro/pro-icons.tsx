// Иконки экрана PRO: lucide в золотой плашке вместо эмодзи (премиальный вид).
import { BrainCircuit, Swords, Sparkles, PartyPopper, Crown, Receipt, type LucideIcon } from 'lucide-react'

const FEATURE: Record<string, LucideIcon> = { lessons: BrainCircuit, part2: Swords, ai: Sparkles }

export const GoldIconTile = ({ icon: Icon, size = 44 }: { icon: LucideIcon; size?: number }) => (
    <span
        className="flex flex-shrink-0 items-center justify-center rounded-xl"
        style={{
            width: size, height: size,
            background: 'linear-gradient(145deg, #3A2E12 0%, #1E1A10 100%)',
            boxShadow: 'inset 0 0 0 1.5px rgba(242,195,91,0.65), inset 0 1px 0 rgba(255,236,170,0.35), 0 0 16px -4px rgba(242,195,91,0.55)',
        }}
    >
        <Icon className="text-[#F2C35B]" style={{ width: size * 0.5, height: size * 0.5 }} strokeWidth={2.2} />
    </span>
)

export const FeatureIcon = ({ name }: { name: string }) => <GoldIconTile icon={FEATURE[name] ?? Sparkles} />
export { PartyPopper, Crown, Receipt }
