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
            // eslint-disable-next-line @next/next/no-img-element
            <img src={iconSrc} alt="" draggable={false} style={{ width: size * 0.72, height: size * 0.72, filter: unlocked ? 'none' : 'grayscale(1) opacity(0.45)' }} />
        ) : (
            <span style={{ fontSize: size * 0.5, lineHeight: 1, filter: unlocked ? 'none' : 'grayscale(1) opacity(0.45)' }}>{emoji}</span>
        )}
    </div>
);
