// 'use client'

// import React, { RefObject } from 'react'
// import { QuestionType } from './page'
// import Latex from 'react-latex-next';
// import 'katex/dist/katex.min.css';



// import { BoundingBox, MotionProps, useAnimationControls } from "framer-motion";
// import { useEffect, useLayoutEffect, useRef, useState } from "react";
// import { motion } from "framer-motion";
// import { ArrowUpLeft } from "lucide-react";
// import { Button } from "@/components/ui/button";
// import { SnapPointsType, useSnap } from './useSnap';
// import { useSnapFTrue } from './useSnapFTrue';



// // type Props = {
// //   question: QuestionType
// //   onAnswer: (answer: string) => void
// // }


// type Props = {
//     ButtonList: {
//         id: number;
//         text: string;
//         buttonRef: RefObject<HTMLButtonElement>;
//     }[]
    
// }



// // export const TypeAssistTRIANGLE_4_T = ({ ButtonList }: Props) => {
// export const TypeAssistTRIANGLE_4_T = () => {

//     // const [x1, y1, x2, y2, x3, y3] = threeCoordinates

//     const strokeWidth = 10

//     const handleWidth = 45;
//     const handleHeight = 45;

//     const HEIGHT_FORMULA_COEFF = 0.8
//     const SIN_X_SHIFT_FORMULA = 200

//     const colorLineSlate = "#cbd5e1"  // slate300
    
//     const colorLineList = [
//         "#22c55e",   // green500
//         "#0ea5e9",   // sky500
//         "#a855f7",   // purple500
//     ]

//     // const tailwindColorLineList = [
//     //     'bg-green-500', 
//     //     'bg-sky-500', 
//     //     'bg-purple-500'
//     // ]

//     // const colorCircle1 = "#16a34a"  // green600
//     // const colorCircle2 = "#0284c7"  // sky600
//     // const colorCircle3 = "#9333ea"  // purple600
    

//     const containerRef = useRef<HTMLDivElement>(null);

//     const [width, setWidth] = useState(0);
//     const [height, setHeight] = useState(0);
//     const [left, setLeft] = useState(0);
//     const [top, setTop] = useState(0);
 
//     useLayoutEffect(() => {
//         setWidth(containerRef.current?.getBoundingClientRect().width ?? 0);
//         setHeight(containerRef.current?.getBoundingClientRect().height ?? 0);
//         setLeft(containerRef.current?.getBoundingClientRect().left ?? 0);
//         setTop(containerRef.current?.getBoundingClientRect().top ?? 0);
//     }, []);




//     type initialestateType = {
//         pointId: number;
//         isFree: boolean;
//         occupiedBy: number;
//         coord: {
//             x: number;
//             y: number;
//         };
//     }[]

//     //555

//     const X_START = 0.3
//     const X_STEP = 0.2

//     const Y_START = 0.3
//     const Y_STEP = 0.2


//     const initialestate:initialestateType = [

//         {
//             pointId: 0,
//             isFree: true,
//             occupiedBy: -1,
//             coord: { y: 0 }, 

//         },
        
//         // точки для SNAP FORMULA
        
//         {
//             pointId: 1,
//             isFree: false,
//             occupiedBy: -1,
//             coord: { x: X_START * width, y: Y_START * height }, 

//         },
//         {
//             pointId: 2,
//             isFree: false,
//             occupiedBy: -1,
//             coord: { x: (X_START + X_STEP) * width, y: Y_START * height + 120 },
//         },
//         {
//             pointId: 3,
//             isFree: false,
//             occupiedBy: -1,
//             coord: { x: (X_START + 2 * X_STEP) * width, y: Y_START * height },
//         },




//         {
//             pointId: 4,
//             isFree: false,
//             occupiedBy: -1,
//             coord: { x: X_START * width, y: (Y_START + Y_STEP) * height }, 

//         },
//         {
//             pointId: 5,
//             isFree: false,
//             occupiedBy: -1,
//             coord: { x: (X_START + X_STEP) * width, y: (Y_START + Y_STEP) * height },
//         },
//         {
//             pointId: 6,
//             isFree: false,
//             occupiedBy: -1,
//             coord: { x: (X_START + 2 * X_STEP) * width, y: (Y_START + Y_STEP) * height },
//         },



//         {
//             pointId: 7,
//             isFree: false,
//             occupiedBy: -1,
//             coord: { x: X_START * width, y: (Y_START + 2 * Y_STEP) * height }, 

