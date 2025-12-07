// import { Button } from "@/components/ui/button";
// import Image from "next/image";
// import LottieRight from '@/public/Lottie/LottieRight.json'
// import LottieWrong from '@/public/Lottie/LottieWrong.json'
// import LottieCoins from '@/public/Lottie/LottieCoins.json'
// import Lottie from "lottie-react";
// import 'katex/dist/katex.min.css';
// import Latex from 'react-latex-next';


// type Props= {
//     question: string
//     pts: number
//     author: string
//     timesDoneWrong: number
//     timesDone: number
// }

// // РИСУЕМ УСЛОВИЕ ЗАДАЧИ С ИКОНКАМИ МОНЕТ АВТОРА
// //
// export const QuestionBubble = ({question, pts, author, timesDoneWrong, timesDone}: Props) => {
//     return (
//         <div className="flex items-center gap-x-4 mb-6">
//             <Image 
//                 src='/mascot.svg'
//                 alt='Mascot'
//                 height={60}
//                 width={60}
//                 className="hidden lg:block"
//             />
//             <Image 
//                 src='/mascot.svg'
//                 alt='Mascot'
//                 height={40}
//                 width={40}
//                 className="block lg:hidden"
//             />

//             <div className="relative py-2 px-4 border-2 rounded-xl text-center text-sm lg:text-base w-full pb-7 pt-5">
//                 <Latex>
//                     {question}
//                 </Latex>
//             <div 
//                 className="absolute -left-3 top-1/2 w-0 h-0 border-x-8 border-x-transparent border-t-8 transform -translate-y-1/2 rotate-90"
//             />

//                 {/* <div 
//                     className="absolute right-40 -bottom-3 w-0 h-0 border-x-8 border-x-transparent border-t-8 transform -translate-y-1/2 rotate-90"
//                 /> */}




//                 {timesDone - timesDoneWrong > 0  
//                     && (
//                         <div className="absolute left-2 -bottom w-0 h-0 bottom-2 transform">
//                             <Button variant='author' size='xs'>
//                                 <Lottie className="h-10 w-10 pr-5"
//                                 animationData={ LottieRight } 
//                                 /> {timesDone - timesDoneWrong}
//                             </Button>
//                         </div>
//                         )
//                 }


//                 {timesDoneWrong > 0  
//                     && (
//                         <div className=  {timesDone - timesDoneWrong > 0 ? "absolute left-20 bottom-2 w-0 h-0 transform" :  "absolute left-2 bottom-2 w-0 h-0 transform"}  >
//                             <Button variant='author' size='xs'>
//                                 <Lottie className="h-10 w-10 pr-5"
//                                 animationData={ LottieWrong } 
//                                 /> {timesDoneWrong}
//                             </Button>
//                         </div>
//                         )
//                 }


//                 <div className="absolute right-32 -bottom w-0 h-0  bottom-2 transform">
//                     <Button variant='author' size='xs'>
//                         {author}
//                     </Button>
//                 </div>


//                 <div className="absolute right-32 -top-5 w-0 h-0">
//                     <Button variant='author' size='xs'>
//                             <Lottie className="h-16 w-16 pr-5 pb-3"
//                             animationData={ LottieCoins } 
//                             />
//                             {pts}
//                     </Button>
//                 </div>







//             </div>
            
//         </div>
//     )
// }