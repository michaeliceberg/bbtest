import React, { useState } from 'react'
import { QuestionType } from './page'
import Latex from 'react-latex-next';
import 'katex/dist/katex.min.css';
import SwipeCard from './swipe-component';

type Props = {
    question: QuestionType
    onAnswer: (answer: string) => void
}

export const TypeSwipe = ({
    question,
    onAnswer,
}: Props) => {
    const [lrAnswer, setLrAnswer] = useState(0)

    // Функция обработки ответа - передаём выбранный вариант
    const handleSwipeAnswer = (selectedOption: string) => {
        onAnswer(selectedOption)
    }

    return (
        <div className="mt-10">
            <SwipeCard 
                onAnswer={handleSwipeAnswer}
                question={question}
                setLrAnswer={setLrAnswer}
            />
        </div>
    )
}





// import React, { useState } from 'react'
// import { QuestionType } from './page'
// import Latex from 'react-latex-next';
// import 'katex/dist/katex.min.css';
// import UseTransform from './swipe-component';


// type Props = {
//     question: QuestionType
//     onAnswer: (answer: string) => void
// }

// export const TypeSwipe = ({
//     question,
//     onAnswer,
// }:Props) => {


//   const [lrAnswer, setLrAnswer] = useState(0)



//   return (
    
//     // <div className="grid grid-cols-2 gap-x-2 gap-y-2 mt-10">
//     <div className="mt-10">
          

//     <Latex>
//       {question.options[0]}
//     </Latex>


    
  

//   <UseTransform 
//     onAnswer={onAnswer}
//     question={question}
//     setLrAnswer={setLrAnswer}
//     // trigger={question.} 
//   />



//   </div>
//   )
// }



