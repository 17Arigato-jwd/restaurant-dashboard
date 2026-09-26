"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell, ReferenceLine } from "recharts";
import { Star, HelpCircle, TrendingUp, AlertTriangle } from "lucide-react";

// Mock Menu Items
const INITIAL_MENU = [
  { id: "M1", name: "Butter Chicken", category: "main", salesVolume: 850, bomCost: 140, retailPrice: 380 },
  { id: "M2", name: "Dal Makhani", category: "main", salesVolume: 920, bomCost: 65, retailPrice: 240 },
  { id: "M3", name: "Truffle Naan", category: "breads", salesVolume: 120, bomCost: 80, retailPrice: 180 },
  { id: "M4", name: "Paneer Tikka", category: "starters", salesVolume: 780, bomCost: 110, retailPrice: 260 },
  { id: "M5", name: "Exotic Veg Curry", category: "main", salesVolume: 180, bomCost: 120, retailPrice: 220 },
  { id: "M6", name: "Virgin Mojito", category: "drinks", salesVolume: 650, bomCost: 35, retailPrice: 150 },
  { id: "M7", name: "Lobster Thermidor", category: "seafood", salesVolume: 40, bomCost: 850, retailPrice: 1800 },
  { id: "M8", name: "Plain Rice", category: "rice", salesVolume: 800, bomCost: 20, retailPrice: 90 },
];

const AVG_VOLUME = 500;
const AVG_MARGIN_PERCENT = 60;

const getMatrixCategory = (volume: number, marginPercent: number) => {
  if (volume >= AVG_VOLUME && marginPercent >= AVG_MARGIN_PERCENT) return "STAR";
  if (volume < AVG_VOLUME && marginPercent >= AVG_MARGIN_PERCENT) return "PUZZLE";
  if (volume >= AVG_VOLUME && marginPercent < AVG_MARGIN_PERCENT) return "PLOW_HORSE";
  return "DOG";
};

const CATEGORY_UI = {
  STAR: { label: "Star", color: "bg-green-500", icon: <Star className="w-4 h-4 mr-1" />, desc: "High Margin, High Sales", advice: "Maintain strict quality control. Highly profitable and popular. Promote heavily." },
  PUZZLE: { label: "Puzzle", color: "bg-blue-500", icon: <HelpCircle className="w-4 h-4 mr-1" />, desc: "High Margin, Low Sales", advice: "Highly profitable but hard to sell. Decrease price slightly, rename, or push via suggestive selling." },
  PLOW_HORSE: { label: "Plow Horse", color: "bg-amber-500", icon: <TrendingUp className="w-4 h-4 mr-1" />, desc: "Low Margin, High Sales", advice: "Popular but low margin. Increase price slightly, or decrease portion size/ingredient cost carefully." },
  DOG: { label: "Dog", color: "bg-red-500", icon: <AlertTriangle className="w-4 h-4 mr-1" />, desc: "Low Margin, Low Sales", advice: "Unpopular and unprofitable. Consider removing from menu or reinventing completely." }
};

