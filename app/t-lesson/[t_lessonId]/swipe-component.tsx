"use client"
// import { motion } from "framer-motion";
import { motion, useMotionValue, useMotionValueEvent, useTransform } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { QuestionType } from "./page";
// import {react} from react


type Props = {
    onAnswer: (answer: string) => void
    question: QuestionType
    setLrAnswer: (lrAnswer: number) => void
}

// export default function UseTransform() {
export default function UseTransform(
    {
     onAnswer,
     question,
     setLrAnswer,
    } : Props
) {
    const x = useMotionValue(0)
    const xInput = [-100, 0, 100]
    // const background = useTransform(x, xInput, [
    //     "linear-gradient(180deg, #ff008c 0%, rgb(211, 9, 225) 100%)",
    //     "linear-gradient(180deg, #7700ff 0%, rgb(68, 0, 255) 100%)",
    //     "linear-gradient(180deg, rgb(230, 255, 0) 0%, rgb(3, 209, 0) 100%)",
    // ])
    // const color = useTransform(x, xInput, [
    //     "rgb(211, 9, 225)",
    //     "rgb(68, 0, 255)",
    //     "rgb(3, 209, 0)",
    // ])


const background = useTransform(x, xInput, [
    "linear-gradient(180deg, #f97316 0%, #ef4444 100%)", // bg-rose-500
    "linear-gradient(180deg, #0ea5e9 0%, #3b82f6 100%)", // bg-sky-300
    "linear-gradient(180deg, #22c55e 0%, #16a34a 100%)", // bg-green-500
])

const color = useTransform(x, xInput, [
    "#ef4444", // rose-500
    "#0ea5e9", // sky-300
    "#22c55e", // green-500
])


    const tickPath = useTransform(x, [10, 100], [0, 1])
    const crossPathA = useTransform(x, [-10, -55], [0, 1])
    const crossPathB = useTransform(x, [-50, -100], [0, 1])

    // const answeredRef = useRef(false)

    const [isAnswered, setIsAnswered] = useState(false)

    useEffect(() => {
        setIsAnswered(false)
        setLrAnswer(0)
    }, [question, setLrAnswer]) // или другой триггер

    useMotionValueEvent(x, "change", (latest) => 
    {
        // console.log('.... ' && isAnswered)

        if (isAnswered) return 

        if (latest >= 100) {
            console.log('Right')
            // answeredRef.current = true
            setIsAnswered(true)
            if (question.correctAnswer == question.options[0]) {
                onAnswer('right')
            } else {
                onAnswer('wrong')
            }
        } else if (latest <= -100) {
            console.log('Left')
            // answeredRef.current = true
            setIsAnswered(true)
            if (question.correctAnswer != question.options[0]) {
                onAnswer('right')
            } else {
                onAnswer('wrong')
            }
        }
    })


    return (
        <div>
            <motion.div style={{ ...container, background }}>
                <motion.div
                    className="icon-container"
                    style={{ ...box, x }}
                    drag="x"
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={0.5}
                >
                    <svg className="progress-icon" viewBox="0 0 50 50">
                        <motion.path
                            fill="none"
                            strokeWidth="2"
                            stroke={color}
                            d="M 0, 20 a 20, 20 0 1,0 40,0 a 20, 20 0 1,0 -40,0"
                            style={{
                                x: 5,
                                y: 5,
                            }}
                        />
                        <motion.path
                            id="tick"
                            fill="none"
                            strokeWidth="2"
                            stroke={color}
                            d="M14,26 L 22,33 L 35,16"
                            strokeDasharray="0 1"
                            style={{ pathLength: tickPath }}
                        />
                        <motion.path
                            fill="none"
                            strokeWidth="2"
                            stroke={color}
                            d="M17,17 L33,33"
                            strokeDasharray="0 1"
                            style={{ pathLength: crossPathA }}
                        />
                        <motion.path
                            id="cross"
                            fill="none"
                            strokeWidth="2"
                            stroke={color}
                            d="M33,17 L17,33"
                            strokeDasharray="0 1"
                            style={{ pathLength: crossPathB }}
                        />
                    </svg>
                </motion.div>
            </motion.div>
        </div>
    )
}

/**
 * ==============   Styles   ================
 */

const box = {
    //140x140
    width: 100,
    height: 100,
    backgroundColor: "#f5f5f5",
    borderRadius: 20,
    padding: 20,
}

const container: React.CSSProperties = {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    flex: 1,
    width: 500,
    //500x300
    height: 200,
    maxWidth: "100%",
    borderRadius: 20,
}
