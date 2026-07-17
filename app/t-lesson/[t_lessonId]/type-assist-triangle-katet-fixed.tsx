'use client'

import React, { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { motion, useAnimationControls } from 'framer-motion'
import { ArrowDownLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SnapPointsType, useSnap } from './useSnap'

type Props = {
  threeCoordinates: number[]
  answer: string[]
  onAnswer: (answer: string) => void
}

const COLORS = ['#22c55e', '#0ea5e9', '#a855f7']
const GRAY = '#cbd5e1'
const HANDLE_SIZE = { width: 125, height: 45 }
const STROKE_WIDTH = 10

export const TypeAssistTRIANGLEgdeKatet = ({
  threeCoordinates,
  answer,
  onAnswer,
}: Props) => {
  const [x1, y1, x2, y2, x3, y3] = threeCoordinates
  const containerRef = useRef<HTMLDivElement>(null)

  // Размеры контейнера
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })

  useLayoutEffect(() => {
    const rect = containerRef.current?.getBoundingClientRect()
    if (rect) {
      setDimensions({ width: rect.width, height: rect.height })
    }
  }, [])

  // Refs для стикеров
  const ref0 = useRef<HTMLButtonElement>(null)
  const ref1 = useRef<HTMLButtonElement>(null)
  const ref2 = useRef<HTMLButtonElement>(null)
  const refs = [ref0, ref1, ref2]

  // Данные для стикеров
  const stickers = [
    { id: 0, text: 'катет' },
    { id: 1, text: 'катет' },
    { id: 2, text: 'гипотенуза' },
  ]

  // Координаты линий
  const lineCoordinates = [
    {
      x1: dimensions.width * x1,
      y1: dimensions.height * y1,
      x2: dimensions.width * x2,
      y2: dimensions.height * y2,
      mid: [
        (dimensions.width * (x1 + x2)) / 2,
        (dimensions.height * (y1 + y2)) / 2,
      ],
    },
    {
      x1: dimensions.width * x2,
      y1: dimensions.height * y2,
      x2: dimensions.width * x3,
      y2: dimensions.height * y3,
      mid: [
        (dimensions.width * (x2 + x3)) / 2,
        (dimensions.height * (y2 + y3)) / 2,
      ],
    },
    {
      x1: dimensions.width * x3,
      y1: dimensions.height * y3,
      x2: dimensions.width * x1,
      y2: dimensions.height * y1,
      mid: [
        (dimensions.width * (x3 + x1)) / 2,
        (dimensions.height * (y3 + y1)) / 2,
      ],
    },
  ]

  // Snap points
  const snapPoints: SnapPointsType = {
    type: 'absolute',
    points: lineCoordinates.map(line => ({
      x: line.mid[0],
      y: line.mid[1],
    })),
  }

  // Вызываем useSnap для каждого ref явно (никакой map!)
  const snap0 = useSnap({
    direction: 'both',
    ref: ref0,
    constraints: containerRef,
    snapPoints,
  })

  const snap1 = useSnap({
    direction: 'both',
    ref: ref1,
    constraints: containerRef,
    snapPoints,
  })

  const snap2 = useSnap({
    direction: 'both',
    ref: ref2,
    constraints: containerRef,
    snapPoints,
  })

  const snaps = [snap0, snap1, snap2]

  // Анимационные контролы - явно 3 раза
  const lineControl0 = useAnimationControls()
  const lineControl1 = useAnimationControls()
  const lineControl2 = useAnimationControls()
  const lineControls = [lineControl0, lineControl1, lineControl2]

  const buttonControl0 = useAnimationControls()
  const buttonControl1 = useAnimationControls()
  const buttonControl2 = useAnimationControls()
  const buttonControls = [buttonControl0, buttonControl1, buttonControl2]

  // Состояние
  const [assignments, setAssignments] = useState<(number | null)[]>([null, null, null])
  const [isDone, setIsDone] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)

  // Главный эффект
  useEffect(() => {
    const currentAssignments = [snap0.currentSnappointIndex, snap1.currentSnappointIndex, snap2.currentSnappointIndex]
    setAssignments(currentAssignments)

    // Все ли размещены?
    const allPlaced = currentAssignments.every(idx => idx !== null && idx >= 0)
    setIsDone(allPlaced)

    if (allPlaced) {
      // Проверяем ответ
      const sorted = stickers
        .map((sticker, idx) => ({
          text: sticker.text,
          snapIdx: currentAssignments[idx]!,
        }))
        .sort((a, b) => a.snapIdx - b.snapIdx)

      const isRight = sorted.every((item, idx) => item.text === answer[idx])
      setIsCorrect(isRight)
    }

    // Анимируем
    stickers.forEach((_, idx) => {
      const snapIdx = currentAssignments[idx]
      if (snapIdx !== null && snapIdx >= 0) {
        buttonControls[idx].start({ backgroundColor: COLORS[idx], opacity: 0.8 })
        lineControls[idx].start({ opacity: 1, stroke: COLORS[idx] })
      } else {
        buttonControls[idx].start({ backgroundColor: GRAY, opacity: 0.8 })
        lineControls[idx].start({ opacity: 0 })
      }
    })
  }, [snap0.currentSnappointIndex, snap1.currentSnappointIndex, snap2.currentSnappointIndex])

  const handleAnswer = () => {
    onAnswer(isCorrect ? 'right' : 'wrong')
  }

  return (
    <motion.div
      className="SnappingExample relative"
      ref={containerRef}
      style={{ width: '100%', height: 'auto', minHeight: '400px' }}
    >
      {/* Стикеры - явно каждый */}
      {stickers.map((sticker, idx) => (
        <motion.button
          key={sticker.id}
          ref={refs[idx]}
          className="absolute text-xl rounded font-semibold text-white"
          style={{
            width: HANDLE_SIZE.width,
            height: HANDLE_SIZE.height,
          }}
          {...snaps[idx].dragProps}
          variants={{
            initial: { backgroundColor: GRAY, opacity: 0.8 },
          }}
          initial="initial"
          animate={buttonControls[idx]}
          whileHover={{ scale: 1.2, rotate: 5 }}
          whileTap={{ scale: 0.8, rotate: -5 }}
          transition={{ type: 'spring', stiffness: 400, damping: 17 }}
        >
          {sticker.text}
          <motion.div className="absolute bottom-0 -pb-4 text-white text-2xl">
            <ArrowDownLeft size={20} />
          </motion.div>
        </motion.button>
      ))}

      <Button
        className="absolute"
        style={{ left: '50%', bottom: '20px', transform: 'translateX(-50%)' }}
        disabled={!isDone}
        onClick={handleAnswer}
        variant="primary"
      >
        ответить
      </Button>

      <motion.svg width={dimensions.width} height={dimensions.height}>
        {lineCoordinates.map((line, idx) => (
          <motion.line
            key={`gray-${idx}`}
            x1={line.x1}
            y1={line.y1}
            x2={line.x2}
            y2={line.y2}
            stroke={GRAY}
            strokeWidth={STROKE_WIDTH}
            strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ delay: idx * 0.3, duration: 1 }}
          />
        ))}

        {lineCoordinates.map((line, idx) => (
          <motion.line
            key={`color-${idx}`}
            x1={line.x1}
            y1={line.y1}
            x2={line.x2}
            y2={line.y2}
            stroke={COLORS[idx]}
            strokeWidth={STROKE_WIDTH}
            strokeLinecap="round"
            initial={{ opacity: 0 }}
            animate={lineControls[idx]}
            transition={{ duration: 0.3 }}
          />
        ))}

        {lineCoordinates.map((line, idx) => (
          <motion.circle
            key={`snap-${idx}`}
            cx={line.mid[0]}
            cy={line.mid[1]}
            r={8}
            stroke={GRAY}
            fill="none"
            strokeWidth={2}
            initial={{ opacity: 0.3 }}
            whileHover={{ opacity: 1, r: 12 }}
          />
        ))}
      </motion.svg>
    </motion.div>
  )
}
