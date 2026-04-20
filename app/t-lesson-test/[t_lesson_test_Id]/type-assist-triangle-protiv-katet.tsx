'use client'

import React from 'react'
import { QuestionType } from './page'



import { MotionProps, useAnimationControls } from "framer-motion";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ArrowDownLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SnapPointsType, useSnap } from './useSnap';



// type Props = {
//   question: QuestionType
//   onAnswer: (answer: string) => void
// }


type Props = {
    threeCoordinates: number[],
    xCoordinates: number[],
    arcSVG: string,
    answer: string[],
    onAnswer: (answer: string) => void
}



export const TypeAssistTRIANGLEgdeProtivKatet = ({
    threeCoordinates,
    xCoordinates,
    arcSVG,
    answer,
    onAnswer,

}: Props) => {

    const [x1, y1, x2, y2, x3, y3] = threeCoordinates

    const strokeWidth = 10

    const handleWidth = 125;
    const handleHeight = 45;

    const HEIGHT_FORMULA_COEFF = 0.8
    const SIN_X_SHIFT_FORMULA = 200

    const colorLineSlate = "#cbd5e1"  // slate300
    
    const colorLineList = [
        "#22c55e",   // green500
        "#0ea5e9",   // sky500
        "#a855f7",   // purple500
    ]

    // const tailwindColorLineList = [
    //     'bg-green-500', 
    //     'bg-sky-500', 
    //     'bg-purple-500'
    // ]

    // const colorCircle1 = "#16a34a"  // green600
    // const colorCircle2 = "#0284c7"  // sky600
    // const colorCircle3 = "#9333ea"  // purple600
    

    const containerRef = useRef<HTMLDivElement>(null);

    const [width, setWidth] = useState(0);
    const [height, setHeight] = useState(0);
    const [left, setLeft] = useState(0);
    const [top, setTop] = useState(0);
 
    useLayoutEffect(() => {
        setWidth(containerRef.current?.getBoundingClientRect().width ?? 0);
        setHeight(containerRef.current?.getBoundingClientRect().height ?? 0);
        setLeft(containerRef.current?.getBoundingClientRect().left ?? 0);
        setTop(containerRef.current?.getBoundingClientRect().top ?? 0);
    }, []);




    type initialestateType = {
        pointId: number;
        isFree: boolean;
        occupiedBy: number;
        coord: {
            x?: number;
            y?: number;
        };
    }[]

    //555
    const initialestate:initialestateType = [

        {
            pointId: 0,
            isFree: false,
            occupiedBy: -1,
            coord: { x:0, y: 0 }, 

        },
        
        // INITIAL STATE (Кнопки находятся в точках)
        
        {
            pointId: 1,
            isFree: true,
            occupiedBy: 0,
            coord: { x: (x1+x2) * width /2, y: (y1+y2) * height /2 }, 

        },
        {
            pointId: 2,
            isFree: true,
            occupiedBy: 1,
            coord: { x: (x2+x3) * width /2, y: (y2+y3) * height /2 },
        },
        {
            pointId: 3,
            isFree: true,
            occupiedBy: 2,
            coord: { x: (x1+x3) * width /2, y: (y1+y3) * height /2 },
        },

        // точки для SNAP FORMULA

       
    ]

    const [BigSnapListState, setBigSnapListState] = useState(initialestate)

    // Так как вначале width и height не посчиталось, надо через useEffect обновить Snap координаты
    //
    useEffect(()=> {
        setBigSnapListState(initialestate)
    }, [width, height])


    

    const ButtonList =  [
        {
            id: 0,
            text: 'прот. к',
            buttonRef: useRef<HTMLButtonElement>(null),
        },
        {
            id: 1,
            text: 'прил. к',
            buttonRef: useRef<HTMLButtonElement>(null),
        },
        {
            id: 2,
            text: 'гипотенуза',
            buttonRef: useRef<HTMLButtonElement>(null),
        },

    ]



    

    const lineCoordinates = [
        {
            x1: width * x1,
            y1: height * y1,
            x2: width * x2,
            y2: height * y2,
        },
        {
            x1: width * x2,
            y1: height * y2,
            x2: width * x3,
            y2: height * y3,
        },
        {
            x1: width * x3,
            y1: height * y3,
            x2: width * x1,
            y2: height * y1,
        },
    ]




    // TODO: СОБИРАЕМ useSnap

    const points = BigSnapListState.map(point => point.coord)

    const snapPoints:SnapPointsType = {
        type: 'constraints-box',
       
        unit: 'pixel',
        points: points,
    };
 
    type TypeUseSnapList= {
        buttonId: number;
        buttonIndex: number;
        dragProps: Pick<MotionProps, "onDragStart" | "onDragEnd" | "onMeasureDragConstraints" | "drag" | "dragMomentum"> & Partial<Pick<MotionProps, "dragConstraints">>
        currentSnappointIndex: number | null;
    }[]

    let useSnapList: TypeUseSnapList= []


    
    
    // Хук useSnap нельзя пихать в ButtonList.map, поэтому 3 отдельных индекса ii
    //
    let ii = 0
    let spanResult  = useSnap(
        
        {   
            direction: 'both',
            ref: ButtonList[ii].buttonRef,
            constraints: containerRef,

            snapPoints: 
            { 
                type: snapPoints.type,
                unit: snapPoints.unit,
                
                // сюда вставляем СВОБОДНЫЕ snap point
                points: snapPoints.points,
            },
            
        })

    useSnapList[ii]=
        {
            buttonId: ButtonList[ii].id,
            buttonIndex: ii,
            dragProps: spanResult.dragProps,
            currentSnappointIndex: spanResult.currentSnappointIndex       
        }
    




        ii = 1
        spanResult  = useSnap(
        
            {
                
                direction: 'both',
                ref: ButtonList[ii].buttonRef,
                constraints: containerRef,
    
                snapPoints: 
                { 
                    type: snapPoints.type,
                    unit: snapPoints.unit,
                    
                    // сюда вставляем СВОБОДНЫЕ snap point
                    points: snapPoints.points,
                },
                
            })

        useSnapList[ii]=
            {
                buttonId: ButtonList[ii].id,
                buttonIndex: ii,
                dragProps: spanResult.dragProps,
                currentSnappointIndex: spanResult.currentSnappointIndex       
            }








            ii = 2
            spanResult  = useSnap(
            
                {                    
                    direction: 'both',
                    ref: ButtonList[ii].buttonRef,
                    constraints: containerRef,
        
                    snapPoints: 
                    { 
                        type: snapPoints.type,
                        unit: snapPoints.unit,
                        
                        // сюда вставляем СВОБОДНЫЕ snap point
                        points: snapPoints.points,
                    },
                    
                })
    
            useSnapList[ii]=
                {
                    buttonId: ButtonList[ii].id,
                    buttonIndex: ii,
                    dragProps: spanResult.dragProps,
                    currentSnappointIndex: spanResult.currentSnappointIndex       
                }







    // РИСУЕМ:

    const draw = {
        hidden: { pathLength: 0, opacity: 0 },
        visible: (i: number) => {
            const delay = i * 0.5
            return {
                pathLength: 1,
                opacity: 1,
                transition: {
                    pathLength: { delay, type: "spring", duration: 1.5, bounce: 0 },
                    opacity: { delay, duration: 0.01 },
                },
            }
        },
    }

    
    const controlsColor0 = useAnimationControls()
    const controlsColor1 = useAnimationControls()
    const controlsColor2 = useAnimationControls()  

    const controlsColorBG0 = useAnimationControls()
    const controlsColorBG1 = useAnimationControls()
    const controlsColorBG2 = useAnimationControls()

    const listControlsColorLine = [
        controlsColor0,
        controlsColor1,
        controlsColor2,
    ]

    const listControlsColorBG = [
        controlsColorBG0,
        controlsColorBG1,
        controlsColorBG2,
    ]


    const [isDone, setIsDone] = useState(false) // выбран ли ответ (но еще не нажата кнопка "ОТВЕТИТЬ")
    const [isDoneRight, setIsDoneRight] = useState(false) // правильный ли ответ


    // BL - ButtonList useState
    // PTP - POINTS TO PLOT useState
    //
    const [BL, setBL] = useState( ButtonList.map(el => {
        return (
            {
                buttonId: el.id,
                snapPointId: 0,
                snapColor: "#222222",
                isSnapped: false,
            }
        )
    }) )

    const [PTP, setPTP] = useState( 
        initialestate.slice(1).map(el => {
            return (
                {
                    snapPointId: el.pointId,
                    snapColor: "#abcabc",
                    isSnapped: false,
                }
            )
        }) )

  


    // СУПЕР АЛГОРИТМ С ДОБАВЛЕНИЕМ 0 МАГНИТА В ЗАНЯТУЮ ТОЧКУ
    //
    useEffect(()=>{
   
        const LifeSaver = useSnapList.map(useSnapResult => {
            
            return (
            {
                currentSnappointIndex: useSnapResult.currentSnappointIndex || 0,
                buttonId: useSnapResult.buttonId,

            })
        })

        const OccupiedPointsObject = LifeSaver.filter(el => el.currentSnappointIndex > 0)
        const OccupiedPointsList = OccupiedPointsObject.map(el => el.currentSnappointIndex)
        
        // 
        //
        let newInitialState:initialestateType = []
        
        initialestate.map((point, index) => {
                if (!OccupiedPointsList.includes(index)) {
                    //
                    // Говорим что ТОЧКА СВОБОДНА 
                    //
                    newInitialState.push({
                        pointId: point.pointId,
                        isFree: true,
                        occupiedBy: -1,
                        coord: point.coord,
                    })
                    return {
                point
              } 
            } 
            else {
                //
                // Говорим что ТОЧКА ЗАНЯТА 
                //
                // вместо занятой точки, пихаем МАГНИТ { y: 0 }
                newInitialState.push({
                    pointId: point.pointId,
                    isFree: false,
                    occupiedBy: LifeSaver.filter(p => p.currentSnappointIndex == point.pointId)[0].buttonId,
                    coord: initialestate[0].coord,
                }
                    
                )
            }
        });

        // ПЕРЕОБНОВЛЯЕМ НАЧАЛЬНОЕ СОСТОЯНИЕ чтобы координаты занятых Магнитов стали в x 0, y 0
        //
        setBigSnapListState(newInitialState)
        //
        

        // Создаем объект: со ВСЕМИ СТИКЕРАМИ. Если кнопка НЕ занимает SNAP POINT то snapPointId = -1
        // Если заняты - красим в цвет, иначе SLATE
        //
        const ButtonListWithSnap = ButtonList.map((button, index) => {
            const occPoint = newInitialState.filter(el=>el.occupiedBy == button.id)
            return (
                {
                    buttonId: button.id,
                    buttonText: button.text,
                    snapPointId: occPoint.length > 0 ? occPoint[0].pointId : -1,
                    snapColor: occPoint.length > 0 ? colorLineList[index]: colorLineSlate,
                    isSnapped: occPoint.length > 0 ? true : false,
                }
            )
        })

        setBL(ButtonListWithSnap)

        // console.log('ButtonListWithSnap ---- ', ButtonListWithSnap)

        const snapPointsToPaint = initialestate.slice(1).map(snapPoint =>{
            const snapFound = ButtonListWithSnap.filter(button => button.snapPointId == snapPoint.pointId)
            return (
                {
                    snapPointId: snapPoint.pointId,
                    snapColor: snapFound.length > 0 ? snapFound[0].snapColor : colorLineSlate,
                    isSnapped: snapFound.length > 0 ? true : false,
                }
            )
        })

        setPTP(snapPointsToPaint)
     
        // console.log('snapPointsToPaint ---- ', snapPointsToPaint)
        

        // Перекрашиваем отдельно Buttons CТИКЕРЫ - отдельно Линии 
        //
        // красим Buttons CТИКЕРЫ
        //
        // TODO:  НЕ УСПЕВАЮТ ПОМЕНЯТЬСЯ для перекрашивания стикеров
        // console.log('BL ',BL)
        // console.log('PTP ',PTP)

        ButtonListWithSnap.map( el => {
            if (el.isSnapped) {
                listControlsColorBG[el.buttonId].start('snapColorBG')
                // console.log( ' перекрасили buttonId:', el.buttonId )

            } 
            // else {
            //     listControlsColorBG[el.buttonId].start('initialBG')
            // }
        })
        //
        // красим ЛИНИИ
        //
        snapPointsToPaint.map( el => {
            if (el.isSnapped) {
            // Линии это IdSnap МИНУС 1  потому что НУЛЕВОЙ snap  это x 0 y 0
            listControlsColorLine[el.snapPointId - 1].start('snapColor')
            // console.log( ' перекрасили el.snapPointId - 1:', el.snapPointId - 1 )

            } else {
            // Линии это IdSnap МИНУС 1  потому что НУЛЕВОЙ snap  это x 0 y 0
            listControlsColorLine[el.snapPointId - 1].start('initial')
            }
        })



        // готовим ОТВЕТ
        //
        let isDone = true
        ButtonListWithSnap.map(el => {
            if (el.snapPointId > 0) {} else {isDone = false}
        })
        setIsDone(isDone)


        if ( isDone ){
            ButtonListWithSnap.sort((a, b) => a.snapPointId - b.snapPointId);
            // console.log('SORTED ', ButtonListWithSnap)
            let isRight = true
            ButtonListWithSnap.map((el, index) => {
                if (el.buttonText == answer[index]) {} else {isRight = false}
            })
            setIsDoneRight(isRight)
            // console.log(isRight)
        }
        

        

        
    }, useSnapList.map(el => el.currentSnappointIndex)
)





// Просто функция placeDiv , которой потом пользуемся
//
function placeDiv(x_pos: number, y_pos: number, elementId: string) {
    var d = document.getElementById(elementId);
    if (d) 
        {
            d.style.position = "absolute";
            d.style.left = x_pos+'px';
            d.style.top = y_pos+'px';
        }
}

useEffect(()=>{

    // Div для Угла X на треугольнике
    placeDiv(xCoordinates[0]*width, xCoordinates[1]*height, 'x')
    
    // Div для кнопки ответа
    placeDiv(width * 0.5 - 50, height - 80, 'btnAnswer')

}, [width, height, left, top])
    




    // const containerVariantsForButtons = {
    //     hidden: {
    //         opacity: 0,
    //         y: 20,
    //     },
    //     visible: {
    //         opacity: 1,
    //         y: 0,
    //     },

    // }


    const HandleClickAnswerButton = () => {
        if (isDoneRight) 
            {
                onAnswer("right")
            }
        else 
            {
                onAnswer("wrong")
            }
    }


  return (
    




  <motion.div 
  className="SnappingExample" 
  ref={containerRef}
>
  
  
  {/* TODO: 234 СТИКЕРЫ - кнопки,  которые перетягиваем */}

   {ButtonList.map( (button, index) => 

      <motion.button 
          key={index*51078}
          id={`${button.id}`}
          ref={button.buttonRef}
          className={`text-xl rounded text-primary-foreground `}
          style={{ width: handleWidth, height: handleHeight }} 
            // backgroundColor: BL[index].snapColor }} 
          drag 
          dragConstraints={containerRef}
          {...useSnapList[index].dragProps}

          custom={13}
          

          variants = {{
            //   hidden: {
            //     opacity: 0,
            //     scale: 0,
            //     // y: -20,
            //   },

              initialBG: {
                backgroundColor: colorLineSlate,
                opacity: 0.8,
                // opacity: 0.1,
                  
              },
              snapColorBG: {
                
                backgroundColor: BL[index].snapColor,
                opacity: 0.8,
              },
          }}



        initial = 'initialBG'
        animate= {listControlsColorBG[index]}
        // animate= {handleButtonAnimate(index)}
          

          whileHover={{
              scale: 1.2,
              rotate: 5,
              transition: { duration: 0.2 },
          }}
          whileTap={{
              scale: 0.8,
              rotate: -5,
          }}
          transition={{
              type: "spring",
              stiffness: 400,
              damping: 17,
          }}
      


      >
              
          {button.text}

          {/* <motion.div className="absolute top-0 -pt-4  text-white text-2xl"> */}
          <motion.div className="absolute bottom-0 -pb-4  text-white text-2xl">

              {/* <ArrowUpLeft size='20' /> */}
              <ArrowDownLeft size='20' />

          </motion.div>


      </motion.button>
      
  )} 







  {/* угол X */}
                  
  <motion.div
      id='x'
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1, rotateZ: 360 }}

      transition={{ delay: 4, type: 'spring', stiffness: 300 }}

    //   transition={{
    //         delay: 3,
    //         // duration: 0.4,
    //         // scale: { type: "spring", visualDuration: 0.4, bounce: 0.5 },
    //         // duration: 0.4,
    //         // scale: { type: "spring", visualDuration: 0.4, bounce: 0.5 },
    //       }}
      className="absolute text-3xl text-slate-300 font-bold"
  >
      x 

  </motion.div>





  {/* TODO: ОТВЕТ */}

  <Button 
      id = 'btnAnswer'
      disabled = {!isDone}
      className = "absolute"
      variant='primary'
      onClick={HandleClickAnswerButton}
  >
      ответить
  </Button>






  <motion.svg
      width= {width}
      height= {height}
      initial="hidden"
      animate="visible"
  >



