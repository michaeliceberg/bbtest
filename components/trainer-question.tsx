
"use client"

import { motion } from "framer-motion";

import { useState, useEffect, useRef, useLayoutEffect, SetStateAction, Dispatch } from "react"
import Lottie from "lottie-react"

import LottieOclockBlue from '@/public/Lottie/trainer/LottieOclockBlue.json'

import { Check, Circle, Flame, X } from "lucide-react"
import { cn } from "@/lib/utils";
import Latex from 'react-latex-next';
import 'katex/dist/katex.min.css';


// import { useAudio } from "react-use"

import Image from "next/image"
import { QuestionType } from "@/app/t-lesson/[t_lessonId]/page"
import { TypeAssist } from "@/app/t-lesson/[t_lessonId]/type-assist"
import { TypeSlider } from "@/app/t-lesson/[t_lessonId]/type-slider"
import { TypeConnect } from "@/app/t-lesson/[t_lessonId]/type-connect"
import { TypeWorkbook } from "@/app/t-lesson/[t_lessonId]/type-workbook"
import { TypeConstructor } from "@/app/t-lesson/[t_lessonId]/type-constructor"

import { AnimRightTriangleSin } from "@/app/(main)/motiontest/AnimRightTriangleSin"
// import { TypeAssistTRIANGLETable } from "@/app/t-lesson/[t_lessonId]/type-assist-triangle-table"
import { TypeAssistTRIANGLEgdeKatet } from "@/app/t-lesson/[t_lessonId]/type-assist-triangle-katet";
import { TypeAssistTRIANGLEgdeProtivKatet } from "@/app/t-lesson/[t_lessonId]/type-assist-triangle-protiv-katet";
import { TypeAssistTRIANGLEsincostg } from "@/app/t-lesson/[t_lessonId]/type-assist-triangle-sin-cos-tg";
import { TypeAssistTRIANGLEformGip } from "@/app/t-lesson/[t_lessonId]/type-assist-triangle-form-gip";
import { TypeAssistTRIANGLETable } from "@/app/t-lesson/[t_lessonId]/type-assist-triangle-table";
import { TypeRussianDictant } from "@/app/t-lesson/[t_lessonId]/type-russian-dictant";
import { TypeSwipe } from "@/app/t-lesson/[t_lessonId]/type-swipe";





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
  




  let ButtonList =  [
    {
        id: 0,
        text: ' $ \\frac{ 1 } {2}  $ ',
        buttonRef: useRef<HTMLButtonElement>(null),
    },
    {
        id: 1,
        text: ' $ \\frac{ \\sqrt {2} } {2}  $ ',
        buttonRef: useRef<HTMLButtonElement>(null),
    },
    {
        id: 2,
        text: ' $ \\frac{ \\sqrt {3} } {2}  $ ',
        buttonRef: useRef<HTMLButtonElement>(null),
    },

    {
        id: 0,
        text: ' $ \\frac{ 1 } {2}  $ ',
        buttonRef: useRef<HTMLButtonElement>(null),
    },
    {
        id: 1,
        text: ' $ \\frac{ \\sqrt {2} } {2}  $ ',
        buttonRef: useRef<HTMLButtonElement>(null),
    },
    {
        id: 2,
        text: ' $ \\frac{ \\sqrt {3} } {2}  $ ',
        buttonRef: useRef<HTMLButtonElement>(null),
    },

  ]



  // const audioRef1 = useRef<HTMLAudioElement | null>(null);
  // const audioRef2 = useRef<HTMLAudioElement | null>(null);

  // const [audioCorrect, _, controlsCorrect] = useAudio({src: '/correct.wav'})
  // const [audioInCorrect, _c, controlsInCorrect] = useAudio({src: '/incorrect.wav'})
  
  // const [audioConstructAdd, _ca, controlsAudioConstructAdd] = useAudio({src: '/Lottie/trainer/frozen/sounds/soundClick2.mp3'})
  // const [audioConstructFire, _cf, controlsAudioConstructFire] = useAudio({src: '/Lottie/trainer/frozen/sounds/soundClickFire1.mp3'})


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
  // }, [question, onTimeout, randomFrozen])
  }, [question, onTimeout])










  const triangleGdeProtivKatet = [
            {
              'coords': [0.1, 0.1, 0.9, 0.1, 0.1, 0.6],
              'xCoord': [0.7, 0.2],
              'answer': ['прил. к', 'гипотенуза', 'прот. к'],
            },
            {
              'coords': [0.1, 0.1, 0.9, 0.1, 0.1, 0.6],
              'xCoord': [0.15, 0.5],
              'answer': ['прот. к', 'гипотенуза', 'прил. к'],
            },

            {
              'coords': [0.1, 0.1, 0.8, 0.1, 0.8, 0.6],
              'xCoord': [0.7, 0.5],
              'answer': ['прот. к', 'прил. к', 'гипотенуза'],
            },
            {
              'coords': [0.1, 0.1, 0.8, 0.1, 0.8, 0.6],
              'xCoord': [0.25, 0.2],
              'answer': ['прил. к', 'прот. к', 'гипотенуза'],
            },

            {
              'coords': [0.1, 0.6, 0.8, 0.6, 0.8, 0.1],
              'xCoord': [0.25, 0.6],
              'answer': ['прил. к', 'прот. к', 'гипотенуза'],
            },
            {
              'coords': [0.1, 0.6, 0.8, 0.6, 0.8, 0.1],
              'xCoord': [0.7, 0.3],
              'answer': ['против. к', 'прил. к', 'гипотенуза'],
            },

            {
              'coords': [0.1, 0.6, 0.9, 0.6, 0.1, 0.1],
              'xCoord': [0.17, 0.3],
              'answer': ['прот. к', 'гипотенуза', 'прил. к'],
            },
            {
              'coords': [0.1, 0.6, 0.9, 0.6, 0.1, 0.1],
              'xCoord': [0.7, 0.6],
              'answer': ['прил. к', 'гипотенуза', 'прот. к'],
            },
  ]



  const triangleGdeKatet = [
    {
      'coords': [0.1, 0.1, 0.9, 0.1, 0.1, 0.6],
      'xCoord': [0.7, 0.2],
      'answer': ['катет', 'гипотенуза', 'катет'],
    },
    {
      'coords': [0.1, 0.1, 0.9, 0.1, 0.1, 0.6],
      'xCoord': [0.15, 0.5],
      'answer': ['катет', 'гипотенуза', 'катет'],
    },

    {
      'coords': [0.1, 0.1, 0.8, 0.1, 0.8, 0.6],
      'xCoord': [0.7, 0.5],
      'answer': ['катет', 'катет', 'гипотенуза'],
    },
    {
      'coords': [0.1, 0.1, 0.8, 0.1, 0.8, 0.6],
      'xCoord': [0.25, 0.2],
      'answer': ['катет', 'катет', 'гипотенуза'],
    },

    {
      'coords': [0.1, 0.6, 0.8, 0.6, 0.8, 0.1],
      'xCoord': [0.25, 0.6],
      'answer': ['катет', 'катет', 'гипотенуза'],
    },
    {
      'coords': [0.1, 0.6, 0.8, 0.6, 0.8, 0.1],
      'xCoord': [0.7, 0.3],
      'answer': ['катет', 'катет', 'гипотенуза'],
    },

    {
      'coords': [0.1, 0.6, 0.9, 0.6, 0.1, 0.1],
      'xCoord': [0.17, 0.3],
      'answer': ['катет', 'гипотенуза', 'катет'],
    },
    {
      'coords': [0.1, 0.6, 0.9, 0.6, 0.1, 0.1],
      'xCoord': [0.7, 0.6],
      'answer': ['катет', 'гипотенуза', 'катет'],
    },
]


