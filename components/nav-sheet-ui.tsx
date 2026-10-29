// components/nav-sheet-ui.tsx — общий вид меню навигации по юнитам/разделам (шторка слева на /trainer и /learn).
// Без цветов юнитов (разные цвета — только на самой карте тренажёра, как «новый уровень»): нейтральные
// «стеклянные» плитки с объёмной нижней гранью (boxShadow, а не border — при нажатии ничего не прыгает),
// текущий пункт — серебристая рамка и лёгкое свечение, прогресс — тонкая полоска.

import type { CSSProperties } from 'react'

export const NAV_SHEET_CLASS = 'p-0 z-[100] border-[#2B373D] w-[82%] sm:max-w-xs overflow-y-auto bg-[linear-gradient(180deg,#18232A_0%,#121B20_100%)]'

export const navItemStyle = (here: boolean, locked = false): CSSProperties => locked
    ? { background: '#1A2328', boxShadow: 'inset 0 0 0 1px #26323A, 0 3px 0 #0C1215' }
    : here
        ? {
            background: 'linear-gradient(180deg, #2C3B43 0%, #1F2B31 100%)',
            boxShadow: 'inset 0 0 0 1.5px rgba(230,238,243,0.7), inset 0 1px 0 rgba(255,255,255,0.25), 0 4px 0 #0C1215, 0 0 20px rgba(200,220,235,0.12)',
        }
        : { background: 'linear-gradient(180deg, #212D33 0%, #1B262B 100%)', boxShadow: 'inset 0 0 0 1px #2F3C43, inset 0 1px 0 rgba(255,255,255,0.06), 0 4px 0 #0C1215' }

export const NAV_ITEM_PRESS = 'transition-transform active:translate-y-[3px]'

export const NavProgress = ({ percent, done }: { percent: number; done?: boolean }) => (
    <span className="flex w-12 flex-shrink-0 flex-col items-end gap-1">
        <span className="text-[11px] font-black leading-none text-[#AEBCC5]">{done ? '✓' : `${percent}%`}</span>
        <span className="h-1 w-full overflow-hidden rounded-full bg-[#0E1518]">
            <span className="block h-full rounded-full bg-[linear-gradient(90deg,#9FB0BA,#F2F7FB)]" style={{ width: `${Math.max(0, Math.min(100, done ? 100 : percent))}%` }} />
        </span>
    </span>
)

export const NAV_SECTION_LABEL_CLASS = 'px-1 pb-1 text-[11px] font-black uppercase tracking-[0.12em] text-[#7E8F99]'

// Медаль прогресса в меню тренажёра: ничего не сделано — пустой кружок, что-то начато — бронза,
// половина и больше — серебро, всё пройдено — золото (картинки public/medals/*.webp).
export const medalFor = (percent: number): 'none' | 'bronze' | 'silver' | 'gold' =>
    percent >= 100 ? 'gold' : percent >= 50 ? 'silver' : percent > 0 ? 'bronze' : 'none'

const MEDAL_TITLE = { none: 'Ещё не начато', bronze: 'Бронза: начало положено', silver: 'Серебро: больше половины', gold: 'Золото: всё пройдено' }

const MEDAL_LABEL = { bronze: 'Бронза', silver: 'Серебро', gold: 'Золото' }
const MEDAL_COLOR = { bronze: '#B9784F', silver: '#3F9FE0', gold: '#F0A818' }
// Белая обводка подписи — кольцо из text-shadow (не -webkit-text-stroke: у жирных букв даёт шипы на углах).
const WHITE_RING = [0, 45, 90, 135, 180, 225, 270, 315]
    .map((a) => `${(Math.cos(a * Math.PI / 180) * 2).toFixed(2)}px ${(Math.sin(a * Math.PI / 180) * 2).toFixed(2)}px 0 #fff`)
    .join(', ') + ', 0 3px 3px rgba(0,0,0,0.35)'

const MEDAL_SRC = { bronze: '/medals/medal-bronze.webp', silver: '/medals/medal-silver.webp', gold: '/medals/medal-gold.webp' }

