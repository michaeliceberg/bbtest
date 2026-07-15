// components/trainer-question.tsx

"use client"

import { useState, useEffect, useRef, SetStateAction, Dispatch } from "react"

import { cn } from "@/lib/utils";
import Latex from 'react-latex-next';
import 'katex/dist/katex.min.css';

import Image from "next/image"
import { QuestionType } from "@/app/t-lesson/[t_lessonId]/page"
import { TypeAssist } from "@/app/t-lesson/[t_lessonId]/type-assist"
import { TypeSlider } from "@/app/t-lesson/[t_lessonId]/type-slider"
import { TypeConnect } from "@/app/t-lesson/[t_lessonId]/type-connect"
import { TypeWorkbook } from "@/app/t-lesson/[t_lessonId]/type-workbook"
import { TypeConstructor } from "@/app/t-lesson/[t_lessonId]/type-constructor"

// import { AnimRightTriangleSin } from "@/app/(main)/motiontest/AnimRightTriangleSin"
import { TypeAssistTRIANGLEgdeKatet } from "@/app/t-lesson/[t_lessonId]/type-assist-triangle-katet";
import { TypeAssistTRIANGLEgdeProtivKatet } from "@/app/t-lesson/[t_lessonId]/type-assist-triangle-protiv-katet";
import { TypeAssistTRIANGLEsincostg } from "@/app/t-lesson/[t_lessonId]/type-assist-triangle-sin-cos-tg";
import { TypeAssistTRIANGLEformGip } from "@/app/t-lesson/[t_lessonId]/type-assist-triangle-form-gip";
import { TypeAssistTRIANGLETable } from "@/app/t-lesson/[t_lessonId]/type-assist-triangle-table";
import { TypeRussianDictant } from "@/app/t-lesson/[t_lessonId]/type-russian-dictant";
import { TypeSwipe } from "@/app/t-lesson/[t_lessonId]/type-swipe";

import {triangleGdeProtivKatet, triangleBissektr, triangleGdeKatet, triangleGdeSinCosTg } from "@/constants"


import { motion } from "framer-motion"
import { TrainerMascot } from "./TrainerMascot"







interface QuestionProps {
  questions: QuestionType[],
  question: QuestionType,

  isRightList: number[]

  onAnswer: (answer: string) => void
  onTimeout: () => void

  isRightPrevious: boolean
  randomEmotionLottie: any

  setThreeHearts: Dispatch<SetStateAction<number>>
  threeHearts: number,
}

export default function TrainerQuestion({
  questions, 
  isRightList, 
  question, 
  onAnswer, 
  onTimeout, 
  isRightPrevious,
  randomEmotionLottie,

  setThreeHearts,
  threeHearts,

}: QuestionProps) {
  



  const buttonRefs = {
    ref0: useRef<HTMLButtonElement>(null),
    ref1: useRef<HTMLButtonElement>(null),
    ref2: useRef<HTMLButtonElement>(null),
    ref3: useRef<HTMLButtonElement>(null),
    ref4: useRef<HTMLButtonElement>(null),
    ref5: useRef<HTMLButtonElement>(null),
  }

  let ButtonList =  [
    {
        id: 0,
        text: ' $ \\frac{ 1 } {2}  $ ',
        buttonRef: buttonRefs.ref0,
    },
    {
        id: 1,
        text: ' $ \\frac{ \\sqrt {2} } {2}  $ ',
        buttonRef: buttonRefs.ref1
    },
    {
        id: 2,
        text: ' $ \\frac{ \\sqrt {3} } {2}  $ ',
        buttonRef: buttonRefs.ref2,
    },

    {
        id: 0,
        text: ' $ \\frac{ 1 } {2}  $ ',
        buttonRef: buttonRefs.ref3,
    },
    {
        id: 1,
        text: ' $ \\frac{ \\sqrt {2} } {2}  $ ',
        buttonRef: buttonRefs.ref4,
    },
    {
        id: 2,
        text: ' $ \\frac{ \\sqrt {3} } {2}  $ ',
        buttonRef: buttonRefs.ref5,
    },

  ]


  const [timeLeft, setTimeLeft] = useState(question.timeLimit)
  const timerRef = useRef<NodeJS.Timeout | null>(null)






useEffect(() => {
    setTimeLeft(question.timeLimit) // Reset timer when a new question appears
  }, [question])

  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current) // Clear existing timer

    timerRef.current = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 1) {
          clearInterval(timerRef.current!)
          // Defer the call to onTimeout to avoid updating parent state during render
          setTimeout(() => {
            onTimeout()
          }, 0)
          return 0
        }





        // // FOR CONSTRUCTOR
        




        return prevTime - 1
      })
    }, 1000)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [question, onTimeout])







// В компоненте TrainerQuestion, добавьте эти состояния и эффекты:

const [mascotEmotion, setMascotEmotion] = useState<"happy" | "sad" | "thinking" | "celebrating" | "waiting" | "angry" | "neutral">("waiting")

// Реакция на правильный/неправильный ответ
useEffect(() => {
  if (isRightPrevious === true) {
    setMascotEmotion("celebrating")
    setTimeout(() => setMascotEmotion("waiting"), 2000)
  } else if (isRightPrevious === false) {
    setMascotEmotion("sad")
    setTimeout(() => setMascotEmotion("thinking"), 2000)
  }
}, [isRightPrevious])

