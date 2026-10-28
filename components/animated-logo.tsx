// Анимированный логотип: три слоя (public/logo-anim) — гусь с надписью, вспышка выстрела, монстр.
// Каждые 16 с: два импульса выстрела, монстра после каждого встряхивает (globals.css, .logo-anim-*).
// Только transform/opacity. Статичная версия целиком — public/ggege-logo-v4.webp.
import { cn } from '@/lib/utils'

export const AnimatedLogo = ({ className }: { className?: string }) => (
    <span className={cn('relative block aspect-[640/400]', className)} role="img" aria-label="ggege">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-anim/base.webp" alt="" className="absolute inset-0 w-full h-full" draggable={false} />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-anim/monster.webp" alt="" className="logo-anim-monster absolute inset-0 w-full h-full" draggable={false} />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-anim/flash.webp" alt="" className="logo-anim-flash absolute inset-0 w-full h-full" draggable={false} />
    </span>
)
