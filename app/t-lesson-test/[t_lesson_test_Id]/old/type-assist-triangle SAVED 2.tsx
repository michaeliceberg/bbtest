// 'use client'

// import React from 'react'
// import { QuestionType } from '../page'
// import Latex from 'react-latex-next';
// import 'katex/dist/katex.min.css';



// import { BoundingBox, MotionProps, useAnimationControls } from "framer-motion";
// import { useEffect, useLayoutEffect, useRef, useState } from "react";
// import { motion } from "framer-motion";
// import { ArrowUpLeft, Cog } from "lucide-react";
// // import { SnapPointsType } from "./useSnap";
// // import { useSnapFTrue } from "./useSnapFTrue";
// import { Button } from "@/components/ui/button";
// import { SnapPointsType } from '../useSnap';
// import { useSnapFTrue } from '../useSnapFTrue';



// // type Props = {
// //   question: QuestionType
// //   onAnswer: (answer: string) => void
// // }


// type Props = {
//     threeCoordinates: number[],
//     xCoordinates: number[],
//     arcSVG: string,
    
// }





// // export const TypeAssistTRIANGLE = ({
// //     question,
// //     onAnswer,
// // }:Props) => {



//   export const TypeAssistTRIANGLE_2 = ({
//     threeCoordinates,
//     xCoordinates,
//     arcSVG,
// }: Props) => {



//   const [x1, y1, x2, y2, x3, y3] = threeCoordinates



//     const strokeWidth = 10


//     const colorLineSlate = "#cbd5e1"  // slate300
    

//     const colorLineList = [
//         "#22c55e",   // green500
//         "#0ea5e9",   // sky500
//         "#a855f7",   // purple500
//     ]

//     const tailwindColorLineList = [
//         'bg-green-500', 
//         'bg-sky-500', 
//         'bg-purple-500'
//     ]

//     const colorCircle1 = "#16a34a"  // green600
//     const colorCircle2 = "#0284c7"  // sky600
//     const colorCircle3 = "#9333ea"  // purple600
    

//     const handleWidth = 45;
//     const handleHeight = 45;

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

//     // Так как вначале width и height не посчиталось, надо через useEffect обновить Snap координаты
//     //

//     const HEIGHT_FORMULA_COEFF = 0.8
//     const SIN_X_SHIFT_FORMULA = 200


//     useEffect(()=> {

//         setBigSnapListState(initialestate
//             // [
//             //     // INITIAL STATE (Кнопки находятся в точках)
//             //     {
//             //         pointId: 0,
//             //         isFree: true,
//             //         occupiedBy: -1,
//             //         coord: { x: 0, y: 0}, 
//             //     },

//             //     {
//             //         pointId: 1,
//             //         isFree: false,
//             //         occupiedBy: 0,
//             //         coord: { x: (x1+x2) * width /2, y: (y1+y2) * height /2 }, 
//             //     },
//             //     {
//             //         pointId: 2,
//             //         isFree: false,
//             //         occupiedBy: 1,
//             //         coord: { x: (x2+x3) * width /2, y: (y2+y3) * height /2 },
//             //     },
//             //     {
//             //         pointId: 3,
//             //         isFree: false,
//             //         occupiedBy: 2,
//             //         coord: { x: (x1+x3) * width /2, y: (y1+y3) * height /2 },
//             //     },


//             //     // SNAP FORMULA


//             //     {
//             //         pointId: 4,
//             //         isFree: true,
//             //         occupiedBy: -1,

                    
//             //         coord: { x: x1 * width + 120 + 30, y: HEIGHT_FORMULA_COEFF * height - handleWidth + 5},
//             //     },
//             //     {
//             //         pointId: 5,
//             //         isFree: true,
//             //         occupiedBy: -1,
//             //         coord: { x: x1 * width + 120 + 30, y: (HEIGHT_FORMULA_COEFF + 0.1) * height - handleWidth/4},
//             //     },
//             // ]
//     )

//     }, [width, height])


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
//     const initialestate:initialestateType = [

//         {
//             pointId: 0,
//             isFree: true,
//             occupiedBy: -1,
//             coord: { x: 0, y: 0}, 

//         },
//         {
//             pointId: 1,
//             isFree: false,
//             occupiedBy: 0,
//             coord: { x: (x1+x2) * width /2, y: (y1+y2) * height /2 }, 

//         },
//         {
//             pointId: 2,
//             isFree: false,
//             occupiedBy: 1,
//             coord: { x: (x2+x3) * width /2, y: (y2+y3) * height /2 },
//         },
//         {
//             pointId: 3,
//             isFree: false,
//             occupiedBy: 2,
//             coord: { x: (x1+x3) * width /2, y: (y1+y3) * height /2 },
//         },


