'use client'

import React, { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { motion, useAnimationControls, MotionProps } from 'framer-motion'
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

export const TypeAssistTRIANGLEgdeKatetV2 = ({
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

  // Данные для стикеров
  const stickers = [
    { id: 0, text: 'катет', ref: useRef<HTMLButtonElement>(null) },
    { id: 1, text: 'катет', ref: useRef<HTMLButtonElement>(null) },
    { id: 2, text: 'гипотенуза', ref: useRef<HTMLButtonElement>(null) },
  ]

  // Координаты линий (sides) треугольника
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

  // Snap points = середины линий
  const snapPoints: SnapPointsType = {
    type: 'absolute',
    points: lineCoordinates.map(line => ({
      x: line.mid[0],
      y: line.mid[1],
    })),
  }

  // useSnap для каждого стикера
  const useSnapResults = stickers.map(sticker =>
    useSnap({
      direction: 'both',
      ref: sticker.ref,
      constraints: containerRef,
      snapPoints,
    })
  )

  // Состояние: какой стикер в каком snap point
  const [assignments, setAssignments] = useState<(number | null)[]>([null, null, null])
  const [isDone, setIsDone] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)

  // Анимационные контролы для каждой линии и кнопки
  const lineControls = stickers.map(() => useAnimationControls())
  const buttonControls = stickers.map(() => useAnimationControls())

  // Обновляем состояние когда стикер перемещается
  useEffect(() => {
    const newAssignments = useSnapResults.map(result => result.currentSnappointIndex)
    setAssignments(newAssignments)

    // Проверяем, все ли стикеры размещены
    const allPlaced = newAssignments.every(idx => idx !== null && idx >= 0)
    setIsDone(allPlaced)

    if (allPlaced) {
      // Проверяем правильность ответа
      const sortedAssignments = stickers
        .map((sticker, idx) => ({ id: sticker.id, snapIdx: newAssignments[idx] }))
        .sort((a, b) => (a.snapIdx ?? -1) - (b.snapIdx ?? -1))

      const isRight = sortedAssignments.every(
        (item, idx) => stickers[item.id].text === answer[idx]
      )
      setIsCorrect(isRight)
    }

    // Перекрашиваем линии и кнопки
    stickers.forEach((sticker, idx) => {
      const snapIdx = newAssignments[idx]
      if (snapIdx !== null && snapIdx >= 0) {
        buttonControls[idx].start({ backgroundColor: COLORS[idx], opacity: 0.8 })
        lineControls[idx].start({ opacity: 1, stroke: COLORS[idx] })
      } else {
        buttonControls[idx].start({ backgroundColor: GRAY, opacity: 0.8 })
        lineControls[idx].start({ opacity: 0 })
      }
    })
  }, useSnapResults.map(r => r.currentSnappointIndex))

  const handleAnswer = () => {
    onAnswer(isCorrect ? 'right' : 'wrong')
  }

  return (
    <motion.div
      className="SnappingExample relative"
      ref={containerRef}
      style={{ width: '100%', height: 'auto', minHeight: '400px' }}
    >
      {/* Стикеры */}
      {stickers.map((sticker, idx) => (
        <motion.button
          key={sticker.id}
          ref={sticker.ref}
          className="absolute text-xl rounded font-semibold"
          style={{
            width: HANDLE_SIZE.width,
            height: HANDLE_SIZE.height,
          }}
          {...useSnapResults[idx].dragProps}
          variants={{
            initial: { backgroundColor: GRAY, opacity: 0.8 },
            snapped: { backgroundColor: COLORS[idx], opacity: 0.8 },
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

      {/* Кнопка "Ответить" */}
      <Button
        className="absolute"
        style={{ left: '50%', bottom: '20px', transform: 'translateX(-50%)' }}
        disabled={!isDone}
        onClick={handleAnswer}
        variant="primary"
      >
        ответить
      </Button>

      {/* SVG: треугольник */}
      <motion.svg width={dimensions.width} height={dimensions.height}>
        {/* Серые линии (фон) */}
        {lineCoordinates.map((line, idx) => (
          <motion.line
            key={`gray-${idx}`}
            x1={line.x1}
            y1={line.y1}
            x2={line.x2}
            y2={line.y2}
            stroke={GRAY}
            strokeWidth={10}
            strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ delay: idx * 0.3, duration: 1 }}
          />
        ))}

        {/* Цветные линии (на синяп) */}
        {lineCoordinates.map((line, idx) => (
          <motion.line
            key={`color-${idx}`}
            x1={line.x1}
            y1={line.y1}
            x2={line.x2}
            y2={line.y2}
            stroke={COLORS[idx]}
            strokeWidth={10}
            strokeLinecap="round"
            initial={{ opacity: 0 }}
            animate={lineControls[idx]}
            transition={{ duration: 0.3 }}
          />
        ))}

        {/* Snap points (маленькие кружки) */}
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