//         },
//         {
//             pointId: 8,
//             isFree: false,
//             occupiedBy: -1,
//             coord: { x: (X_START + X_STEP) * width, y: (Y_START + 2 * Y_STEP) * height },
//         },
//         {
//             pointId: 9,
//             isFree: false,
//             occupiedBy: -1,
//             coord: { x: (X_START + 2 * X_STEP) * width, y: (Y_START + 2 * Y_STEP) * height },
//         },



//     ]

//     const [BigSnapListState, setBigSnapListState] = useState(initialestate)

//     // Так как вначале width и height не посчиталось, надо через useEffect обновить Snap координаты
//     //
//     useEffect(()=> {
//         setBigSnapListState(initialestate)
//     }, [width, height])



//     const FormulaDots = initialestate.filter(el => el.pointId > 0).map((el, index )=> {
//         return (
//             {
//                 id: `formulaDot${index + 1}`,
//                 cx: el.coord.x,
//                 cy: el.coord.y,

//             }
//         )
//     })




//   const ButtonList =  [
//     {
//         id: 0,
//         text: ' $ \\frac{ 1 } {2}  $ ',
//         buttonRef: useRef<HTMLButtonElement>(null),
//     },
//     {
//         id: 1,
//         text: ' $ \\frac{ \\sqrt {2} } {2}  $ ',
//         buttonRef: useRef<HTMLButtonElement>(null),
//     },
//     {
//         id: 2,
//         text: ' $ \\frac{ \\sqrt {3} } {2}  $ ',
//         buttonRef: useRef<HTMLButtonElement>(null),
//     },

//     {
//         id: 0,
//         text: ' $ \\frac{ 1 } {2}  $ ',
//         buttonRef: useRef<HTMLButtonElement>(null),
//     },
//     {
//         id: 1,
//         text: ' $ \\frac{ \\sqrt {2} } {2}  $ ',
//         buttonRef: useRef<HTMLButtonElement>(null),
//     },
//     {
//         id: 2,
//         text: ' $ \\frac{ \\sqrt {3} } {2}  $ ',
//         buttonRef: useRef<HTMLButtonElement>(null),
//     },

//   ]
//     // const ButtonList = ButtonList
//     // const ButtonList =  [
//     //     {
//     //         id: 0,
//     //         text: 'a',
//     //         buttonRef: useRef<HTMLButtonElement>(null),
//     //     },
//     //     {
//     //         id: 1,
//     //         text: 'b',
//     //         buttonRef: useRef<HTMLButtonElement>(null),
//     //     },
//     //     {
//     //         id: 2,
//     //         text: 'c',
//     //         buttonRef: useRef<HTMLButtonElement>(null),
//     //     },

//     // ]



    

//     const lineCoordinates = [
//         {
//             x1: width * (X_START - X_STEP / 2),
//             y1: height * (Y_START + Y_STEP / 2),
//             x2: width * (X_START + 5 * X_STEP / 2),
//             y2: height * (Y_START + Y_STEP / 2),
//         },
//         {
//             x1: width * (X_START - X_STEP / 2),
//             y1: height * (Y_START + Y_STEP / 2),
//             x2: width * (X_START + 5 * X_STEP / 2),
//             y2: height * (Y_START + Y_STEP / 2),
//         },
//         {
//             x1: width * (X_START - X_STEP / 2),
//             y1: height * (Y_START + Y_STEP / 2),
//             x2: width * (X_START + 5 * X_STEP / 2),
//             y2: height * (Y_START + Y_STEP / 2),
//         },
//     ]




//     // TODO: СОБИРАЕМ useSnap

//     const points = BigSnapListState.map(point => point.coord)

//     const snapPoints:SnapPointsType = {
//         type: 'constraints-box',
       
//         unit: 'pixel',
//         points: points,
//     };
 
//     type TypeUseSnapList= {
//         buttonId: number;
//         buttonIndex: number;
//         dragProps: Pick<MotionProps, "onDragStart" | "onDragEnd" | "onMeasureDragConstraints" | "drag" | "dragMomentum"> & Partial<Pick<MotionProps, "dragConstraints">>
//         currentSnappointIndex: number | null;
//     }[]

//     let useSnapList: TypeUseSnapList= []


//     // FTrue  изначально TRUE (прикреплены к точкам)
//     //
//     let ii = 0
//     let spanResult  = useSnapFTrue(
        
//         {
//             // initialSnapPoint: index, // к чему изначально прикреплена эта кнопка
//             initialSnapPoint: BigSnapListState.filter(el=>el.occupiedBy == ButtonList[ii].id)[0]?.pointId, 

            
//             direction: 'both',
//             ref: ButtonList[ii].buttonRef,
//             constraints: containerRef,

//             snapPoints: 
//             { 
//                 type: snapPoints.type,
//                 unit: snapPoints.unit,
                
