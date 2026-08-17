'use client'

import { useState, useCallback, useEffect, useRef } from "react"
import { useRive } from "@rive-app/react-webgl2"

// Пул готовых .riv-файлов с "зашитой" внутри последовательностью редкости.
// Мы не лезем внутрь файла и не переключаем редкость сами — просто выбираем
// ОДИН файл целиком по весу (шансу выпадения) и даём игроку тапать по нему.
// Когда появятся новые файлы (например common-rare-rare, common-rare-mythic),
// просто добавь их сюда с нужным весом.
const CHEST_RIV_POOL: { src: string; weight: number }[] = [
  { src: '/Rivs/big_riv_test.riv', weight: 100 }, // common-common-common
]

const pickWeightedRiv = () => {
  const total = CHEST_RIV_POOL.reduce((sum, item) => sum + item.weight, 0)
  let r = Math.random() * total
  for (const item of CHEST_RIV_POOL) {
    if (r < item.weight) return item.src
    r -= item.weight
  }
  return CHEST_RIV_POOL[0].src
}

interface ChestRewardProps {
  onChestClicked?: () => void
}

export const ChestReward = ({ onChestClicked }: ChestRewardProps) => {
  const [riveSrc] = useState(pickWeightedRiv)
  const [triggerNames, setTriggerNames] = useState<string[]>([])

  const tapIndexRef = useRef(0)
  const finishedRef = useRef(false)
  const waitingForFinalStopRef = useRef(false)
  const fallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const finish = useCallback(() => {
    if (finishedRef.current) return
    finishedRef.current = true
    if (fallbackTimerRef.current) clearTimeout(fallbackTimerRef.current)
    onChestClicked?.()
  }, [onChestClicked])

  const { RiveComponent, rive } = useRive({
    src: riveSrc,
    stateMachines: 'State Machine 1',
    autoplay: true,
    autoBind: true,
    onStop: () => {
      // Каждый триггер проигрывает свою анимацию и State Machine
      // останавливается — нас интересует именно остановка ПОСЛЕ последнего тапа.
      if (waitingForFinalStopRef.current) {
        waitingForFinalStopRef.current = false
        finish()
      }
    },
  })

  // Определяем реальные триггеры файла (pressTrig1, pressTrig2, ...),
  // сколько их есть - столько тапов и понадобится.
  useEffect(() => {
    if (!rive) return
    const vmi = (rive as any).viewModelInstance
    if (!vmi) return

    const names = (vmi.properties || [])
      .filter((p: any) => p.type === 'trigger' && /^pressTrig\d+$/.test(p.name))
      .map((p: any) => p.name as string)
      .sort((a: string, b: string) => parseInt(a.replace('pressTrig', ''), 10) - parseInt(b.replace('pressTrig', ''), 10))

    setTriggerNames(names)
  }, [rive])

  useEffect(() => {
    return () => {
      if (fallbackTimerRef.current) clearTimeout(fallbackTimerRef.current)
    }
  }, [])

  const handleTap = useCallback(() => {
    if (!rive || finishedRef.current) return
    const vmi = (rive as any).viewModelInstance
    if (!vmi || triggerNames.length === 0) return

    const idx = tapIndexRef.current
    if (idx >= triggerNames.length) return

    const trig = vmi.trigger(triggerNames[idx])
    trig?.trigger()

    tapIndexRef.current += 1

    if (tapIndexRef.current >= triggerNames.length) {
      waitingForFinalStopRef.current = true
      // подстраховка: если по какой-то причине onStop не придёт
      fallbackTimerRef.current = setTimeout(finish, 6000)
    }
  }, [rive, triggerNames, finish])

  return (
    // Canvas Rive сам обрабатывает pointer-события (хит-тест своих Listener'ов,
    // в т.ч. со звуком) и останавливает их всплытие, поэтому обычный onClick
    // на обёртке не сработает. onClickCapture перехватывает клик на фазе
    // погружения — раньше, чем canvas успеет его остановить — и не мешает
    // самому canvas получить событие для своей логики (звук, hit-test).
    <div className="relative w-80 h-80 mx-auto cursor-pointer" onClickCapture={handleTap}>
      <RiveComponent />
    </div>
  )
}
