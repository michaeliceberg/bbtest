// import React, { ReactNode, useEffect, useState } from "react";
// import { motion } from "framer-motion";
// import Image from "next/image";
// import Lottie from "lottie-react";


// import LottieDeathMeanRho from '@/public/LottieDeathMeanRho.json'



// export const TypeTextEffect = () => {
//   return (
//     <div className="flex items-center justify-center text-neutral-800">
//     {/* <div className="flex items-center justify-center bg-neutral-100 text-neutral-800"> */}
//       <BlockInTextCard

//         examples={[
//             "Молодец! У тебя получается Теорема Виета!",
//             "Хмм..",
//             "Попробуй что-нибудь ещё..",
//             "$ \\huge  x \\cdot \\frac{1}{7}=\\frac{c}{b}   \\quad b=? $",
//         ]}

//       />

//     </div>
//   );
// };

// const BlockInTextCard = ({

//   examples,
// }: {

//   examples: string[];
// }) => {
//   return (
//     <div className="w-full max-w-xl">

//         <Typewrite examples={examples} />

//     </div>
//   );
// };

// const LETTER_DELAY = 0.025;
// const BOX_FADE_DURATION = 0.125;

// const FADE_DELAY = 5;
// const MAIN_FADE_DURATION = 0.25;

// const SWAP_DELAY_IN_MS = 5500;

// const Typewrite = ({ examples }: { examples: string[] }) => {
//   const [exampleIndex, setExampleIndex] = useState(0);

//   useEffect(() => {
//     const intervalId = setInterval(() => {
//       setExampleIndex((pv) => (pv + 1) % examples.length);
//     }, SWAP_DELAY_IN_MS);

//     return () => clearInterval(intervalId);
//   }, []);

//   return (
//     <div className="text-xs font-light">
//       {/* <span className="inline-block size-2 bg-neutral-950" /> */}
//       <span className="ml-3">


//         <Lottie 
//             className="size-36" 
//             animationData={LottieDeathMeanRho}
//             // loop={false}
//         /> 

//         {/* <Image 
//             src='/mascot.svg' 
//             height={40} 
//             width={40} 
//             alt='Mascot' 
//         /> */}

//         {/* BB:{" "} */}


//         <div className="relative mt-4 py-2 px-4 border-2 rounded-xl font-semibold text-center text-sm lg:text-base w-full pb-1 pt-1">
            
//             {examples[exampleIndex].split("").map((l, i) => (
              
//                 <motion.span
//                 initial={{
//                     opacity: 1,
//                 }}
//                 animate={{
//                     opacity: 0,
//                 }}
//                 transition={{
//                     delay: FADE_DELAY,
//                     duration: MAIN_FADE_DURATION,
//                     ease: "easeInOut",
//                 }}
//                 key={`${exampleIndex}-${i}`}
//                 className="relative"
//                 >
//                 <motion.span
//                     initial={{
//                     opacity: 0,
//                     }}
//                     animate={{
//                     opacity: 1,
//                     }}
//                     transition={{
//                     delay: i * LETTER_DELAY,
//                     duration: 0,
//                     }}
//                 >
//                     {l}
//                 </motion.span>
//                 <motion.span
//                     initial={{
//                     opacity: 0,
//                     }}
//                     animate={{
//                     opacity: [0, 1, 0],
//                     }}
//                     transition={{
//                     delay: i * LETTER_DELAY,
//                     times: [0, 0.1, 1],
//                     duration: BOX_FADE_DURATION,
//                     ease: "easeInOut",
//                     }}
//                     className="absolute bottom-[3px] left-[1px] right-0 top-[3px] bg-neutral-950"
//                 />
//                 </motion.span>
//             ))}

//             <div 
//               className="absolute left-1/2 -mt-1 top-0 w-0 h-0 border-x-8 border-x-transparent border-t-8 transform -translate-y-1/2 rotate-180"
//             />

//         </div>
//       </span>


//     </div>
//   );
// };


import React, { ReactNode, useEffect, useState } from "react";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";

// Динамический импорт Lottie с отключением SSR
const Lottie = dynamic(() => import("lottie-react"), { 
  ssr: false,
  loading: () => <div className="size-36 bg-gray-200 animate-pulse rounded-full" />
});

// Импортируем анимацию через dynamic, чтобы избежать проблем с парсингом JSON на сервере
import LottieDeathMeanRho from '@/public/LottieDeathMeanRho.json'

export const TypeTextEffect = () => {
  return (
    <div className="flex items-center justify-center text-neutral-800">
      <BlockInTextCard
        examples={[
          "Молодец! У тебя получается Теорема Виета!",
          "Хмм..",
          "Попробуй что-нибудь ещё..",
          "$ \\huge  x \\cdot \\frac{1}{7}=\\frac{c}{b}   \\quad b=? $",
        ]}
      />
    </div>
  );
};

const BlockInTextCard = ({ examples }: { examples: string[] }) => {
  return (
    <div className="w-full max-w-xl">
      <Typewrite examples={examples} />
    </div>
  );
};

const LETTER_DELAY = 0.025;
const BOX_FADE_DURATION = 0.125;
const FADE_DELAY = 5;
const MAIN_FADE_DURATION = 0.25;
const SWAP_DELAY_IN_MS = 5500;

const Typewrite = ({ examples }: { examples: string[] }) => {
  const [exampleIndex, setExampleIndex] = useState(0);
  const [isClient, setIsClient] = useState(false);

  // Фикс для SSR: проверяем, что мы на клиенте
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setExampleIndex((pv) => (pv + 1) % examples.length);
    }, SWAP_DELAY_IN_MS);

    return () => clearInterval(intervalId);
  }, [examples.length]); // ✅ Добавили зависимость

  // Показываем заглушку на сервере
  if (!isClient) {
    return (
      <div className="text-xs font-light">
        <span className="ml-3">
          <div className="size-36 bg-gray-200 animate-pulse rounded-full" />
          <div className="relative mt-4 py-2 px-4 border-2 rounded-xl font-semibold text-center text-sm lg:text-base w-full pb-1 pt-1">
            {examples[0]}
          </div>
        </span>
      </div>
    );
  }

  return (
    <div className="text-xs font-light">
      <span className="ml-3">
        <Lottie 
          className="size-36" 
          animationData={LottieDeathMeanRho}
          loop={false}
        />
        
        <div className="relative mt-4 py-2 px-4 border-2 rounded-xl font-semibold text-center text-sm lg:text-base w-full pb-1 pt-1">
          {examples[exampleIndex].split("").map((l, i) => (
            <motion.span
              initial={{ opacity: 1 }}
              animate={{ opacity: 0 }}
              transition={{
                delay: FADE_DELAY,
                duration: MAIN_FADE_DURATION,
                ease: "easeInOut",
              }}
              key={`${exampleIndex}-${i}`}
              className="relative"
            >
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{
                  delay: i * LETTER_DELAY,
                  duration: 0,
                }}
              >
                {l}
              </motion.span>
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 1, 0] }}
                transition={{
                  delay: i * LETTER_DELAY,
                  times: [0, 0.1, 1],
                  duration: BOX_FADE_DURATION,
                  ease: "easeInOut",
                }}
                className="absolute bottom-[3px] left-[1px] right-0 top-[3px] bg-neutral-950"
              />
            </motion.span>
          ))}
          <div className="absolute left-1/2 -mt-1 top-0 w-0 h-0 border-x-8 border-x-transparent border-t-8 transform -translate-y-1/2 rotate-180" />
        </div>
      </span>
    </div>
  );
};