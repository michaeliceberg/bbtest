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

export const NavMedal = ({ percent }: { percent: number }) => {
    const m = medalFor(percent)
    return (
        <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center" title={MEDAL_TITLE[m]}>
            {m === 'none'
                ? <span className="h-7 w-7 rounded-full border-[3px] border-dashed border-[#3A4850]" />
                // eslint-disable-next-line @next/next/no-img-element
                : <img src={`/medals/medal-${m}.webp`} alt={MEDAL_TITLE[m]} className="h-11 w-11 object-contain drop-shadow-[0_2px_0_rgba(0,0,0,0.35)]" draggable={false} />}
        </span>
    )
}
