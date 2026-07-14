
import {  useEffect, useState, useTransition } from "react"
import styles from "./select.module.css"
import { Avatar, AvatarImage } from "./ui/avatar"
import { toast } from "sonner"
import { upsertUserAvatar } from "@/actions/user-progress"


export type SelectOption = {
  label: string
  // value?: string | number
  value: any
}

type SelectProps = {
  options: SelectOption[]
  value?: SelectOption
  onChange: (value: SelectOption | undefined) => void
//   value: string
} 

export function NewSelect({ value, onChange, options }: SelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(0)
  const [pending, startTransition] = useTransition()

  function clearOptions() {
    onChange(undefined)
  }

  function selectOption(option: SelectOption) {
    if (option !== value) onChange(option)
  }

  function isOptionSelected(option: SelectOption) {


    // useEffect(() => {
    //     if (isOpen) setHighlightedIndex(0)
    // }, [isOpen])

    return option === value
  }


  return (
    <div
      onBlur={() => setIsOpen(false)}
      onClick={() => setIsOpen(prev => !prev)}
      tabIndex={0}
      className={styles.container}
    >


    <span className={styles.value}> 

      <Avatar>
            <AvatarImage 
                className="object-cover"
                src={value?.label}
            />
        </Avatar>  

    </span>

      <div className={styles.divider}></div>
      <div className={styles.caret}></div>
      <ul className={`${styles.options} ${isOpen ? styles.show : ""}`}>
        {options.map((option, index) => (
          <li
            onClick={e => {
              e.stopPropagation()
              selectOption(option)
              setIsOpen(false)




        startTransition(()=> {
            if (pending) return;
            
            upsertUserAvatar(option.label)
            .catch(()=>toast.error('Что-то пошло не так! Попробуйте ещё раз'))
        })



            }}
            onMouseEnter={() => setHighlightedIndex(index)}
            key={option.value}
            className={`${styles.option} ${
              isOptionSelected(option) ? styles.selected : ""
            } ${index === highlightedIndex ? styles.highlighted : ""}`}
          >

        <Avatar>
            <AvatarImage 
                className="object-cover"
                src={option.label}
            />
        </Avatar>  


          </li>
        ))}
      </ul>
    </div>
  )
}

























// import { useEffect, useRef, useState, useTransition } from "react"
// import styles from "./select.module.css"
// import { Avatar, AvatarImage } from "./ui/avatar"
// import { upsertUserAvatar } from "@/actions/user-progress"
// import { toast } from "sonner"



// export type SelectOption = {
//   label: string
//   value: string | number
// }

// type MultipleSelectProps = {
//   multiple: true
//   value: SelectOption[]
//   onChange: (value: SelectOption[]) => void
// }

// type SingleSelectProps = {
//   multiple?: false
//   value?: SelectOption
//   onChange: (value: SelectOption | undefined) => void
// }

// type SelectProps = {
//   options: SelectOption[]
//   imageSrc: string
// } & (SingleSelectProps | MultipleSelectProps)

// export function NewSelect({ multiple, value, onChange, options }: SelectProps) {
//   const [isOpen, setIsOpen] = useState(false)
//   const [highlightedIndex, setHighlightedIndex] = useState(0)
//   const containerRef = useRef<HTMLDivElement>(null)

// //   function clearOptions() {
// //     multiple ? onChange([]) : onChange(undefined)
// //   }

//   function selectOption(option: SelectOption) {
//     if (multiple) {
//       if (value.includes(option)) {
//         onChange(value.filter(o => o !== option))
//       } else {
//         onChange([...value, option])
//       }
//     } else {
//       if (option !== value) onChange(option)
//     }
//   }

//   function isOptionSelected(option: SelectOption) {

//     // const [pending, startTransition] = useTransition()

//     // const onButtonPress = () => {
//     //     startTransition(()=> {
//     //         if (pending) return;
            
//     //         upsertUserAvatar(option.label)
//     //         .catch(()=>toast.error('Что-то пошло не так! Попробуйте ещё раз'))
//     //     })
        
//     // }





    

//     return multiple ? value.includes(option) : option === value
//   }

//   useEffect(() => {
//     if (isOpen) setHighlightedIndex(0)
//   }, [isOpen])

//   useEffect(() => {
//     const handler = (e: KeyboardEvent) => {
//       if (e.target != containerRef.current) return
//       switch (e.code) {
//         case "Enter":
//         case "Space":
//           setIsOpen(prev => !prev)
//           if (isOpen) selectOption(options[highlightedIndex])
//           break
//         case "ArrowUp":
//         case "ArrowDown": {
//           if (!isOpen) {
//             setIsOpen(true)
//             break
//           }

//           const newValue = highlightedIndex + (e.code === "ArrowDown" ? 1 : -1)
//           if (newValue >= 0 && newValue < options.length) {
//             setHighlightedIndex(newValue)
//           }
//           break
//         }
//         case "Escape":
//           setIsOpen(false)
//           break
//       }
//     }
//     containerRef.current?.addEventListener("keydown", handler)

//     return () => {
//       containerRef.current?.removeEventListener("keydown", handler)
//     }
//   }, [isOpen, highlightedIndex, options])

//   return (
//     <div
//       ref={containerRef}
//       onBlur={() => setIsOpen(false)}
//       onClick={() => setIsOpen(prev => !prev)}
//       tabIndex={0}
//       className={styles.container}
//     >
//       <span className={styles.value}>
//         {multiple
//           ? value.map(v => (
//               <button
//                 key={v.value}
//                 onClick={e => {
//                   e.stopPropagation()
//                   selectOption(v)
//                 }}
//                 className={styles["option-badge"]}
//               >
//                 {v.label}
//                 <span className={styles["remove-btn"]}>&times;</span>
//               </button>
//             ))
//           : 
          
          
          
//         //   value?.label
          


//         <Avatar
//             // className="border bg-green-500 h-12 w-12 ml-3 mr-6"
//             // className="border bg-green-500 h-10 w-10 ml-3 mr-6"
//             >
//             <AvatarImage 
//                 className="object-cover"
//                 src={value?.label}
//             />
//         </Avatar>  


          
          
          
//           }
//       </span>
//       {/* <button
//         onClick={e => {
//           e.stopPropagation()
//           clearOptions()
//         }}
//         className={styles["clear-btn"]}
//       >
//         &times;
//       </button> */}
//       <div className={styles.divider}></div>
//       <div className={styles.caret}></div>
//       <ul className={`${styles.options} ${isOpen ? styles.show : ""}`}>
//         {options.map((option, index) => (
//           <li
//             onClick={e => {
//               e.stopPropagation()
//               selectOption(option)
//               setIsOpen(false)
//             }}
//             onMouseEnter={() => setHighlightedIndex(index)}
//             key={option.value}
//             className={`${styles.option} ${
//               isOptionSelected(option) ? styles.selected : ""
//             } ${index === highlightedIndex ? styles.highlighted : ""}`}
//           >



//             {/* {option.label} */}



//             <Avatar
//             // className="border bg-green-500 h-12 w-12 ml-3 mr-6"
//             // className="border bg-green-500 h-10 w-10 ml-3 mr-6"
//             >
//             <AvatarImage 
//                 className="object-cover"
//                 src={option.label}
//             />
//         </Avatar>  




//           </li>
//         ))}
//       </ul>
//     </div>
//   )
// }
