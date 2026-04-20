import React, { useState } from "react";
import { motion } from "framer-motion";
import Latex from "react-latex-next";
import { Button } from "@/components/ui/button";
import { num5 } from "@/components/svgs";




type Props = {
    question: string,
    options: string[],
}

export const TypeWorkbook = ({
    question,
    options,
}: Props) => {

  
  const questionWorkbook: string[] = question.split("@")


  const [constructorList, setConstructorList] = useState<string[]>(['', '', '', '', ''])
  


  const handleConstructorAddClick = (option: string ) => {
    
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

    let newList = constructorList
    newList[delIndex] = ''
    setConstructorList(newList)

  
}



  return (


    <div className="items-center justify-center text-neutral-800">

        {questionWorkbook.map((questionPart, index) => 

            <div key={index*1497}>

                {constructorList.indexOf('') >= index &&

                <Typewrite 
                    examples = {questionPart}
                />
                }


                {constructorList[index] !== ''
                    ? <Button 
                        variant='super'
                        size='construct'
                        onClick={()=>handleConstructorDelClick(index)}
                        >
                        {constructorList[index]} 
                        </Button>

                    : <Button 
                        className={constructorList.indexOf('') == index ? "bg-sky-200/90 text-white animate-bounce": ""}
                        variant='construct' 
                        size='construct'
                        > 
                        {index+1}
                        </Button>
                }



                    </div>
                )}

        



    <div>

        {options.map((option, index) => (

        <button
        key={index*28748}
        // onClick={() => onAnswer(option)}
        className="inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-bold ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 tracking-wide bg-white border-slate-200 border-2 border-b-4 active:border-b-2 hover:bg-slate-100 text-slate-500"
        onClick={() => handleConstructorAddClick(option)}

        >
        <p className="m-4">
            <Latex>
                {option}
            </Latex>
        </p>
        </button>

        ))}

    </div>

    </div>
  );
};




const Typewrite = ({ 
    examples 
}: { examples: string }) => {

  return (

    <div>

 
        hello
        
        

        <PathDrawing />

    </div>
  );
};





 
export default function PathDrawing() {

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

    return (
        <div>
           

            <motion.svg
                width="600"
                height="600"
                viewBox="0 0 600 600"
                initial="hidden"
                animate="visible"
                style={{ maxWidth: "80vw" }}
            >


<svg xmlns="http://www.w3.org/2000/svg" viewBox="0.08571429550647736 15.300000190734863 23.614286422729492 35.70000076293945" data-asc="1.011" width="23.614286422729492" height="35.70000076293945"><defs/><g><g><g transform="translate(0, 0)"><path d="M11.80 51Q8.95 51 6.13 50.15Q3.30 49.30 1 47.50Q0.40 47.10 0.20 46.55Q0 46 0.15 45.45Q0.30 44.90 0.70 44.52Q1.10 44.15 1.67 44.10Q2.25 44.05 2.90 44.50Q4.95 45.95 7.15 46.65Q9.35 47.35 11.75 47.35Q14.20 47.35 15.98 46.42Q17.75 45.50 18.68 43.82Q19.60 42.15 19.60 39.90Q19.60 36.45 17.60 34.25Q15.60 32.05 12.10 32.05Q9.95 32.05 8.15 32.85Q6.35 33.65 4.85 35.40Q4.50 35.80 4.03 36.07Q3.55 36.35 2.95 36.35Q2.10 36.35 1.63 35.88Q1.15 35.40 1.15 34.60L1.15 17.20Q1.15 16.25 1.65 15.77Q2.15 15.30 3.05 15.30L20.05 15.30Q21.00 15.30 21.48 15.75Q21.95 16.20 21.95 17.05Q21.95 17.90 21.48 18.35Q21.00 18.80 20.05 18.80L5.20 18.80L5.20 32.85L4.10 32.85Q5.40 30.75 7.70 29.62Q10 28.50 12.85 28.50Q16.20 28.50 18.63 29.90Q21.05 31.30 22.38 33.82Q23.70 36.35 23.70 39.70Q23.70 43 22.25 45.55Q20.80 48.10 18.15 49.55Q15.50 51 11.80 51Z"/></g></g></g></svg>

            

          
          



                <motion.circle
                    cx="200"
                    cy="100"
                    r="80"
                    stroke="#FF0055"
                    variants={draw}
                    custom={1}
                    style={{
                        strokeWidth: 10,
                        strokeLinecap: "round",
                        fill: "transparent",
                    }}
                />

                <motion.line
                    x1="220"
                    y1="30"
                    x2="360"
                    y2="170"
                    stroke="#7700FF"
                    variants={draw}
                    custom={2}
                    style={{
                        strokeWidth: 10,
                        strokeLinecap: "round",
                        fill: "transparent",
                    }}
                />

                <motion.line
                    x1="360"
                    y1="170"
                    x2="360"
                    y2="30"
                    stroke="#7700FF"
                    variants={draw}
                    custom={3}
                    style={{
                        strokeWidth: 10,
                        strokeLinecap: "round",
                        fill: "transparent",
                    }}
                />

                <motion.line
                    x1="360"
                    y1="30"
                    x2="220"
                    y2="30"
                    stroke="#7700FF"
                    variants={draw}
                    custom={4}
                    style={{
                        strokeWidth: 10,
                        strokeLinecap: "round",
                        fill: "transparent",
                    }}
                />


            </motion.svg> 
        </div>
    )
}