'use client'

import { animate, motion, useMotionValue, useTransform } from "framer-motion";
import { useEffect } from "react";


type Props = {
    percent: number
}

export default function HTMLContent({
    percent
}:Props) {

    const count = useMotionValue(0)
    const rounded = useTransform(() => Math.round(count.get()))

    useEffect(() => {
        const controls = animate(count, percent, { duration: 5 })
        return () => controls.stop()
    }, [count, percent])

    return (
        // <pre style={{ fontSize: 64, color: "#61afef" }}>
        //     0
        // </pre>

    <motion.p>{rounded}</motion.p>
    
)}