//                 // сюда вставляем СВОБОДНЫЕ snap point
//                 points: snapPoints.points,
//             },
            
//         })



//     useSnapList[ii]=
//         {
//             buttonId: ButtonList[ii].id,
//             buttonIndex: ii,
//             dragProps: spanResult.dragProps,
//             currentSnappointIndex: spanResult.currentSnappointIndex       
//         }
    




//         // Хук useSnap нельзя пихать в ButtonList.map, поэтому 3 отдельных индекса ii
//         //
//         ii = 1
//         spanResult  = useSnap(
        
//             {
//                 // initialSnapPoint: index, // к чему изначально прикреплена эта кнопка
//                 // initialSnapPoint: BigSnapListState.filter(el=>el.occupiedBy == ButtonList[ii].id)[0]?.pointId, 

                
//                 direction: 'both',
//                 ref: ButtonList[ii].buttonRef,
//                 constraints: containerRef,
    
//                 snapPoints: 
//                 { 
//                     type: snapPoints.type,
//                     unit: snapPoints.unit,
                    
//                     // сюда вставляем СВОБОДНЫЕ snap point
//                     points: snapPoints.points,
//                 },
                
//             })

//         useSnapList[ii]=
//             {
//                 buttonId: ButtonList[ii].id,
//                 buttonIndex: ii,
//                 dragProps: spanResult.dragProps,
//                 currentSnappointIndex: spanResult.currentSnappointIndex       
//             }








//             ii = 2
//             spanResult  = useSnapFTrue(
            
//                 {
//                     // initialSnapPoint: index, // к чему изначально прикреплена эта кнопка
//                     initialSnapPoint: BigSnapListState.filter(el=>el.occupiedBy == ButtonList[ii].id)[0]?.pointId, 
    
                    
//                     direction: 'both',
//                     ref: ButtonList[ii].buttonRef,
//                     constraints: containerRef,
        
//                     snapPoints: 
//                     { 
//                         type: snapPoints.type,
//                         unit: snapPoints.unit,
                        
//                         // сюда вставляем СВОБОДНЫЕ snap point
//                         points: snapPoints.points,
//                     },
                    
//                 })
    
//             useSnapList[ii]=
//                 {
//                     buttonId: ButtonList[ii].id,
//                     buttonIndex: ii,
//                     dragProps: spanResult.dragProps,
//                     currentSnappointIndex: spanResult.currentSnappointIndex       
//                 }







//     // РИСУЕМ:

//     const draw = {
//         hidden: { pathLength: 0, opacity: 0 },
//         visible: (i: number) => {
//             const delay = i * 0.5
//             return {
//                 pathLength: 1,
//                 opacity: 1,
//                 transition: {
//                     pathLength: { delay, type: "spring", duration: 1.5, bounce: 0 },
//                     opacity: { delay, duration: 0.01 },
//                 },
//             }
//         },
//     }

    
//     const controlsColor0 = useAnimationControls()
//     const controlsColor1 = useAnimationControls()
//     const controlsColor2 = useAnimationControls()  

//     const controlsColorBG0 = useAnimationControls()
//     const controlsColorBG1 = useAnimationControls()
//     const controlsColorBG2 = useAnimationControls()

//     const listControlsColorLine = [
//         controlsColor0,
//         controlsColor1,
//         controlsColor2,
//     ]

//     const listControlsColorBG = [
//         controlsColorBG0,
//         controlsColorBG1,
//         controlsColorBG2,
//     ]


//     const [isAnswered, setIsAnswered] = useState(false)


    
    

//     // СУПЕР АЛГОРИТМ С ДОБАВЛЕНИЕМ 0 МАГНИТА В ЗАНЯТУЮ ТОЧКУ
//     //
//     useEffect(()=>{
   
//         const LifeSaver = useSnapList.map(useSnapResult => {
            
//             return (
//             {
//                 currentSnappointIndex: useSnapResult.currentSnappointIndex || 0,
//                 buttonId: useSnapResult.buttonId,

//             })
//         })

//         console.log('LifeSaver: .... ')
//         console.log(LifeSaver)


//         const OccupiedPointsObject = LifeSaver.filter(el => el.currentSnappointIndex > 0)
//         const OccupiedPointsList = OccupiedPointsObject.map(el => el.currentSnappointIndex)
        
//         console.log('OccupiedPointsList: ', OccupiedPointsList)


//         // 
//         //
//         let newInitialState:initialestateType = []
        
