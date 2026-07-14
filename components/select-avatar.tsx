// import {
//     Select,
//     SelectContent,
//     SelectItem,
//     SelectTrigger,
//     SelectValue,
//   } from "@/components/ui/select"
  


// import React, { useState } from 'react'
// import { Avatar, AvatarImage } from "./ui/avatar"

// const imgHrefList = [
//     "cats/cat1.jpg",
//     "cats/cat2.jpg",
//     "cats/cat3.jpg",
//     "cats/cat4.jpg",
//     "cats/cat5.jpg",
//     "cats/cat6.jpg",
//     "cats/cat7.jpg",
//     "cats/cat8.jpg",
//     "cats/cat9.jpg",
//     "cats/cat10.jpg",
//     "cats/cat11.jpg",
//     "cats/cat12.jpg",
//     "cats/cat13.jpg",
//     "cats/cat14.jpg",
//     "cats/cat15.jpg"
// ]



// const [value, setValue] = useState<typeof imgHrefList[0] | undefined>(imgHrefList[0])

// export const SelectAvatar = () => {

//     const onChangeValue = (event: <T>) => {
//     }

//   return (
//     <div>

// {/* onValueChange={field.onChange} defaultValue={field.value} */}

//         <Select onValueChange={o => setValue(o)}>
//             <SelectTrigger className="w-[100px]">
//                 <SelectValue placeholder="Theme" />
//             </SelectTrigger>
//             <SelectContent>
                
//                 {imgHrefList.map(imgHref => (

//                     <SelectItem key={imgHref} value={imgHref}>
//                         <Avatar
//                             // className="border bg-green-500 h-12 w-12 ml-3 mr-6"
//                             // className="border bg-green-500 h-10 w-10 ml-3 mr-6"
//                             >
//                             <AvatarImage 
//                                 className="object-cover"
//                                 src={imgHref}
//                             />
//                         </Avatar>  
//                     </SelectItem>

//                 ))}
                
                
//                 {/* <SelectItem value="dark">Dark</SelectItem>
//                 <SelectItem value="system">System</SelectItem> */}
//             </SelectContent>
//         </Select>

//     </div>
    


//   )
// }


 