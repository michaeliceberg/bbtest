import React, { ReactNode, useEffect, useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Lottie from "lottie-react";


import LottieDeathMeanRho from '@/public/LottieDeathMeanRho.json'


type Props = {
  someText: string,
}

export const TypeTextEffectFunc = ({
  someText,
}: Props) => {
  return (
    <div className="flex items-center justify-center text-neutral-800">
    {/* <div className="flex items-center justify-center bg-neutral-100 text-neutral-800"> */}
      <BlockInTextCard

        examples={[
            someText
        ]}

      />

    </div>
  );
};

const BlockInTextCard = ({

  examples,
}: {

  examples: string[];
}) => {
  return (
    <div className="w-full max-w-xl">

        <Typewrite examples={examples} />

    </div>
  );
};

const LETTER_DELAY = 0.025;
const BOX_FADE_DURATION = 0.125;

const FADE_DELAY = 500;
const MAIN_FADE_DURATION = 0.25;

const SWAP_DELAY_IN_MS = 5500;

const Typewrite = ({ examples }: { examples: string[] }) => {
  const [exampleIndex, setExampleIndex] = useState(0);

  // useEffect(() => {
  //   const intervalId = setInterval(() => {
  //     setExampleIndex((pv) => (pv + 1) % examples.length);
  //   }, SWAP_DELAY_IN_MS);

  //   return () => clearInterval(intervalId);
  // }, []);

  return (
    <div className="text-xs font-light">
      {/* <span className="inline-block size-2 bg-neutral-950" /> */}
      <span className="ml-3">



        <div className=" mt-4 py-2 px-4 font-semibold text-sm lg:text-base pb-1 pt-1">
            
            {examples[exampleIndex].split("").map((l, i) => (
              
                <motion.span
                initial={{
                    opacity: 1,
                }}
                animate={{
                    opacity: 0,
                }}
                transition={{
                    delay: FADE_DELAY,
                    duration: MAIN_FADE_DURATION,
                    ease: "easeInOut",
                }}
                key={`${exampleIndex}-${i}`}
                className="relative"
                >
                <motion.span
                    initial={{
                    opacity: 0,
                    }}
                    animate={{
                    opacity: 1,
                    }}
                    transition={{
                    delay: i * LETTER_DELAY,
                    duration: 0,
                    }}
                >
                    {l}
                </motion.span>
                <motion.span
                    initial={{
                    opacity: 0,
                    }}
                    animate={{
                    opacity: [0, 1, 0],
                    }}
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



        </div>
      </span>


    </div>
  );
};