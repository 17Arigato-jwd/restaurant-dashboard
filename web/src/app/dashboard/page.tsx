/* eslint-disable */
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { TrendingUp, Clock, AlertTriangle, AlertCircle, CreditCard, Banknote, Smartphone, CheckCircle2, Utensils } from "lucide-react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  PieChart, Pie, Cell
} from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent, type ChartConfig } from "@/components/ui/chart";

// Mock Data
const HOURLY_DATA = [
  { time: "12 PM", dineIn: 12000, delivery: 8000 },
  { time: "1 PM", dineIn: 25000, delivery: 15000 },
  { time: "2 PM", dineIn: 18000, delivery: 12000 },
  { time: "3 PM", dineIn: 5000, delivery: 4000 },
  { time: "7 PM", dineIn: 15000, delivery: 20000 },
  { time: "8 PM", dineIn: 35000, delivery: 32000 },
  { time: "9 PM", dineIn: 42000, delivery: 38000 },
  { time: "10 PM", dineIn: 20000, delivery: 25000 },
];

const CHANNEL_DATA = [
  { name: "Dine-In", value: 172000, color: "#10b981", key: "dineIn" },
  { name: "Swiggy", value: 85000, color: "#f97316", key: "swiggy" },
  { name: "Zomato", value: 65000, color: "#ef4444", key: "zomato" },
  { name: "ONDC", value: 4000, color: "#3b82f6", key: "ondc" },
];

const ACTIVE_ORDERS = [
  { id: "KOT-142", channel: "Dine-In", table: "T-04", items: 4, elapsed: 4, status: "green" },
  { id: "KOT-143", channel: "Swiggy", table: "Rider Waiting", items: 2, elapsed: 8, status: "green" },
  { id: "KOT-144", channel: "Zomato", table: "Prep", items: 5, elapsed: 14, status: "amber" },
  { id: "KOT-145", channel: "Dine-In", table: "T-02", items: 3, elapsed: 16, status: "amber" },
  { id: "KOT-146", channel: "Swiggy", table: "Rider Waiting", items: 8, elapsed: 22, status: "red" },
];

const LOW_STOCK = [
  { item: "Fresh Paneer", current: "2.1 kg", min: "5.0 kg", requested: true },
  { item: "Amul Butter", current: "0.5 kg", min: "2.0 kg", requested: false },
  { item: "Tandoori Chicken", current: "4 portions", min: "15 portions", requested: true },
];

