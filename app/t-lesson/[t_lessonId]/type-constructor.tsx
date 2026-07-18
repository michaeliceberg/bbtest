'use client'

import React, { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { QuestionType } from './page'
import Latex from 'react-latex-next';
import 'katex/dist/katex.min.css';
import { useAudio } from 'react-use';
import { Button } from '@/components/ui/button';
import LottieArrowRight from '@/public/Lottie/trainer/LottieArrowRight.json'
import LottieSkull from '@/public/Lottie/trainer/frozen/LottieSkull.json'

const Lottie = dynamic(() => import('lottie-react'), { ssr: false })


type Props = {
    question: QuestionType
    onAnswer: (answer: string) => void
}

export const TypeConstructor = ({
    question,
    onAnswer,
}:Props) => {


// START TYPE CONSTRUCTOR 

const FrozenList = ['unfrozen','unfrozen','unfrozen','unfrozen','frozen','frozen']
const FrozenTimeList = [3, 4, 5, 6, 7, 8]


// AUDIO
// const [audioConstructAdd, _ca, controlsAudioConstructAdd] = useAudio({src: '/Lottie/trainer/frozen/sounds/soundClick2.mp3'})
// const [audioConstructFire, _cf, controlsAudioConstructFire] = useAudio({src: '/Lottie/trainer/frozen/sounds/soundClickFire1.mp3'})

//
// const [randomFrozen, setRandomFrozen] = useState(
// [
//   { index: 0, time: 0, status: 'unfrozen' },
//   { index: 1, time: 0, status: 'unfrozen' },
//   { index: 2, time: 3, status: 'frozen' },
//   { index: 3, time: 0, status: 'unfrozen' },
//   { index: 4, time: 7, status: 'frozen' },
//   { index: 5, time: 8, status: 'frozen' },
// ])


const [randomFrozen, setRandomFrozen] = useState(
  [
    { index: 0, time: FrozenTimeList[Math.floor(Math.random()*FrozenTimeList.length)], status: FrozenList[Math.floor(Math.random()*FrozenList.length)] },
    { index: 1, time: FrozenTimeList[Math.floor(Math.random()*FrozenTimeList.length)], status: FrozenList[Math.floor(Math.random()*FrozenList.length)] },
    { index: 2, time: FrozenTimeList[Math.floor(Math.random()*FrozenTimeList.length)], status: FrozenList[Math.floor(Math.random()*FrozenList.length)] },
    { index: 3, time: FrozenTimeList[Math.floor(Math.random()*FrozenTimeList.length)], status: FrozenList[Math.floor(Math.random()*FrozenList.length)] },
    { index: 4, time: FrozenTimeList[Math.floor(Math.random()*FrozenTimeList.length)], status: FrozenList[Math.floor(Math.random()*FrozenList.length)] },
    { index: 5, time: FrozenTimeList[Math.floor(Math.random()*FrozenTimeList.length)], status: FrozenList[Math.floor(Math.random()*FrozenList.length)] },
  ])
  


const [constructorList, setConstructorList] = useState<string[]>(['', '', ''])

const handleConstructorAddClick = (option: string ) => {
  
  // AUDIO
  // controlsAudioConstructAdd.play()
  const indexEmpty = constructorList.indexOf('')

  if (indexEmpty > -1) {
    //
    // есть ли -1 ?
    //
    let newList = constructorList
    newList[indexEmpty] = option
    setConstructorList(newList)

  
  }
  
}


const handleConstructorDelClick = (delIndex: number) => {

    // AUDIO
    // controlsAudioConstructAdd.play()
    let newList = constructorList
    newList[delIndex] = ''
    setConstructorList(newList)

  
}


const handleConstructButtonClick = (constrList: string[]) => {
  if (constrList[0] == 'a') {
    onAnswer("right")
  } else {
    onAnswer("wrong")
  }
}

// END TYPE CONSTRUCTOR 


  return (
    
    <div>

            <div className="mt-4 mb-4">
              
              {constructorList[0] !== ''
              ? <Button 
                  variant='super'
                  size='construct'
                  onClick={()=>handleConstructorDelClick(0)}
                >
                  {constructorList[0]} 
                </Button>

              : <Button 
                  className={constructorList.indexOf('') == 0 ? "bg-sky-200/90 text-white animate-bounce": ""}
                  variant='construct' 
                  size='construct'
                > 
                  1 
                </Button>
              }

              {constructorList[1] !== ''
              ? <Button 
                  variant='super'
                  size='construct' 
                  className="ml-4 mr-4"
                  onClick={()=>handleConstructorDelClick(1)}
                > 
                  {constructorList[1]} 
                </Button>

              : <Button 
                  variant='construct' 
                  size='construct' 
                  className={constructorList.indexOf('') == 1  ? "bg-sky-200/90 text-white animate-bounce ml-4 mr-4 ": "ml-4 mr-4"}
                > 
                  2 
                </Button>
              }
              
              {constructorList[2] !== ''
              ? <Button size='construct'
                variant='super'
                onClick={()=>handleConstructorDelClick(2)}
                > 
                {constructorList[2]} 
                </Button>

              : <Button 
                  variant='construct' 
                  size='construct'
                  className={constructorList.indexOf('') == 2  ? "bg-sky-200/90 animate-bounce text-white": ""}
                > 
                  3 
                </Button>
              }
              
            </div>









            <div className="grid grid-cols-2 gap-x-2 gap-y-2 mt-10">
            
              {question.options.map((option, index) => (

                    <button

                      disabled= {
                        randomFrozen.filter(el => el.index == index)[0] && randomFrozen.filter(el => el.index == index)[0].status === 'frozen'
                      }

                      key={index*2228748}
                      onClick={() => handleConstructorAddClick(option)}
                      
                      className="h-24 inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-bold ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 tracking-wide bg-[#151F23] border-[#3A464E] border-2 border-b-4 active:border-b-2 hover:bg-[#232F34] text-[#9AA7B0]"
                    >

                      <p className="m-4">

                      { 
                      randomFrozen.filter(el => el.index == index)[0] && randomFrozen.filter(el => el.index == index)[0].status === 'frozen'  
                      ?
                        <Lottie 
                          className="h-16 w-16 pb-2 content-center" 
                          animationData={LottieSkull}
                        /> 
                      :
                        <Latex>
                          {option}
                        </Latex>
                      }



                      </p>
                    </button>
                    
              ))}

            
            </div>


            <Button 
              className="mt-8" 
              variant= 'primary'
              disabled={constructorList.filter(x => x=='').length !== 0}
              onClick={()=>{handleConstructButtonClick(constructorList)}}
            >
              готово
            </Button>

          </div>

    
  )
}
