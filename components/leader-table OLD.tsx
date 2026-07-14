import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableFooter,
    TableHead,
    TableHeader,
    TableRow,
  } from "@/components/ui/table"
import { Divide } from "lucide-react";
  
  const invoices = [
    {
      invoice: "INV001",
      paymentStatus: "Paid",
      totalAmount: "$250.00",
      paymentMethod: "Credit Card",
    },
    {
      invoice: "INV002",
      paymentStatus: "Pending",
      totalAmount: "$150.00",
      paymentMethod: "PayPal",
    },
    {
      invoice: "INV003",
      paymentStatus: "Unpaid",
      totalAmount: "$350.00",
      paymentMethod: "Bank Transfer",
    },
    {
      invoice: "INV004",
      paymentStatus: "Paid",
      totalAmount: "$450.00",
      paymentMethod: "Credit Card",
    },
    {
      invoice: "INV005",
      paymentStatus: "Paid",
      totalAmount: "$550.00",
      paymentMethod: "PayPal",
    },
    {
      invoice: "INV006",
      paymentStatus: "Pending",
      totalAmount: "$200.00",
      paymentMethod: "Bank Transfer",
    },
    {
      invoice: "INV007",
      paymentStatus: "Unpaid",
      totalAmount: "$300.00",
      paymentMethod: "Credit Card",
    },
  ]
  

    var today = new Date();
    var dd:number = today.getDate();
    var mm:number = today.getMonth()+1; 
    var yyyy:number = today.getFullYear();
    var TodayStr = dd + "."  + mm + "." + yyyy


    let dateList : string[];
    dateList = []
    //  
    for (let i = 0; i <= 6; i++) {
        let dd:number = today.getDate()-i;
        let mm:number = today.getMonth()+1; 
        let yyyy:number = today.getFullYear();
        let TodayStr = dd + "."  + mm + "." + yyyy
        dateList.push(TodayStr);
    }


  const LeaderList = [
    {
      name: "Mike",
      day_1: {date: '22.11.2024', pts: 2200, hwInARow: 0, selfDoneRight: 21},
      day_2: {date: '21.11.2024', pts: 1800, hwInARow: 0, selfDoneRight: 4},
      day_3: {date: '20.11.2024',pts: 1420, hwInARow: 1, selfDoneRight: 31},
      day_4: {date: '19.11.2024',pts: 1100, hwInARow: 2, selfDoneRight: 18},
      day_5: {date: '18.11.2024',pts: 850, hwInARow: 3, selfDoneRight: 13},
      day_6: {date: '17.11.2024',pts: 530, hwInARow: 4, selfDoneRight: 27},
      day_7: {date: '16.11.2024',pts: 440, hwInARow: 5, selfDoneRight: 16},
    },
    {
        name: "Mike2",
        day_1: {date: '22.11.2024', pts: 1250, hwInARow: 0, selfDoneRight: 2},
        day_2: {date: '21.11.2024',pts: 720, hwInARow: 1, selfDoneRight: 5},
        day_3: {date: '20.11.2024',pts: 520, hwInARow: 2, selfDoneRight: 21},
        day_4: {date: '19.11.2024',pts: 410, hwInARow: 3, selfDoneRight: 8},
        day_5: {date: '18.11.2024',pts: 30, hwInARow: 0, selfDoneRight: 12},
        day_6: {date: '17.11.2024',pts: 20, hwInARow: 1, selfDoneRight: 7},
        day_7: {date: '16.11.2024',pts: 10, hwInARow: 2, selfDoneRight: 5},
      },
      
    
  ]
  // DATE LISTDATE LISTDATE LISTDATE LISTDATE LISTDATE LIST
  

  export function TableLeader() {
    return (
      <Table>
        <TableCaption>Лидеры недели</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">Имя</TableHead>
            
            <TableHead>{dateList[0]}</TableHead>
            <TableHead>{dateList[1]}</TableHead>
            <TableHead>{dateList[2]}</TableHead>
            <TableHead>{dateList[3]}</TableHead>
            <TableHead>{dateList[4]}</TableHead>

            
            
            <TableHead className="text-right">Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          
          
          {invoices.map((invoice) => (
            <TableRow key={invoice.invoice}>
              <TableCell className="font-medium">{invoice.invoice}</TableCell>
              <TableCell>{invoice.paymentStatus}</TableCell>
              <TableCell>{invoice.paymentMethod}</TableCell>
              <TableCell className="text-right">{invoice.totalAmount}</TableCell>
            </TableRow>
          ))}


        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell colSpan={3}>Total</TableCell>
            <TableCell className="text-right">$2,500.00</TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    )
  }
  