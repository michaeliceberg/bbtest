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

