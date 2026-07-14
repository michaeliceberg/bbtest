
'use client'

import { Variants, motion } from "framer-motion";


type Props = {
    someText: string,
}

export default function ScrollTriggered({
    someText
}: Props) {
    const i = 1
    return (
        <div style={container}>
            
            {/* {food.map(([emoji, hueA, hueB], i) => ( */}
            {/* <Card i={i} emoji={emoji} hueA={hueA} hueB={hueB} key={emoji} /> */}
            <Card i={i} emoji={someText} hueA={340} hueB={10} key={someText} />
        </div>
    )
}

interface CardProps {
    emoji: string
    hueA: number
    hueB: number
    i: number
}

function Card({ emoji, hueA, hueB, i }: CardProps) {
    const background = `linear-gradient(306deg, ${hue(hueA)}, ${hue(hueB)})`

    return (
        <motion.div
            className={`card-container-${i}`}
            style={cardContainer}
            initial="offscreen"
            whileInView="onscreen"
            viewport={{ amount: 0.8 }}
        >
            <div style={{ ...splash, background }} />
            <motion.div style={card} variants={cardVariants} className="card">
                {emoji}
            </motion.div>
        </motion.div>
    )
}

const cardVariants: Variants = {
    offscreen: {
        y: 300,
    },
    onscreen: {
        y: 50,
        rotate: -10,
        transition: {
            type: "spring",
            bounce: 0.4,
            duration: 0.8,
        },
    },
}

const hue = (h: number) => `hsl(${h}, 100%, 50%)`

/**
 * ==============   Styles   ================
 */

const container: React.CSSProperties = {
    margin: "100px auto",
    // margin: "30px auto",
    // maxWidth: 500,
    maxWidth: 150,
    // paddingBottom: 100,
    paddingBottom: 20,
    width: "100%",
    // width: "60%",
}

const cardContainer: React.CSSProperties = {
    overflow: "hidden",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    // paddingTop: 20,
    // paddingTop: -20,
    // marginBottom: -120,
    // marginBottom: -10,
}

const splash: React.CSSProperties = {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    clipPath: `path("M 0 303.5 C 0 292.454 8.995 285.101 20 283.5 L 460 219.5 C 470.085 218.033 480 228.454 480 239.5 L 500 430 C 500 441.046 491.046 450 480 450 L 20 450 C 8.954 450 0 441.046 0 430 Z")`,
    // clipPath: `path("M 0 303.5 C 0 292.454 8.995 285.101 20 441.046 491.046 450 480 450 L 20 450 C 8.954 450 0 441.046 0 430 Z")`,
}

const card: React.CSSProperties = {
    // fontSize: 164,
    fontSize: 20,
    // width: 300,
    width: 300,
    // height: 430,
    height: 230,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 20,
    background: "#f5f5f5",
    boxShadow:
        "0 0 1px hsl(0deg 0% 0% / 0.075), 0 0 2px hsl(0deg 0% 0% / 0.075), 0 0 4px hsl(0deg 0% 0% / 0.075), 0 0 8px hsl(0deg 0% 0% / 0.075), 0 0 16px hsl(0deg 0% 0% / 0.075)",
        // transformOrigin: "10% 60%",
        transformOrigin: "5% 20%",
}

/**
 * ==============   Data   ================
 */

const food: [string, number, number][] = [
    ["подбери 2 числа", 340, 10],
    // ["🍅", 340, 10],
    // ["🍊", 20, 40],
    // ["🍋", 60, 90],
    // ["🍐", 80, 120],
    // ["🍏", 100, 140],
    // ["🫐", 205, 245],
    // ["🍆", 260, 290],
    // ["🍇", 290, 320],
]