{/*  Дуга УГЛА 222
<motion.path
transition={transition}
initial={{ pathLength: 0.001 }}
animate={{ pathLength: 1 }}
// 123
// threeCoordinates = {[40, 40, 550, 40, 40, 350]}
d={arcSVG}
fill="none"
stroke={colorLineSlate}
strokeWidth="11"
strokeLinecap="round" 
// custom={5}
/> */}









      {/* TODO:  LINES    рисуем серые линии */}

      {lineCoordinates.map((line, index) => (

          <motion.line
              key={index*5131078}

              x1 = {line.x1}
              y1 = {line.y1}
              x2 = {line.x2}
              y2 = {line.y2}
              stroke = {colorLineSlate}
              variants = {draw}
              custom={2 + index * 1.5}
              style={{
                  strokeWidth: strokeWidth,
                  strokeLinecap: "round",
                  fill: "transparent",
              }}
          />

      ))}



      {/* TODO: 123 рисуем ЦВЕТНЫЕ SNAP линии (просто меняем Opacity) */}


      {lineCoordinates.map((line, index) => (
        <motion.line
              key={index*5107851}

              x1 = {line.x1}
              y1 = {line.y1}
              x2 = {line.x2}
              y2 = {line.y2}
            stroke= {PTP[index].snapColor}

              variants = {{
                  initial: {
                      opacity: '0',
                  },
                  snapColor: {
                      opacity: [0, 1],
                  }
              }}
              custom={0}
              style={{
                  strokeWidth: strokeWidth,
                  strokeLinecap: "round",
                  fill: "transparent",
              }}
              initial = 'initial'
              animate = {listControlsColorLine[index]}

        />



      ))}
      









      {/* TODO:   GRAY   CIRCLE  на Lines */}

      {lineCoordinates.map((line, index) => (

          <motion.circle  
              key={index*55101783}

              cx={(line.x1+line.x2)/2}
              cy={(line.y1+line.y2)/2}
              r="4"
              // stroke= {colorCircle1}
              stroke= {colorLineSlate}

              variants={draw}
              custom={6.5}
              style={{
                  strokeWidth: strokeWidth,
                  strokeLinecap: "round",
                  fill: "transparent",
              }}
          />

      ))}




      {/* TODO: COLOR circle SNAP на Lines */}

      {lineCoordinates.map((line, index) => (

          <motion.circle  
              key={index*5106378}

              cx={(line.x1+line.x2)/2}
              cy={(line.y1+line.y2)/2}
              r="4"
            //   stroke= {colorLineList[index]}
              stroke= {PTP[index].snapColor}

              variants = {{
                  initial: {
                      opacity: '0'
                  },
                  snapColor: {
                      opacity: [0, 1],
                  }
              }}

              custom={0}
              style={{
                  strokeWidth: strokeWidth,
                  strokeLinecap: "round",
                  fill: "transparent",
              }}

              initial = 'initial'
              animate = {listControlsColorLine[index]}
          />


      ))}

      








  </motion.svg> 


  

