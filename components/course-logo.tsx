// components/course-logo.tsx
//
// Lottie-логотип курса рядом с его названием на /learn. Свой файл под
// каждый courseId (public/Lottie/coursesLogo/*.json). У исходных Lottie
// большие пустые поля вокруг самой анимации — обрезаем их через
// overflow:hidden + scale на внутреннем контейнере (масштаб подобран и
// проверен вручную по всей длительности анимации каждого файла, чтобы
// ничего не вылезало за рамку).

'use client';

import dynamic from 'next/dynamic';
import GreenCalculator from '@/public/Lottie/coursesLogo/greencalculator.json';
import RollingBall from '@/public/Lottie/coursesLogo/rollingball.json';
import MagnetAtom from '@/public/Lottie/coursesLogo/magnetatom.json';

const Lottie = dynamic(() => import('lottie-react'), { ssr: false });

const COURSE_LOGOS: Record<number, { animationData: object; scale: number; rotateDeg?: number }> = {
    11: { animationData: GreenCalculator, scale: 1.5 },                 // ЕГЭ Математика Профиль
    12: { animationData: RollingBall, scale: 2.6 },                     // ЕГЭ Физика
    10: { animationData: MagnetAtom, scale: 1.4, rotateDeg: 90 },       // ЛНИП Физика 7
};

type Props = {
    courseId?: number | null;
    size?: number;
};

export const CourseLogo = ({ courseId, size = 36 }: Props) => {
    if (!courseId) return null;
    const logo = COURSE_LOGOS[courseId];
    if (!logo) return null;

    const transform = [logo.rotateDeg && `rotate(${logo.rotateDeg}deg)`, `scale(${logo.scale})`]
        .filter(Boolean)
        .join(' ');

    return (
        <div
            style={{ width: size, height: size, overflow: 'hidden' }}
            className="flex items-center justify-center flex-shrink-0"
        >
            <div style={{ width: size, height: size, transform, flexShrink: 0 }}>
                <Lottie
                    animationData={logo.animationData}
                    loop={true}
                    autoplay={true}
                    style={{ width: '100%', height: '100%' }}
                />
            </div>
        </div>
    );
};
