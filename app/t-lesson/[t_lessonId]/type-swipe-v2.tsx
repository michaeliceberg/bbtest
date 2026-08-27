import React, { useState } from 'react'
import { QuestionType } from './page'
import SwipeArena from './swipe-arena'

type Props = {
    question: QuestionType
    onAnswer: (answer: string) => void
}

export const TypeSwipeV2 = ({
    question,
    onAnswer,
}: Props) => {
    const [lrAnswer, setLrAnswer] = useState(0)

    const handleSwipeAnswer = (selectedOption: string) => {
        onAnswer(selectedOption)
    }

    return (
        <SwipeArena
            onAnswer={handleSwipeAnswer}
            question={question}
            setLrAnswer={setLrAnswer}
        />
    )
}
