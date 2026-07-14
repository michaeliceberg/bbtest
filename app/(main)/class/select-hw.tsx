
'use client'

import { NewSelect } from '@/components/new-select'
import { Avatar, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import React, { useState, useTransition } from 'react'


type Props = {
    allUsers: {
        userId: string;
        userName: string;
        userImageSrc: string;
        points: number;
        classId: number | null;
    }[],
}
export const SelectHW = ({
    allUsers,
}: Props) => {



    const [value, setValue] = useState()




    return (


    
    <div className="pt-10 w-full">
           
           {/* <NewSelect 
                options={options} 
                value={value} 
                onChange={o => setValue(o)} 
            /> */}
      


    </div>


  )
}
