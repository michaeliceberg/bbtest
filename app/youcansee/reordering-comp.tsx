// "use client"

// import { Transition } from "framer-motion";
// import * as motion from "framer-motion/client";
// import { useEffect, useState } from "react"

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
// // "use client"

// // import { Transition } from "framer-motion";
// // import * as motion from "framer-motion/client";
// // import Image from "next/image";
// // import { useEffect, useState } from "react"


// // const SVGList = [
// //     {
// //         bgColor: "#ff0088",
// //         imgSrc: '/RandomFire/RandomFireInf.svg'
// //     },
// //     {
// //         bgColor: "#dd00ee",
// //         imgSrc: '/RandomFire/RandomFireMath.svg'
// //     },
// //     {
// //         bgColor: "#9911ff",
// //         imgSrc: '/RandomFire/RandomFirePhys.svg'
// //     },
// //     {
// //         bgColor: "#0d63f8",
// //         imgSrc: '/RandomFire/RandomFireRus.svg'
// //     },
// // ]

// // export default function ReorderingComp() {
// //     const [order, setOrder] = useState(SVGList.map(el=>el.bgColor))

// //     useEffect(() => {
// //         const timeout = setTimeout(() => setOrder(shuffle(order)), 1000)
// //         return () => clearTimeout(timeout)
// //     }, [order])

// //     return (
// //         <ul style={container}>
// //             {order.map((backgroundColor) => (
// //                 <motion.li
// //                     key={backgroundColor}
// //                     layout
// //                     transition={spring}
// //                     // style={{ ...item, backgroundColor }}
// //                     style={{ ...item }}
// //                 >
// //                     <Image 
// //                         src={SVGList.filter(el=>el.bgColor == backgroundColor)[0].imgSrc} 
// //                         alt={backgroundColor} 
// //                         height={270} 
// //                         width={293.33} 
// //                         className='text-white fill-green-500 rounded-lg drop-shadow-md border object-cover' 
// //                     />

// //                 </motion.li>
// //             ))}
// //         </ul>
// //     )
// // }


// // // const initialOrderSVG = [
// // //     "#ff0088",
// // //     "#dd00ee",
// // //     "#9911ff",
// // //     "#0d63f8",
// // // ]



// // const initialOrder = [
// //     "#ff0088",
// //     "#dd00ee",
// //     "#9911ff",
// //     "#0d63f8",
// // ]

// // /**
// //  * ==============   Utils   ================
// //  */
// // function shuffle([...array]: string[]) {
// //     return array.sort(() => Math.random() - 0.5)
// // }

// // /**
// //  * ==============   Styles   ================
// //  */

// // const spring: Transition = {
// //     type: "spring",
// //     damping: 20,
// //     stiffness: 300,
// // }

// // const container: React.CSSProperties = {
// //     listStyle: "none",
// //     padding: 0,
// //     margin: 0,
// //     position: "relative",
// //     display: "flex",
// //     flexWrap: "wrap",
// //     gap: 10,
// //     width: 300,
// //     flexDirection: "row",
// //     justifyContent: "center",
// //     alignItems: "center",
// // }

// // const item: React.CSSProperties = {
// //     width: 100,
// //     height: 100,
// //     borderRadius: "10px",
// //     borderWidth: 4,
// //     // borderColor:
// // }




















// // "use client"

// // import { Transition } from "framer-motion";
// // import * as motion from "framer-motion/client";
// // import Image from "next/image";
// // import { useEffect, useState } from "react"


// // const SVGList = [
// //     {
// //         bgColor: "#ff0088",
// //         imgSrc: '/RandomFire/RandomFireInf.svg'
// //     },
// //     {
// //         bgColor: "#dd00ee",
// //         imgSrc: '/RandomFire/RandomFireInf.svg'
// //     },
// //     {
// //         bgColor: "#9911ff",
// //         imgSrc: '/RandomFire/RandomFireInf.svg'
// //     },
// //     {
// //         bgColor: "#0d63f8",
// //         imgSrc: '/RandomFire/RandomFireInf.svg'
// //     },
// // ]

// // export default function ReorderingComp() {
// //     const [order, setOrder] = useState(initialOrder)

// //     useEffect(() => {
// //         const timeout = setTimeout(() => setOrder(shuffle(order)), 1000)
// //         return () => clearTimeout(timeout)
// //     }, [order])

// //     return (
// //         <ul style={container}>
// //             {order.map((backgroundColor) => (
// //                 <motion.li
// //                     key={backgroundColor}
// //                     layout
// //                     transition={spring}
// //                     style={{ ...item, backgroundColor }}
// //                 >
// //                     {/* <Image src={imageSrc} alt={title} height={270} width={293.33} className='rounded-lg drop-shadow-md border object-cover' /> */}

// //                 </motion.li>
// //             ))}
// //         </ul>
// //     )
// // }


// // // const initialOrderSVG = [
// // //     "#ff0088",
// // //     "#dd00ee",
// // //     "#9911ff",
// // //     "#0d63f8",
// // // ]



// // const initialOrder = [
// //     "#ff0088",
// //     "#dd00ee",
// //     "#9911ff",
// //     "#0d63f8",
// // ]

// // /**
// //  * ==============   Utils   ================
// //  */
// // function shuffle([...array]: string[]) {
// //     return array.sort(() => Math.random() - 0.5)
// // }

// // /**
// //  * ==============   Styles   ================
// //  */

// // const spring: Transition = {
// //     type: "spring",
// //     damping: 20,
// //     stiffness: 300,
// // }

// // const container: React.CSSProperties = {
// //     listStyle: "none",
// //     padding: 0,
// //     margin: 0,
// //     position: "relative",
// //     display: "flex",
// //     flexWrap: "wrap",
// //     gap: 10,
// //     width: 300,
// //     flexDirection: "row",
// //     justifyContent: "center",
// //     alignItems: "center",
// // }

// // const item: React.CSSProperties = {
// //     width: 100,
// //     height: 100,
// //     borderRadius: "10px",
// // }
