'use client'

// components/gang-battle-countdown.tsx — живое табло «до конца битвы банд» (/gangs).
// Плитки Д / Ч / МИН / СЕК с объёмной нижней гранью; меняющаяся цифра въезжает сверху
// (только transform/opacity). В последние сутки табло краснеет — «Финальный рывок».

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

const pad = (n: number) => String(n).padStart(2, '0')

const Digit = ({ ch, hot, ready }: { ch: string; hot: boolean; ready: boolean }) => (
    <span className="relative inline-block h-[1.15em] w-[0.68em] overflow-hidden">
        <motion.span
            key={ch}
            className="absolute inset-0 flex items-center justify-center"
            initial={ready ? { y: '-100%', opacity: 0 } : false}
            animate={{ y: '0%', opacity: 1 }}
            transition={{ type: 'spring', stiffness: 420, damping: 26 }}
            style={{ color: hot ? '#FFE3D1' : '#F2F7FB' }}
        >
            {ch}
        </motion.span>
    </span>
)

const Tile = ({ value, label, hot, ready }: { value: string; label: string; hot: boolean; ready: boolean }) => (
    <div className="flex flex-col items-center gap-1.5">
        <div
            className="flex items-center justify-center rounded-2xl px-2.5 py-2 font-black tabular-nums text-3xl sm:text-4xl"
            style={{
                background: hot ? 'linear-gradient(180deg, #E0563F, #A93526)' : 'linear-gradient(180deg, #3A4A52, #232E34)',
                boxShadow: hot ? '0 5px 0 #6E1F15, 0 0 18px -4px rgba(224,86,63,0.7)' : '0 5px 0 #141C20',
            }}
        >
            {value.split('').map((ch, i) => <Digit key={i} ch={ch} hot={hot} ready={ready} />)}
        </div>
        <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: hot ? '#F2A08F' : '#7A8A93' }}>{label}</span>
    </div>
)

export const GangBattleCountdown = ({ initialMs }: { initialMs: number }) => {
    // Конец считаем от момента загрузки страницы — без рассинхрона часовых поясов.
    const [endAt] = useState(() => Date.now() + initialMs)
    const [left, setLeft] = useState(initialMs)
    // Первый показ — цифры сразу на месте; въезжают сверху только при смене.
    const [ready, setReady] = useState(false)
    useEffect(() => { setReady(true) }, [])
    useEffect(() => {
        const t = setInterval(() => setLeft(Math.max(0, endAt - Date.now())), 1000)
        return () => clearInterval(t)
    }, [endAt])

    const s = Math.floor(left / 1000)
    const d = Math.floor(s / 86400)
    const h = Math.floor((s % 86400) / 3600)
    const m = Math.floor((s % 3600) / 60)
    const sec = s % 60
    const hot = left < 24 * 3600 * 1000

    return (
        <div className="flex flex-col items-center gap-2">
            <p className="text-xs font-black uppercase tracking-widest" style={{ color: hot ? '#F28C78' : '#9AA7B0' }}>
                {hot ? '🔥 Финальный рывок! До конца битвы' : '⏳ До конца битвы'}
            </p>
            <div className="flex items-start gap-1.5 sm:gap-2">
                {d > 0 && <><Tile value={String(d)} label="дн" hot={hot} ready={ready} /><span className="pt-2 text-2xl font-black text-[#5C6B73]">:</span></>}
                <Tile value={pad(h)} label="ч" hot={hot} ready={ready} />
                <span className="pt-2 text-2xl font-black text-[#5C6B73]">:</span>
                <Tile value={pad(m)} label="мин" hot={hot} ready={ready} />
                <span className="pt-2 text-2xl font-black text-[#5C6B73]">:</span>
                <Tile value={pad(sec)} label="сек" hot={hot} ready={ready} />
            </div>
        </div>
    )
}
