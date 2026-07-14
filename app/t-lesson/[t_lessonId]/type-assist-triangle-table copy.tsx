// 'use client'


// import { RefObject, useEffect, useLayoutEffect, useRef, useState } from "react";
// import { MotionProps, motion } from "framer-motion";
// import { SnapPointsType, useSnap } from "./useSnap";
// import 'katex/dist/katex.min.css';
// import Latex from 'react-latex-next';
// import { Button } from "@/components/ui/button";

// type Props = {
//     ButtonList: {
//         id: number;
//         text: string;
//         buttonRef: RefObject<HTMLButtonElement>;
//     }[],
//     onAnswer: (answer: string) => void
// }

// export const TypeAssistTRIANGLETable = ({ 
//     ButtonList,
//     onAnswer,
//  }: Props) => {

//     const colorLine = "#cbd5e1"  // slate300
       

//     const deltaX = 155
//     const deltaY = 155

//     const strokeWidth = 2

//     const multiplier = 0.4
    
//     // размер кнопок стикеров
//     //
//     const handleWidth = deltaX * multiplier
//     const handleHeight = deltaY * multiplier


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
 


//     const X_START = 0.2
//     const X_STEP = 0.2

//     const Y_START = 0.2
//     const Y_STEP = 0.15

//     // // -- 1 ряд
    
//     // const x1 = X_START * width
//     // const y1 = Y_START * height
    
//     // const x2 = (X_START + X_STEP) * width
//     // const y2 = Y_START * height

//     // const x3 = (X_START + 2 * X_STEP) * width
//     // const y3 = Y_START * height

//     // // -- 2 ряд

//     // const x4 = X_START * width
//     // const y4 = (Y_START + Y_STEP) * height
    
//     // const x5 = (X_START + X_STEP) * width
//     // const y5 = (Y_START + Y_STEP) * height

//     // const x6 = (X_START + 2 * X_STEP) * width
//     // const y6 = (Y_START + Y_STEP) * height

//     // // -- 3 ряд

//     // const x7 = X_START * width
//     // const y7 = (Y_START + 2 * Y_STEP) * height
    
//     // const x8 = (X_START + X_STEP) * width
//     // const y8 = (Y_START + 2 * Y_STEP) * height

//     // const x9 = (X_START + 2 * X_STEP) * width
//     // const y9 = (Y_START + 2 * Y_STEP) * height


//     // -- 1 ряд
    
//     let x1 = X_START * width
//     let y1 = Y_START * height
    
//     let x2 = (X_START + X_STEP) * width
//     let y2 = Y_START * height

//     let x3 = (X_START + 2 * X_STEP) * width
//     let y3 = Y_START * height

//     // -- 2 ряд

//     let x4 = X_START * width
//     let y4 = (Y_START + Y_STEP) * height
    
//     let x5 = (X_START + X_STEP) * width
//     let y5 = (Y_START + Y_STEP) * height

//     let x6 = (X_START + 2 * X_STEP) * width
//     let y6 = (Y_START + Y_STEP) * height

//     // -- 3 ряд

//     let x7 = X_START * width
//     let y7 = (Y_START + 2 * Y_STEP) * height
    
//     let x8 = (X_START + X_STEP) * width
//     let y8 = (Y_START + 2 * Y_STEP) * height

//     let x9 = (X_START + 2 * X_STEP) * width
//     let y9 = (Y_START + 2 * Y_STEP) * height

//     useEffect(()=>{

//          // -- 1 ряд
    
//     let x1 = X_START * width
//     let y1 = Y_START * height
    
//     let x2 = (X_START + X_STEP) * width
//     let y2 = Y_START * height

//     let x3 = (X_START + 2 * X_STEP) * width
//     let y3 = Y_START * height

//     // -- 2 ряд

//     let x4 = X_START * width
//     let y4 = (Y_START + Y_STEP) * height
    
//     let x5 = (X_START + X_STEP) * width
//     let y5 = (Y_START + Y_STEP) * height

//     let x6 = (X_START + 2 * X_STEP) * width
//     let y6 = (Y_START + Y_STEP) * height

//     // -- 3 ряд

//     let x7 = X_START * width
//     let y7 = (Y_START + 2 * Y_STEP) * height
    
