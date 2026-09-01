// components/FormulaIcon.tsx
//
// Иконка-пиктограмма для типа задания PICMATCH ("сопоставь картинку и
// формулу") — см. lib/formulaIcons.ts. Простые lucide-иконки, а не
// подробные SVG-диаграммы (как в public/geometry/) — пилот специально
// делался лёгким по трудозатратам, см. CLAUDE.md.

'use client'

import { Apple, LifeBuoy, Gauge, Droplets, Zap, Mountain, Move, Rocket, ArrowUp, ArrowDown, Timer, Waves, LucideIcon } from 'lucide-react'
import type { FormulaIconKey } from '@/lib/formulaIcons'

const ICON_BY_KEY: Record<FormulaIconKey, { Icon: LucideIcon; color: string; label: string }> = {
    'kinetic-energy': { Icon: Zap, color: '#F5C451', label: 'Кинетическая энергия' },
    'potential-energy': { Icon: Mountain, color: '#7FB2F0', label: 'Потенциальная энергия' },
    'spring-energy': { Icon: Waves, color: '#B48CF2', label: 'Энергия пружины' },
    'momentum': { Icon: Move, color: '#7ED0A0', label: 'Импульс тела' },
    'pressure-solid': { Icon: Gauge, color: '#F0A868', label: 'Давление тела' },
    'pressure-liquid': { Icon: Droplets, color: '#7DD3FC', label: 'Давление жидкости' },
    'gravity-force': { Icon: Apple, color: '#E37B7B', label: 'Сила тяжести' },
    'archimedes-force': { Icon: LifeBuoy, color: '#7DD3FC', label: 'Сила Архимеда' },
    'elastic-force': { Icon: Waves, color: '#B48CF2', label: 'Сила упругости' },
    'newton-second-law': { Icon: Rocket, color: '#F0A868', label: '2-ой закон Ньютона' },
    'weight-up': { Icon: ArrowUp, color: '#7ED0A0', label: 'Вес в лифте (вверх)' },
    'weight-down': { Icon: ArrowDown, color: '#E37B7B', label: 'Вес в лифте (вниз)' },
    'pendulum-period': { Icon: Timer, color: '#8FA8F5', label: 'Период колебаний' },
}

type Props = {
    iconKey: string
}

export const FormulaIcon = ({ iconKey }: Props) => {
    const entry = ICON_BY_KEY[iconKey as FormulaIconKey]
    if (!entry) return null
    const { Icon, color } = entry

    return (
        <div className="flex justify-center pt-6">
            <div
                className="flex items-center justify-center rounded-full w-24 h-24 border-2"
                style={{ borderColor: color, backgroundColor: `${color}1A` }}
            >
                <Icon className="w-12 h-12" style={{ color }} strokeWidth={2} />
            </div>
        </div>
    )
}
