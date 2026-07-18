'use client'

// components/trainer-question.tsx

import { useState, useEffect, useRef, SetStateAction, Dispatch, useCallback } from "react"
import dynamic from "next/dynamic"

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

import { motion, AnimatePresence } from "framer-motion"
import { X, Check, Flag } from "lucide-react"

const TrainerMascot = dynamic(() => import("./TrainerMascot").then(mod => mod.TrainerMascot), { ssr: false })




interface QuestionProps {
  questions: QuestionType[],
  question: QuestionType,

  isRightList: number[]

  onAnswer: (answer: string) => void
  onTimeout: () => void

  isRightPrevious: boolean | null
  randomEmotionLottie: any
  playCorrectSound?: () => void

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
  playCorrectSound,

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

  const [showExitModal, setShowExitModal] = useState(false)
  const [mascotEmotion, setMascotEmotion] = useState<"happy" | "sad" | "thinking" | "celebrating" | "waiting" | "angry" | "neutral">("waiting")
  const [answerState, setAnswerState] = useState<"pending" | "selected" | "correct" | "incorrect">("pending")
  const [selectedAssistAnswer, setSelectedAssistAnswer] = useState<string | null>(null)
  const [answerSubmitted, setAnswerSubmitted] = useState(false)

  // Для CONNECT: отслеживаем когда все пары правильны
  const handleAllPairsMatched = useCallback(() => {
    playCorrectSound?.()
    setAnswerState("correct")
    setMascotEmotion("celebrating")
  }, [playCorrectSound])

  // Для ASSIST: когда выбран вариант
  const handleAssistOptionSelected = (answer: string | null) => {
    setSelectedAssistAnswer(answer)
    if (answer) {
      setAnswerState("selected")
    } else {
      setAnswerState("pending")
    }
  }

  // Реакция на правильный/неправильный ответ
  useEffect(() => {
    if (isRightPrevious === true) {
      setAnswerState("correct")
      setMascotEmotion("celebrating")
      setTimeout(() => setMascotEmotion("waiting"), 2000)
    } else if (isRightPrevious === false) {
      setAnswerState("incorrect")
      setMascotEmotion("sad")
      setTimeout(() => setMascotEmotion("thinking"), 2000)
    }
  }, [isRightPrevious])

  // При смене вопроса
  useEffect(() => {
    setAnswerState("pending")
    setSelectedAssistAnswer(null)
    setAnswerSubmitted(false)
    setMascotEmotion("thinking")
    setTimeout(() => {
      setMascotEmotion("waiting")
    }, 1500)
  }, [question])

