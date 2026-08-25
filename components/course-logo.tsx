// components/course-logo.tsx
//
// Lottie-логотип курса рядом с его названием на /learn. Свой файл под
// каждый courseId (public/Lottie/coursesLogo/*.json).

'use client';

import dynamic from 'next/dynamic';
import GreenCalculator from '@/public/Lottie/coursesLogo/greencalculator.json';
import RollingBall from '@/public/Lottie/coursesLogo/rollingball.json';
import MagnetAtom from '@/public/Lottie/coursesLogo/magnetatom.json';

const Lottie = dynamic(() => import('lottie-react'), { ssr: false });

const COURSE_LOGOS: Record<number, { animationData: object; rotateDeg?: number }> = {
    11: { animationData: GreenCalculator },              // ЕГЭ Математика Профиль
    12: { animationData: RollingBall },                  // ЕГЭ Физика
    10: { animationData: MagnetAtom, rotateDeg: 90 },    // ЛНИП Физика 7
};

type Props = {
    courseId?: number | null;
    size?: number;
};

export const CourseLogo = ({ courseId, size = 40 }: Props) => {
    if (!courseId) return null;
    const logo = COURSE_LOGOS[courseId];
    if (!logo) return null;

    return (
        <div style={{ width: size, height: size }}>
            <Lottie
                animationData={logo.animationData}
                loop={true}
                autoplay={true}
                style={
                    logo.rotateDeg
                        ? { width: '100%', height: '100%', transform: `rotate(${logo.rotateDeg}deg)` }
                        : { width: '100%', height: '100%' }
                }
            />
        </div>
    );
};