//         initialestate.map((point, index) => {
//                 if (!OccupiedPointsList.includes(index)) {
//                     //
//                     // Говорим что ТОЧКА СВОБОДНА 
//                     //
//                     newInitialState.push({
//                         pointId: point.pointId,
//                         isFree: true,
//                         occupiedBy: -1,
//                         coord: point.coord,
//                     })
//                     return {
//                 point
//               } 
//             } 
//             else {
//                 //
//                 // Говорим что ТОЧКА ЗАНЯТА 
//                 //
//                 // вместо занятой точки, пихаем МАГНИТ { y: 0 }
//                 newInitialState.push({
//                     pointId: point.pointId,
//                     isFree: false,
//                     occupiedBy: LifeSaver.filter(p => p.currentSnappointIndex == point.pointId)[0].buttonId,
//                     coord: initialestate[0].coord,
//                 }
                    
//                 )
//             }
//         });

//         console.log('newInitialState ', newInitialState)


//         // ПЕРЕОБНОВЛЯЕМ НАЧАЛЬНОЕ СОСТОЯНИЕ 
//         setBigSnapListState(newInitialState)

        

//         let isSnapped_4 = false
//         let isSnapped_5 = false


//         useSnapList.map((useSnapResult, indexButton) => {
                
//             // 
//             // Если SnapPoint Не равен индексу Стикера, то перекрашиваем
//             //
//             if (useSnapResult.currentSnappointIndex != indexButton + 1) 
//                 {
//                     listControlsColorLine[indexButton].start('snapColor') 
//                     listControlsColorBG[indexButton].start('snapColorBG')
//                 } else {
//                     listControlsColorLine[indexButton].start('initial') 
//                     listControlsColorBG[indexButton].start('initialBG')
//                 }   


//             // Смотрим, был ли дан ответ (заняты ли Snap4 и Snap5)
//             //
//             if (useSnapResult.currentSnappointIndex == 4) {
//                 isSnapped_4 = true
//             }
//             if (useSnapResult.currentSnappointIndex == 5) {
//                 isSnapped_5 = true
//             }        
//             if (isSnapped_4 && isSnapped_5) {
//                 setIsAnswered(true)
//             } else {
//                 setIsAnswered(false)
//             }
                

//         })

        
//     }, useSnapList.map(el => el.currentSnappointIndex)
// )







// function placeDiv(x_pos: number, y_pos: number, elementId: string) {
//     var d = document.getElementById(elementId);
//     if (d) 
//         {
//             d.style.position = "absolute";
//             d.style.left = x_pos+'px';
//             d.style.top = y_pos+'px';
//         }
// }

// useEffect(()=>{

//     // 111

//     // placeDiv((x1+x2)*width/2, (y1+y2)*height/2, `${ButtonList[0].id}`)
//     // placeDiv((x3+x2)*width/2, (y3+y2)*height/2, `${ButtonList[1].id}`)
//     // placeDiv((x1+x3)*width/2, (y1+y3)*height/2, `${ButtonList[2].id}`)

//     placeDiv(initialestate[1].coord.x , initialestate[1].coord.y, 'pi6')
//     placeDiv(initialestate[2].coord.x , initialestate[2].coord.y, 'pi4')
//     placeDiv(initialestate[3].coord.x , initialestate[3].coord.y, 'pi3')


//     placeDiv(initialestate[1].coord.x - 50, initialestate[1].coord.y , 'sin')
//     placeDiv(initialestate[4].coord.x - 50, initialestate[4].coord.y , 'cos')

    
//     // placeDiv(x1, height * HEIGHT_FORMULA_COEFF, 'btnAnswer')
//     placeDiv(width * 0.5 - 50, height + 50, 'btnAnswer')

//     // FormulaDots.map((dot) => { placeDiv(dot.cx ? dot.cx : 0, dot.cy ? dot.cy : 0, dot.id) })


// }, [width, height, left, top])
    

// // const transition = { duration: 1, yoyo: Infinity, ease: "easeInOut"}






//   return (
    
//   // <div className="grid grid-cols-2 gap-x-2 gap-y-2 mt-10">
    
//   //   {question.options.map((option, index) => (

//   //         <button
//   //           key={index*28748}
//   //           onClick={() => onAnswer(option)}
//   //           className="inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-bold ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 tracking-wide bg-white border-slate-200 border-2 border-b-4 active:border-b-2 hover:bg-slate-100 text-slate-500"
//   //         >
//   //           <p className="m-4">
//   //             <Latex>
//   //               {option}
//   //             </Latex>
//   //           </p>
//   //         </button>
          
//   //   ))}

  
//   // </div>







//   <motion.div 
//   className="SnappingExample" 
//   ref={containerRef}
// >
  
  
//   {/* TODO: 234 СТИКЕРЫ - кнопки,  которые перетягиваем */}

