// components/unit-scroll-effect.tsx

'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type UnitTheme = {
    id: number;
    title: string;
    bgGradient: string;
    icon: string;
    accentColor: string;
};

const unitThemes: UnitTheme[] = [
    {
        id: 1,
        title: 'Алгебра',
        bgGradient: 'from-purple-600 via-indigo-600 to-blue-600',
        icon: '📐',
        accentColor: '#8b5cf6',
    },
    {
        id: 2,
        title: 'Геометрия',
        bgGradient: 'from-emerald-600 via-teal-600 to-cyan-600',
        icon: '📏',
        accentColor: '#14b8a6',
    },
    {
        id: 3,
        title: 'Тригонометрия',
        bgGradient: 'from-orange-600 via-amber-600 to-yellow-600',
        icon: '📐',
        accentColor: '#f59e0b',
    },
    {
        id: 4,
        title: 'Векторы',
        bgGradient: 'from-rose-600 via-pink-600 to-fuchsia-600',
        icon: '➡️',
        accentColor: '#ec4899',
    },
    {
        id: 5,
        title: 'Стереометрия',
        bgGradient: 'from-slate-600 via-gray-600 to-zinc-600',
        icon: '🧊',
        accentColor: '#64748b',
    },
    {
        id: 6,
        title: 'Вероятность',
        bgGradient: 'from-indigo-600 via-purple-600 to-pink-600',
        icon: '🎲',
        accentColor: '#6366f1',
    },
];

type Props = {
    children: React.ReactNode;
    unitTitles: { id: number; title: string }[];
};

