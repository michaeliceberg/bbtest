
import React, { useRef } from "react";
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useSpring,
} from "framer-motion";
import { FiMousePointer } from "react-icons/fi";
import { ToyBrick } from "lucide-react";
import { BicepsFlexed } from 'lucide-react';
import { LuBicepsFlexed } from "react-icons/lu";

type Props= {
    data: number[],
}

const Example = ({
    data,
}: Props) => {
  return (
    // <div className="grid w-full place-content-center bg-gradient-to-br from-indigo-500 to-violet-500 px-4 py-12 text-slate-900">
    // <div className="grid w-full place-content-center  text-slate-900">
    <div className="grid w-full place-content-center ">
      <TiltCard data={data} />
    </div>
  );
};

const ROTATION_RANGE = 32.5;
const HALF_ROTATION_RANGE = 32.5 / 2;



const TiltCard = ({
    data,
}: Props) => {
  const ref = useRef<HTMLDivElement | null>(null);

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const xSpring = useSpring(x);
  const ySpring = useSpring(y);

  const transform = useMotionTemplate`rotateX(${xSpring}deg) rotateY(${ySpring}deg)`;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    if (!ref.current) return [0, 0];

    const rect = ref.current.getBoundingClientRect();

    const width = rect.width;
    const height = rect.height;

    const mouseX = (e.clientX - rect.left) * ROTATION_RANGE;
    const mouseY = (e.clientY - rect.top) * ROTATION_RANGE;

    const rX = (mouseY / height - HALF_ROTATION_RANGE) * -1;
    const rY = mouseX / width - HALF_ROTATION_RANGE;

    x.set(rX);
    y.set(rY);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transformStyle: "preserve-3d",
        transform,
      }}
    //   className="relative h-60 w-72 rounded-xl bg-gradient-to-br from-indigo-300 to-violet-300"
      className="relative h-60 w-64 rounded-xl bg-gradient-to-br from-red-300 to-green-300"
    >
      <div
        style={{
          transform: "translateZ(75px)",
          transformStyle: "preserve-3d",
        }}
        className="absolute inset-4 grid place-content-center rounded-xl bg-white shadow-lg"
      >
        {/* <FiMousePointer
          style={{
            transform: "translateZ(75px)",
          }}
          className="mx-auto text-4xl"
        /> */}

        {/* <BicepsFlexed /> */}
        <LuBicepsFlexed
                  style={{
                    transform: "translateZ(75px)",
                  }}
                  className="mx-auto text-4xl"
        />


        <p
          style={{
            transform: "translateZ(50px)",
          }}
          className="text-center text-2xl font-bold"
        >
          
          


          
          <div className="col-span-3 mt-6 mb-4">

                        <div className="grid grid-cols-5 gap-x-5">
                            {data.map((el, index) => 
                                <ToyBrick 
                                    key={index*1659}
                                    className= {
                                        el > 0.9 
                                        ? `h-6 w-6 fill-yellow-300 stroke-neutral-600`
                                        
                                        : el > 0.6
                                        ? `h-6 w-6 fill-green-400 stroke-neutral-600`
                                        
                                        : el > 0 
                                        ? `h-6 w-6 fill-red-400 stroke-neutral-600`

                                        : `h-6 w-6 fill-white stroke-neutral-400 opacity-${80}`
                                        }
                                />
                            )}
                        </div>
                            
                    </div>
          мои скилы
        
        
        
        
        
        </p>
      </div>
    </motion.div>
  );
};

export default Example;