export default function DashboardPage() {
  const [showDelayedOnly, setShowDelayedOnly] = useState(false);
  const [timeFilter, setTimeFilter] = useState<"today" | "yesterday">("today");

  const chartConfigHourly = {
    dineIn: { label: "Dine-In", color: "hsl(var(--main))" },
    delivery: { label: "Aggregators", color: "#3b82f6" },
  } satisfies ChartConfig;

  const chartConfigChannel = {
    dineIn: { label: "Dine-In", color: "#10b981" },
    swiggy: { label: "Swiggy", color: "#f97316" },
    zomato: { label: "Zomato", color: "#ef4444" },
    ondc: { label: "ONDC", color: "#3b82f6" },
  } satisfies ChartConfig;

  const filteredOrders = showDelayedOnly 
    ? ACTIVE_ORDERS.filter(o => o.status === "amber" || o.status === "red")
    : ACTIVE_ORDERS;

  return (
    <div className="flex-1 p-8 overflow-y-auto h-[calc(100vh-4rem)] bg-muted/10">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sales Command Center</h1>
          <p className="text-muted-foreground mt-1">Real-time revenue, kitchen performance, and active operations.</p>
        </div>
      </div>

      {/* Top KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Gross Revenue</p>
                <h3 className="text-3xl font-bold mt-2">₹3,26,000</h3>
                <p className="text-sm text-green-600 flex items-center mt-1 font-medium">
                  <TrendingUp className="w-4 h-4 mr-1" /> +14.2% vs yesterday
                </p>
              </div>
              <div className="p-3 bg-primary/10 rounded-full"><Banknote className="w-5 h-5 text-primary" /></div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Prep Time</p>
                <h3 className="text-3xl font-bold mt-2 text-amber-600">16.4m</h3>
                <p className="text-sm text-amber-600 flex items-center mt-1 font-medium">
                  Target: 14.0m (Lagging)
                </p>
              </div>
              <div className="p-3 bg-amber-100 dark:bg-amber-900/40 rounded-full"><Clock className="w-5 h-5 text-amber-600" /></div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Orders</p>
                <h3 className="text-3xl font-bold mt-2">{ACTIVE_ORDERS.length}</h3>
                <p className="text-sm text-muted-foreground mt-1 font-medium">
                  Across 3 stations
                </p>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900/40 rounded-full"><Utensils className="w-5 h-5 text-blue-600" /></div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <p className="text-sm font-medium text-muted-foreground mb-4">Payment Channel Split</p>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="flex items-center"><Smartphone className="w-4 h-4 mr-1 text-purple-500" /> UPI (PhonePe/GPay)</span>
                  <span className="font-bold">68%</span>
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden"><div className="h-full bg-purple-500 w-[68%]"></div></div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="flex items-center"><CreditCard className="w-4 h-4 mr-1 text-blue-500" /> Cards</span>
                  <span className="font-bold">22%</span>
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden"><div className="h-full bg-blue-500 w-[22%]"></div></div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="flex items-center"><Banknote className="w-4 h-4 mr-1 text-green-500" /> Cash</span>
                  <span className="font-bold">10%</span>
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden"><div className="h-full bg-green-500 w-[10%]"></div></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Middle Row: Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle>Hourly Sales Flow</CardTitle>
              <CardDescription>Lunch vs Dinner peak volumes (₹)</CardDescription>
            </div>
            <div className="flex bg-muted rounded-lg p-1">
              <button 
                className={`px-3 py-1 text-sm rounded-md transition-colors ${timeFilter === 'today' ? 'bg-background shadow-sm font-medium' : 'text-muted-foreground'}`}
                onClick={() => setTimeFilter('today')}
              >
                Today
              </button>
              <button 
                className={`px-3 py-1 text-sm rounded-md transition-colors ${timeFilter === 'yesterday' ? 'bg-background shadow-sm font-medium' : 'text-muted-foreground'}`}
                onClick={() => setTimeFilter('yesterday')}
              >
                Yesterday
              </button>
            </div>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfigHourly} className="h-[300px] w-full mt-4">
                <BarChart accessibilityLayer data={HOURLY_DATA} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="time" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} tickFormatter={(val) => `₹${val/1000}k`} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Bar dataKey="dineIn" name="Dine-In" stackId="a" fill="var(--color-dineIn)" radius={[0, 0, 4, 4]} />
                  <Bar dataKey="delivery" name="Aggregators" stackId="a" fill="var(--color-delivery)" radius={[4, 4, 0, 0]} />
                </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Revenue Channel Share</CardTitle>
            <CardDescription>Dine-in vs Delivery platforms</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfigChannel} className="h-[220px] w-full">
                <PieChart>
                  <Pie
                    data={CHANNEL_DATA}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {CHANNEL_DATA.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={`var(--color-${entry.key})`} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                </PieChart>
            </ChartContainer>
            
            <div className="mt-6 p-4 bg-muted/50 rounded-lg border border-dashed flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Ratio Monitor</p>
                <p className="text-sm font-bold mt-1">Dine-In <span className="text-green-600">₹1.72L</span> vs Delivery <span className="text-blue-600">₹1.54L</span></p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row: Tables & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Active Orders Escalation</CardTitle>
              <CardDescription>Live kitchen tickets sorted by delay.</CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">Show Delayed Only</span>
              <Switch checked={showDelayedOnly} onCheckedChange={setShowDelayedOnly} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 text-muted-foreground uppercase text-xs">
                  <tr>
                    <th className="px-4 py-3 font-medium">Ticket</th>
                    <th className="px-4 py-3 font-medium">Channel</th>
                    <th className="px-4 py-3 font-medium">Destination</th>
                    <th className="px-4 py-3 font-medium">Items</th>
                    <th className="px-4 py-3 font-medium text-right">Elapsed</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No delayed orders!</td>
                    </tr>
                  ) : (
                    filteredOrders.map(order => (
                      <tr key={order.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 font-medium">{order.id}</td>
                        <td className="px-4 py-3">{order.channel}</td>
                        <td className="px-4 py-3">{order.table}</td>
                        <td className="px-4 py-3">{order.items} items</td>
                        <td className="px-4 py-3 text-right">
                          <Badge variant="outline" className={`
                            ${order.status === 'green' ? 'text-green-700 bg-green-100 border-green-300' : ''}
                            ${order.status === 'amber' ? 'text-amber-700 bg-amber-100 border-amber-300' : ''}
                            ${order.status === 'red' ? 'text-red-700 bg-red-100 border-red-300 animate-pulse' : ''}
                          `}>
                            {order.elapsed} mins
                          </Badge>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-200 dark:border-red-900/50">
          <CardHeader className="bg-red-50 dark:bg-red-900/10 pb-4 border-b border-red-100 dark:border-red-900/30">
            <CardTitle className="text-red-800 dark:text-red-400 flex items-center text-lg">
              <AlertTriangle className="w-5 h-5 mr-2" /> Low Stock Alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-red-100 dark:divide-red-900/30">
              {LOW_STOCK.map((stock, i) => (
                <div key={i} className="p-4 flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-sm">{stock.item}</span>
                    <span className="text-red-600 dark:text-red-400 font-mono text-sm font-bold">{stock.current}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground">Min Threshold: {stock.min}</span>
                    {stock.requested ? (
                      <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800">
                        <CheckCircle2 className="w-3 h-3 mr-1" /> Auto-Requested
                      </Badge>
                    ) : (
                      <Badge variant="destructive" className="bg-red-500">
                        <AlertCircle className="w-3 h-3 mr-1" /> Request Pending
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Need to create Utensils icon import if not exist, will reuse one.