//     let x8 = (X_START + X_STEP) * width
//     let y8 = (Y_START + 2 * Y_STEP) * height

//     let x9 = (X_START + 2 * X_STEP) * width
//     let y9 = (Y_START + 2 * Y_STEP) * height

//     },[width, height])






//     type PointsInitial = {
//         y?: number;
//         x?: number;
//     }[] 
//     // | undefined

//     const pointsInitial:PointsInitial = [
//         { y: 0 },   // верхний магнит
        
//         // { x: x1, y: y1 },
//         // { x: x2, y: y2 },
//         // { x: x3, y: y3 },        
        
//         { x: x4, y: y4 },
//         { x: x5, y: y5 },
//         { x: x6, y: y6 },   

//         { x: x7, y: y7 },
//         { x: x8, y: y8 },
//         { x: x9, y: y9 },   
//     ]

//     // Для Рисования Крожочков списком  123
//     //
//     const CircleSnapListCoord = pointsInitial.slice(1)

//     const CircleColors = 
//         [
//             "#16a34a", // green600
//             "#0284c7", // sky600
//             "#9333ea", // purple600
//             "#16a34a", // green600
//             "#0284c7", // sky600
//             "#9333ea", // purple600
//         ]

//     const CirclesToPlot = CircleSnapListCoord.map((el, index) => {
//         return (
//             {
//                 coord: el,
//                 color: CircleColors[index],
//             }
//         )
//     })



//     // Для Рисования Линий списком  123
//     //

//     const LineList = 
//         [
//             {
//                 coordStart_x: 0.1 * width,
//                 coordStart_y: Y_START * height,
//                 coordEnd_x: 0.75 * width,
//                 coordEnd_y: Y_START * height,
//             },
//             {
//                 coordStart_x: 0.1 * width,
//                 coordStart_y: (Y_START + Y_STEP) * height,
//                 coordEnd_x: 0.75 * width,
//                 coordEnd_y: (Y_START + Y_STEP)  * height,
//             },            
//             {
//                 coordStart_x: 0.1 * width,
//                 coordStart_y: (Y_START + 2 * Y_STEP) * height,
//                 coordEnd_x: 0.75 * width,
//                 coordEnd_y: (Y_START + 2 * Y_STEP)  * height,
//             },

//             {
//                 coordStart_x: 0.38 * width,
//                 coordStart_y: 0.1 * height,
//                 coordEnd_x: 0.38 * width,
//                 coordEnd_y: 0.5 * height,
//             },
//             {
//                 coordStart_x: 0.58 * width ,
//                 coordStart_y: 0.1 * height,
//                 coordEnd_x: 0.58 * width ,
//                 coordEnd_y: 0.5 * height,
//             },

//             // {
//             //     coordStart_x: 0.15 * width,
//             //     coordStart_y: 0.1 * height,
//             //     coordEnd_x: 0.15 * width,
//             //     coordEnd_y: 0.4 * height,
//             // },


//         ]
    





//     const [points, setPoints] = useState(pointsInitial)

 
//     const snapPoints:SnapPointsType = {

//         type: 'constraints-box',
//         // unit: 'percent',
//         unit: 'pixel',
//         points: points
        

//     };
 






//     type TypeUseSnapList= {
//         buttonId: number;
//         buttonIndex: number;
//         dragProps: Pick<MotionProps, "onDragStart" | "onDragEnd" | "onMeasureDragConstraints" | "drag" | "dragMomentum"> & Partial<Pick<MotionProps, "dragConstraints">>
//         currentSnappointIndex: number | null;
//     }[]

//     let useSnapList: TypeUseSnapList= []





//     let ii = 0
//     let spanResult  = useSnap(
        
//         {
            
//             // initialSnapPoint: index, // к чему изначально прикреплена эта кнопка
//             // initialSnapPoint: BigSnapListState.filter(el=>el.occupiedBy == ButtonList[ii].id)[0]?.pointId, 

            
//             direction: 'both',
//             ref: ButtonList[ii].buttonRef,
//             constraints: containerRef,

//             snapPoints: 
//             { 
//                 type: snapPoints.type,
//                 unit: snapPoints.unit,
                
