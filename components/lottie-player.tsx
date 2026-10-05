// components/lottie-player.tsx
//
// Обёртка над lottie-react, которая принимает animationData ЛИБО объектом, ЛИБО строкой-URL.
// Все Lottie-JSON из public/ (см. next.config.mjs, webpack-правило) при импорте превращаются в
// URL статического файла (/_next/static/lottie/…), а не вшиваются в JS-бандл (раньше они
// весили ~14 МБ в общем бандле и грузились/разбирались на каждой странице). Здесь файл
// подгружается по требованию, кэшируется браузером навсегда (immutable) и в памяти.

'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import type { LottieComponentProps } from 'lottie-react'

const LottieReact = dynamic(() => import('lottie-react'), { ssr: false })

const loaded = new Map<string, unknown>()
const inflight = new Map<string, Promise<unknown>>()

const loadLottie = (url: string): Promise<unknown> => {
    const hit = loaded.get(url)
    if (hit) return Promise.resolve(hit)
    let p = inflight.get(url)
    if (!p) {
        p = fetch(url)
            .then((r) => r.json())
            .then((d) => { loaded.set(url, d); inflight.delete(url); return d })
            .catch((e) => { inflight.delete(url); throw e })
        inflight.set(url, p)
    }
    return p
}

// Предзагрузка: сам модуль lottie-react + JSON (если это URL). Нужна там, где облачко и анимация
// должны появиться одновременно (см. useLottieModuleReady в WalkthroughLog.tsx).
export const preloadLottie = (...data: unknown[]): Promise<unknown> =>
    Promise.all([import('lottie-react'), ...data.map((d) => (typeof d === 'string' ? loadLottie(d) : Promise.resolve()))])

type Props = Omit<LottieComponentProps, 'animationData'> & { animationData: unknown }

const Lottie = ({ animationData, ...rest }: Props) => {
    const isUrl = typeof animationData === 'string'
    const [data, setData] = useState<unknown>(() => (isUrl ? loaded.get(animationData as string) ?? null : animationData))
    useEffect(() => {
        if (!isUrl) { setData(animationData); return }
        const url = animationData as string
        const cached = loaded.get(url)
        if (cached) { setData(cached); return }
        setData(null)
        let alive = true
        loadLottie(url).then((d) => { if (alive) setData(d) }).catch(() => {})
        return () => { alive = false }
    }, [animationData, isUrl])
    // Пока JSON не пришёл — пустой блок того же размера (без скачка вёрстки).
    if (!data) return <div className={rest.className} style={rest.style} aria-hidden />
    return <LottieReact {...(rest as object)} animationData={data as object} />
}

export default Lottie