//         {
//             pointId: 4,
//             isFree: true,
//             occupiedBy: -1,
//             coord: { x: x1 * width + 120 + 30, y: HEIGHT_FORMULA_COEFF * height - handleWidth + 5},
//         },
//         {
//             pointId: 5,
//             isFree: true,
//             occupiedBy: -1,
//             coord: { x: x1 * width + 120 + 30, y: (HEIGHT_FORMULA_COEFF + 0.1) * height - handleWidth/4},
//         },

//     ]

//     const [BigSnapListState, setBigSnapListState] = useState(initialestate)

    

//     const FormulaDots = [
//         {
//             id: 'formulaDot1',
//             cx: BigSnapListState[4].coord.x,
//             cy: BigSnapListState[4].coord.y,
//         },
//         {
//             id: 'formulaDot2',
//             cx: BigSnapListState[5].coord.x,
//             cy: BigSnapListState[5].coord.y,
//         },

//     ]

//     const ButtonList =  [
//         {
//             id: 0,
//             text: 'a',
//             buttonRef: useRef<HTMLButtonElement>(null),
//         },
//         {
//             id: 1,
//             text: 'b',
//             buttonRef: useRef<HTMLButtonElement>(null),
//         },
//         {
//             id: 2,
//             text: 'c',
//             buttonRef: useRef<HTMLButtonElement>(null),
//         },

//     ]



    

//     const lineCoordinates = [
//         {
//             x1: width * x1,
//             y1: height * y1,
//             x2: width * x2,
//             y2: height * y2,
//         },
//         {
//             x1: width * x2,
//             y1: height * y2,
//             x2: width * x3,
//             y2: height * y3,
//         },
//         {
//             x1: width * x3,
//             y1: height * y3,
//             x2: width * x1,
//             y2: height * y1,
//         },
//     ]


//     type PointsInitialFree = {
//         y?: number;
//         x?: number;
//     }[] 

//     type PointsInitialFreeID = {
//         coord: 
//         {
//             y: number;
//             x: number;
//         }
//         pointId: number;
//         isFree: boolean;

//     }[] 




//     // const PointsInitialFree:PointsInitialFree = BigSnapListState.filter(el => el.isFree).map(point => point.coord)
//     const PointsInitialFree:PointsInitialFree = BigSnapListState.map(point => point.coord)

//     const pointsInitialFreeWithID: PointsInitialFreeID = BigSnapListState.filter(el => el.isFree).map(point => (
//         {
//         pointId: point.pointId,
//         coord: point.coord,
//         isFree: true,
//         }
//     ))

   
//     const points = PointsInitialFree


 
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

    


//     // TODO: FTrue  изначально TRUE (прикреплены к точкам)
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
//         spanResult  = useSnapFTrue(
        
//             {
//                 // initialSnapPoint: index, // к чему изначально прикреплена эта кнопка
//                 initialSnapPoint: BigSnapListState.filter(el=>el.occupiedBy == ButtonList[ii].id)[0]?.pointId, 

                
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

// // 555

//         let freeList:initialestateType = []
        
//         initialestate.map((point, index) => {
//                 if (!OccupiedPointsList.includes(index)) {
//                     //
//                     // Говорим что ТОЧКА СВОБОДНА 
//                     //
//                     freeList.push({
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
//                 // вместо занятой точки, пихаем магнит {y: 0}
//                 freeList.push({
//                     pointId: point.pointId,
//                     isFree: false,
//                     occupiedBy: LifeSaver.filter(p => p.currentSnappointIndex == point.pointId)[0].buttonId,
//                     coord: initialestate[0].coord,
//                 }
                    
//                 )
//             }
//         });

//         console.log('freeList ', freeList)

//         setBigSnapListState(freeList)

//         // {
//         //     pointId: 0,
//         //     isFree: true,
//         //     occupiedBy: -1,
//         //     coord: { x: 0, y: 0}, 
//         // },

//         // const mega = pointsInitialFreeWithID.map((el, index )=>{

//         //     // ищем, есть ли этот index в занятых LifeSaver
//         //     //
//         //     const isSnapped = LifeSaver.filter(el => el.currentSnappointIndex == index)
//         //     if (isSnapped.length > 0) {
//         //         // console.log(index)
//         //         return( 
//         //             {
//         //                 isFree: false,
//         //                 coord: el.coord,
//         //                 pointId: el.pointId,
//         //                 occupiedBy: isSnapped[0].buttonId,
//         //             }
//         //         )
//         //     } else {
//         //         return( 
//         //             {
//         //                 isFree: true,
//         //                 coord: el.coord,
//         //                 pointId: el.pointId,
//         //                 occupiedBy: -1,
//         //             }
//         //         )
//         //     }

//         // })



//         // console.log('mega')
//         // console.log(mega)


