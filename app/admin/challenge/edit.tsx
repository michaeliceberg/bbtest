// import { SimpleForm, Edit, TextInput, required, ReferenceInput, NumberInput, SelectInput } from 'react-admin'

// export const ChallengeEdit = () => {
    
//     return(
//         <Edit>
//             <SimpleForm>
//                 <TextInput 
//                     source='question' 
//                     validate={[required()]} 
//                     label='Question'
//                 />
//                 <SelectInput 
//                     source='type'
//                     choices={[
//                         {
//                             id: "SELECT",
//                             name: "SELECT",
//                         },
//                         {
//                             id: "ASSIST",
//                             name: "ASSIST",
//                         },
//                         {
//                             id: "CONNECT",
//                             name: "CONNECT",
//                         },
//                         {
//                             id: "SLIDER",
//                             name: "SLIDER",
//                         },
//                         {
//                             id: "CONSTRUCT",
//                             name: "CONSTRUCT",
//                         },
//                         {
//                             id: "WORKBOOK",
//                             name: "WORKBOOK",
//                         },
//                         {
//                             id: "R ASSIST",
//                             name: "R ASSIST",
//                         },
//                         {
//                             id: "R CONNECT",
//                             name: "R CONNECT",
//                         },
//                         {
//                             id: "R SLIDER",
//                             name: "R SLIDER",
//                         },
//                         {
//                             id: "GEOSIN",
//                             name: "GEOSIN",
//                         },
//                     ]}
//                     validate={[required()]} 
//                 /> 
//                 <ReferenceInput 
//                     source='lessonId'
//                     reference='lessons'
//                 />
//                 <NumberInput 
//                     source='order'
//                     validate={[required()]}
//                     label='Order'
//                 />
//             </SimpleForm>
//         </Edit>     
//     )       
// }