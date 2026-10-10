/* eslint-disable */
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from "recharts";
import { AlertTriangle, TrendingDown, ClipboardCheck, BookOpen } from "lucide-react";
import { authHeaders } from "@/lib/api";

interface Ingredient {
  id: string;
  name: string;
  startStock: number;
  theoreticalSold: number;
  actualStock: number;
  unit: string;
  expiryDate: string;
}

interface ApiInventoryItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  expiryDate: string;
}

const RECIPE_GUIDE = [
  { dish: "Paneer Butter Masala", ingredients: ["150g Fresh Paneer", "50g Amul Butter", "200ml Base Gravy"] },
  { dish: "Butter Chicken", ingredients: ["180g Chicken Tikka", "60g Amul Butter", "50ml Fresh Cream"] },
  { dish: "Dal Makhani", ingredients: ["200g Urad Dal", "40g Amul Butter", "30ml Fresh Cream"] },
];

export default function InventoryPage() {
  const [inventory, setInventory] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInventory = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/inventory-items', { headers: authHeaders() });
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      const items: ApiInventoryItem[] = await res.json();
      if (!Array.isArray(items)) throw new Error('Unexpected response from the inventory API');
      // Real on-hand stock from the API. POS consumption isn't tracked yet, so the
      // physical count starts equal to stock and the manager overrides it.
      const ingredients: Ingredient[] = items.map(item => ({
        id: item.id,
        name: item.name,
        startStock: item.quantity,
        theoreticalSold: 0,
        actualStock: item.quantity,
        unit: item.unit,
        expiryDate: item.expiryDate,
      }));
      setInventory(ingredients);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load inventory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleActualStockChange = (id: string, value: string) => {
    setInventory(prev => prev.map(ing => 
      ing.id === id ? { ...ing, actualStock: Number(value) } : ing
    ));
  };

  const processData = () => {
    return inventory.map(ing => {
      const theoreticalRemaining = ing.startStock - ing.theoreticalSold;
      const variance = theoreticalRemaining - ing.actualStock;
      const variancePercent = ing.startStock > 0 ? (variance / ing.startStock) * 100 : 0;
      
      const isCritical = variancePercent > 2.0;

      return {
        ...ing,
        theoreticalRemaining,
        variance,
        variancePercent,
        isCritical,
        "Theoretical Stock": Number(theoreticalRemaining.toFixed(2)),
        "Physical Count": Number(ing.actualStock.toFixed(2))
      };
    });
  };

  const data = processData();
  const criticalItems = data.filter(d => d.isCritical);

  if (loading) {
    return <div className="p-8 text-center">Loading inventory data...</div>;
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 overflow-y-auto h-[calc(100vh-4rem)]">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Stock & Waste Tracker</h1>
        <p className="text-muted-foreground mt-1">Reconcile theoretical POS consumption against physical inventory counts.</p>
      </div>

      {error && (
        <Card className="border-red-500 bg-red-50 dark:bg-red-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-red-700 dark:text-red-400 flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2" /> Could not load inventory
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between gap-4">
            <p className="text-sm text-red-800 dark:text-red-300">
              {error}. Make sure the backend is running: <code>cd backend &amp;&amp; cargo run</code>
            </p>
            <Button variant="outline" onClick={fetchInventory}>Retry</Button>
          </CardContent>
        </Card>
      )}

      {criticalItems.length > 0 && (
        <Card className="border-red-500 bg-red-50 dark:bg-red-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-red-700 dark:text-red-400 flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2" /> Critical Variance Detected (Potential Theft/Over-portioning)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc pl-5 space-y-1 text-red-800 dark:text-red-300">
              {criticalItems.map(item => (
                <li key={item.id}>
                  <b>{item.name}</b> is missing <b>{item.variance.toFixed(2)}{item.unit}</b> ({item.variancePercent.toFixed(1)}% variance). 
                  Expected {item.theoreticalRemaining.toFixed(2)}{item.unit}, found {item.actualStock}{item.unit}.
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Theoretical vs Actual Stock (EOD Reconcile)</CardTitle>
            <CardDescription>Calculated remaining stock based on POS sales vs physical counts.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[350px] w-full">
              {data.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} className="opacity-20" />
                    <XAxis dataKey="name" />
                    <YAxis label={{ value: 'Stock (kg)', angle: -90, position: 'insideLeft' }} />
                    <RechartsTooltip contentStyle={{ borderRadius: '8px' }} />
                    <Legend />
                    <Bar dataKey="Theoretical Stock" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Physical Count" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground italic">
                  {error ? "Inventory could not be loaded." : "No inventory data. Add items via the Inventory Expiry Tracker."}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Standard Recipe Guide */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center"><BookOpen className="w-5 h-5 mr-2" /> Standard Portion Guide</CardTitle>
            <CardDescription>Strict BOMs to prevent over-portioning.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {RECIPE_GUIDE.map((recipe, idx) => (
                <div key={idx} className="p-3 bg-muted/50 rounded-lg border">
                  <h4 className="font-bold text-sm mb-2">{recipe.dish}</h4>
                  <ul className="text-xs space-y-1 text-muted-foreground">
                    {recipe.ingredients.map((ing, i) => (
                      <li key={i} className="flex items-center before:content-['•'] before:mr-2">{ing}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center"><ClipboardCheck className="w-5 h-5 mr-2" /> Physical Stock Entry</CardTitle>
          <CardDescription>Enter end-of-day counts. Variances &gt;2% will trigger alerts.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border">
              <thead className="bg-muted/50 uppercase text-xs">
                <tr>
                  <th className="px-4 py-3">Ingredient</th>
                  <th className="px-4 py-3">Start Stock</th>
                  <th className="px-4 py-3 text-blue-600">POS Consumed</th>
                  <th className="px-4 py-3 text-blue-600">Theor. Remaining</th>
                  <th className="px-4 py-3">Physical Count (Entry)</th>
                  <th className="px-4 py-3">Expiry Date</th>
                  <th className="px-4 py-3 text-right">Variance</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {data.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground italic">
                      {error ? "Inventory could not be loaded." : "No inventory items found. Add stock via the Inventory Expiry Tracker."}
                    </td>
                  </tr>
                ) : data.map(item => (
                  <tr key={item.id} className={item.isCritical ? 'bg-red-50/50 dark:bg-red-950/10' : ''}>
                    <td className="px-4 py-3 font-medium">{item.name}</td>
                    <td className="px-4 py-3">{item.startStock.toFixed(2)} {item.unit}</td>
                    <td className="px-4 py-3 text-blue-600">-{item.theoreticalSold.toFixed(2)} {item.unit}</td>
                    <td className="px-4 py-3 font-bold text-blue-700">{item.theoreticalRemaining.toFixed(2)} {item.unit}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 max-w-[150px]">
                        <Input 
                          type="number" step="0.1" 
                          value={item.actualStock} 
                          onChange={(e) => handleActualStockChange(item.id, e.target.value)}
                        />
                        <span className="text-muted-foreground">{item.unit}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{new Date(item.expiryDate).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-right">
                      {item.variance > 0 ? (
                        <Badge variant="destructive" className={item.isCritical ? "animate-pulse" : "bg-amber-500"}>
                          <TrendingDown className="w-3 h-3 mr-1" /> {item.variance.toFixed(2)} {item.unit}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-green-600 border-green-300 bg-green-50">Match</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
