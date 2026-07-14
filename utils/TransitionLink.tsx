'use client'

import Link, { LinkProps } from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import React, { ReactNode, useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'
import Reordering from '@/components/reordering-comp'

interface TransitionLinkProps extends LinkProps {
    children: ReactNode,
    href: string,
    className?: string,
    style?: React.CSSProperties,
    'aria-disabled'?: boolean,
}

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
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
    const [progress, setProgress] = useState(0)
    const timeoutRef = useRef<NodeJS.Timeout>()

    useEffect(() => {
        setMounted(true)
    }, [])

    // Имитация прогресса загрузки
    useEffect(() => {
        if (!isLoading) {
            setProgress(0)
            return
        }
        
        const interval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 90) return prev
                return prev + 10
            })
        }, 100)
        
        return () => clearInterval(interval)
    }, [isLoading])

    // Скрываем оверлей ТОЛЬКО когда страница полностью загрузилась
    useEffect(() => {
        if (!isLoading) return
        
        if (pathname === href) {
            setProgress(100)
            setTimeout(() => {
                setIsLoading(false)
            }, 200)
        }
    }, [pathname, href, isLoading])

    const handleTransition = async (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
        e.preventDefault()
        
        if (isLoading) return
        
        setIsLoading(true)
        setProgress(0)

        await sleep(300)
        
        router.push(href)
    }
    
    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current)
            }
        }
    }, [])
    
    const overlay = mounted && isLoading ? createPortal(
        <div 
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                width: '100vw',
                height: '100vh',
                backgroundColor: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                zIndex: 999999,
                margin: 0,
                padding: 0,
            }}
            onClick={(e) => e.stopPropagation()}
        >
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '30px',
            }}>
                {/* Reordering компонент вместо лоадера */}
                <Reordering />
                
                <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    style={{ 
                        color: '#9911ff', 
                        fontSize: '16px',
                        fontWeight: 'bold',
                        fontFamily: 'Nunito, sans-serif',
                        letterSpacing: '1px'
                    }}
                >
                    ЗАГРУЗКА...
                </motion.p>
                
                {/* Игровой прогресс-бар */}
                {/* Минималистичный прогресс-бар */}
<div style={{ width: '200px' }}>
    <div style={{
        width: '100%',
        height: '4px',
        backgroundColor: '#f0f0f0',
        borderRadius: '2px',
        overflow: 'hidden',
    }}>
        <motion.div
            style={{
                height: '100%',
                backgroundColor: '#c0c0c0',
            }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
        />
    </div>
    
    <div style={{
        display: 'flex',
        justifyContent: 'center',
        marginTop: '6px',
    }}>
        <span style={{ 
            color: '#c0c0c0', 
            fontSize: '11px', 
            fontFamily: 'monospace',
        }}>
            {Math.floor(progress)}%
        </span>
    </div>
</div>

            </div>
        </div>,
        document.body
    ) : null
    
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

