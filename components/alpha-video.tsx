'use client'

// components/alpha-video.tsx
//
// Прозрачные ролики (VP9 с альфой в .webm) Safari/iPhone не умеет —
// рисует белый фон и артефакты. Для них рядом лежит HEVC с альфой (.mov,
// родной для Apple формат): на iPhone/iPad и в Safari подменяем src на него.
// Новый прозрачный ролик: положить рядом .mov того же имени и добавить имя в ALPHA.
// Сделать .mov: ffmpeg -c:v libvpx-vp9 -i x.webm -an -c:v hevc_videotoolbox
//   -alpha_quality 0.7 -b:v 700k -tag:v hvc1 -pix_fmt bgra x.mov

import { useEffect, useState, type VideoHTMLAttributes } from 'react'

const ALPHA = new Set([
    'travolta', 'travolta-dancing', 'cat-dance-1', 'cat-dance-2', 'cat-thinking',
    'football-ronaldo', 'right-hand-pumped',
])

const needsHevc = () => {
    if (typeof navigator === 'undefined') return false
    const ua = navigator.userAgent
    const ios = /iP(hone|ad|od)/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)
    const safari = /Safari/.test(ua) && !/Chrome|Chromium|Edg|Firefox|OPR/.test(ua)
    return ios || safari
}

const toMov = (src: string) => {
    const m = src.match(/^\/video\/(.+)\.webm$/)
    return m && ALPHA.has(m[1]) ? `/video/${m[1]}.mov` : src
}

export const AlphaVideo = ({ src, ...rest }: VideoHTMLAttributes<HTMLVideoElement> & { src: string }) => {
    const [s, setS] = useState(src)
    useEffect(() => { setS(needsHevc() ? toMov(src) : src) }, [src])
    // eslint-disable-next-line jsx-a11y/media-has-caption
    return <video key={s} src={s} {...rest} />
}