//                 // сюда вставляем ВСЕ snap point (если заняты, то координата x=0 y=0)
//                 points: snapPoints.points,
//             },
            
//         })



//     useSnapList[0]=
//         {
//             buttonId: ButtonList[ii].id,
//             buttonIndex: ii,
//             dragProps: spanResult.dragProps,
//             currentSnappointIndex: spanResult.currentSnappointIndex       
//         }
    








//     // const useSnapList: TypeUseSnapList[]= ButtonList.map((button, index) => {

//     //     const spanResult  = useSnap(
//     //         {
//     //             direction: 'both',
//     //             ref: button.buttonRef,
//     //             constraints: containerRef,
    
//     //             snapPoints: 
//     //             { 
//     //                 type: snapPoints.type,
//     //                 unit: snapPoints.unit,
//     //                 points: snapPoints.points,
//     //             },
                
//     //         })

//     //     return (
//     //         {
//     //             buttonId: button.id,
//     //             buttonIndex: index,
//     //             dragProps: spanResult.dragProps,
//     //             currentSnappointIndex: spanResult.currentSnappointIndex       
//     //         }
//     //     )
//     // })












    

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

   
    
   





//     function placeDiv(x_pos: number, y_pos: number, elementId: string) {
//         var d = document.getElementById(elementId);
//         if (d) 
//             {
//                 d.style.position = "absolute";
//                 d.style.left = x_pos+'px';
//                 d.style.top = y_pos+'px';
//             }
//     }

//     useEffect(()=>{

//         //123  Добавляем текстовые метки pi6 pi4 pi3

//         placeDiv(x1 + 20, y1, 'pi6')
//         placeDiv(x2 + 20, y2, 'pi4')
//         placeDiv(x3 + 20, y1, 'pi3')

//         // Добавляем текстовые метки sin cos
//         //
//         // y4 y7 потому что второй и третий ряд
//         //
//         placeDiv(x1 - deltaX/3, y4 + 10, 'sin')
//         placeDiv(x1 - deltaX/3, y7 + 10, 'cos')


//         // Div для кнопки ответа    
//         placeDiv(width * 0.5 - 50, height - 80, 'btnAnswer')

//     }, [width, height, left, top])
        








//     // TODO:
//     //
//     // Проверяем Правильно ИЛИ нет
//     //
//     const [isDone, setIsDone] = useState(false) // выбран ли ответ (но еще не нажата кнопка "ОТВЕТИТЬ")
//     const [isDoneRight, setIsDoneRight] = useState(false) // правильный ли ответ
    
//     useEffect(()=>{

//         const LifeSaver = useSnapList.map(useSnapResult => (
//             {
//                 currentSnappointIndex: useSnapResult.currentSnappointIndex || -1,
//                 buttonId: useSnapResult.buttonId,

//             })
//         )

//         console.log(LifeSaver)
        
//         // Делаем так чтобы Занятые точки НЕ магнитились
//         // в Магнит пихаем вместо координаты точки  pointsInitial[0]
//         //
//         const OccupiedPointsObject = LifeSaver.filter(el => el.currentSnappointIndex > 0)
//         const OccupiedPointsList = OccupiedPointsObject.map(el => el.currentSnappointIndex)
//         console.log('OccupiedPointsList: ', OccupiedPointsList)

//         let freeList:PointsInitial = []
//         pointsInitial.map((point, index) => {
//                 if (!OccupiedPointsList.includes(index)) {
//                     freeList.push(point)
//                     return {
//                 point
//               } 
//             } 
//             else {
//                 // вместо занятой точки, пихаем магнит {y: 0}
//                 freeList.push(pointsInitial[0])
//             }
//         });
//         setPoints(freeList)


//         console.log('freeList ', freeList)

        
//         // Проверяем, получен ли ответ
//         //
//         // сортируем по Snap point'ам  от 1 до 6
//         //
//         LifeSaver.sort((a, b) => a.currentSnappointIndex - b.currentSnappointIndex)
//         //
//         // смотрим, какие кнопки лежат по порядку snap Point'ов
//         //
//         if (
//             LifeSaver[0].buttonId == 0 && 
//             LifeSaver[1].buttonId == 1 &&
//             LifeSaver[2].buttonId == 2 && 
//             LifeSaver[3].buttonId == 2 && 
//             LifeSaver[4].buttonId == 1 && 
//             LifeSaver[5].buttonId == 0  