// Реакция на таймер
useEffect(() => {
  if (timeLeft <= 5 && timeLeft > 0 && mascotEmotion !== "angry") {
    setMascotEmotion("angry")
    setTimeout(() => {
      setMascotEmotion("waiting")
    }, 2500)
  } else if (timeLeft === 0 && mascotEmotion !== "sad") {
    setMascotEmotion("sad")
    setTimeout(() => {
      setMascotEmotion("waiting")
    }, 2000)
  }
}, [timeLeft, mascotEmotion])

// При смене вопроса
useEffect(() => {
  setMascotEmotion("thinking")
  setTimeout(() => {
    setMascotEmotion("waiting")
  }, 1500)
// }, [currentQuestionIndex])
}, [question])








const renderQuestionContent = () => {
  // Сначала рендерим заголовок вопроса (если нужно)
  
  const renderQuestionHeader = () => {
    // Для SWIPE типа не показываем заголовок вопроса, так как он уже внутри карточки
    if (question.questionType !== "WORKBOOK" && 
        question.questionType !== "RUSSIANDICTANT" && 
        question.questionType !== "SWIPE") {  // Добавляем SWIPE в исключения
        return (
            <motion.h2
                className="text-xl font-semibold mt-4 text-white"
                initial={{ x: 250, y: -20, opacity: 0 }}
                animate={{ x: 10, y: -20, opacity: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 300 }}
            >
                <Latex>{question.question}</Latex>
            </motion.h2>
        );
    }
    return null;
  };

  // Рендерим изображение
  const renderImage = () => {
    if (question.imageSrc && question.imageSrc !== '0') {
      return (
        <Image
          className="pt-8 mx-auto"
          src={`/trainer-images/${question.imageSrc}`}
          alt='triangle'
          height={90}
          width={90}
        />
      );
    }
    return null;
  };

  // Рендерим основной контент в зависимости от типа вопроса
  const renderMainContent = () => {
    switch (question.questionType) {
      case "ASSIST":
        return <TypeAssist question={question} onAnswer={onAnswer} />
      
      case "SLIDER":
        return <TypeSlider questions={questions} question={question} onAnswer={onAnswer} />
      
      case "CONNECT":
        return <TypeConnect question={question} onAnswer={onAnswer} />
      
      case "WORKBOOK":
        return <TypeWorkbook question={question.question} options={question.options} />
      
      case "RUSSIANDICTANT":
        return <TypeRussianDictant question={question} onAnswer={onAnswer} />
      
      case "SWIPE":
        return <TypeSwipe question={question} onAnswer={onAnswer} />
      
      case "GEOSIN":
        return renderGeosinContent()
      
      default:
        return <TypeConstructor question={question} onAnswer={onAnswer} />
    }
  };

  const renderGeosinContent = () => {
    switch (question.difficulty) {
      case '1':
        return <TypeAssistTRIANGLEgdeKatet 
          threeCoordinates={triangleGdeKatet[7].coords}
          answer={triangleGdeKatet[7].answer}
          onAnswer={onAnswer}
        />
      
      case '2':
        return <TypeAssistTRIANGLEgdeProtivKatet 
          threeCoordinates={triangleGdeProtivKatet[7].coords}
          xCoordinates={triangleGdeProtivKatet[7].xCoord}
          answer={triangleGdeProtivKatet[7].answer}
          onAnswer={onAnswer}
          arcSVG="M 440,42 Q 420,80 460,92"
        />
      
      case '3':
        return <TypeAssistTRIANGLEsincostg 
          threeCoordinates={triangleGdeSinCosTg[2].coords}
          xCoordinates={[triangleGdeSinCosTg[2].xCoord[0], triangleGdeSinCosTg[2].xCoord[1] - 0.09]}
          answer={triangleGdeSinCosTg[2].answer}
          onAnswer={onAnswer}
          variant='sin'
        />
      
      case '4':
        return <TypeAssistTRIANGLETable 
          ButtonList={ButtonList}
          onAnswer={onAnswer}
        />
      
      case '5':
        return <TypeAssistTRIANGLEformGip
          threeCoordinates={triangleGdeSinCosTg[2].coords}
          xCoordinates={[triangleGdeSinCosTg[2].xCoord[0], triangleGdeSinCosTg[2].xCoord[1] - 0.09]}
          answer={triangleGdeSinCosTg[2].answer}
          onAnswer={onAnswer}
          variant='sin'
        />
      
      default:
        return null
    }
  };

  // Собираем всё вместе
  return (
    <>
      {renderQuestionHeader()}
      {renderImage()}
      {renderMainContent()}
    </>
  );
};



return (
  <div className="bg-[#1E2A2E] shadow-xl rounded-2xl p-6 relative overflow-hidden border border-[#2E3A40]">

    {/* Верхняя панель: маскот (с сообщениями) + прогресс-бар */}
    <div className="flex items-center justify-between gap-4 mb-6">

      {/* Маскот с сообщениями - занимает всё свободное место */}
      <div className="flex-1">
        <TrainerMascot
          emotion={mascotEmotion}
          lottieAnimations={{
            right: randomEmotionLottie,
            wrong: randomEmotionLottie,
            default: randomEmotionLottie
          }}
          isRightPrevious={isRightPrevious}
        />
      </div>

      {/* Прогресс-бар - 40% от ширины */}
      <div className="w-[40%]">
        <div className="w-full bg-[#2E3A40] rounded-full h-2">
          <div
            className={cn(
              "h-2 rounded-full transition-all duration-1000 ease-linear",
              timeLeft > 5 ? "bg-sky-400" : "bg-red-500"
            )}
            style={{ width: `${(timeLeft / question.timeLimit) * 100}%` }}
          />
        </div>
      </div>

    </div>




    <div className="mt-8">
      {renderQuestionContent()}
    </div>


  </div>
)}