// Медаль: тень вниз-вправо (лежит на баннере) и блик, пробегающий раз в 4,5 с (.medal-shine — по маске самой картинки).
const MedalPic = ({ src, alt, size }: { src: string; alt: string; size: number }) => {
    const dx = Math.max(2, Math.round(size * 0.06)), dy = Math.max(3, Math.round(size * 0.085))
    const mask = { WebkitMaskImage: `url(${src})`, maskImage: `url(${src})`, WebkitMaskSize: 'contain', maskSize: 'contain', WebkitMaskRepeat: 'no-repeat', maskRepeat: 'no-repeat', WebkitMaskPosition: 'center', maskPosition: 'center' } as const
    return (
        <span className="relative block" style={{ width: size, height: size }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt={alt} className="absolute inset-0 h-full w-full object-contain" draggable={false}
                style={{ filter: `drop-shadow(${dx}px ${dy}px 0 rgba(0,0,0,0.28)) drop-shadow(${Math.round(dx / 2)}px ${Math.round(dy / 2)}px 2px rgba(0,0,0,0.22))` }} />
            <span aria-hidden className="medal-shine" style={mask} />
        </span>
    )
}

export const NavMedal = ({ percent, size = 44, onColor = false, label = false }: { percent: number; size?: number; onColor?: boolean; label?: boolean }) => {
    const m = medalFor(percent)
    return (
        <span className="relative flex flex-shrink-0 flex-col items-center justify-center" style={{ width: size, minHeight: size }} title={MEDAL_TITLE[m]}>
            {m === 'gold' && (
                // Свечение как у кнопки «ИИ-помощник»: тёплый пульс позади и искры (только transform/opacity).
                <>
                    <span aria-hidden className="medal-glow" />
                    {[22, 50, 78].map((left, i) => (
                        <span key={left} aria-hidden className="medal-spark" style={{ left: `${left}%`, animationDelay: `${i * 0.6}s` }} />
                    ))}
                </>
            )}
            {m === 'none'
                ? <span className="rounded-full border-[3px] border-dashed" style={{ width: size * 0.64, height: size * 0.64, borderColor: onColor ? 'rgba(255,255,255,0.55)' : '#3A4850' }} />
                // eslint-disable-next-line @next/next/no-img-element
                : <MedalPic src={MEDAL_SRC[m]} alt={MEDAL_TITLE[m]} size={size} />}
            {label && m !== 'none' && (
                <span className="relative whitespace-nowrap font-black leading-none" style={{ marginTop: -size * 0.12, fontSize: Math.max(11, size * 0.17), color: MEDAL_COLOR[m], textShadow: WHITE_RING, zIndex: 2 }}>
                    {MEDAL_LABEL[m]}
                </span>
            )}
        </span>
    )
}

// Маленькая медаль без блика и свечения (слоты медалей над плитками задачника, кнопки тренажёров).
// У серебра и бронзы широкие крылья, сама медаль на картинке ниже золотой — boost увеличивает их,
// чтобы на глаз все три были одного роста (крылья при этом выходят за квадрат — нужен отступ по бокам).
const MEDAL_BOOST = { bronze: 1.3, silver: 1.65, gold: 1 } as const
export const TinyMedal = ({ percent, size = 12, title, boost = false }: { percent: number; size?: number; title?: string; boost?: boolean }) => {
    const m = medalFor(percent)
    if (m === 'none') return <span title={title} className="block flex-shrink-0 rounded-full border border-dashed border-[#4A5860]" style={{ width: size, height: size }} />
    const k = boost ? MEDAL_BOOST[m] : 1
    return (
        <span title={title} className="relative block flex-shrink-0" style={{ width: size, height: size }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={MEDAL_SRC[m]} alt={MEDAL_TITLE[m]} draggable={false} className="absolute left-1/2 top-1/2 max-w-none object-contain"
                style={{ width: size * k, height: size * k, transform: 'translate(-50%, -50%)' }} />
        </span>
    )
}