  const renderQuestionContent = () => {
    // Сначала рендерим заголовок вопроса (если нужно)

    const renderQuestionHeader = () => {
      // Для SWIPE типа не показываем заголовок вопроса, так как он уже внутри карточки
      if (question.questionType !== "WORKBOOK" &&
          question.questionType !== "RUSSIANDICTANT" &&
          question.questionType !== "SWIPE") {  // Добавляем SWIPE в исключения
          return (
              <h2 className="text-xl font-semibold mt-4 text-[#C386F8]">
                  <Latex>{question.question}</Latex>
              </h2>
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
          return <TypeAssist
            question={question}
            onAnswer={onAnswer}
            onOptionSelected={handleAssistOptionSelected}
            isAnswerChecked={answerState === "correct" || answerState === "incorrect"}
            isAnswerCorrect={answerState === "correct"}
          />

        case "SLIDER":
          return <TypeSlider questions={questions} question={question} onAnswer={onAnswer} />

        case "CONNECT":
          return <TypeConnect question={question} onAnswer={onAnswer} onAllPairsMatched={handleAllPairsMatched} />

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

  const getButtonColor = () => {
    if (answerState === "correct" || answerState === "selected") {
      return "bg-[#A1D051] active:bg-[#876E4A]"
    } else if (answerState === "incorrect") {
      return "bg-[#DC605B] active:bg-[#C8524E]"
    }
    return "bg-[#3A464E] active:bg-[#4A5568]"
  }

  const getButtonTextColor = () => {
    if (answerState === "correct" || answerState === "incorrect") {
      return "text-[#151F24]"
    }
    return "text-[#F2F7FB]"
  }

  const getButtonText = () => {
    // Для ASSIST - состояние "selected" = кнопка "ответить"
    if (answerState === "selected") {
      return "ответить"
    }
    // После проверки
    if (answerState === "correct") return "далее"
    if (answerState === "incorrect") return "понятно"
    return "ответить"
  }

  const isButtonDisabled = answerState === "pending"

  return (
    <div className="min-h-screen bg-[#151F24] text-[#F2F7FB] flex flex-col">

      {/* Крестик и прогресс-бар (не анимируются) */}
      <div className="px-4 py-4 flex items-center gap-4">
        {/* Крестик слева */}
        <button
          onClick={() => setShowExitModal(true)}
          className="text-[#F2F7FB] hover:opacity-80 transition-opacity shrink-0"
        >
          <X size={24} />
        </button>

        {/* Прогресс-бар */}
        <div className="flex-1 bg-[#2A3A4A] rounded-full h-2 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-300 ease-out"
            style={{
              width: `${((questions.indexOf(question) + 1) / questions.length) * 100}%`,
              backgroundColor: '#A1D051'
            }}
          />
        </div>
      </div>

      {/* Основной контент (скролируемый) с анимацией слайда */}
      <AnimatePresence mode="wait">
        <motion.div
          className="flex-1 overflow-y-auto px-4 pb-6"
          key={questions.indexOf(question)}
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -100 }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
        >
        {/* Маскот */}
        <div className="mb-6">
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

        {/* Вопрос и варианты ответов */}
        <div className="bg-[#1A2A3A] rounded-xl p-6 mb-6">
          {renderQuestionContent()}
        </div>
        </motion.div>
      </AnimatePresence>

      {/* Кнопка внизу - фиксированная */}
      <div className="px-4 pb-4 pt-2 bg-[#151F24] relative">
        {/* Notification фон который выезжает при правильном ответе */}
        {answerState === "correct" && (
          <motion.div
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute inset-x-4 bottom-16 bg-[#16293a] rounded-lg p-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              {/* Кружок с галочкой */}
              <div className="w-6 h-6 bg-[#A1D051] rounded-full flex items-center justify-center flex-shrink-0">
                <Check className="w-4 h-4 text-[#151F24]" strokeWidth={3} />
              </div>
              {/* Текст Отлично */}
              <span className="text-base font-black text-[#A1D051]">Отлично!</span>
            </div>

            {/* Иконка Flag справа */}
            <button className="cursor-pointer hover:opacity-80 transition-opacity flex-shrink-0">
              <Flag className="w-5 h-5 text-[#A1D051]" strokeWidth={2.5} />
            </button>
          </motion.div>
        )}

        <button
          onClick={() => {
            if (!isButtonDisabled) {
              // Для ASSIST - отправить ответ при первом нажатии (answerState === "selected")
              if (question.questionType === "ASSIST" && answerState === "selected" && selectedAssistAnswer) {
                onAnswer(selectedAssistAnswer)
                setAnswerSubmitted(true)
              }
              // Для ASSIST - при клике на "далее"/"понятно" (answerState === "correct" или "incorrect")
              // просто переходим к следующему вопросу БЕЗ отправки ответа
              else if (question.questionType === "ASSIST" && (answerState === "correct" || answerState === "incorrect")) {
                onAnswer("next")
              }
              // Для других типов (CONNECT и т.д.)
              else if (question.questionType !== "ASSIST") {
                onAnswer(answerState === "correct" ? "right" : "wrong")
                setAnswerState("pending")
              }
            }
          }}
          disabled={isButtonDisabled}
          className={`
            w-full py-3 rounded-lg font-bold text-lg transition-all duration-200
            ${getButtonColor()}
            ${getButtonTextColor()}
            ${isButtonDisabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}
            shadow-lg relative
            transform active:translate-y-1
          `}
          style={{
            boxShadow: answerState === "correct"
              ? "0 4px 0 #876E4A"
              : answerState === "incorrect"
              ? "0 4px 0 #C8524E"
              : "0 4px 0 #1A2A3A"
          }}
        >
          {getButtonText()}
        </button>
      </div>

      {/* Модалка выхода */}
      {showExitModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1A2A3A] border border-[#2A3A4A] rounded-xl p-6 max-w-sm w-full">
            <h3 className="text-white font-bold text-lg mb-2">Вы уверены?</h3>
            <p className="text-[#F2F7FB]/70 mb-6 text-sm">Вы действительно хотите завершить урок?</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowExitModal(false)}
                className="flex-1 px-4 py-2 bg-[#3A464E] text-[#F2F7FB] rounded-lg hover:bg-[#4A5568] transition"
              >
                Продолжить
              </button>
              <button
                onClick={() => window.location.href = '/trainer'}
                className="flex-1 px-4 py-2 bg-[#DC605B] text-[#151F24] rounded-lg hover:bg-[#C8524E] transition"
              >
                Выход
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
