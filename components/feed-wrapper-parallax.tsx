'use client'

import { useMotionTemplate, useScroll, useTransform, motion } from "framer-motion";
import { useRef } from "react";


type Props = {
	children: React.ReactNode
}
export const FeedWrapper = ({ children }: Props) => {

	// const SECTION_HEIGHT = 1500;

	return (


		<div
			// style={{ height: `calc(${SECTION_HEIGHT}px + 100vh)` }}
			className="relative w-full z-0"
			// className="relative w-full z-0"
		>

			{children}
			<ParallaxImages />


		{/* <div className="absolute bottom-0 left-0 right-0 h-screen bg-gradient-to-b from-zinc-950/0 to-zinc-950" /> */}
		</div>



	)
}





const ParallaxImages = () => {
	return (

		<div>

			<div className="mx-auto max-w-5xl px-4 pt-[200px]">
				<ParallaxImg
				
				src="RatingSvg/scary_with_arms.svg"
				alt="And example of a space launch"
				start={200}
				end={200}
				className="w-1/3"
				/>
				<ParallaxImg
				src='RatingSvg/scary_with_arms.svg'
				alt="An example of a space launch"
				start={200}
				end={-250}
				className="mx-auto w-2/3"
				/>
				<ParallaxImg
				src="RatingSvg/rating-bee.svg"
				alt="Orbiting satellite"
				start={-200}
				end={100}
				className="ml-auto w-1/3"
				/>
				<ParallaxImg
				src="RatingSvg/rating-butterfly.svg"
				alt="Orbiting satellite"
				start={0}
				end={-500}
				className="ml-24 w-5/12"
				/>
			</div>


			<div className="mx-auto max-w-5xl px-4 pt-[1200px]">
				<ParallaxImg
				src="RatingSvg/rating-fly.svg"
				alt="And example of a space launch"
				start={200}
				end={200}
				className="w-1/3"
				/>
				<ParallaxImg
				src="RatingSvg/rating-han.svg"
				alt="An example of a space launch"
				start={200}
				end={-250}
				className="mx-auto w-2/3"
				/>
				<ParallaxImg
				src="RatingSvg/rating-bee.svg"
				alt="Orbiting satellite"
				start={-200}
				end={200}
				className="ml-auto w-1/3"
				/>
				<ParallaxImg
				src="RatingSvg/rating-ant.svg"
				alt="Orbiting satellite"
				start={0}
				end={-500}
				className="ml-24 w-5/12"
				/>
			</div>

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
	const ref = useRef(null);
  
	const { scrollYProgress } = useScroll({
	  target: ref,
	  // @ts-ignore
	  offset: [`${start}px end`, `end ${end * -1}px`],
	});
  
	const opacity = useTransform(scrollYProgress, [0.75, 0.8], [0.8, 0]);
	const scale = useTransform(scrollYProgress, [0.75, 1], [1, 0.85]);
  
	const y = useTransform(scrollYProgress, [0, 1], [start, end]);
	const transform = useMotionTemplate`translateY(${y}px) scale(${scale})`;
  
	return (
	  <motion.img
	  
		src={src}
		alt={alt}
		className={className}
		ref={ref}
		style={{ transform, opacity }}
	  />
	);
  };