// Надо сделать Свойство Биссектрисы (пропорция кусочков)
const triangleBissektr = [
  {
    'coords': [0.1, 0.1, 0.9, 0.1, 0.1, 0.6],
    'xCoord': [0.7, 0.2],
    'answer': ['катет', 'гипотенуза', 'катет'],
  },
]




const triangleGdeSinCosTg = [
  {
    'coords': [0.1, 0.1, 0.9, 0.1, 0.1, 0.6],
    'xCoord': [0.7, 0.2],
    'answer': 
    [{variant: 'sin',answer: ['c', 'b'],},
      {variant: 'cos',answer: ['a', 'b'],},
      {variant: 'tg',answer: ['c', 'a'],},]
    // 'answer': ['прил. к', 'гипотенуза', 'прот. к'],
  },
  {
    'coords': [0.1, 0.1, 0.9, 0.1, 0.1, 0.6],
    'xCoord': [0.15, 0.5],
    'answer': 
    [{variant: 'sin',answer: ['a', 'b'],},
    {variant: 'cos',answer: ['c', 'b'],},
    {variant: 'tg',answer: ['a', 'c'],},]

    // 'answer': ['прот. к', 'гипотенуза', 'прил. к'],
  },

  {
    'coords': [0.1, 0.1, 0.8, 0.1, 0.8, 0.6],
    'xCoord': [0.7, 0.5],
    'answer': 
    [{variant: 'sin',answer: ['a', 'c'],},
    {variant: 'cos',answer: ['b', 'c'],},
    {variant: 'tg',answer: ['a', 'b'],},]

    // 'answer': ['прот. к', 'прил. к', 'гипотенуза'],
  },
  {
    'coords': [0.1, 0.1, 0.8, 0.1, 0.8, 0.6],
    'xCoord': [0.25, 0.2],
    'answer': 
    [{variant: 'sin',answer: ['b', 'c'],},
    {variant: 'cos',answer: ['a', 'c'],},
    {variant: 'tg',answer: ['b', 'a'],},]

    // 'answer': ['прил. к', 'прот. к', 'гипотенуза'],
  },

  {
    'coords': [0.1, 0.6, 0.8, 0.6, 0.8, 0.1],
    'xCoord': [0.25, 0.6],
    'answer': 
    [{variant: 'sin',answer: ['b', 'c'],},
    {variant: 'cos',answer: ['a', 'c'],},
    {variant: 'tg',answer: ['b', 'a'],},]

    // 'answer': ['прил. к', 'прот. к', 'гипотенуза'],
  },
  {
    'coords': [0.1, 0.6, 0.8, 0.6, 0.8, 0.1],
    'xCoord': [0.7, 0.3],
    'answer': 
    [{variant: 'sin',answer: ['a', 'c'],},
    {variant: 'cos',answer: ['b', 'c'],},
    {variant: 'tg',answer: ['a', 'c'],},]

    // 'answer': ['против. к', 'прил. к', 'гипотенуза'],
  },

  {
    'coords': [0.1, 0.6, 0.9, 0.6, 0.1, 0.1],
    'xCoord': [0.17, 0.3],
    'answer': 
    [{variant: 'sin',answer: ['a', 'b'],},
    {variant: 'cos',answer: ['c', 'b'],},
    {variant: 'tg',answer: ['a', 'c'],},]

    // 'answer': ['прот. к', 'гипотенуза', 'прил. к'],
  },
  {
    'coords': [0.1, 0.6, 0.9, 0.6, 0.1, 0.1],
    'xCoord': [0.7, 0.6],
    'answer': 
    [{variant: 'sin',answer: ['c', 'b'],},
    {variant: 'cos',answer: ['a', 'b'],},
    {variant: 'tg',answer: ['c', 'a'],},]

    // 'answer': ['прил. к', 'гипотенуза', 'прот. к'],
  },
]


  return (

    <div className="bg-white shadow-md rounded-lg p-6">

    {/* {audioCorrect} */}
    {/* {audioInCorrect} */}
    {/* {audioConstructAdd} */}
    {/* {audioConstructFire} */}






      <div>

        <div className="grid grid-cols-12">
          
          <div className="w-full bg-gray-200 rounded-full h-4 mt-4 col-span-10">
            <div
              className=
              {timeLeft > 5
                ? "bg-sky-300 h-4 rounded-full transition-all duration-1000 ease-linear"
                : "bg-red-300 h-4 rounded-full transition-all duration-1000 ease-linear"
              }
              

              style={{ width: `${(timeLeft / question.timeLimit) * 100}%` }}
            />
          </div>


          <div className="ml-1 flex flex-1 content-center col-span-2">
            <Lottie 
                className="size-16 pb-5" 
                animationData={LottieOclockBlue}
            /> 

            <p className="text-lg font-bold pt-2 text-sky-400">
              {timeLeft}
            </p>
          </div>

        </div>




        { (question.questionType !== "WORKBOOK" ) && (question.questionType !== "RUSSIANDICTANT")  &&
          <motion.h2 
            className="text-xl font-semibold mt-4"
            // animate={{ scale : [2, 1] }}
            initial={{ x: 250, y:-20, opacity: 0}}
            animate={{ x : 10, y:-20, opacity: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 300 }}
          >
            <Latex>          
              {question.question}
            </Latex>
          </motion.h2>
        }

      


        {
        question.imageSrc &&  question.imageSrc !== '0' &&
        
          <Image
            className="pt-8 mx-auto"
            // src='/trainer-images/triangle7.svg'
            src={`/trainer-images/${question.imageSrc}`}
            alt='triangle'
            height={90}
            width={90}
          />  
        }



        {
          question.questionType == "ASSIST" 
          ? <TypeAssist 
              question={question} 
              onAnswer={onAnswer}
            />



          : question.questionType == "SLIDER"         
          ? <TypeSlider 
              questions={questions} 
              question={question} 
              onAnswer={onAnswer}
            />

          : question.questionType == "CONNECT" 
          ? <TypeConnect 
              question={question} 
              onAnswer={onAnswer}
            />

          : question.questionType == "WORKBOOK" 
          ? <TypeWorkbook
              question = {question.question}
              options = {question.options} 
            />
                    
    



        : (question.questionType == "GEOSIN") && (question.difficulty == '1') 
          ? <TypeAssistTRIANGLEgdeKatet 
              
          threeCoordinates = {triangleGdeKatet[7].coords}
          answer = {triangleGdeKatet[7].answer}
          onAnswer={onAnswer}
        />


        : (question.questionType == "GEOSIN") && (question.difficulty == '2') 


        ? <TypeAssistTRIANGLEgdeProtivKatet 
            
            threeCoordinates = {triangleGdeProtivKatet[7].coords}
            xCoordinates = {triangleGdeProtivKatet[7].xCoord}
            answer = {triangleGdeProtivKatet[7].answer}
            onAnswer={onAnswer}

            arcSVG = {"M 440,42 Q 420,80 460,92"}
          />




        : (question.questionType == "GEOSIN") && (question.difficulty == '3') 

        ? <TypeAssistTRIANGLEsincostg 

            threeCoordinates = {triangleGdeSinCosTg[2].coords}
                                                                        // -0.09 тк нет стикеров сверху и все опускается
            xCoordinates = {[triangleGdeSinCosTg[2].xCoord[0], triangleGdeSinCosTg[2].xCoord[1]-0.09]}
            answer = {triangleGdeSinCosTg[2].answer}
            onAnswer={onAnswer}
            variant='sin'
          />



        : (question.questionType == "GEOSIN") && (question.difficulty == '4') 
        

        ? <TypeAssistTRIANGLETable 
            ButtonList={ButtonList}
            onAnswer={onAnswer}
        />


        : (question.questionType == "GEOSIN") && (question.difficulty == '5') 
        
        ? <TypeAssistTRIANGLEformGip

          threeCoordinates = {triangleGdeSinCosTg[2].coords}
                                                                      // -0.09 тк нет стикеров сверху и все опускается
          xCoordinates = {[triangleGdeSinCosTg[2].xCoord[0], triangleGdeSinCosTg[2].xCoord[1]-0.09]}
          answer = {triangleGdeSinCosTg[2].answer}
          onAnswer={onAnswer}
          variant='sin'
        />


        
        : (question.questionType == "RUSSIANDICTANT")
        
        ? <TypeRussianDictant             
            question = {question}
            onAnswer={onAnswer}
          />







        : (question.questionType == "SWIPE")
        ? <TypeSwipe
            question = {question}
            onAnswer={onAnswer}
        />



        : <TypeConstructor
            question={question} 
            onAnswer={onAnswer}
        />



        }


      </div>




    </div>
  )
}









