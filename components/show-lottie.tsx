// 'use client'

// import {useState, useTransition} from 'react'
// import { Input } from './ui/input';
// import { Button } from './ui/button';
// import { upsertUserName } from '@/actions/user-progress';
// import { toast } from 'sonner';


// type Props= {
//     placeholder: string
// }


// export const ShowLottie = ({
//     LottieFile,
// }: Props) => {


//     const [pending, startTransition] = useTransition()

//     const onButtonPress = () => {
//         startTransition(()=> {
//             if (pending) return;
            
//             upsertUserName(value)
//             .catch(()=>toast.error('Что-то пошло не так! Попробуйте ещё раз'))
//         })
        
//     }


//     const [value, setValue] = useState(placeholder);
//     const handleChange = (event:any) => {
//     setValue(event.target.value);
//     }

//     return (
//         <>
//             <Input 
//                 placeholder={placeholder}
//                 type="text"
//                 value={value}
//                 onChange={handleChange} 
//             />

//             {/* <p>Value: {value}</p> */}
//             <Button 
//                 onClick={onButtonPress}
//                 type="submit"
//             >
//                 Поменять имя
//             </Button> 
//         </>
//     )
// }