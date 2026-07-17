'use client'

import React, { useEffect, useLayoutEffect, useRef, useState, useMemo } from 'react'
import { motion, useAnimationControls } from 'framer-motion'
import { ArrowUpLeft } from 'lucide-react'
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

  // Координаты линий - вычисляются когда dimensions получены
  const [lineCoordinates, setLineCoordinates] = useState([
    { x1: 0, y1: 0, x2: 0, y2: 0, mid: [0, 0] },
    { x1: 0, y1: 0, x2: 0, y2: 0, mid: [0, 0] },
    { x1: 0, y1: 0, x2: 0, y2: 0, mid: [0, 0] },
  ])

  useEffect(() => {
    if (dimensions.width > 0 && dimensions.height > 0) {
      const newLineCoordinates = [
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
      setLineCoordinates(newLineCoordinates)
    }
  }, [dimensions.width, dimensions.height, x1, x2, x3, y1, y2, y3])

  // Базовые snap points
  const baseSnapPoints: SnapPointsType = {
    type: 'constraints-box',
    unit: 'pixel',
    points: lineCoordinates.map(line => ({
      x: line.mid[0],
      y: line.mid[1],
    })),
  }

  // Хранимое состояние текущих snap indices (для использования в useMemo)
  const [currentSnapIndices, setCurrentSnapIndices] = useState<(number | null)[]>([null, null, null])

  // useMemo для создания snapPoints для каждого стикера
  // Пересчитывается когда currentSnapIndices меняется
  const snapPointsForEachSticker = useMemo(() => {
    return [0, 1, 2].map((stickerIdx) => {
      // Проверяем какие snap points занаты ДРУГИМИ стикерами
      const occupiedByOthers = currentSnapIndices
        .map((idx, i) => (i !== stickerIdx && idx !== null ? idx : null))
        .filter((idx): idx is number => idx !== null)

      return {
        type: 'constraints-box' as const,
        unit: 'pixel' as const,
        points: baseSnapPoints.points.map((point, idx) => {
          // Если эта точка занята другим стикером, "отключаем" её
          if (occupiedByOthers.includes(idx)) {
            return { y: 0 } // Точка вне экрана, недостижимая
          }
          return point
        }),
      } as SnapPointsType
    })
  }, [currentSnapIndices, baseSnapPoints])

  // Вызываем useSnap для каждого ref с мемоизированными snap points
  const snap0 = useSnap({
    direction: 'both',
    ref: ref0,
    constraints: containerRef,
    snapPoints: snapPointsForEachSticker[0],
  })

  const snap1 = useSnap({
    direction: 'both',
    ref: ref1,
    constraints: containerRef,
    snapPoints: snapPointsForEachSticker[1],
  })

  const snap2 = useSnap({
    direction: 'both',
    ref: ref2,
    constraints: containerRef,
    snapPoints: snapPointsForEachSticker[2],
  })

  const snaps = [snap0, snap1, snap2]
  const liveCurrentSnapIndices = [
    snap0.currentSnappointIndex,
    snap1.currentSnappointIndex,
    snap2.currentSnappointIndex,
  ]

  // Анимационные контролы для линий
  const lineControl0 = useAnimationControls()
  const lineControl1 = useAnimationControls()
  const lineControl2 = useAnimationControls()
  const lineControls = [lineControl0, lineControl1, lineControl2]

  // Анимационные контролы для snap point кружочков
  const snapPointControl0 = useAnimationControls()
  const snapPointControl1 = useAnimationControls()
  const snapPointControl2 = useAnimationControls()
  const snapPointControls = [snapPointControl0, snapPointControl1, snapPointControl2]

  // Анимационные контролы для стикеров
  const buttonControl0 = useAnimationControls()
  const buttonControl1 = useAnimationControls()
  const buttonControl2 = useAnimationControls()
  const buttonControls = [buttonControl0, buttonControl1, buttonControl2]

  // Состояние для финального ответа
  const [isDone, setIsDone] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)

  // Главный эффект - обновляем цвета и проверяем конфликты
  useEffect(() => {
    // Проверяем конфликты: два стикера не должны быть на одном snap point
    console.log(`📊 liveCurrentSnapIndices:`, liveCurrentSnapIndices)

    const snapIndexCounts = new Map<number, number>()
    const resolvedSnapIndices = [...liveCurrentSnapIndices]

    liveCurrentSnapIndices.forEach((snapIdx, stickerIdx) => {
      if (snapIdx !== null && snapIdx >= 0) {
        const count = snapIndexCounts.get(snapIdx) || 0
        if (count > 0) {
          // Конфликт! Сбрасываем этот стикер
          console.log(`⚠️ Conflict: Sticker ${stickerIdx} trying to use snap point ${snapIdx} that's already occupied. Resetting.`)
          resolvedSnapIndices[stickerIdx] = null
          snaps[stickerIdx].snapTo(-1) // Сбрасываем snap
        } else {
          snapIndexCounts.set(snapIdx, count + 1)
        }
      }
    })

    console.log(`📋 resolvedSnapIndices after conflict check:`, resolvedSnapIndices)
    console.log(`📋 snapIndexCounts:`, Array.from(snapIndexCounts.entries()))

    // Обновляем currentSnapIndices для использования в useMemo
    setCurrentSnapIndices(resolvedSnapIndices)

    // Сначала скрываем ВСЕ цветные линии и сбрасываем snap points на серый
    lineControls.forEach((control) => {
      control.start({ opacity: 0 })
    })
    snapPointControls.forEach((control, idx) => {
      console.log(`🔴 Resetting snap point ${idx} to GRAY`)
      control.start({ stroke: GRAY, transition: { duration: 0.15 } })
    })

    // Для каждого стикера обновляем его цвет на основе текущей позиции
    stickers.forEach((_, idx) => {
      const snapIdx = resolvedSnapIndices[idx]
      console.log(`🎨 Sticker ${idx}: snapIdx = ${snapIdx}`)

      if (snapIdx !== null && snapIdx >= 0) {
        // Стикер на snap point - раскрашиваем его, линию и snap point кружочек
        const lineColor = COLORS[snapIdx]
        console.log(`  → На snap point ${snapIdx}, цвет: ${lineColor}`)
        buttonControls[idx].start({ backgroundColor: lineColor, opacity: 0.8, transition: { duration: 0.1 } })
        lineControls[snapIdx].start({ opacity: 1, stroke: lineColor, transition: { duration: 0.1 } })
        console.log(`🟢 Coloring snap point ${snapIdx} to ${lineColor}`)
        snapPointControls[snapIdx].start({ stroke: lineColor, transition: { duration: 0.1 } })
      } else {
        // Стикер не на snap point - серый
        console.log(`  → Вне snap points, цвет: серый`)
        buttonControls[idx].start({ backgroundColor: GRAY, opacity: 0.8, transition: { duration: 0.15 } })
      }
    })

    // Проверяем все ли размещены
    const allPlaced = liveCurrentSnapIndices.every(idx => idx !== null && idx >= 0)
    setIsDone(allPlaced)

    if (allPlaced) {
      // Проверяем ответ
      const sorted = stickers
        .map((sticker, idx) => ({
          text: sticker.text,
          snapIdx: liveCurrentSnapIndices[idx]!,
        }))
        .sort((a, b) => a.snapIdx - b.snapIdx)

      const resultArray = sorted.map(item => item.text)
      const isRight = sorted.every((item, idx) => item.text === answer[idx])

      console.log('📋 Expected answer:', answer)
      console.log('📋 Your answer:', resultArray)
      console.log('✅ Is correct?', isRight)

      setIsCorrect(isRight)
    }
  }, [liveCurrentSnapIndices[0], liveCurrentSnapIndices[1], liveCurrentSnapIndices[2]])

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
          ref={refs[idx]}
          className="absolute text-xl rounded font-semibold text-white"
          style={{
            width: HANDLE_SIZE.width,
            height: HANDLE_SIZE.height,
          }}
          {...snaps[idx].dragProps}
          initial={{ x: idx * 150, y: -20, backgroundColor: GRAY, opacity: 0.8 }}
          animate={buttonControls[idx]}
          whileHover={{ scale: 1.2, rotate: 5 }}
          whileTap={{ scale: 0.8, rotate: -5 }}
          transition={{ type: 'spring', stiffness: 400, damping: 17 }}
        >
          {sticker.text}
          <motion.div className="absolute top-0 left-0 text-white text-2xl">
            <ArrowUpLeft size={18} />
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
        {/* Серые линии */}
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

        {/* Цветные линии */}
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

        {/* Snap point circles */}
        {lineCoordinates.map((line, idx) => (
          <motion.circle
            key={`snap-${idx}`}
            cx={line.mid[0]}
            cy={line.mid[1]}
            r={10}
            fill="none"
            stroke={GRAY}
            strokeWidth={5}
            strokeLinecap="round"
            initial={{ opacity: 0.5 }}
            animate={snapPointControls[idx]}
            whileHover={{ opacity: 1, r: 14 }}
            transition={{ duration: 0.2 }}
          />
        ))}
      </motion.svg>
    </motion.div>
  )
}
