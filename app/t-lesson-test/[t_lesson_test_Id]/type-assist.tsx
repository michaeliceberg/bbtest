import React from 'react'
import { QuestionType } from './page'
import Latex from 'react-latex-next';
import 'katex/dist/katex.min.css';


type Props = {
    question: QuestionType
    onAnswer: (answer: string) => void
}

export const TypeAssist = ({
    question,
    onAnswer,
}:Props) => {

  return (
    
    <div className="grid grid-cols-2 gap-x-2 gap-y-2 mt-10">
          
    {question.options.map((option, index) => (

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
          
    ))}

  
  </div>
  )
}