export const UnitScrollEffect = ({ children, unitTitles }: Props) => {
    const [activeUnitId, setActiveUnitId] = useState<number | null>(unitTitles[0]?.id || null);
    const [scrolled, setScrolled] = useState<boolean>(false);

    useEffect(() => {
        const handleScroll = () => {
            // Показываем кнопку "наверх"
            setScrolled(window.scrollY > 300);

            // Находим все элементы юнитов
            const units = document.querySelectorAll('[data-unit-id]');
            let currentUnitId: number | null = null;

            // Определяем, какой юнит в центре видимости
            units.forEach((unit) => {
                const rect = unit.getBoundingClientRect();
                const viewportHeight = window.innerHeight;
                const isVisible = rect.top < viewportHeight / 2 && rect.bottom > viewportHeight / 4;
                
                if (isVisible) {
                    const unitId = parseInt(unit.getAttribute('data-unit-id') || '0');
                    if (unitId && !isNaN(unitId)) {
                        currentUnitId = unitId;
                    }
                }
            });

            if (currentUnitId && currentUnitId !== activeUnitId) {
                setActiveUnitId(currentUnitId);
                
                // Обновляем фон body
                const theme = unitThemes.find(t => t.id === currentUnitId) || unitThemes[0];
                document.body.style.transition = 'background 0.5s ease';
                document.body.style.background = `linear-gradient(135deg, var(--tw-gradient-from), var(--tw-gradient-to))`;
                document.body.style.backgroundImage = `linear-gradient(135deg, ${theme.bgGradient.split(' ')[1]}, ${theme.bgGradient.split(' ')[3]})`;
            }
        };

        window.addEventListener('scroll', handleScroll);
        handleScroll(); // Вызываем сразу для установки начального фона

        return () => window.removeEventListener('scroll', handleScroll);
    }, [activeUnitId, unitTitles]);

    const activeTheme = unitThemes.find(t => t.id === activeUnitId) || unitThemes[0];

    return (
        <div className="relative min-h-screen">
            {/* Фиксированный фоновый градиент */}
            <div 
                className="fixed inset-0 -z-20 transition-all duration-700"
                style={{
                    background: `linear-gradient(135deg, ${activeTheme.bgGradient.split(' ')[1]}, ${activeTheme.bgGradient.split(' ')[3]})`,
                }}
            />

            {/* Декоративные плавающие элементы */}
            <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
                {[...Array(20)].map((_, i) => (
                    <div
                        key={i}
                        className="absolute text-white/10 text-2xl animate-float"
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                            animationDelay: `${Math.random() * 10}s`,
                            animationDuration: `${15 + Math.random() * 15}s`,
                        }}
                    >
                        {activeTheme.icon}
                    </div>
                ))}
            </div>

            {/* Боковая панель с иконкой текущего юнита */}
            <div className="fixed right-4 top-1/2 transform -translate-y-1/2 z-20 hidden lg:block">
                <div className="bg-black/30 backdrop-blur rounded-2xl p-3">
                    <div className="text-4xl filter drop-shadow-lg">
                        {activeTheme.icon}
                    </div>
                    <div className="w-px h-8 bg-white/30 mx-auto my-2" />
                    <div className="flex flex-col gap-2">
                        {unitTitles.map((unit) => (
                            <button
                                key={unit.id}
                                onClick={() => {
                                    const element = document.querySelector(`[data-unit-id="${unit.id}"]`);
                                    if (element) {
                                        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                    }
                                }}
                                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                                    activeUnitId === unit.id
                                        ? 'bg-white scale-150 shadow-lg'
                                        : 'bg-white/40 hover:bg-white/60'
                                }`}
                                title={unit.title}
                            />
                        ))}
                    </div>
                </div>
            </div>

            {/* Кнопка "Наверх" */}
            {scrolled && (
                <button
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    className="fixed bottom-6 right-6 z-20 bg-white/20 backdrop-blur rounded-full p-3 text-white hover:bg-white/30 transition-all hover:scale-110"
                >
                    ↑
                </button>
            )}

            {/* Основной контент */}
            {children}
        </div>
    );
};





// // components/unit-scroll-effect.tsx

// 'use client';

// import React, { useEffect, useState, useRef } from 'react';
// import { motion, AnimatePresence } from 'framer-motion';

// type UnitTheme = {
//     id: number;
//     title: string;
//     bgGradient: string;
//     icon: string;
//     particles: string[];
// };

// const unitThemes: UnitTheme[] = [
//     {
//         id: 1,
//         title: 'Алгебра',
//         bgGradient: 'from-purple-600 via-indigo-600 to-blue-600',
//         icon: '📐',
//         particles: ['✖️', '➕', '➗', '➖', '='],
//     },
//     {
//         id: 2,
//         title: 'Геометрия',
//         bgGradient: 'from-emerald-600 via-teal-600 to-cyan-600',
//         icon: '📏',
//         particles: ['△', '□', '○', '∠', '⊥'],
//     },
//     {
//         id: 3,
//         title: 'Тригонометрия',
//         bgGradient: 'from-orange-600 via-amber-600 to-yellow-600',
//         icon: '📐',
//         particles: ['sin', 'cos', 'tan', 'π', 'θ'],
//     },
//     {
//         id: 4,
//         title: 'Векторы',
//         bgGradient: 'from-rose-600 via-pink-600 to-fuchsia-600',
//         icon: '➡️',
//         particles: ['→', '↑', '↓', '←', '↗'],
//     },
//     {
//         id: 5,
//         title: 'Стереометрия',
//         bgGradient: 'from-slate-600 via-gray-600 to-zinc-600',
//         icon: '🧊',
//         particles: ['🔲', '🔳', '⚪', '🔺', '📦'],
//     },
//     {
//         id: 6,
//         title: 'Вероятность',
//         bgGradient: 'from-indigo-600 via-purple-600 to-pink-600',
//         icon: '🎲',
//         particles: ['🎲', '🃏', '⚡', '🎯', '⭐'],
//     },
// ];

// type Props = {
//     children: React.ReactNode;
//     unitTitles: { id: number; title: string }[];
// };

// export const UnitScrollEffect = ({ children, unitTitles }: Props) => {
//     const [activeUnitId, setActiveUnitId] = useState<number | null>(null);
//     const [scrolled, setScrolled] = useState(false);
//     const observerRef = useRef<IntersectionObserver | null>(null);
//     const unitRefs = useRef<Map<number, HTMLElement>>(new Map());

//     useEffect(() => {
//         // Наблюдаем за видимостью юнитов
//         observerRef.current = new IntersectionObserver(
//             (entries) => {
//                 entries.forEach((entry) => {
//                     if (entry.isIntersecting) {
//                         const unitId = parseInt(entry.target.getAttribute('data-unit-id') || '0');
//                         if (unitId) {
//                             setActiveUnitId(unitId);
//                         }
//                     }
//                 });
//             },
//             { threshold: 0.3, rootMargin: '-100px 0px -100px 0px' }
//         );

//         unitRefs.current.forEach((element) => {
//             if (observerRef.current) observerRef.current.observe(element);
//         });

//         return () => {
//             if (observerRef.current) observerRef.current.disconnect();
//         };
//     }, []);

//     const registerUnitRef = (id: number, element: HTMLElement | null) => {
//         if (element) {
//             unitRefs.current.set(id, element);
//             if (observerRef.current) observerRef.current.observe(element);
//         }
//     };

//     const activeTheme = unitThemes.find(t => t.id === activeUnitId) || unitThemes[0];

//     return (
//         <div className="relative min-h-screen">
//             {/* Фоновый градиент, меняющийся при скролле */}
//             <motion.div
//                 className="fixed inset-0 -z-10 transition-all duration-700"
//                 initial={{ opacity: 0 }}
//                 animate={{
//                     background: `linear-gradient(135deg, var(--tw-gradient-from), var(--tw-gradient-to))`,
//                 }}
//                 transition={{ duration: 0.7 }}
//                 style={{
//                     background: `linear-gradient(135deg, ${unitThemes.find(t => t.id === activeUnitId)?.bgGradient?.split(' ')[1] || '#6366f1'}, ${unitThemes.find(t => t.id === activeUnitId)?.bgGradient?.split(' ')[3] || '#8b5cf6'})`,
//                 }}
//             >
//                 {/* Анимированные частицы */}
//                 <div className="absolute inset-0 overflow-hidden">
//                     {activeTheme?.particles.map((particle, i) => (
//                         <motion.div
//                             key={i}
//                             className="absolute text-white/10 text-4xl select-none pointer-events-none"
//                             initial={{ x: Math.random() * window.innerWidth, y: -100 }}
//                             animate={{ y: window.innerHeight + 100 }}
//                             transition={{
//                                 duration: 10 + Math.random() * 10,
//                                 repeat: Infinity,
//                                 delay: i * 2,
//                             }}
//                             style={{ left: `${Math.random() * 100}%` }}
//                         >
//                             {particle}
//                         </motion.div>
//                     ))}
//                 </div>
//             </motion.div>

//             {/* Декоративные элементы в зависимости от активного юнита */}
//             <AnimatePresence mode="wait">
//                 {activeUnitId && (
//                     <motion.div
//                         key={activeUnitId}
//                         initial={{ opacity: 0, scale: 0.8 }}
//                         animate={{ opacity: 1, scale: 1 }}
//                         exit={{ opacity: 0, scale: 0.8 }}
//                         className="fixed top-1/4 right-8 z-10 hidden lg:block"
//                     >
//                         <div className="text-8xl filter drop-shadow-2xl animate-bounce">
//                             {activeTheme?.icon}
//                         </div>
//                         <div className="text-center mt-2">
//                             <span className="text-white/40 text-xs">{activeTheme?.title}</span>
//                         </div>
//                     </motion.div>
//                 )}
//             </AnimatePresence>

//             {/* Контент с переданными ref */}
//             <div>
//                 {React.Children.map(children, (child, index) => {
//                     const unitId = unitTitles[index]?.id;
//                     return React.cloneElement(child as React.ReactElement, {
//                         ref: (el: HTMLElement) => registerUnitRef(unitId, el),
//                         'data-unit-id': unitId,
//                     });
//                 })}
//             </div>

//             {/* Индикатор прогресса по уровням */}
//             <div className="fixed right-4 top-1/2 transform -translate-y-1/2 z-20 hidden lg:block">
//                 <div className="bg-black/20 backdrop-blur rounded-full py-3 px-2">
//                     {unitTitles.map((unit, idx) => (
//                         <div
//                             key={unit.id}
//                             className={`w-2 h-2 rounded-full mb-2 transition-all duration-300 cursor-pointer ${
//                                 activeUnitId === unit.id
//                                     ? 'bg-white scale-150'
//                                     : 'bg-white/40 hover:bg-white/60'
//                             }`}
//                             onClick={() => {
//                                 const element = unitRefs.current.get(unit.id);
//                                 if (element) {
//                                     element.scrollIntoView({ behavior: 'smooth', block: 'start' });
//                                 }
//                             }}
//                         />
//                     ))}
//                 </div>
//             </div>

//             {/* Плавающая кнопка "Наверх" */}
//             {scrolled && (
//                 <motion.button
//                     initial={{ opacity: 0, scale: 0 }}
//                     animate={{ opacity: 1, scale: 1 }}
//                     exit={{ opacity: 0, scale: 0 }}
//                     onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
//                     className="fixed bottom-6 right-6 z-20 bg-white/20 backdrop-blur rounded-full p-3 text-white hover:bg-white/30 transition"
//                 >
//                     ↑
//                 </motion.button>
//             )}

//             <script
//                 dangerouslySetInnerHTML={{
//                     __html: `
//                         window.addEventListener('scroll', function() {
//                             const scrolled = window.scrollY > 300;
//                             document.querySelector('.fixed.bottom-6')?.style.setProperty('display', scrolled ? 'block' : 'none');
//                         });
//                     `,
//                 }}
//             />
//         </div>
//     );
// };