// threeCoordinates = {[0.1, 0.1, 0.9, 0.1, 0.1, 0.6]}
            // xCoordinates = {[0.7, 0.2]}
            // answer = {['прил. к', 'гипотенуза', 'прот. к']}

            // xCoordinates = {[0.15, 0.5]}
            // answer = {['прот. к', 'гипотенуза', 'прил. к']}

            // threeCoordinates = {[0.1, 0.1, 0.8, 0.1, 0.8, 0.6]}
            // xCoordinates = {[0.7, 0.5]}
            // answer = {['прот. к', 'прил. к', 'гипотенуза']}
            // xCoordinates = {[0.25, 0.2]}
            // answer = {['прил. к', 'прот. к', 'гипотенуза']}


            // threeCoordinates = {[0.1, 0.6, 0.8, 0.6, 0.8, 0.1]}
            // xCoordinates = {[0.25, 0.6]}
            // answer = {['прил. к', 'прот. к', 'гипотенуза']}
            // xCoordinates = {[0.7, 0.3]}
            // answer = {['против. к', 'прил. к', 'гипотенуза']}


            // threeCoordinates = {[0.1, 0.6, 0.9, 0.6, 0.1, 0.1]}
            // xCoordinates = {[0.17, 0.3]}
            // answer = {['прот. к', 'гипотенуза', 'прил. к']}
            // xCoordinates = {[0.7, 0.6]}
            // answer = {['прил. к', 'гипотенуза', 'прот. к']}














              // TODO:

  // START TYPE CONSTRUCTOR 

  // const FrozenList = ['unfrozen','unfrozen','unfrozen','unfrozen','frozen','frozen']
  // const FrozenTimeList = [3, 4, 5, 6, 7, 8]

  // const [randomFrozen, setRandomFrozen] = useState(
  //   [
  //     { index: 0, time: FrozenTimeList[Math.floor(Math.random()*FrozenTimeList.length)], status: FrozenList[Math.floor(Math.random()*FrozenList.length)] },
  //     { index: 1, time: FrozenTimeList[Math.floor(Math.random()*FrozenTimeList.length)], status: FrozenList[Math.floor(Math.random()*FrozenList.length)] },
  //     { index: 2, time: FrozenTimeList[Math.floor(Math.random()*FrozenTimeList.length)], status: FrozenList[Math.floor(Math.random()*FrozenList.length)] },
  //     { index: 3, time: FrozenTimeList[Math.floor(Math.random()*FrozenTimeList.length)], status: FrozenList[Math.floor(Math.random()*FrozenList.length)] },
  //     { index: 4, time: FrozenTimeList[Math.floor(Math.random()*FrozenTimeList.length)], status: FrozenList[Math.floor(Math.random()*FrozenList.length)] },
  //     { index: 5, time: FrozenTimeList[Math.floor(Math.random()*FrozenTimeList.length)], status: FrozenList[Math.floor(Math.random()*FrozenList.length)] },
  //   ])
    

  


  // CONSTRUCTOR:

  //           const [constructorList, setConstructorList] = useState<string[]>(['', '', ''])
  
  // const handleConstructorAddClick = (option: string ) => {
    
  //   controlsAudioConstructAdd.play()
  //   const indexEmpty = constructorList.indexOf('')

  //   if (indexEmpty > -1) {
  //     //
  //     // есть ли -1 ?
  //     //
  //     let newList = constructorList
  //     newList[indexEmpty] = option
  //     setConstructorList(newList)
  
    
  //   }
    
  // }


  // const handleConstructorDelClick = (delIndex: number) => {

  //     controlsAudioConstructAdd.play()
  //     let newList = constructorList
  //     newList[delIndex] = ''
  //     setConstructorList(newList)
  
    
  // }


  // const handleConstructButtonClick = (constrList: string[]) => {
  //   if (constrList[0] == 'a') {
  //     onAnswer("right")
  //   } else {
  //     onAnswer("wrong")
  //   }
  // }

  // // END TYPE CONSTRUCTOR 






  // // FOR CONSTRUCTOR inside useEffect
        // //
        // const newFrozen = randomFrozen.map(el => {
        //   if (el.status === 'frozen' && el.time >= prevTime) {
        //   // if (el.status === 'frozen') {
            
        //     // TODO: sound Fire
        //     // controlsAudioConstructFire.play()
        //     return {
        //       // ...el,
        //       index: 0,
        //       time: 0,
        //       status: 'unfrozen',              
        //     };

        //   } else {
        //     // No change
        //     return el;
           
        //   }
        // });
        // // Re-render with the new array

        // setRandomFrozen(newFrozen);

        // // controlsAudioConstructFire





        //     TypeWorkbookTRIANGLE

        // <AnimRightTriangleSin
        //     threeCoordinates = {[0.1, 0.1, 0.9, 0.1, 0.1, 0.6]}
        //     // xCoordinates = {[0.13, 0.47]}
        //     xCoordinates = {[0.7, 0.11]}
        //     arcSVG = {"M 440,42 Q 420,80 460,92"}

        // />