//    {ButtonList.map( (button, index) => 

//       <motion.button 
//           key={index*51078}
//           id={`${button.id}`}
//           ref={button.buttonRef}
//           className={`text-xl rounded text-primary-foreground `}
//           style={{ width: handleWidth, height: handleHeight }} 
//           drag 
//           dragConstraints={containerRef}
//           {...useSnapList[index].dragProps}

//           custom={13}

//           variants = {{
//               initialBG: {
//                   backgroundColor: colorLineSlate,
                  
//               },
//               snapColorBG: {
//                   backgroundColor: colorLineList[index],
//               },
//           }}

//           initial = 'initialBG'
//           animate= {listControlsColorBG[index]}
          

//           whileHover={{
//               scale: 1.2,
//               rotate: 5,
//               transition: { duration: 0.2 },
//           }}
//           whileTap={{
//               scale: 0.8,
//               rotate: -5,
//           }}
//           transition={{
//               type: "spring",
//               stiffness: 400,
//               damping: 17,
//           }}
      


//       >
              
//           {button.text}

//           <motion.div className="absolute top-0 -pt-4  text-white text-2xl">

//               <ArrowUpLeft size='20' />

//           </motion.div>


//       </motion.button>
      
//   )} 







//   {/* TODO: sin  Пишем формулу */}

      
//   <motion.div
//       id='sin'
//       initial={{ opacity: 0, scale: 0 }}
//       animate={{ opacity: 1, scale: 1 }}
//       transition={{
//           duration: 0.4,
//           scale: { type: "spring", visualDuration: 0.4, bounce: 0.5 },
//       }}
//       className="absolute text-3xl"
//   >
//      sin(x) = 

//   </motion.div>

//   {/* угол X */}
                  
//   <motion.div
//       id='x'
//       initial={{ opacity: 0, scale: 0 }}
//       animate={{ opacity: 1, scale: 1 }}
//       transition={{
//           duration: 0.4,
//           scale: { type: "spring", visualDuration: 0.4, bounce: 0.5 },
//       }}
//       className="absolute text-3xl text-slate-300 font-bold"
//   >
//       x 

//   </motion.div>





//   {/* TODO: ОТВЕТ */}

//   <Button 
//       id = 'btnAnswer'
//       disabled = {!isAnswered}
//       className = "absolute"
//       variant='primary'
//   >
//       ответить
//   </Button>










//   <motion.svg
//       width= {width}
//       height= {height}
//       initial="hidden"
//       animate="visible"
//   >



// {/*  Дуга УГЛА 222
// <motion.path
// transition={transition}
// initial={{ pathLength: 0.001 }}
// animate={{ pathLength: 1 }}
// // 123
// // threeCoordinates = {[40, 40, 550, 40, 40, 350]}
// d={arcSVG}
// fill="none"
// stroke={colorLineSlate}
// strokeWidth="11"
// strokeLinecap="round" 
// // custom={5}
// /> */}









//       {/* TODO:  LINES    рисуем серые линии */}

//       {lineCoordinates.map((line, index) => (

//           <motion.line
//               key={index*5131078}

//               x1 = {line.x1}
//               y1 = {line.y1}
//               x2 = {line.x2}
//               y2 = {line.y2}
//               stroke = {colorLineSlate}
//               variants = {draw}
//               custom={2 + index * 1.5}
//               style={{
//                   strokeWidth: strokeWidth,
//                   strokeLinecap: "round",
//                   fill: "transparent",
//               }}
//           />

//       ))}

// {/* 
// <motion.polygon
// points={`${x1},${y1} ${x2},${y2} ${x3},${y3}`}
// // fill="#234236"
// fill="transparent"
// variants = {draw}

// // style={{
// //     strokeWidth: strokeWidth,
// //     strokeLinecap: "round",
// //     fill: "transparent",
// // }}
// /> */}











//       {/* TODO:  FORMULA  СЕРЫЕ snap CIRCLES    222 */}

//       {FormulaDots.map((dot, index) => (


//           <motion.circle  
//               key={index*51075138}

//               cx={dot.cx ? dot.cx + handleWidth/2: handleWidth/2}
//               cy={dot.cy ? dot.cy + handleHeight/2: handleHeight/2}
//               r="4"
//               // stroke= {colorCircle1}
//               stroke= {colorLineSlate}

//               variants={draw}
//               custom={6.5 + index}
//               style={{
//                   strokeWidth: strokeWidth,
//                   strokeLinecap: "round",
//                   fill: "transparent",
//               }}
//           />


//       ))}












//   </motion.svg> 


  

// </motion.div>
// );





  
// }
