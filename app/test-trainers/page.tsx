'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TypeAssist } from "@/app/t-lesson/[t_lessonId]/type-assist"
import { TypeSlider } from "@/app/t-lesson/[t_lessonId]/type-slider"
import { TypeConnect } from "@/app/t-lesson/[t_lessonId]/type-connect"
import { TypeWorkbook } from "@/app/t-lesson/[t_lessonId]/type-workbook"
import { TypeConstructor } from "@/app/t-lesson/[t_lessonId]/type-constructor"
import { TypeAssistTRIANGLEgdeKatet } from "@/app/t-lesson/[t_lessonId]/type-assist-triangle-katet"
import { TypeAssistTRIANGLEgdeProtivKatet } from "@/app/t-lesson/[t_lessonId]/type-assist-triangle-protiv-katet"
import { TypeAssistTRIANGLEsincostg } from "@/app/t-lesson/[t_lessonId]/type-assist-triangle-sin-cos-tg"
import { TypeAssistTRIANGLEformGip } from "@/app/t-lesson/[t_lessonId]/type-assist-triangle-form-gip"
import { TypeAssistTRIANGLETable } from "@/app/t-lesson/[t_lessonId]/type-assist-triangle-table"
import { TypeRussianDictant } from "@/app/t-lesson/[t_lessonId]/type-russian-dictant"
import { TypeSwipe } from "@/app/t-lesson/[t_lessonId]/type-swipe"
import { triangleGdeProtivKatet, triangleGdeKatet, triangleGdeSinCosTg } from "@/constants"

const mockQuestion = {
  id: 1,
  question: 'Выберите правильный ответ',
  questionType: 'ASSIST',
  difficulty: '1',
  timeLimit: 30,
  imageSrc: '0',
  options: [
    { text: 'Вариант 1', correct: true },
    { text: 'Вариант 2', correct: false },
    { text: 'Вариант 3', correct: false },
  ],
}

const mockQuestions = [mockQuestion]

const buttonList = [
  {
    id: 0,
    text: ' $ \\frac{ 1 } {2}  $ ',
    buttonRef: { current: null },
  },
  {
    id: 1,
    text: ' $ \\frac{ \\sqrt {2} } {2}  $ ',
    buttonRef: { current: null },
  },
  {
    id: 2,
    text: ' $ \\frac{ \\sqrt {3} } {2}  $ ',
    buttonRef: { current: null },
  },
  {
    id: 0,
    text: ' $ \\frac{ 1 } {2}  $ ',
    buttonRef: { current: null },
  },
  {
    id: 1,
    text: ' $ \\frac{ \\sqrt {2} } {2}  $ ',
    buttonRef: { current: null },
  },
  {
    id: 2,
    text: ' $ \\frac{ \\sqrt {3} } {2}  $ ',
    buttonRef: { current: null },
  },
]

export default function TestTrainersPage() {
  const [result, setResult] = useState<string>('')

  const handleAnswer = (answer: string) => {
    setResult(`Ответ: ${answer}`)
  }

  return (
    <div className="min-h-screen bg-[#0F1419] p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">🧪 Тестирование тренажеров</h1>

        {result && (
          <div className="bg-[#1E2A2E] border border-[#3A464E] rounded-lg p-4 mb-6 text-white">
            {result}
          </div>
        )}

        <Tabs defaultValue="triangle-katet" className="w-full">
          <TabsList className="bg-[#161F23] border-b border-[#3A464E] grid grid-cols-4 w-full">
            <TabsTrigger value="triangle-katet" className="text-white text-xs">
              🔺 Катет
            </TabsTrigger>
            <TabsTrigger value="triangle-protiv" className="text-white text-xs">
              🔺 Проти.
            </TabsTrigger>
            <TabsTrigger value="triangle-sincostg" className="text-white text-xs">
              📐 Sin/Cos
            </TabsTrigger>
            <TabsTrigger value="triangle-formgip" className="text-white text-xs">
              🔺 Гип.
            </TabsTrigger>
          </TabsList>

          <TabsContent value="triangle-katet" className="mt-6">
            <div className="bg-[#161F23] border border-[#3A464E] rounded-lg p-6">
              <h2 className="text-white font-bold mb-4">Где катет? (gde Katet)</h2>
              <TypeAssistTRIANGLEgdeKatet
                threeCoordinates={triangleGdeKatet[7].coords}
                answer={triangleGdeKatet[7].answer}
                onAnswer={handleAnswer}
              />
            </div>
          </TabsContent>

          <TabsContent value="triangle-protiv" className="mt-6">
            <div className="bg-[#161F23] border border-[#3A464E] rounded-lg p-6">
              <h2 className="text-white font-bold mb-4">Где противоположный катет?</h2>
              <TypeAssistTRIANGLEgdeProtivKatet
                threeCoordinates={triangleGdeProtivKatet[7].coords}
                xCoordinates={triangleGdeProtivKatet[7].xCoord}
                answer={triangleGdeProtivKatet[7].answer}
                onAnswer={handleAnswer}
                arcSVG="M 440,42 Q 420,80 460,92"
              />
            </div>
          </TabsContent>

          <TabsContent value="triangle-sincostg" className="mt-6">
            <div className="bg-[#161F23] border border-[#3A464E] rounded-lg p-6">
              <h2 className="text-white font-bold mb-4">Sin / Cos / Tg</h2>
              <TypeAssistTRIANGLEsincostg
                threeCoordinates={triangleGdeSinCosTg[2].coords}
                xCoordinates={[triangleGdeSinCosTg[2].xCoord[0], triangleGdeSinCosTg[2].xCoord[1] - 0.09]}
                answer={triangleGdeSinCosTg[2].answer}
                onAnswer={handleAnswer}
                variant="sin"
              />
            </div>
          </TabsContent>

          <TabsContent value="triangle-formgip" className="mt-6">
            <div className="bg-[#161F23] border border-[#3A464E] rounded-lg p-6">
              <h2 className="text-white font-bold mb-4">Формула гипотенузы</h2>
              <TypeAssistTRIANGLEformGip
                threeCoordinates={triangleGdeSinCosTg[2].coords}
                xCoordinates={[triangleGdeSinCosTg[2].xCoord[0], triangleGdeSinCosTg[2].xCoord[1] - 0.09]}
                answer={triangleGdeSinCosTg[2].answer}
                onAnswer={handleAnswer}
                variant="sin"
              />
            </div>
          </TabsContent>
        </Tabs>

        <div className="mt-12">
          <h2 className="text-2xl font-bold text-white mb-6">📋 Таблица sin/cos</h2>
          <div className="bg-[#161F23] border border-[#3A464E] rounded-lg p-6">
            <TypeAssistTRIANGLETable
              ButtonList={buttonList}
              onAnswer={handleAnswer}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
