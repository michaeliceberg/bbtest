import React, { useState } from 'react'
import { QuestionType } from './page'
import Latex from 'react-latex-next';
import 'katex/dist/katex.min.css';
import UseTransform from './swipe-component';


type Props = {
    question: QuestionType
    onAnswer: (answer: string) => void
}

export const TypeSwipe = ({
    question,
    onAnswer,
}:Props) => {


  const [lrAnswer, setLrAnswer] = useState(0)



  return (
    
    // <div className="grid grid-cols-2 gap-x-2 gap-y-2 mt-10">
    <div className="mt-10">
          

    <Latex>
      {question.options[0]}
    </Latex>


    
    {/* {question.options.map((option, index) => (

          <button
            key={index*28748}
            onClick={() => onAnswer(option)}
            className="inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-bold ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 tracking-wide bg-white border-slate-200 border-2 border-b-4 active:border-b-2 hover:bg-slate-100 text-slate-500"
          >
            <p className="m-4">
              <Latex>
                {option}
              </Latex>
            </p>
          </button>
          
    ))} */}

  

  <UseTransform 
    onAnswer={onAnswer}
    question={question}
    setLrAnswer={setLrAnswer}
    // trigger={question.} 
  />



  </div>
  )
}