//         ) {
//             setIsDoneRight(true)

//         } else {

//             setIsDoneRight(false)
            

//         }      
        
//         const checkIsDone = LifeSaver.filter(el => el.currentSnappointIndex == -1)


//         if (checkIsDone.length == 0 ) {
//             setIsDone(true)

//         } else {
//             setIsDone(false)
//         }
        

//         // Зависимости useEffect - список (map) snapPoints
//         //
//     }, useSnapList.map(el => el.currentSnappointIndex))




//     const HandleClickAnswerButton = () => {
//         if (isDoneRight) 
//             {
//                 onAnswer("right")
//             }
//         else 
//             {
//                 onAnswer("wrong")
//             }
//     }

//     return (
        
        
//         <motion.div 
//             className="SnappingExample" 
//             ref={containerRef}
//         >
                
//                 <div
//                 // РИСУЕМ ВЕРХНИЙ СИНИЙ МАГНИТ
//                 //
//                     className="snappoint"
//                     style={{
//                         top: snapPoints.points[0].y === undefined ? '0' : (height - handleHeight) * snapPoints.points[0].y,
//                         bottom: snapPoints.points[0].y === undefined ? '0' : undefined,
//                         left: snapPoints.points[0].x === undefined ? '0' : (width - handleWidth) * snapPoints.points[0].x,
//                         right: snapPoints.points[0].x === undefined ? '0' : undefined,
//                         width: snapPoints.points[0].x === undefined ? undefined : snapPoints.points[0].y === undefined ? 4 : 8,
//                         height: snapPoints.points[0].y === undefined ? undefined : snapPoints.points[0].x === undefined ? 4 : 8,
//                     }}
//                 />
 
            


//             {/* TODO:  статичные НАДПИСИ pi6 pi4 pi3 */}
            
            
//             <motion.div
//                 id='pi6'
//                 initial={{ opacity: 0, scale: 0 }}
//                 animate={{ opacity: 1, scale: 1 }}
//                 transition={{
//                     duration: 0.4,
//                     scale: { type: "spring", visualDuration: 0.4, bounce: 0.5 },
//                 }}
//                 // className="absolute text-3xl"
//                 className="absolute text-2xl"
//             >
//                 <Latex>
//                     {' $ \\frac{ \\pi } {6}  $ '}
//                 </Latex>
//             </motion.div>



//             <motion.div
//                 id='pi4'
//                 initial={{ opacity: 0, scale: 0 }}
//                 animate={{ opacity: 1, scale: 1 }}
//                 transition={{
//                     duration: 0.4,
//                     scale: { type: "spring", visualDuration: 0.4, bounce: 0.5 },
//                 }}
//                 className="absolute text-2xl"
//             >
//                 <Latex>
//                     {' $ \\frac{ \\pi } {4}  $ '}
//                 </Latex>
//             </motion.div>



//             <motion.div
//                 id='pi3'
//                 initial={{ opacity: 0, scale: 0 }}
//                 animate={{ opacity: 1, scale: 1 }}
//                 transition={{
//                     duration: 0.4,
//                     scale: { type: "spring", visualDuration: 0.4, bounce: 0.5 },
//                 }}
//                 className="absolute text-2xl"
//             >
//                 <Latex>
//                     {' $ \\frac{ \\pi } {3}  $ '}
//                 </Latex>
//             </motion.div>






//             {/* TODO:  sin слева (название строки) */}


//             <motion.div
//                 id='sin'
//                 initial={{ opacity: 0, scale: 0 }}
//                 animate={{ opacity: 1, scale: 1 }}
//                 transition={{
//                     duration: 0.4,
//                     scale: { type: "spring", visualDuration: 0.4, bounce: 0.5 },
//                 }}
//                 className="absolute text-2xl"
//             >
//                sin
//             </motion.div>


//             {/* TODO:  cos слева (название строки) */}

