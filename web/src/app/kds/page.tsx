/* eslint-disable */
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Flame, Utensils, CupSoda, CheckCircle2, AlertTriangle, XCircle, Clock } from "lucide-react";

type Station = 'tandoor' | 'main' | 'drinks';

interface KOTItem {
  id: string;
  name: string;
  qty: number;
  modifiers?: string;
  station: Station;
}

interface KOT {
  id: string;
  tableId: string;
  items: KOTItem[];
  createdAt: number;
}

const DUMMY_KOTS: KOT[] = [
  {
    id: "KOT-101",
    tableId: "T-02",
    createdAt: Date.now() - 400000, // 6.6 mins ago
    items: [
      { id: "1", name: "Paneer Tikka", qty: 2, modifiers: "Extra Spicy", station: "tandoor" },
      { id: "2", name: "Tandoori Roti", qty: 4, station: "tandoor" },
    ]
  },
  {
    id: "KOT-102",
    tableId: "T-04",
    createdAt: Date.now() - 750000, // 12.5 mins ago
    items: [
      { id: "3", name: "Dal Makhani", qty: 1, station: "main" },
      { id: "4", name: "Butter Chicken", qty: 1, modifiers: "Less Cream", station: "main" },
    ]
  },
  {
    id: "KOT-103",
    tableId: "SWIGGY-891",
    createdAt: Date.now() - 1150000, // 19 mins ago (Red)
    items: [
      { id: "5", name: "Virgin Mojito", qty: 3, station: "drinks" },
      { id: "6", name: "Mango Lassi", qty: 1, modifiers: "No Ice", station: "drinks" },
    ]
  }
];

export default function KDSPage() {
  const [activeKots, setActiveKots] = useState<KOT[]>(DUMMY_KOTS);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [activeFilter, setActiveFilter] = useState<Station | 'all'>('all');

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleBump = (kotId: string, itemId: string) => {
    setActiveKots(prev => prev.map(kot => {
      if (kot.id === kotId) {
        return { ...kot, items: kot.items.filter(i => i.id !== itemId) };
      }
      return kot;
    }).filter(kot => kot.items.length > 0)); // Remove empty KOTs
  };

  const getSlaStatus = (createdAt: number) => {
    const elapsedMins = (currentTime - createdAt) / 60000;
    if (elapsedMins < 10) return { color: "bg-green-100 text-green-800 border-green-300", icon: <CheckCircle2 className="w-4 h-4" /> };
    if (elapsedMins < 18) return { color: "bg-amber-100 text-amber-800 border-amber-300", icon: <AlertTriangle className="w-4 h-4" /> };
    return { color: "bg-red-100 text-red-800 border-red-300 animate-pulse", icon: <XCircle className="w-4 h-4" /> };
  };

  const formatTime = (createdAt: number) => {
    const elapsedSecs = Math.floor((currentTime - createdAt) / 1000);
    const m = Math.floor(elapsedSecs / 60);
    const s = elapsedSecs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const renderStationColumn = (title: string, station: Station, icon: React.ReactNode) => {
    if (activeFilter !== 'all' && activeFilter !== station) return null;

    const stationItems = activeKots.map(kot => ({
      kot,
      items: kot.items.filter(i => i.station === station)
    })).filter(k => k.items.length > 0);

    return (
      <div className="flex-1 min-w-[300px] flex flex-col h-full border-r last:border-r-0 border-dashed border-border/50">
        <div className="p-4 bg-muted/50 border-b flex items-center justify-between sticky top-0 z-10">
          <h2 className="font-bold flex items-center uppercase tracking-wider text-sm">
            {icon} <span className="ml-2">{title}</span>
          </h2>
          <Badge variant="secondary">{stationItems.length} active</Badge>
        </div>
        
        <div className="p-4 space-y-4 overflow-y-auto">
          {stationItems.length === 0 ? (
            <div className="text-center text-muted-foreground text-sm p-8 border rounded-lg border-dashed">
              No active orders for this station.
            </div>
          ) : (
            stationItems.map(({ kot, items }) => {
              const sla = getSlaStatus(kot.createdAt);
              
              return (
                <Card key={kot.id} className={`overflow-hidden border-2 transition-colors duration-500 ${sla.color}`}>
                  <div className="flex justify-between items-center p-3 bg-background/50 border-b border-inherit">
                    <div className="flex items-center gap-2 font-bold">
                      <span className="text-lg">{kot.tableId}</span>
                      <Badge variant="outline" className="border-inherit text-inherit bg-background/50">
                        {kot.id}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1 font-mono font-bold text-lg">
                      <Clock className="w-5 h-5 mr-1" />
                      {formatTime(kot.createdAt)}
                    </div>
                  </div>
                  
                  <div className="divide-y divide-inherit">
                    {items.map(item => (
                      <div key={item.id} className="p-4 bg-background/80 backdrop-blur-sm flex justify-between items-center group">
                        <div>
                          <div className="font-bold text-lg flex items-center gap-2">
                            <span className="text-xl">{item.qty}x</span> {item.name}
                          </div>
                          {item.modifiers && (
                            <div className="text-destructive font-semibold mt-1 flex items-center gap-1 text-sm bg-destructive/10 inline-block px-2 py-0.5 rounded">
                              * {item.modifiers}
                            </div>
                          )}
                        </div>
                        <Button 
                          onClick={() => handleBump(kot.id, item.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity bg-black text-white hover:bg-gray-800"
                        >
                          BUMP
                        </Button>
                      </div>
                    ))}
                  </div>
                </Card>
              );
            })
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] overflow-hidden bg-muted/10">
      <div className="p-4 border-b bg-background flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Kitchen Display System (KDS)</h1>
          <p className="text-sm text-muted-foreground mt-1">Live routing and SLA tracking.</p>
        </div>
        
        <div className="flex gap-2">
          <Button variant={activeFilter === 'all' ? 'default' : 'outline'} onClick={() => setActiveFilter('all')}>All Stations</Button>
          <Button variant={activeFilter === 'tandoor' ? 'default' : 'outline'} onClick={() => setActiveFilter('tandoor')}><Flame className="w-4 h-4 mr-2"/> Tandoor</Button>
          <Button variant={activeFilter === 'main' ? 'default' : 'outline'} onClick={() => setActiveFilter('main')}><Utensils className="w-4 h-4 mr-2"/> Main Kitchen</Button>
          <Button variant={activeFilter === 'drinks' ? 'default' : 'outline'} onClick={() => setActiveFilter('drinks')}><CupSoda className="w-4 h-4 mr-2"/> Drinks</Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-x-auto">
        {renderStationColumn("Tandoor & Starters", "tandoor", <Flame className="w-5 h-5 text-orange-500" />)}
        {renderStationColumn("Main Meals & Curries", "main", <Utensils className="w-5 h-5 text-blue-500" />)}
        {renderStationColumn("Drinks & Packing", "drinks", <CupSoda className="w-5 h-5 text-cyan-500" />)}
      </div>
    </div>
  );
}
