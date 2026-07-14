'use client'

import Image from "next/image"
// /Users/mac/Desktop/DuoLingoClone/lingo/public/hwSvgs/ribbonBrown.svg
// import BackgroundImage from '/hwSvgs/ribbonBrown.svg';

type Props = {
    missedCIds: number[]
    variant: "casual" | "trainer"
}

export const HwTopBanner = ({
    
    missedCIds,
    variant,

}: Props) => {

  

    var sectionStyle = {
        width: "202px",
        height: "65px",
        // BackgroundImage: "url(" + { BackgroundImage } + ")"
        // backgroundImage: "url(" + BackgroundImage + ")"
        backgroundImage: "url(" + '/hwSvgs/ribbon.svg' + ")"
    };

    

  return (
    <div className="content-center justify-center mx-auto text-center">

        {missedCIds.length > 0 
            ?
            
            // <div className="justify-center w-[200px] text-lg font-bold p-1 ">
                    
                        
            <section style={ sectionStyle } className="content-center justify-center mx-auto text-center">

                    <div className="justify-center w-[200px] text-lg font-bold p-1 ">
                    
                        

                    
                        
                    <div className="flex justify-center">     
                        
                    <p className="pt-2 pl-4 text-amber-900">
                        {/* <p className="pt-3 pl-4 text-green-300"> */}
                            ДЗ: реши {missedCIds.length}
                        </p>     

                        <Image 
                            //
                            // TODO: если HW, то ПОНЧИК РИСУЕМ
                            //
                            src={variant=='casual' ? '/hwSvgs/donut.svg' : '/hwSvgs/friesW.svg'}
                            height={40} 
                            width={40} 
                            alt='Mascot' 
                            // className= "absolute bg-white  rounded-2xl"
                            className= "ml-2"
                        />  

                    </div>
    
    
                    {/* <Image 
                        //
                        // лента
                        //
                        src='/hwSvgs/ribbonBrown.svg' 
                        height={100} 
                        width={200} 
                        alt='Mascot' 
                        className= "absolute"
                    />   */}
    
                </div>

            </section>
                        
                        
            //     <div className="flex justify-center">          
            //         <Image 
            //             //
            //             // TODO: если HW, то ПОНЧИК РИСУЕМ
            //             //
            //             src='/hwSvgs/donut.svg' 
            //             height={40} 
            //             width={40} 
            //             alt='Mascot' 
            //             // className= "absolute bg-white  rounded-2xl"
            //             className= ""
            //         />  
            //         <p>
            //             {missedCIds.length}
            //         </p>
            //     </div>


            //     <Image 
            //         //
            //         // лента
            //         //
            //         src='/hwSvgs/ribbonBrown.svg' 
            //         height={100} 
            //         width={200} 
            //         alt='Mascot' 
            //         className= "absolute"
            //     />  

            // </div>
            






            :

            <div className="mx-auto justify-center w-[200px] rounded-xl border-green-500 border-2 border-dashed text-lg font-bold p-1">
                <div className="flex text-green-500 justify-center ">
                    <p>
                        😍 ДЗ выполнено!
                    </p>
                </div>
            </div>
        }
    </div>
    
    )
}
