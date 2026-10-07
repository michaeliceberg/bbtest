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
        className="flex flex-shrink-0 items-center justify-center rounded-xl"
        style={{
            width: size,
            height: size,
            background: unlocked ? `linear-gradient(135deg, ${color}, ${color}99)` : '#232F34',
            boxShadow: unlocked ? `0 ${Math.round(size / 14)}px 0 ${color}66` : `0 ${Math.round(size / 14)}px 0 #1B262B`,
        }}
    >
        {iconSrc ? (
            // Иконка (белый силуэт на прозрачном фоне) рисуется маской: белая у полученных, серая у закрытых.
            <div
                style={{
                    width: size * 0.66,
                    height: size * 0.66,
                    backgroundColor: unlocked ? '#FFFFFF' : '#56646C',
                    opacity: unlocked ? 1 : 0.7,
                    WebkitMaskImage: `url(${iconSrc})`,
                    maskImage: `url(${iconSrc})`,
                    WebkitMaskSize: 'contain',
                    maskSize: 'contain',
                    WebkitMaskRepeat: 'no-repeat',
                    maskRepeat: 'no-repeat',
                    WebkitMaskPosition: 'center',
                    maskPosition: 'center',
                    filter: unlocked ? `drop-shadow(0 1px 0 ${color}AA)` : 'none',
                }}
            />
        ) : (
            <span style={{ fontSize: size * 0.5, lineHeight: 1, filter: unlocked ? 'none' : 'grayscale(1) opacity(0.45)' }}>{emoji}</span>
        )}
    </div>
);
