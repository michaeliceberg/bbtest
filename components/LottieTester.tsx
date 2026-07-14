'use client'

import { Button } from "./ui/button"
import Link from "next/link"
import LottieKapiSad1 from '@/public/Lottie/LottieKapiSad1.json'
// import AETriangle from '@/public/Lottie/hints/AETriangle.json'
import AETriangle from '@/public/Lottie/hints/gpt.json'
import Lottie from "lottie-react"

export const LottieTester = () => {

  

  return (
    <div>
                <Lottie 
                
                    // animationData={ isLate ? LottieTriangle3 : LottieTriangle3 } 
                    animationData={ AETriangle } 
                className="h-200 w-200"
                />


</div>
  )}
