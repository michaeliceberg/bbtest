// import { Datagrid, List, TextField, ReferenceField, NumberField, SelectField } from 'react-admin'

// export const ChallengeList = () => {
    
//     return(
//         <List>
//             <Datagrid rowClick='edit'>
//                 <TextField source='id'/>
//                 <TextField source='question'/>
//                 <SelectField 
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
//                 />
//                 <ReferenceField source='lessonId' reference='lessons'/>
//                 <NumberField source='order' />
//             </Datagrid>
//         </List>     
//     )       
// }