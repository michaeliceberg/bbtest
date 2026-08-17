'use client'

import Link, { LinkProps } from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import React, { ReactNode, useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import dynamic from 'next/dynamic'

const LessonLoading = dynamic(() => import('@/components/lesson-loading').then(mod => mod.LessonLoading), { ssr: false })

const SIDEBAR_LOTTIE_LOADERS = [
    '/LottieLoader/HP angry snake hugs.json',
    '/LottieLoader/HP cool guy Full.json',
    '/LottieLoader/HP hurry.json',
    '/LottieLoader/HP i saw some shit.json',
    '/LottieLoader/HP like.json',
    '/LottieLoader/HP loveletter.json',
]

// Ниже этого лоадер не скрываем, даже если страница успела прогрузиться
// быстрее — иначе на очень быстрых переходах будет просто мигание.
const MIN_LOADING_DISPLAY = 500
// Ориентир для анимации прогресс-бара внутри LessonLoading (декоративный,
// реальную загрузку не отслеживает) — если страница грузится дольше, бар
// просто "стоит" у 100%, ничего не ломается.
const PROGRESS_BAR_DURATION = 1800

interface TransitionLinkProps extends LinkProps {
    children: ReactNode,
    href: string,
    className?: string,
    style?: React.CSSProperties,
    'aria-disabled'?: boolean,
}

export const TransitionLink = ({
    children,
    href,
    className,
    style,
    'aria-disabled': ariaDisabled,
    ...props
}: TransitionLinkProps) => {
    const router = useRouter()
    const pathname = usePathname()
    const [isLoading, setIsLoading] = useState(false)
    const [mounted, setMounted] = useState(false)
    const loadStartRef = useRef<number | null>(null)
    const hideTimerRef = useRef<ReturnType<typeof setTimeout>>()

    useEffect(() => {
        setMounted(true)
        return () => {
            if (hideTimerRef.current) clearTimeout(hideTimerRef.current)
        }
    }, [])

    // Sidebar не размонтируется при переходе (это часть layout), поэтому
    // скрываем оверлей сами — как только роут реально сменился на целевой,
    // но не раньше MIN_LOADING_DISPLAY от момента клика.
    useEffect(() => {
        if (!isLoading) return
        if (pathname !== href) return

        const elapsed = loadStartRef.current ? Date.now() - loadStartRef.current : MIN_LOADING_DISPLAY
        const remaining = Math.max(0, MIN_LOADING_DISPLAY - elapsed)

        hideTimerRef.current = setTimeout(() => setIsLoading(false), remaining)
        return () => clearTimeout(hideTimerRef.current)
    }, [pathname, href, isLoading])

    const handleTransition = (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
        e.preventDefault()

        if (isLoading || pathname === href) return

        loadStartRef.current = Date.now()
        setIsLoading(true)
        router.push(href)
    }

    // Рендерим оверлей через портал прямо в <body>: если рендерить его на месте
    // (внутри sidebar), fixed inset-0 может "прилипнуть" не ко всему экрану,
    // а к ближайшему предку с CSS transform (например, анимированной обёртке
    // от framer-motion) — тогда предыдущая страница остаётся видна на фоне.
    const overlay = mounted && isLoading
        ? createPortal(
            <LessonLoading minDuration={PROGRESS_BAR_DURATION} lottieFiles={SIDEBAR_LOTTIE_LOADERS} />,
            document.body
        )
        : null

    return (
        <>
            {overlay}
            <Link
                onClick={handleTransition}
                href={href}
                className={className}
                style={style}
                aria-disabled={ariaDisabled}
                {...props}
            >
                {children}
            </Link>
        </>
    )
}
