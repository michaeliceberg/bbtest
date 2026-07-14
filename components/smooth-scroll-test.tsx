import {FiArrowRight} from "react-icons/fi";
import { SiSpacex } from "react-icons/si";
import { motion, useMotionTemplate, useMotionValueEvent, useScroll, useTransform } from 'framer-motion'
import { useRef } from "react";


export const SmoothScrollLenis = () => {
    return ( 
        <div className="bg-zinc-950">
            <Nav />
            <Hero />
            <div className="h-screen" />
        </div>
    )
}

const Nav = () => {
    return (
        <nav className="fixed left-0 right-0 top-0 z-50 flex items-center justify-between px-6 py-3 text-white">
            <SiSpacex className="3xl" />
            <button
                onClick={()=>{
                    document.getElementById("launch-schedule")?.scrollIntoView({
                        behavior: "smooth"
                    })
                }}
                className="flex items-center gap-1 text-xs text-zinc-400"
            >
                Launch schedule <FiArrowRight />
            </button>
        </nav>
    )
}


const SECTION_HEIGHT = 1500

const Hero = () => {
return (
    <div  className="relative w-full"
        style={{ height: `calc(${SECTION_HEIGHT}px + 100vh)`}}
    >

    
        <CenterImage />
        <ParallaxImages />

        <div 
            className="absolute bottom-0 left-0 right-0 h-96 bg-gradient-to-b from-zinc-950/0 to-zinc-950"
        />
    </div>
)}

const CenterImage = () => {

    const { scrollY } = useScroll()
    const clip1 = useTransform(scrollY, [0, SECTION_HEIGHT], [25, 0])
    const clip2 = useTransform(scrollY, [0, SECTION_HEIGHT], [75, 100])

    const clipPath = useMotionTemplate`polygon(${clip1}% ${clip1}%, ${clip2}% ${clip1}%, ${clip2}% ${clip2}%, ${clip1}% ${clip2}%`

    const opacity = useTransform(scrollY, [SECTION_HEIGHT, SECTION_HEIGHT+500], [1, 0])
    const backgroundSize = useTransform(scrollY, [0, SECTION_HEIGHT+500], ["170%", "100%"])

    return (
        <motion.div 
            className="sticky top-0 h-screen w-full"
            style={{
                opacity,
                backgroundSize,
                clipPath,
                backgroundImage: "url(https://media.dodostatic.net/image/r:584x584/11ee7d612a1c13cbbfcc286c332d7762.avif)",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
            }}
        />
    )
}

// const ParallaxImages = () => {
//     return (
//         <div className="mx-auto max-w-5xl px-4 pt-[200px] relative z-10">
//             <ParallaxImg 
//                 src="https://media.dodostatic.net/image/r:584x584/11ee7d61706d472f9a5d71eb94149304.avif"
//                 alt="image1"
//                 start={-200}
//                 end={200}
//                 className="w-1/3"
//             />   

//             {/* <ParallaxImg 
//                 src="https://media.dodostatic.net/image/r:584x584/11ee7d61706d472f9a5d71eb94149304.avif"
//                 alt="image2"
//                 start={200}
//                 end={-250}
//                 className="w-2/3"
//             />    */}
//         </div>
//     )
// }


const ParallaxImages = () => {
    return (
      <div className="mx-auto max-w-5xl px-4 pt-[200px]">
        <ParallaxImg
          src="https://images.unsplash.com/photo-1484600899469-230e8d1d59c0?q=80&w=2670&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
          alt="And example of a space launch"
          start={-200}
          end={200}
          className="w-1/3"
        />
        <ParallaxImg
          src="https://images.unsplash.com/photo-1446776709462-d6b525c57bd3?q=80&w=2670&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
          alt="An example of a space launch"
          start={200}
          end={-250}
          className="mx-auto w-2/3"
        />
        <ParallaxImg
          src="https://images.unsplash.com/photo-1541185933-ef5d8ed016c2?q=80&w=2370&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
          alt="Orbiting satellite"
          start={-200}
          end={200}
          className="ml-auto w-1/3"
        />
        <ParallaxImg
          src="https://images.unsplash.com/photo-1494022299300-899b96e49893?q=80&w=2670&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
          alt="Orbiting satellite"
          start={0}
          end={-500}
          className="ml-24 w-5/12"
        />
      </div>
    );
  };
  
const ParallaxImg = ({
    className,
    alt,
    src,
    start,
    end,
}: {
    className?: string;
    alt: string;
    src: string;
    start: number;
    end: number;
}) => {

    // const ref = useRef(null)

    // const { scrollYProgress } = useScroll({
    //     target: ref,
    //     // offset: ['start end', 'end start'],
    // })

    // useMotionValueEvent(scrollYProgress, 'change', (latest) => console.log(latest))

    // const opacity = useTransform(scrollYProgress, [0.75, 1], [1,0])

    const ref = useRef(null);

    const { scrollYProgress } = useScroll({
      target: ref,
      // @ts-ignore
      offset: [`${start}px end`, `end ${end * -1}px`],
    });
  
    useMotionValueEvent(scrollYProgress, 'change', (latest) => console.log(latest))

    
    const opacity = useTransform(scrollYProgress, [0.75, 1], [1, 0]);
    const scale = useTransform(scrollYProgress, [0.75, 1], [1, 0.85]);
  
    const y = useTransform(scrollYProgress, [0, 1], [start, end]);
    const transform = useMotionTemplate`translateY(${y}px) scale(${scale})`;










    return <motion.img 
            style={{opacity}}
            src={src} 
            alt={alt} 
            className={className} 
        />
}