//         // 123
//         // setBigSnapListState(mega)








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

//     placeDiv((x1+x2)*width/2, (y1+y2)*height/2, `${ButtonList[0].id}`)
//     placeDiv((x3+x2)*width/2, (y3+y2)*height/2, `${ButtonList[1].id}`)
//     placeDiv((x1+x3)*width/2, (y1+y3)*height/2, `${ButtonList[2].id}`)


//     placeDiv(x1*width, height*0.8 , 'sin')

//     placeDiv(xCoordinates[0]*width, xCoordinates[1]*height, 'x')
    
//     // placeDiv(x1, height * HEIGHT_FORMULA_COEFF, 'btnAnswer')
//     placeDiv(width * 0.5 - 50, height + 50, 'btnAnswer')

//     FormulaDots.map((dot) => { placeDiv(dot.cx, dot.cy, dot.id) })


// }, [width, height, left, top])
    

// // const transition = { duration: 1, yoyo: Infinity, ease: "easeInOut"}




//     // useEffect(()=>{
//     //     console.log(width)
//     //     console.log(height)
//     //     console.log(left)
//     //     console.log(top)
//     // },[width, height])










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
//       // width="600"
//       // height="600"
//       // viewBox="0 0 600 600"
//       initial="hidden"
//       animate="visible"
//       // style={{ maxWidth: "80vw" }}
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

//               // x1 = {line.x1}
//               // y1 = {line.y1}
//               // x2 = {line.x2}
//               // y2 = {line.y2}
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











//       {/* TODO: 123 рисуем ЦВЕТНЫЕ SNAP линии (просто меняем Opacity) */}


//       {lineCoordinates.map((line, index) => (

//           <motion.line
//               key={index*5107851}

//               x1 = {line.x1}
//               y1 = {line.y1}
//               x2 = {line.x2}
//               y2 = {line.y2}
//               stroke= {colorLineList[index]}
//               variants = {{
//                   initial: {
//                       opacity: '0',
//                   },
//                   snapColor: {
//                       opacity: [0, 1],
//                   }
//               }}
//               custom={0}
//               style={{
//                   strokeWidth: strokeWidth,
//                   strokeLinecap: "round",
//                   fill: "transparent",
//               }}
//               initial = 'initial'
//               animate = {listControlsColorLine[index]}
//               // transition={{ duration: 1 }}
//               // transition={{ type: "spring" }}
//           />

//       ))}
      





//       {/* TODO:  FORMULA LINE (дробь)*/}

//       <motion.line
//           x1 = {x1 * width + 120}
//           y1 = {HEIGHT_FORMULA_COEFF * height + 20}
//           // x2 = {x3 + deltaX + 120 }
//           x2 = {x1 * width + 120 + 120 }
//           y2 = {HEIGHT_FORMULA_COEFF * height + 20}
//           stroke= "#404040"
//           variants = {draw}
//           custom={3.5}
//           style={{
//               strokeWidth: 3,
//               strokeLinecap: "round",
//               fill: "transparent",
//           }}
//       />


//       {/* TODO:  FORMULA  СЕРЫЕ snap CIRCLES    222 */}

//       {FormulaDots.map((dot, index) => (


//           <motion.circle  
//               key={index*51075138}

//               cx={dot.cx + handleWidth/2}
//               cy={dot.cy + handleHeight/2}
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





//       {/* TODO:   GRAY   CIRCLE  на Lines */}

//       {lineCoordinates.map((line, index) => (

//           <motion.circle  
//               key={index*55101783}

//               cx={(line.x1+line.x2)/2}
//               cy={(line.y1+line.y2)/2}
//               r="4"
//               // stroke= {colorCircle1}
//               stroke= {colorLineSlate}

//               variants={draw}
//               custom={6.5}
//               style={{
//                   strokeWidth: strokeWidth,
//                   strokeLinecap: "round",
//                   fill: "transparent",
//               }}
//           />

//       ))}




//       {/* TODO: COLOR circle SNAP на Lines */}

//       {lineCoordinates.map((line, index) => (

//           <motion.circle  
//               key={index*5106378}

//               cx={(line.x1+line.x2)/2}
//               cy={(line.y1+line.y2)/2}
//               r="4"
//               stroke= {colorLineList[index]}

//               variants = {{
//                   initial: {
//                       opacity: '0'
//                   },
//                   snapColor: {
//                       opacity: [0, 1],
//                   }
//               }}

//               custom={0}
//               style={{
//                   strokeWidth: strokeWidth,
//                   strokeLinecap: "round",
//                   fill: "transparent",
//               }}

//               initial = 'initial'
//               animate = {listControlsColorLine[index]}
//           />


//       ))}

      








//   </motion.svg> 


  

// </motion.div>
// );





  
// }
