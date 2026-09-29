"use client"

import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"

import * as React from "react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export const description = "An interactive area chart"

const chartData = [
  { date: "2024-04-01", dineIn: 222, delivery: 150 },
  { date: "2024-04-02", dineIn: 97, delivery: 180 },
  { date: "2024-04-03", dineIn: 167, delivery: 120 },
  { date: "2024-04-04", dineIn: 242, delivery: 260 },
  { date: "2024-04-05", dineIn: 373, delivery: 290 },
  { date: "2024-04-06", dineIn: 301, delivery: 340 },
  { date: "2024-04-07", dineIn: 245, delivery: 180 },
  { date: "2024-04-08", dineIn: 409, delivery: 320 },
  { date: "2024-04-09", dineIn: 59, delivery: 110 },
  { date: "2024-04-10", dineIn: 261, delivery: 190 },
  { date: "2024-04-11", dineIn: 327, delivery: 350 },
  { date: "2024-04-12", dineIn: 292, delivery: 210 },
  { date: "2024-04-13", dineIn: 342, delivery: 380 },
  { date: "2024-04-14", dineIn: 137, delivery: 220 },
  { date: "2024-04-15", dineIn: 120, delivery: 170 },
  { date: "2024-04-16", dineIn: 138, delivery: 190 },
  { date: "2024-04-17", dineIn: 446, delivery: 360 },
  { date: "2024-04-18", dineIn: 364, delivery: 410 },
  { date: "2024-04-19", dineIn: 243, delivery: 180 },
  { date: "2024-04-20", dineIn: 89, delivery: 150 },
  { date: "2024-04-21", dineIn: 137, delivery: 200 },
  { date: "2024-04-22", dineIn: 224, delivery: 170 },
  { date: "2024-04-23", dineIn: 138, delivery: 230 },
  { date: "2024-04-24", dineIn: 387, delivery: 290 },
  { date: "2024-04-25", dineIn: 215, delivery: 250 },
  { date: "2024-04-26", dineIn: 75, delivery: 130 },
  { date: "2024-04-27", dineIn: 383, delivery: 420 },
  { date: "2024-04-28", dineIn: 122, delivery: 180 },
  { date: "2024-04-29", dineIn: 315, delivery: 240 },
  { date: "2024-04-30", dineIn: 454, delivery: 380 },
  { date: "2024-05-01", dineIn: 165, delivery: 220 },
  { date: "2024-05-02", dineIn: 293, delivery: 310 },
  { date: "2024-05-03", dineIn: 247, delivery: 190 },
  { date: "2024-05-04", dineIn: 385, delivery: 420 },
  { date: "2024-05-05", dineIn: 481, delivery: 390 },
  { date: "2024-05-06", dineIn: 498, delivery: 520 },
  { date: "2024-05-07", dineIn: 388, delivery: 300 },
  { date: "2024-05-08", dineIn: 149, delivery: 210 },
  { date: "2024-05-09", dineIn: 227, delivery: 180 },
  { date: "2024-05-10", dineIn: 293, delivery: 330 },
  { date: "2024-05-11", dineIn: 335, delivery: 270 },
  { date: "2024-05-12", dineIn: 197, delivery: 240 },
  { date: "2024-05-13", dineIn: 197, delivery: 160 },
  { date: "2024-05-14", dineIn: 448, delivery: 490 },
  { date: "2024-05-15", dineIn: 473, delivery: 380 },
  { date: "2024-05-16", dineIn: 338, delivery: 400 },
  { date: "2024-05-17", dineIn: 499, delivery: 420 },
  { date: "2024-05-18", dineIn: 315, delivery: 350 },
  { date: "2024-05-19", dineIn: 235, delivery: 180 },
  { date: "2024-05-20", dineIn: 177, delivery: 230 },
  { date: "2024-05-21", dineIn: 82, delivery: 140 },
  { date: "2024-05-22", dineIn: 81, delivery: 120 },
  { date: "2024-05-23", dineIn: 252, delivery: 290 },
  { date: "2024-05-24", dineIn: 294, delivery: 220 },
  { date: "2024-05-25", dineIn: 201, delivery: 250 },
  { date: "2024-05-26", dineIn: 213, delivery: 170 },
  { date: "2024-05-27", dineIn: 420, delivery: 460 },
  { date: "2024-05-28", dineIn: 233, delivery: 190 },
  { date: "2024-05-29", dineIn: 78, delivery: 130 },
  { date: "2024-05-30", dineIn: 340, delivery: 280 },
  { date: "2024-05-31", dineIn: 178, delivery: 230 },
  { date: "2024-06-01", dineIn: 178, delivery: 200 },
  { date: "2024-06-02", dineIn: 470, delivery: 410 },
  { date: "2024-06-03", dineIn: 103, delivery: 160 },
  { date: "2024-06-04", dineIn: 439, delivery: 380 },
  { date: "2024-06-05", dineIn: 88, delivery: 140 },
  { date: "2024-06-06", dineIn: 294, delivery: 250 },
  { date: "2024-06-07", dineIn: 323, delivery: 370 },
  { date: "2024-06-08", dineIn: 385, delivery: 320 },
  { date: "2024-06-09", dineIn: 438, delivery: 480 },
  { date: "2024-06-10", dineIn: 155, delivery: 200 },
  { date: "2024-06-11", dineIn: 92, delivery: 150 },
  { date: "2024-06-12", dineIn: 492, delivery: 420 },
  { date: "2024-06-13", dineIn: 81, delivery: 130 },
  { date: "2024-06-14", dineIn: 426, delivery: 380 },
  { date: "2024-06-15", dineIn: 307, delivery: 350 },
  { date: "2024-06-16", dineIn: 371, delivery: 310 },
  { date: "2024-06-17", dineIn: 475, delivery: 520 },
  { date: "2024-06-18", dineIn: 107, delivery: 170 },
  { date: "2024-06-19", dineIn: 341, delivery: 290 },
  { date: "2024-06-20", dineIn: 408, delivery: 450 },
  { date: "2024-06-21", dineIn: 169, delivery: 210 },
  { date: "2024-06-22", dineIn: 317, delivery: 270 },
  { date: "2024-06-23", dineIn: 480, delivery: 530 },
  { date: "2024-06-24", dineIn: 132, delivery: 180 },
  { date: "2024-06-25", dineIn: 141, delivery: 190 },
  { date: "2024-06-26", dineIn: 434, delivery: 380 },
  { date: "2024-06-27", dineIn: 448, delivery: 490 },
  { date: "2024-06-28", dineIn: 149, delivery: 200 },
  { date: "2024-06-29", dineIn: 103, delivery: 160 },
  { date: "2024-06-30", dineIn: 446, delivery: 400 },
]

