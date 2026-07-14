"use client"

import type React from "react"
// import { motion } from "framer-motion";

import { AnimatePresence, motion, usePresenceData, wrap } from "framer-motion"
import { forwardRef, type SVGProps, useState } from "react"

export default function UsePresenceDataComp() {
  const items = [1, 2, 3, 4, 5, 6]
  const [selectedItem, setSelectedItem] = useState(items[0])
  const [direction, setDirection] = useState<1 | -1>(1)

  function setSlide(newDirection: 1 | -1) {
    const nextItem = wrap(1, items.length, selectedItem + newDirection)
    setSelectedItem(nextItem)
    setDirection(newDirection)
  }

  const colorList = [
    "#22c55e",  
    "#0ea5e9",
    "#a855f7", 
    "#22c55e",  
    "#0ea5e9",
    "#a855f7", 
  ]

  // const currentColor = `var(--hue-${selectedItem})`
  const currentColor = colorList[selectedItem]
  // const currentColor = "#A2A2A2"
  const nextItem = wrap(1, items.length, selectedItem + 1)
  // const nextColor = `var(--hue-${nextItem})`
  const nextColor = colorList[nextItem]
  // const nextColor = "#B5B5B5"


  
  

  return (
    <div style={container}>
      <motion.button
        initial={false}
        animate={{ backgroundColor: currentColor }}
        aria-label="Previous"
        style={button}
        onClick={() => setSlide(-1)}
        whileFocus={{ outline: `2px solid ${currentColor}` }}
        whileTap={{ scale: 0.9 }}
      >
        <ArrowLeft />
      </motion.button>

      <div style={slidesContainer}>
        <AnimatePresence custom={direction} initial={false} mode="popLayout">
          <CurrentSlide key={`current-${selectedItem}`} color={currentColor} />
        </AnimatePresence>

        <AnimatePresence custom={direction} initial={false} mode="popLayout">
          <NextSlide key={`next-${nextItem}`} color={nextColor} />
        </AnimatePresence>
      </div>

      <motion.button
        initial={false}
        animate={{ backgroundColor: currentColor }}
        aria-label="Next"
        style={button}
        onClick={() => setSlide(1)}
        whileFocus={{ outline: `2px solid ${currentColor}` }}
        whileTap={{ scale: 0.9 }}
      >
        <ArrowRight />
      </motion.button>
    </div>
  )
}

const CurrentSlide = forwardRef(function CurrentSlide({ color }: { color: string }, ref: React.Ref<HTMLDivElement>) {
  const direction = usePresenceData()
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: direction * 50, scale: 0.9 }}
      animate={{
        opacity: 1,
        x: 0,
        scale: 1,
        transition: {
          delay: 0.2,
          type: "spring",
          visualDuration: 0.3,
          bounce: 0.4,
        },
      }}
      exit={{ opacity: 0, x: direction * -50, scale: 0.9 }}
      style={{ ...currentSlideBox, backgroundColor: color }}
    />
  )
})

const NextSlide = forwardRef(function NextSlide({ color }: { color: string }, ref: React.Ref<HTMLDivElement>) {
  const direction = usePresenceData()
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: direction * 30, scale: 0.7 }}
      animate={{
        opacity: 0.6,
        x: 0,
        scale: 0.8,
        transition: {
          delay: 0.3,
          type: "spring",
          visualDuration: 0.3,
          bounce: 0.4,
        },
      }}
      exit={{ opacity: 0, x: direction * -30, scale: 0.7 }}
      style={{ ...nextSlideBox, backgroundColor: color }}
    />
  )
})

/**
 * ==============   Icons   ================
 */
const iconsProps: SVGProps<SVGSVGElement> = {
  xmlns: "http://www.w3.org/2000/svg",
  width: "24",
  height: "24",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: "2",
  strokeLinecap: "round",
  strokeLinejoin: "round",
}

function ArrowLeft() {
  return (
    <svg {...iconsProps}>
      <path d="m12 19-7-7 7-7" />
      <path d="M19 12H5" />
    </svg>
  )
}

function ArrowRight() {
  return (
    <svg {...iconsProps}>
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  )
}

/**
 * ==============   Styles   ================
 */

const container: React.CSSProperties = {
  display: "flex",
  position: "relative",
  justifyContent: "center",
  alignItems: "center",
  gap: 10,
}

const slidesContainer: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 20,
  position: "relative",
}

const currentSlideBox: React.CSSProperties = {
  width: 150,
  height: 150,
  backgroundColor: "var(--hue-5)",
  borderRadius: "10px",
  position: "relative",
  zIndex: 2,
}

const nextSlideBox: React.CSSProperties = {
  width: 150,
  height: 150,
  backgroundColor: "var(--hue-5)",
  borderRadius: "10px",
  position: "relative",
  zIndex: 1,
}

const button: React.CSSProperties = {
  backgroundColor: "var(--hue-5)",
  width: 40,
  height: 40,
  borderRadius: "50%",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  position: "relative",
  zIndex: 1,
  outlineOffset: 2,
}