export default function MenuEngineeringPage() {
  const [selectedDishId, setSelectedDishId] = useState<string>("M1");
  const [simPrice, setSimPrice] = useState<number>(380);
  const [simCost, setSimCost] = useState<number>(140);

  // Process Data
  const processedMenu = INITIAL_MENU.map(item => {
    // If it's the selected dish, use simulated inputs
    const p = item.id === selectedDishId ? simPrice : item.retailPrice;
    const c = item.id === selectedDishId ? simCost : item.bomCost;
    
    const marginRupee = p - c;
    const marginPercent = p > 0 ? (marginRupee / p) * 100 : 0;
    const classification = getMatrixCategory(item.salesVolume, marginPercent);
    
    return {
      ...item,
      retailPrice: p,
      bomCost: c,
      marginRupee,
      marginPercent,
      classification
    };
  });

  const selectedDish = processedMenu.find(d => d.id === selectedDishId);
  const ui = selectedDish ? CATEGORY_UI[selectedDish.classification as keyof typeof CATEGORY_UI] : CATEGORY_UI.STAR;

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const cat = CATEGORY_UI[data.classification as keyof typeof CATEGORY_UI];
      return (
        <div className="bg-background border rounded-lg p-3 shadow-md text-sm">
          <p className="font-bold border-b pb-1 mb-2">{data.name}</p>
          <div className="flex items-center gap-2 mb-2">
            <span className={`w-3 h-3 rounded-full ${cat.color}`}></span>
            <span className="font-medium">{cat.label}</span>
          </div>
          <p>Sales Volume: <b>{data.salesVolume} units</b></p>
          <p>Margin: <b>{data.marginPercent.toFixed(1)}%</b></p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 overflow-y-auto h-[calc(100vh-4rem)]">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Menu Profitability & Engineering</h1>
        <p className="text-muted-foreground mt-1">Optimize pricing, analyze dish performance, and simulate margins.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* BCG Matrix */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>4-Quadrant BCG Menu Matrix</CardTitle>
            <CardDescription>Visualizing menu items by popularity (Volume) and profitability (Margin %).</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[450px] w-full relative">
              
              {/* Quadrant Labels Background */}
              <div className="absolute inset-0 z-0 flex flex-col p-[20px] pointer-events-none opacity-10">
                <div className="flex-1 flex">
                  <div className="flex-1 border-r border-b border-foreground flex items-center justify-center font-bold text-4xl">PUZZLE</div>
                  <div className="flex-1 border-b border-foreground flex items-center justify-center font-bold text-4xl">STAR</div>
                </div>
                <div className="flex-1 flex">
                  <div className="flex-1 border-r border-foreground flex items-center justify-center font-bold text-4xl">DOG</div>
                  <div className="flex-1 border-foreground flex items-center justify-center font-bold text-4xl">PLOW HORSE</div>
                </div>
              </div>

              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-20" />
                  <XAxis type="number" dataKey="salesVolume" name="Sales Volume" tickCount={6} domain={[0, 1000]} label={{ value: 'Sales Volume (Popularity)', position: 'insideBottom', offset: -10 }} />
                  <YAxis type="number" dataKey="marginPercent" name="Margin %" tickCount={6} domain={[0, 100]} label={{ value: 'Profit Margin (%)', angle: -90, position: 'insideLeft' }} />
                  <RechartsTooltip content={<CustomTooltip />} cursor={{strokeDasharray: '3 3'}} />
                  <ReferenceLine x={AVG_VOLUME} stroke="hsl(var(--foreground))" strokeDasharray="3 3" className="opacity-50" />
                  <ReferenceLine y={AVG_MARGIN_PERCENT} stroke="hsl(var(--foreground))" strokeDasharray="3 3" className="opacity-50" />
                  <Scatter name="Dishes" data={processedMenu} onClick={(e) => {
                    setSelectedDishId(e.payload.id);
                    setSimPrice(e.payload.retailPrice);
                    setSimCost(e.payload.bomCost);
                  }}>
                    {processedMenu.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.id === selectedDishId ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))"} 
                        className={entry.id === selectedDishId ? "stroke-background stroke-[3px]" : "cursor-pointer transition-colors hover:fill-primary"}
                        r={entry.id === selectedDishId ? 10 : 7}
                      />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Interactive Simulator */}
        <div className="space-y-6">
          <Card className="border-2 border-primary/20">
            <CardHeader className="bg-primary/5 pb-4 border-b border-primary/10">
              <CardTitle>Interactive Dish Simulator</CardTitle>
              <CardDescription>Select a point on the graph or a dish below to simulate pricing changes.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="space-y-2">
                <Label>Selected Dish</Label>
                <select 
                  className="w-full flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={selectedDishId}
                  onChange={(e) => {
                    const dish = INITIAL_MENU.find(d => d.id === e.target.value)!;
                    setSelectedDishId(dish.id);
                    setSimPrice(dish.retailPrice);
                    setSimCost(dish.bomCost);
                  }}
                >
                  {INITIAL_MENU.map(d => (
                    <option key={d.id} value={d.id}>{d.name} ({d.salesVolume} sold)</option>
                  ))}
                </select>
              </div>

              {selectedDish && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Retail Price (₹)</Label>
                      <Input type="number" value={simPrice} onChange={e => setSimPrice(Number(e.target.value))} />
                    </div>
                    <div className="space-y-2">
                      <Label>BOM Cost (₹)</Label>
                      <Input type="number" value={simCost} onChange={e => setSimCost(Number(e.target.value))} />
                    </div>
                  </div>

                  <div className="p-4 bg-muted/50 rounded-lg border border-dashed grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">New Rupee Margin</p>
                      <p className="text-xl font-bold text-green-600">₹{selectedDish.marginRupee}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">New Margin %</p>
                      <p className="text-xl font-bold text-blue-600">{selectedDish.marginPercent.toFixed(1)}%</p>
                    </div>
                  </div>

                  <div className={`p-4 rounded-lg text-white ${ui?.color}`}>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-bold flex items-center">{ui?.icon} Simulated Class: {ui?.label}</h4>
                    </div>
                    <p className="text-sm font-medium opacity-90">{ui?.desc}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">AI Strategy Recommendation</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground leading-relaxed italic">
                "{ui?.advice}"
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
