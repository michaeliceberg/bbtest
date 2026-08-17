'use client'

import { useState } from 'react'
import Confetti from 'react-confetti'
import { useWindowSize } from 'react-use'
import { ChestReward } from '@/components/ChestReward'
import { FinishTrainerStat } from '@/components/finish-trainer-stat'

const mockFinishList = [
  { question: 'Пустой первый элемент (как в реальном flow)', answer: '', rightAnswer: '', isRight: true },
  { question: '2 + 2 = ?', answer: '4', rightAnswer: '4', isRight: true },
]

export default function TestChestPage() {
  const [phase, setPhase] = useState<'chest' | 'stats'>('chest')
  const { width, height } = useWindowSize()

  return (
    <div className="min-h-screen bg-[#0F1419] text-white p-8">
      {phase === 'chest' && (
        <div className="w-full max-w-xl mx-auto py-8">
          <ChestReward onChestClicked={() => setPhase('stats')} />
        </div>
      )}

      {phase === 'stats' && (
        <div className="text-center content-center mx-auto max-w-2xl">
          <h1 className="text-3xl font-bold mb-6">Тестовый урок</h1>
          <h2 className="text-2xl font-bold mb-4">Завершено!</h2>
          <Confetti width={width} height={height} />
          <p className="text-xl text-green-500 font-bold">Правильно 1 из 1</p>
          <button
            onClick={() => setPhase('chest')}
            className="mt-4 px-4 py-2 bg-[#5183A4] rounded-lg"
          >
            Ещё раз
          </button>
          <div className="pt-8 border-t border-white/10 mt-8">
            <FinishTrainerStat finishList={mockFinishList} />
          </div>
        </div>
      )}
    </div>
  )
}
