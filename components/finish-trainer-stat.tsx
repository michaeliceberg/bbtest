import { cn } from '@/lib/utils';
import { BadgeAlert, BadgeCheck, Divide, Heart, Trophy, Zap } from 'lucide-react';
import React from 'react'
import 'katex/dist/katex.min.css';
import Latex from 'react-latex-next';

type Props = {
    finishList:  {
        question: string;
        answer: string;
        rightAnswer: string;
        isRight: boolean;
    }[]
}

export const FinishTrainerStat = ({ finishList }: Props) => {
  return (
    <ul className="mt-4 mb-12 grid grid-cols-6 gap-y-4 ">
      <li className="col-span-2 flex justify-center">
        вопрос
      </li>
      <li className="col-span-2 flex justify-center">
        ваш ответ 
      </li>
      <li className="col-span-2 flex justify-center">
        верный ответ
      </li>

      {finishList.map((el, index) => (
        <React.Fragment key={el.question + index}>
          <li className='col-span-2'>
            <div className='p-2'>
              <Latex>
                {el.question.replace('\huge', '\scriptsize')}
              </Latex>
            </div>
          </li>

          <li className='col-span-2'>
            {el.isRight ? 
              <div className='bg-green-200 p-2 rounded-xl'>
                <Latex>
                  {el.answer.replace('\huge', '\scriptsize')}
                </Latex>
              </div>
            : 
              <div className='bg-red-200 p-2 rounded-xl'>
                <Latex>
                  {el.answer.replace('\huge', '\scriptsize')}
                </Latex>
              </div>
            }
          </li>

          <li className='col-span-2'>
            {!el.isRight && 
              <div className='p-2'>
                <Latex>
                  {el.rightAnswer.replace('\huge', '\scriptsize')}
                </Latex>
              </div>
            }
          </li>
        </React.Fragment>
      ))}
    </ul>
  )
}






// import { cn } from '@/lib/utils';
// import { BadgeAlert, BadgeCheck, Divide, Heart, Trophy, Zap } from 'lucide-react';
// import React from 'react'
// import 'katex/dist/katex.min.css';
// import Latex from 'react-latex-next';


// type Props = {
//     finishList:  {
//         question: string;
//         answer: string;
//         rightAnswer: string;
//         isRight: boolean;
//     }[]
// }

// export const FinishTrainerStat = ({ finishList }: Props) => {

//   return (
    
    
//     <ul className="mt-4 mb-12 grid grid-cols-6 gap-y-4 ">



//           <li className="col-span-2 flex justify-center ">
//             вопрос
//           </li>

            

//           <li className="col-span-2 flex justify-center">
//             ваш ответ 
//           </li>


            
//           <li className="col-span-2 flex justify-center">
//             верный ответ
//           </li>

    

//         {finishList.map((el, index) => (
        
        
//         <React.Fragment key={el.question + index}>
        


//             <li className='col-span-2' key={index* 6219}>
//                 <div className='p-2'>
//                     <Latex>
//                         {el.question.replace('\huge', '\scriptsize')}
//                     </Latex>
//                 </div>
//             </li>

//             <li className='col-span-2' key={index* 4309}>
//                 {el.isRight ? 
//                     <div className='bg-green-200 p-2 rounded-xl'>
//                         <Latex>
//                             {el.answer.replace('\huge', '\scriptsize')}
//                         </Latex>
//                     </div>

//                 : 
//                     <div className='bg-red-200 p-2 rounded-xl'>
//                         <Latex>
//                             {el.answer.replace('\huge', '\scriptsize')}
//                         </Latex>
//                     </div>
//                 }

//             </li>

//             <li className='col-span-2' key={index* 6309}>
//                 {!el.isRight && 
//                     <div className='p-2'>
//                         <Latex>
//                             {el.rightAnswer.replace('\huge', '\scriptsize')}
//                         </Latex>
//                     </div>
//                 }
//             </li>
        

        
//         </React.Fragment>


//     ))}

//     </ul>


//   )
// }