const chartConfig = {
  visitors: {
    label: "Guests",
  },
  dineIn: {
    label: "Dine-In Guests",
    color: "var(--chart-1)",
  },
  delivery: {
    label: "Delivery Orders",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig

export function CustomerHistoryChart() {
  const [timeRange, setTimeRange] = React.useState("90d")

  const filteredData = chartData.filter((item) => {
    const date = new Date(item.date)
    const referenceDate = new Date("2024-06-30")
    let daysToSubtract = 90
    if (timeRange === "30d") {
      daysToSubtract = 30
    } else if (timeRange === "7d") {
      daysToSubtract = 7
    }
    const startDate = new Date(referenceDate)
    startDate.setDate(startDate.getDate() - daysToSubtract)
    return date >= startDate
  })

  return (
    <Card className="bg-secondary-background text-foreground">
      <CardHeader className="flex items-center sm:gap-2 gap-4 space-y-0 sm:flex-row flex-col">
        <div className="grid flex-1 gap-1 text-center sm:text-left">
          <CardTitle>Customer Flow</CardTitle>
          <CardDescription>
            Showing guest volumes for the last 3 months
          </CardDescription>
        </div>
        <Select
          value={timeRange}
          onValueChange={(value) => value && setTimeRange(value)}
        >
          <SelectTrigger
            className="w-[160px] sm:ml-auto"
            aria-label="Select a value"
          >
            <SelectValue placeholder="Last 3 months" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="90d">Last 3 months</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="7d">Last 7 days</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[250px] w-full"
        >
          <AreaChart data={filteredData}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value)
                return date.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })
              }}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => {
                    return new Date(value as string).toLocaleDateString(
                      "en-US",
                      {
                        month: "short",
                        day: "numeric",
                      },
                    )
                  }}
                  indicator="dot"
                />
              }
            />
            <Area
              dataKey="delivery"
              type="natural"
              fill="var(--color-delivery)"
              stroke="var(--color-delivery)"
              stackId="a"
              activeDot={{
                fill: "var(--chart-active-dot)",
              }}
            />
            <Area
              dataKey="dineIn"
              type="natural"
              fill="var(--color-dineIn)"
              stroke="var(--color-dineIn)"
              stackId="a"
              activeDot={{
                fill: "var(--chart-active-dot)",
              }}
            />
            <ChartLegend content={<ChartLegendContent />} />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
