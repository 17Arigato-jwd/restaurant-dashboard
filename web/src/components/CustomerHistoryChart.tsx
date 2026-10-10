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
  const [chartData, setChartData] = React.useState<{date: string, dineIn: number, delivery: number}[]>([])

  React.useEffect(() => {
    let active = true;
    const fetchAnalytics = async () => {
      try {
        const token = localStorage.getItem('restaurant-storage') ? JSON.parse(localStorage.getItem('restaurant-storage')!).state.token : null;
        const res = await fetch('http://127.0.0.1:8000/api/analytics', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          if (active) setChartData(data);
        }
      } catch (e) {
        console.error(e)
      }
    }
    
    fetchAnalytics();
    const interval = setInterval(fetchAnalytics, 5000);
    return () => { active = false; clearInterval(interval); }
  }, [])

  const filteredData = chartData.filter((item) => {
    const date = new Date(item.date)
    const referenceDate = new Date() // Use current date for live API
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
