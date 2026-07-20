import TQuiz from "@/app/t-lesson/[t_lessonId]/TQUIZ"
import { QuestionType } from "@/app/t-lesson/[t_lessonId]/page"

export const dynamic = 'force-dynamic'

export default function DemoAssistPage() {
  const demoQuestions: QuestionType[] = [
    {
      id: 1,
      questionType: "ASSIST",
      question: "Выбери правильный ответ",
      imageSrc: "0",
      options: ["Ответ A", "Ответ B", "Ответ C", "Ответ D"],
      numRans: "0",
      optionsQ: [],
      optionsA: [],
      optionsConstructRight: [],
      correctAnswer: "Ответ B",
      timeLimit: 30,
      difficulty: "1",
    } as any,
    {
      id: 2,
      questionType: "ASSIST",
      question: "Выбери правильный ответ (вопрос 2)",
      imageSrc: "0",
      options: ["Вариант 1", "Вариант 2", "Вариант 3", "Вариант 4"],
      numRans: "0",
      optionsQ: [],
      optionsA: [],
      optionsConstructRight: [],
      correctAnswer: "Вариант 3",
      timeLimit: 30,
      difficulty: "1",
    } as any,
  ]

  return (
    <TQuiz
      t_lessonId={999}
      t_lessonTitle="Demo ASSIST"
      questions1={demoQuestions}
      userName="TestUser"
    />
  )
}
