'use client'

import React, { useEffect, useState } from 'react'
import { QuestionType } from './page'
import Latex from 'react-latex-next';
import 'katex/dist/katex.min.css';
import Lottie from 'lottie-react';
import LottieArrowRight from '@/public/Lottie/trainer/LottieArrowRight.json'
import { useAudio } from 'react-use';


type Props = {
    question: QuestionType
    onAnswer: (answer: string) => void
}

export const TypeConnect = ({
    question,
    onAnswer,
}:Props) => {



  const [audioCorrect, _, controlsCorrect] = useAudio({src: '/correct.wav'})
  const [audioInCorrect, _c, controlsInCorrect] = useAudio({src: '/incorrect.wav'})




  
  const [selectedOptionAId, setSelectedOptionAId] = useState<number>()
  const [selectedOptionQId, setSelectedOptionQId] = useState<number>()

  const [selectedOptionAPair, setSelectedOptionAPair] = useState<number>()
  const [selectedOptionQPair, setSelectedOptionQPair] = useState<number>()

  const [listOptionsIdDoneRight, setListOptionsIdDoneRight] = useState<number[]>([])


  useEffect(()=>{
    //
    // ЕСЛИ СОБРАЛИ 6 ПРАВИЛЬНЫХ ОТВЕТОВ
    //
    if (listOptionsIdDoneRight.length == 6) {
      setListOptionsIdDoneRight([])
      onAnswer("right")
    }
    
  },[listOptionsIdDoneRight])
  
  

  useEffect(() => {

    if (selectedOptionAId && selectedOptionQId && selectedOptionAId > 0 && selectedOptionQId > 0)  {
      //
      // Если нажат ответ A и Q
      //

      if (selectedOptionAPair == selectedOptionQPair) {

        // Если ответ правильный, Добавляем пару в Список, чтобы собрать 6 ответов
        //
        const newList = listOptionsIdDoneRight.concat(selectedOptionAId).concat(selectedOptionQId);
        setListOptionsIdDoneRight(newList);

        setSelectedOptionAId(-1)
        setSelectedOptionQId(-2)
        setSelectedOptionAPair(-3)
        setSelectedOptionQPair(-4)

        controlsCorrect.play()

      }
      else {

        setSelectedOptionAId(-1)
        setSelectedOptionQId(-2)
        setSelectedOptionAPair(-3)
        setSelectedOptionQPair(-4)

        setListOptionsIdDoneRight([])

        controlsInCorrect.play()
        onAnswer("wrong")

      }


    } else {
      //
      // Если нажат только один ответ ИЛИ A или Q
      //
      // controlsAudioConstructAdd.play()

      return
    }

  },[selectedOptionAId, selectedOptionQId])




  const handleOptionQClick = (id: number, pair: number) => {

    setSelectedOptionQId(id)
    setSelectedOptionQPair(pair)
    
  }


  const handleOptionAClick = (id: number, pair: number) => {

    setSelectedOptionAId(id)
    setSelectedOptionAPair(pair)   

  }


 



  return (
    
    <div className="grid grid-cols-7 gap-x-2 gap-y-2 mt-10">


    <div className="grid col-span-3 gap-y-2     bg-slate-100 rounded-xl p-4  z-10">

      {question.optionsQ.map((option, index) => (

        <button
          disabled={listOptionsIdDoneRight.includes(option.id)}
          key={index*28748}
          onClick={()=>handleOptionQClick(option.id, option.pairId)}
          className= {selectedOptionQId == option.id 
            ? "bg-cyan-200  border-cyan-300 border-2 border-b-4 active:border-b-2 hover:bg-cyan-200 text-slate-500 inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-bold ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 tracking-wide"

            : listOptionsIdDoneRight.includes(option.id) ? "bg-green-200  border-green-300 border-2 border-b-4 active:border-b-2 hover:bg-green-200 text-slate-500 inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-bold ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 tracking-wide"

            : "bg-white  border-slate-200 border-2 border-b-4 active:border-b-2 hover:bg-slate-100 text-slate-500 inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-bold ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 tracking-wide"
          
            
          }
          >
          <p className="m-4">

            <Latex>
              {option.optQ} 
            </Latex>

          </p>
        </button>
        
      ))}

    </div>




    

    <Lottie 
        className="rotate-90 content-center align-middle z-0"
        animationData={LottieArrowRight} 
    />           




    <div className="grid col-span-3 gap-y-2      bg-slate-100 rounded-xl p-4   z-10">

      {question.optionsA.map((option, index) => (

      <button
        key={index*2874811}
        disabled={listOptionsIdDoneRight.includes(option.id)}
        onClick={()=>handleOptionAClick(option.id, option.pairId)}
        className= {selectedOptionAId == option.id 
          ? "bg-cyan-200  border-cyan-300 border-2 border-b-4 active:border-b-2 hover:bg-cyan-200 text-slate-500 inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-bold ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 tracking-wide "
          
          : listOptionsIdDoneRight.includes(option.id) ? "bg-green-200  border-green-300 border-2 border-b-4 active:border-b-2 hover:bg-green-200 text-slate-500 inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-bold ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 tracking-wide"

          : "bg-white  border-slate-200 border-2 border-b-4 active:border-b-2 hover:bg-slate-100 text-slate-500 inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-bold ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 tracking-wide"
        }
        >
        <p className="m-4">
          <Latex>
            {option.optA} 
          </Latex>
        </p>
      </button>
      
      ))}

    </div>


  </div>
  )
}