//             <motion.div
//                 id='cos'
//                 initial={{ opacity: 0, scale: 0 }}
//                 animate={{ opacity: 1, scale: 1 }}
//                 transition={{
//                     duration: 0.4,
//                     scale: { type: "spring", visualDuration: 0.4, bounce: 0.5 },
//                 }}
//                 className="absolute text-2xl"
//             >
               
//                 cos
                
//             </motion.div>








//             {/* TODO:  КНОПКИ КОТОРЫЕ СНАЧАЛА НА МАГНИТЕ СВЕРХУ options BUTTONS */}

//             {ButtonList.map( (button, index) => 

//                 <motion.button 
//                     key={index*5350912}
//                     ref={button.buttonRef}
//                     className="text-xl rounded bg-gray-600 text-primary-foreground"
//                     style={{ width: handleWidth, height: handleHeight }} 
//                     drag 
//                     dragConstraints={containerRef}
//                     {...useSnapList[index].dragProps}
                    
//                     whileHover={{
//                         scale: 1.2,
//                         rotate: 2,
//                         backgroundColor: "#2BB95D",
//                         transition: { duration: 0.2 },
//                         opacity: 0.7,
//                     }}
//                     whileTap={{
//                         scale: 0.8,
//                         rotate: -2,
//                         backgroundColor: "#1A7A3E",
//                         opacity: 0.7,
//                     }}
//                     transition={{
//                         type: "spring",
//                         stiffness: 400,
//                         damping: 17,
//                     }}
//                     >
                    
//                     <Latex>
//                         {button.text}
//                     </Latex>


//                 </motion.button>
                
//             )}





//   {/* TODO: ОТВЕТ */}
//   {/* {isDone &&  */}
//     <motion.button
//             initial= {{ y: '-100vh', opacity: 0.2 }}
//             animate= {{ y: '0', opacity: 1 }}
//             transition={{ type: 'spring', stiffness: 300 }}

//             id = 'btnAnswer'
//         disabled = {!isDone}
//         className = "absolute bg-sky-400 text-primary-foreground hover:bg-sky-400/90 border-sky-500 border-b-4 active:border-b-0 inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-bold ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 uppercase tracking-wide  h-11 px-4 py-2"
//         //   variant='primary'
//         //   onClick={()=>{HandleClickAnswerButton}}
//         onClick={HandleClickAnswerButton}
//     >
//         ответить
//     </motion.button>
//   {/* } */}


//   {/* <Button
//       id = 'btnAnswer'
//       disabled = {!isDone}
//       className = "absolute"
//       variant='primary'
//     //   onClick={()=>{HandleClickAnswerButton}}
//       onClick={HandleClickAnswerButton}
//   >
//       ответить
//   </Button> */}


//             <motion.svg
//                 width="600"
//                 height="400"
//                 // viewBox="0 0 600 600"
//                 initial="hidden"
//                 animate="visible"
//                 // style={{ maxWidth: "80vw" }}
//             >

            

//                 {LineList.map((line, index) => 
//                     <motion.line
//                     key = {index * 71515}
//                     x1 = {line.coordStart_x}
//                     y1 = {line.coordStart_y}
//                     x2 = {line.coordEnd_x}
//                     y2 = {line.coordEnd_y}
//                     stroke = {colorLine}
//                     variants = {draw}
//                     custom={1 + index}
//                     style={{
//                         strokeWidth: strokeWidth,
//                         strokeLinecap: "round",
//                         fill: "transparent",
//                     }}
//                     />
//                 )}


//                 {/*123  TODO: SNAP circles кружочки в таблице (FORMULA)  */}

//                 {CirclesToPlot.map((circle, index) => 

//                     <motion.circle  
//                     key = {index * 25891}
//                     cx={circle.coord.x ? circle.coord.x + handleWidth/2 : handleWidth/2}
//                     cy={circle.coord.y ? circle.coord.y - handleHeight/2 : handleHeight/2}
//                     r="4"
//                     stroke= {circle.color}
//                     variants={draw}
//                     custom={2 + index}
//                     style={{
//                         strokeWidth: strokeWidth,
//                         strokeLinecap: "round",
//                         fill: "transparent",
//                     }}
//                     />
//                 )}
                




//             </motion.svg> 


            

            


//         </motion.div>
//     );
// };



