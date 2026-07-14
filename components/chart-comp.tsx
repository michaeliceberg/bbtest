// "use client"
 
// import { Bar, BarChart } from "recharts"
 
// import { ChartConfig, ChartContainer } from "@/components/ui/chart"
 
// const chartData = [
//   { month: "January", desktop: 186, mobile: 80 },
//   { month: "February", desktop: 305, mobile: 200 },
//   { month: "March", desktop: 237, mobile: 120 },
//   { month: "April", desktop: 73, mobile: 190 },
//   { month: "May", desktop: 209, mobile: 130 },
//   { month: "June", desktop: 214, mobile: 140 },
// ]
 
// const chartConfig = {
//   desktop: {
//     label: "Desktop",
//     color: "#2563eb",
//   },
//   mobile: {
//     label: "Mobile",
//     color: "#60a5fa",
//   },
// } satisfies ChartConfig
 
// export function ChartComponent() {
//   return (
//     <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
//       <BarChart accessibilityLayer data={chartData}>
//         <Bar dataKey="desktop" fill="var(--color-desktop)" radius={4} />
//         <Bar dataKey="mobile" fill="var(--color-mobile)" radius={4} />
//       </BarChart>
//     </ChartContainer>
//   )
// }

"use client"

import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"

import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"


type Props = 
    {
        TrainingProgressMonth:    
            {
                month: string,
                doneRight: number,
                doneWrong: number,
            }[]
    }
const chartConfig = {
  doneRight: {
    label: "Верно",
    color: "#2563eb",
  },
  doneWrong: {
    label: "Ошибки",
    // color: "#60a5fa",
    color: "#FE5BAC",
  },
} satisfies ChartConfig

export function ChartComponent({
    TrainingProgressMonth,
}: Props) {




  return (
    <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
      <BarChart accessibilityLayer data={TrainingProgressMonth}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="month"
          tickLine={false}
          tickMargin={10}
          axisLine={false}
          tickFormatter={(value) => value.slice(0, 3)}
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />
        <Bar dataKey="doneRight" fill="var(--color-doneRight)" radius={4} />
        <Bar dataKey="doneWrong" fill="var(--color-doneWrong)" radius={4} />
      </BarChart>
    </ChartContainer>
  )
}