</motion.div>
);





  
}






        // let isSnapped_4 = false
        // let isSnapped_5 = false

        // useSnapList.map((useSnapResult, indexButton) => {
                
        //     // 
        //     // Перекрашивем если CurrentSnapPointIndex > 0  (null - начальное состояние)
        //     //
        //     if (useSnapResult.currentSnappointIndex && useSnapResult.currentSnappointIndex > 0) {
        //         listControlsColorLine[useSnapResult.buttonIndex].start('snapColor') 
        //     }

        //     // if (useSnapResult.currentSnappointIndex != indexButton + 1) 
        //     //     {
        //     //         listControlsColorLine[indexButton].start('snapColor') 
        //     //         listControlsColorBG[indexButton].start('snapColorBG')
        //     //     } else {
        //     //         listControlsColorLine[indexButton].start('initial') 
        //     //         listControlsColorBG[indexButton].start('initialBG')
        //     //     }   


        //     // Смотрим, был ли дан ответ (заняты ли Snap4 и Snap5)
        //     //
        //     if (useSnapResult.currentSnappointIndex == 4) {
        //         isSnapped_4 = true
        //     }
        //     if (useSnapResult.currentSnappointIndex == 5) {
        //         isSnapped_5 = true
        //     }        
        //     if (isSnapped_4 && isSnapped_5) {
        //         setIsAnswered(true)
        //     } else {
        //         setIsAnswered(false)
        //     }
                

        // })




