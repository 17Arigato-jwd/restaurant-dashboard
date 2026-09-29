/* eslint-disable */
"use client";

import { useState } from "react";
import { useAppStore } from "@/store/useAppStore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Truck, Store, TrendingUp, Calculator, Wifi, WifiOff, Map as MapIcon } from "lucide-react";
import dynamic from "next/dynamic";

const DeliveryMap = dynamic(() => import("@/components/DeliveryMap"), {
  ssr: false,
  loading: () => <div className="h-[400px] w-full flex items-center justify-center bg-muted/20 animate-pulse border rounded-lg">Loading Live Map...</div>
});

export default function DeliveryManagerPage() {
  const { channels, setChannelStatus } = useAppStore();
  
  // Local state for auto-accept
  const [autoAccept, setAutoAccept] = useState({
    swiggy: true,
    zomato: true,
    ondc: true
  });

  const toggleAutoAccept = (platform: 'swiggy' | 'zomato' | 'ondc') => {
    setAutoAccept(prev => ({ ...prev, [platform]: !prev[platform] }));
  };

  // State for ONDC Calculator
  const [monthlyDeliveryRev, setMonthlyDeliveryRev] = useState(500000);
  const [migrationTarget, setMigrationTarget] = useState(30); // 30%

  const traditionalCommissionRate = 0.22;
  const ondcCommissionRate = 0.05;

  const currentFees = monthlyDeliveryRev * traditionalCommissionRate;
  
  const migratedVolume = monthlyDeliveryRev * (migrationTarget / 100);
  const remainingVolume = monthlyDeliveryRev - migratedVolume;

  const projectedFees = (remainingVolume * traditionalCommissionRate) + (migratedVolume * ondcCommissionRate);
  const monthlySavings = currentFees - projectedFees;
  const annualSavings = monthlySavings * 12;

  const PlatformCard = ({ name, color, isActive, auto, onToggleStatus, onToggleAuto, rev }: any) => (
    <Card className={`border-2 transition-all ${isActive ? `border-${color}-500/50` : 'border-muted opacity-80'}`}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${isActive ? `bg-${color}-500 animate-pulse` : 'bg-muted-foreground'}`}></div>
            {name}
          </CardTitle>
          <Switch checked={isActive} onCheckedChange={onToggleStatus} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between items-center text-sm">
          <span className="text-muted-foreground">Today's Revenue</span>
          <span className="font-bold">₹{rev.toLocaleString()}</span>
        </div>
        <div className="flex justify-between items-center text-sm pt-2 border-t">
          <span className="text-muted-foreground">Auto-Accept to POS</span>
          <Switch checked={auto} onCheckedChange={onToggleAuto} disabled={!isActive} />
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 overflow-y-auto h-[calc(100vh-4rem)]">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Delivery Manager</h1>
        <p className="text-muted-foreground mt-1">Unified API Hub for Swiggy, Zomato, and ONDC channels.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <PlatformCard 
          name="Swiggy API" color="orange" 
          isActive={channels.swiggy} auto={autoAccept.swiggy}
          onToggleStatus={(s: boolean) => setChannelStatus('swiggy', s)}
          onToggleAuto={() => toggleAutoAccept('swiggy')}
          rev={42500}
        />
        <PlatformCard 
          name="Zomato API" color="red" 
          isActive={channels.zomato} auto={autoAccept.zomato}
          onToggleStatus={(s: boolean) => setChannelStatus('zomato', s)}
          onToggleAuto={() => toggleAutoAccept('zomato')}
          rev={38200}
        />
        <PlatformCard 
          name="ONDC API" color="blue" 
          isActive={channels.ondc} auto={autoAccept.ondc}
          onToggleStatus={(s: boolean) => setChannelStatus('ondc', s)}
          onToggleAuto={() => toggleAutoAccept('ondc')}
          rev={4100}
        />
      </div>

      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-900">
        <CardHeader>
          <CardTitle className="flex items-center text-blue-800 dark:text-blue-400">
            <Calculator className="w-6 h-6 mr-2" /> ONDC Commission Savings Simulator
          </CardTitle>
          <CardDescription className="text-blue-700/80 dark:text-blue-400/80">
            Calculate your monthly profit gains by shifting orders from traditional 22% aggregators to the 5% ONDC network.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          
          <div className="grid md:grid-cols-2 gap-12">
            <div className="space-y-6">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <label className="font-medium text-sm text-blue-900 dark:text-blue-300">Average Monthly Delivery Revenue (₹)</label>
                  <span className="font-bold text-blue-900 dark:text-blue-300">₹{monthlyDeliveryRev.toLocaleString()}</span>
                </div>
                <input 
                  type="range" 
                  min="50000" max="2000000" step="50000"
                  value={monthlyDeliveryRev} 
                  onChange={(e) => setMonthlyDeliveryRev(Number(e.target.value))}
                  className="w-full accent-blue-600"
                />
              </div>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <label className="font-medium text-sm text-blue-900 dark:text-blue-300">Target ONDC Migration Volume (%)</label>
                  <span className="font-bold text-blue-900 dark:text-blue-300">{migrationTarget}%</span>
                </div>
                <input 
                  type="range" 
                  min="0" max="100" step="5"
                  value={migrationTarget} 
                  onChange={(e) => setMigrationTarget(Number(e.target.value))}
                  className="w-full accent-blue-600"
                />
                <p className="text-xs text-blue-700/70 dark:text-blue-400/70">
                  Moving {migrationTarget}% of orders to ONDC (₹{migratedVolume.toLocaleString()}/mo)
                </p>
              </div>
            </div>

            <div className="bg-white dark:bg-black/40 rounded-xl p-6 shadow-sm border border-blue-100 dark:border-blue-900/50 flex flex-col justify-center">
              <div className="text-center space-y-2">
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Projected Extra Profit</p>
                <div className="text-5xl font-bold text-green-600 dark:text-green-500">
                  +₹{monthlySavings.toLocaleString(undefined, {maximumFractionDigits: 0})}
                </div>
                <p className="text-sm font-medium text-green-700 dark:text-green-600 pt-1">
                  Per Month Added to Bottom Line
                </p>
              </div>
              
              <div className="mt-8 pt-6 border-t border-dashed flex justify-between text-sm">
                <div className="text-center">
                  <p className="text-muted-foreground">Current Fees (22%)</p>
                  <p className="font-bold mt-1 text-red-500">₹{currentFees.toLocaleString()}</p>
                </div>
                <div className="text-center">
                  <p className="text-muted-foreground">New Fees</p>
                  <p className="font-bold mt-1 text-blue-600">₹{projectedFees.toLocaleString()}</p>
                </div>
                <div className="text-center">
                  <p className="text-muted-foreground">Annual Savings</p>
                  <p className="font-bold mt-1 text-green-600">₹{annualSavings.toLocaleString(undefined, {maximumFractionDigits: 0})}</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="border-2 border-primary/20">
        <CardHeader className="bg-primary/5 pb-4 border-b border-primary/10">
          <CardTitle className="flex items-center text-primary">
            <MapIcon className="w-6 h-6 mr-2" /> Live Order Fleet Tracking
          </CardTitle>
          <CardDescription>
            Real-time GPS tracking of delivery partners via Aggregator APIs.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="h-[450px] w-full">
            <DeliveryMap />
          </div>
        </CardContent>
      </Card>
      
      <div>
        <h2 className="text-2xl font-bold mb-4">Active Deliveries</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Order #1042</CardTitle>
              <CardDescription>Platform: Zomato</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 font-bold">
              <p>Client: Rahul Sharma</p>
              <p>Food: 2x Butter Chicken, 4x Garlic Naan</p>
              <p className="text-main">Status: Driver 2 mins away</p>
            </CardContent>
            <CardFooter>
              <Button className="w-full">Call Driver</Button>
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Order #1043</CardTitle>
              <CardDescription>Platform: Swiggy</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 font-bold">
              <p>Client: Priya Patel</p>
              <p>Food: 1x Paneer Tikka, 1x Veg Biryani</p>
              <p className="text-main">Status: Driver at Restaurant</p>
            </CardContent>
            <CardFooter>
              <Button className="w-full">Mark Picked Up</Button>
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Order #1044</CardTitle>
              <CardDescription>Platform: ONDC</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 font-bold">
              <p>Client: Amit Kumar</p>
              <p>Food: 1x Masala Dosa, 2x Filter Coffee</p>
              <p className="text-main">Status: Out for Delivery</p>
            </CardContent>
            <CardFooter>
              <Button className="w-full">Track Live</Button>
            </CardFooter>
          </Card>
        </div>
      </div>
      
      <div className="flex justify-end pt-4">
        <Button onClick={() => {
           // Simulate direct POS injection
           alert("Test Order Injected directly into KDS & POS from ONDC API!");
        }}>
          Test Direct POS Order Injection (ONDC)
        </Button>
      </div>
    </div>
  );
}
