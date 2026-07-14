"use client"

import { Transition } from "framer-motion";
import * as motion from "framer-motion/client";
import { useEffect, useState } from "react"
import React from "react";

export default function ReorderingComp() {
    const [order, setOrder] = useState(initialOrder)

    // Эффект перемешивания
    useEffect(() => {
        const timeout = setTimeout(() => setOrder(shuffle(order)), 1000)
        return () => clearTimeout(timeout)
    }, [order])

    // Ключевые кадры для эффекта пружинки
    const bounceKeyframes = {
        scale: [0, 1.2, 0.8, 1.05, 0.95, 1.02, 0.98, 1],
        transition: {
            duration: 0.8,
            ease: "easeOut",
            times: [0, 0.2, 0.4, 0.55, 0.7, 0.8, 0.9, 1],
        }
    }

    return (
        <ul style={container}>
            {order.map(({ color, symbol }, index) => (
                <motion.li
                    key={color}
                    layout
                    transition={spring}
                    style={{ ...item, backgroundColor: color }}
                    initial={{ scale: 0 }}
                    animate={bounceKeyframes}
                    custom={index}
                >
                    <motion.span
                        style={symbolStyle}
                        initial={{ scale: 0 }}
                        animate={bounceKeyframes}
                    >
                        {symbol}
                    </motion.span>
                </motion.li>
            ))}
        </ul>
    )
}

const initialOrder = [
    { color: "#ff0088", symbol: "5" },
    { color: "#dd00ee", symbol: "X" },
    { color: "#9911ff", symbol: "5" },
    { color: "#0d63f8", symbol: "X" },
]

/**
 * ==============   Utils   ================
 */
function shuffle([...array]: typeof initialOrder) {
    return array.sort(() => Math.random() - 0.5)
}

/**
 * ==============   Styles   ================
 */

const spring: Transition = {
    type: "spring",
    damping: 20,
    stiffness: 300,
}

const container: React.CSSProperties = {
    listStyle: "none",
    padding: 0,
    margin: 0,
    position: "relative",
    display: "flex",
    flexWrap: "wrap",
    gap: 10,
    width: 300,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
}

const item: React.CSSProperties = {
    width: 100,
    height: 100,
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
}

const symbolStyle: React.CSSProperties = {
    fontFamily: "Nunito, sans-serif",
    fontSize: "32px",
    fontWeight: "bold",
    color: "white",
    textShadow: "0 2px 4px rgba(0,0,0,0.3)",
}



// "use client"

// import { Transition } from "framer-motion";
// import * as motion from "framer-motion/client";
// import { useEffect, useState } from "react"
// import React from "react";
// export default function Reordering() {
//     const [order, setOrder] = useState(initialOrder)

//     useEffect(() => {
//         const timeout = setTimeout(() => setOrder(shuffle(order)), 1000)
//         return () => clearTimeout(timeout)
//     }, [order])

//     return (
//         <ul style={container}>
//             {order.map(({ color, symbol }) => (
//                 <motion.li
//                     key={color}
//                     layout
//                     transition={spring}
//                     style={{ ...item, backgroundColor: color }}
//                 >
//                     <span style={symbolStyle}>{symbol}</span>
//                 </motion.li>
//             ))}
//         </ul>
//     )
// }

// const initialOrder = [
//     { color: "#ff0088", symbol: "5" },
//     { color: "#dd00ee", symbol: "X" },
//     { color: "#9911ff", symbol: "5" },
//     { color: "#0d63f8", symbol: "X" },
// ]

// /**
//  * ==============   Utils   ================
//  */
// function shuffle([...array]: typeof initialOrder) {
//     return array.sort(() => Math.random() - 0.5)
// }

// /**
//  * ==============   Styles   ================
//  */

// const spring: Transition = {
//     type: "spring",
//     damping: 20,
//     stiffness: 300,
// }

// const container: React.CSSProperties = {
//     listStyle: "none",
//     padding: 0,
//     margin: 0,
//     position: "relative",
//     display: "flex",
//     flexWrap: "wrap",
//     gap: 10,
//     width: 300,
//     flexDirection: "row",
//     justifyContent: "center",
//     alignItems: "center",
// }

// const item: React.CSSProperties = {
//     width: 100,
//     height: 100,
//     borderRadius: "10px",
//     display: "flex",
//     alignItems: "center",
//     justifyContent: "center",
// }

// const symbolStyle: React.CSSProperties = {
//     fontFamily: "Nunito, sans-serif",
//     fontSize: "32px",
//     fontWeight: "bold",
//     color: "white",
//     textShadow: "0 2px 4px rgba(0,0,0,0.3)",
// }