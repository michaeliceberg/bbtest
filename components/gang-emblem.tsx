// components/gang-emblem.tsx
//
// Эмблема банды: тёмная плитка со свечением цвета банды и иконка-силуэт (game-icons.net, CC BY 3.0).
// Старые банды с эмодзи в gangs.emoji показываются как раньше.

import { DEFAULT_GANG_COLOR, emblemIdOf } from '@/lib/gangEmblems'

export const GangEmblem = ({
    value,
    color,
    size = 56,
}: {
    value: string | null | undefined
    color?: string | null
    size?: number
}) => {
    const id = emblemIdOf(value)
    const c = color || DEFAULT_GANG_COLOR
    return (
        <div
            className="flex flex-shrink-0 items-center justify-center rounded-2xl"
            style={{
                width: size,
                height: size,
                background: `radial-gradient(circle at 50% 30%, ${c}66, #0F171B 72%)`,
                border: `2px solid ${c}`,
                boxShadow: `0 0 ${Math.round(size / 3)}px -4px ${c}99, inset 0 0 ${Math.round(size / 4)}px ${c}33`,
            }}
        >
            {id ? (
                <div
                    style={{
                        width: size * 0.72,
                        height: size * 0.72,
                        background: `linear-gradient(180deg, #FFFFFF 0%, ${c} 115%)`,
                        WebkitMaskImage: `url(/gang-emblems/${id}.svg)`,
                        maskImage: `url(/gang-emblems/${id}.svg)`,
                        WebkitMaskSize: 'contain',
                        maskSize: 'contain',
                        WebkitMaskRepeat: 'no-repeat',
                        maskRepeat: 'no-repeat',
                        WebkitMaskPosition: 'center',
                        maskPosition: 'center',
                        filter: `drop-shadow(0 0 ${Math.round(size / 10)}px ${c}CC)`,
                    }}
                />
            ) : (
                <span style={{ fontSize: size * 0.55, lineHeight: 1 }}>{value || '🔥'}</span>
            )}
        </div>
    )
}
