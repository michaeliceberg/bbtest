'use client'

import React, { useEffect, useState } from 'react'
import { QuestionType } from './page'
import Latex from 'react-latex-next';
import 'katex/dist/katex.min.css';
import { SliderModern } from '@/components/slider-modern';
import { Button } from '@/components/ui/button';




type Props = {
    question: QuestionType
    onAnswer: (answer: string) => void
    questions: QuestionType[]
}

export const TypeSlider = ({
    question,
    onAnswer,
    questions,
}:Props) => {


  const handleSliderButtonClick = (value: number[]) => {
    if (value[0] < rightAnswer*1.2 && value[0] > rightAnswer*0.8) {
  
      setSliderValue([0])
      onAnswer("right")
    } else {
      setSliderValue([0])
      onAnswer("wrong")
      
    }
  }


  const [stateForRandom, setStateForRandom] = useState(questions[0].correctAnswer)


  let randomValueForSlider = 0.2
  useEffect(()=>{
    randomValueForSlider = Math.random()
  }, [stateForRandom])
  
  // const [timeLeft, setTimeLeft] = useState(question.correctAnswer)


  // Math.round(num * 100) / 100
  const rightAnswer = Math.round(+(question.correctAnswer.replace(",","."))*10)/10
  const [sliderValue, setSliderValue] = useState([ rightAnswer * randomValueForSlider])


  return (
    
    <div className="mt-24 mb-5 ">
          

          <SliderModern 
            randomValueForSlider={randomValueForSlider}
            rightAnswer={rightAnswer}
            setSliderValue={setSliderValue}
            sliderValue={sliderValue}
            options={question.options}
          
          />
          <Button
            onClick={()=>{handleSliderButtonClick(sliderValue)}}
            className="mt-12 w-[140px]"
            variant = 'primary'
          >
            <p className="p-4 text-2xl">
            {/* ≈ {sliderValue} */}
            {sliderValue}
            </p>
          </Button>


          </div>
  )
}
