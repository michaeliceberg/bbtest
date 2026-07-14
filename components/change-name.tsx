'use client'

import {useState, useTransition} from 'react'
import { Input } from './ui/input';
import { Button } from './ui/button';
import { upsertUserName } from '@/actions/user-progress';
import { toast } from 'sonner';
import { NewSelect } from './new-select'


type Props= {
    placeholder: string
    imageSrc: string
}


const options = [
    { label: "Avatars/cat1.jpg", value: 1 },
    { label: "Avatars/cat2.jpg", value: 2 },
    { label: "Avatars/cat3.jpg", value: 3 },
    { label: "Avatars/cat4.jpg", value: 4 },
    { label: "Avatars/cat5.jpg", value: 5 },
    { label: "Avatars/cat6.jpg", value: 6 },
    { label: "Avatars/cat7.jpg", value: 7 },
    { label: "Avatars/cat8.jpg", value: 8 },
    { label: "Avatars/cat9.jpg", value: 9 },
    { label: "Avatars/cat10.jpg", value: 10 },
    { label: "Avatars/cat11.jpg", value: 11 },
    { label: "Avatars/cat12.jpg", value: 12 },
    { label: "Avatars/cat13.jpg", value: 13 },
    { label: "Avatars/cat14.jpg", value: 14 },
    { label: "Avatars/cat15.jpg", value: 15 },
    { label: "Avatars/cat16.jpg", value: 16 },
    { label: "Avatars/Dog.jpg", value: 17 },
    { label: "Avatars/Tree.jpg", value: 18 },
]



export const ChangeNameInput = ({
    placeholder, imageSrc
}: Props) => {


    const [pending, startTransition] = useTransition()

    const onButtonPress = () => {
        startTransition(()=> {
            if (pending) return;
            
            upsertUserName(newName)
            .catch(()=>toast.error('Что-то пошло не так! Попробуйте ещё раз'))
        })
        
    }


    const [newName, setNewName] = useState(placeholder);
    const handleChangeName = (event:any) => {
        setNewName(event.target.value);
    }



    


    // const [value, setValue] = useState<typeof options[0] | undefined>(options[0])
    const [value, setValue] = useState<typeof options[0] | undefined>({label: imageSrc, value: 1} || options[0])

    return (
        <>



            <NewSelect 
                options={options} 
                value={value} 
                onChange={o => setValue(o)} 
            />



            <Input 
                placeholder={placeholder}
                type="text"
                value={newName}
                onChange={handleChangeName} 
            />

            <Button 
                onClick={onButtonPress}
                type="submit"
            >
                Поменять имя
            </Button> 
        </>
    )
}