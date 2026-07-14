// import React, { useState } from "react";
// import { motion } from "framer-motion";
// import Latex from "react-latex-next";
// import { Button } from "@/components/ui/button";




// type Props = {
//     question: string,
//     options: string[],
// }

// export const TypeWorkbook = ({
//     question,
//     options,
// }: Props) => {

  
//   const questionWorkbook: string[] = question.split("@")


//   const [constructorList, setConstructorList] = useState<string[]>(['', '', '', '', ''])
  


//   const handleConstructorAddClick = (option: string ) => {
    
//     const indexEmpty = constructorList.indexOf('')

//     if (indexEmpty > -1) {
//       //
//       // есть ли -1 ?
//       //
//       let newList = constructorList
//       newList[indexEmpty] = option
//       setConstructorList(newList)
  
    
//     }
    
//   }

//   const handleConstructorDelClick = (delIndex: number) => {

//     let newList = constructorList
//     newList[delIndex] = ''
//     setConstructorList(newList)

  
// }



//   return (


//     <div className="items-center justify-center text-neutral-800">

//         {questionWorkbook.map((questionPart, index) => 

//             <div>

//                 {constructorList.indexOf('') >= index &&

//                 <Typewrite 
//                     examples = {questionPart}
//                 />
//                 }


//                 {constructorList[index] !== ''
//                     ? <Button 
//                         variant='super'
//                         size='construct'
//                         onClick={()=>handleConstructorDelClick(index)}
//                         >
//                         {constructorList[index]} 
//                         </Button>

//                     : <Button 
//                         className={constructorList.indexOf('') == index ? "bg-sky-200/90 text-white animate-bounce": ""}
//                         variant='construct' 
//                         size='construct'
//                         > 
//                         {index+1}
//                         </Button>
//                 }



//                     </div>
//                 )}

        



//     <div>

//         {options.map((option, index) => (

//         <button
//         key={index*28748}
//         // onClick={() => onAnswer(option)}
//         className="inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-bold ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 tracking-wide bg-white border-slate-200 border-2 border-b-4 active:border-b-2 hover:bg-slate-100 text-slate-500"
//         onClick={() => handleConstructorAddClick(option)}

//         >
//         <p className="m-4">
//             <Latex>
//                 {option}
//             </Latex>
//         </p>
//         </button>

//         ))}

//     </div>

//     </div>
//   );
// };



// const LETTER_DELAY = 0.025;
// const BOX_FADE_DURATION = 0.125;

// const FADE_DELAY = 500;
// const MAIN_FADE_DURATION = 0.25;

// const SWAP_DELAY_IN_MS = 5500;

// const Typewrite = (
//     { examples }: { examples: string }) => {


//   return (

//     <div>

//         <p className="text-xs font-light">
//         {/* <span className="inline-block size-2 bg-neutral-950" /> */}
//         <span className="ml-3">



//             <div className=" mt-4 py-2 px-4 font-semibold text-sm lg:text-base pb-1 pt-1">
                
//                 {examples.split("").map((letter, i) => (
                
//                     <motion.span
//                     initial={{
//                         opacity: 1,
//                     }}
//                     animate={{
//                         opacity: 0,
//                     }}
//                     transition={{
//                         delay: FADE_DELAY,
//                         duration: MAIN_FADE_DURATION,
//                         ease: "easeInOut",
//                     }}
//                     key={`${i*31399}-${i}`}
//                     className="relative"
//                     >
//                     <motion.span
//                         initial={{
//                         opacity: 0,
//                         }}
//                         animate={{
//                         opacity: 1,
//                         }}
//                         transition={{
//                         delay: i * LETTER_DELAY,
//                         duration: 0,
//                         }}
//                     >
//                         {letter}
//                     </motion.span>
//                     <motion.span
//                         initial={{
//                         opacity: 0,
//                         }}
//                         animate={{
//                         opacity: [0, 1, 0],
//                         }}
//                         transition={{
//                         delay: i * LETTER_DELAY,
//                         times: [0, 0.1, 1],
//                         duration: BOX_FADE_DURATION,
//                         ease: "easeInOut",
//                         }}
//                         className="absolute bottom-[3px] left-[1px] right-0 top-[3px] bg-neutral-950"
//                     />
//                     </motion.span>
//                 ))}



//             </div>
//         </span>


//         </p>


        
        



//     </div>
//   );
// };