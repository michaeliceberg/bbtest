// components/achievement-icon.tsx
//
// Иконка ачивки: квадрат со скруглением в цвет группы, внутри картинка (iconSrc) или шаблонный эмодзи.
// Нарисованные позже картинки подключаются полем iconSrc в lib/achievementsCatalog.ts.

'use client';

export const AchievementIcon = ({
    emoji,
    iconSrc,
    color,
    size = 64,
    unlocked = true,
}: {
    emoji: string;
    iconSrc?: string;
    color: string;
    size?: number;
    unlocked?: boolean;
}) => (
    <div
        className="flex flex-shrink-0 items-center justify-center rounded-2xl"
        style={{
            width: size,
            height: size,
            // Игровой бейдж: тёмная плитка со свечением цвета группы, а не плоский цветной квадрат.
            background: unlocked ? `radial-gradient(circle at 50% 30%, ${color}66, #0F171B 72%)` : '#1B262B',
            border: `2px solid ${unlocked ? color : '#2B373D'}`,
            boxShadow: unlocked ? `0 0 ${Math.round(size / 3)}px -4px ${color}99, inset 0 0 ${Math.round(size / 4)}px ${color}33` : 'none',
        }}
    >
        {iconSrc ? (
            // Иконка (белый силуэт на прозрачном фоне) рисуется маской: белая у полученных, серая у закрытых.
            <div
                style={{
                    width: size * 0.72,
                    height: size * 0.72,
                    background: unlocked ? `linear-gradient(180deg, #FFFFFF 0%, ${color} 115%)` : '#56646C',
                    opacity: unlocked ? 1 : 0.65,
                    WebkitMaskImage: `url(${iconSrc})`,
                    maskImage: `url(${iconSrc})`,
                    WebkitMaskSize: 'contain',
                    maskSize: 'contain',
                    WebkitMaskRepeat: 'no-repeat',
                    maskRepeat: 'no-repeat',
                    WebkitMaskPosition: 'center',
                    maskPosition: 'center',
                    filter: unlocked ? `drop-shadow(0 0 ${Math.round(size / 10)}px ${color}CC)` : 'none',
                }}
            />
        ) : (
            <span style={{ fontSize: size * 0.5, lineHeight: 1, filter: unlocked ? 'none' : 'grayscale(1) opacity(0.45)' }}>{emoji}</span>
        )}
    </div>
);
