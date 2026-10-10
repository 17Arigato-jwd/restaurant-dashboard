/* eslint-disable */
"use client";

import { useState, useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Flame, Utensils, CupSoda, CheckCircle2, AlertTriangle, XCircle, Clock } from "lucide-react";

type Station = 'tandoor' | 'main' | 'drinks';

interface KOTItem {
  id: string;
  name: string;
  qty: number;
  station: Station;
}

interface KOT {
  id: string;
  tableId: string;
  items: KOTItem[];
  createdAt: number;
}

// Orders only carry a dish name, so each line is routed to a station by keyword.
const STATION_RULES: { station: Station; keywords: string[] }[] = [
  { station: 'tandoor', keywords: ['tikka', 'tandoori', 'kebab', 'seekh', 'naan', 'roti', 'kulcha', 'paratha', 'grill', 'starter', 'kabab'] },
  { station: 'drinks', keywords: ['mojito', 'lassi', 'coffee', 'tea', 'soda', 'juice', 'shake', 'drink', 'mocktail', 'cocktail', 'water', 'beer'] },
];

const classifyStation = (name: string): Station => {
  const normalized = name.toLowerCase();
  for (const rule of STATION_RULES) {
    if (rule.keywords.some((keyword) => normalized.includes(keyword))) return rule.station;
  }
  return 'main';
};

export default function KDSPage() {
  const tables = useAppStore((state) => state.tables);
  const bumpOrder = useAppStore((state) => state.bumpOrder);
  const [currentTime, setCurrentTime] = useState(0);
  const [activeFilter, setActiveFilter] = useState<Station | 'all'>('all');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setCurrentTime(Date.now());
    setMounted(true);
    const timer = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Build live tickets from tables that currently hold orders.
  const activeKots: KOT[] = tables
    .filter((table) => table.orders.length > 0)
    .map((table) => {
      const timestamps = table.orders
        .map((order) => order.createdAt)
        .filter((value): value is number => typeof value === 'number');
      const createdAt = timestamps.length ? Math.min(...timestamps) : (table.seatedAt ?? Date.now());
      return {
        id: table.id,
        tableId: table.name,
        createdAt,
        items: table.orders.map((order) => ({
          id: order.id,
          name: order.name,
          qty: order.qty,
          station: classifyStation(order.name),
        })),
      };
    })
    .sort((a, b) => a.createdAt - b.createdAt);

  const handleBump = async (itemId: string) => {
    await bumpOrder(itemId);
  };

  const getSlaStatus = (createdAt: number) => {
    if (!mounted || !createdAt) return { color: "bg-green-100 text-green-800 border-green-300", icon: <CheckCircle2 className="w-4 h-4" /> };
    const elapsedMins = (currentTime - createdAt) / 60000;
    if (elapsedMins < 10) return { color: "bg-green-100 text-green-800 border-green-300", icon: <CheckCircle2 className="w-4 h-4" /> };
    if (elapsedMins < 18) return { color: "bg-amber-100 text-amber-800 border-amber-300", icon: <AlertTriangle className="w-4 h-4" /> };
    return { color: "bg-red-100 text-red-800 border-red-300 animate-pulse", icon: <XCircle className="w-4 h-4" /> };
  };

  const formatTime = (createdAt: number) => {
    if (!mounted || !createdAt) return "--:--";
    const elapsedSecs = Math.max(0, Math.floor((currentTime - createdAt) / 1000));
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
                        {kot.id.slice(0, 8)}
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
                        </div>
                        <Button
                          onClick={() => handleBump(item.id)}
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
      <div className="p-4 border-b bg-background flex flex-wrap justify-between items-center gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold">Kitchen Display System (KDS)</h1>
          <p className="text-sm text-muted-foreground mt-1">Live routing and SLA tracking.</p>
        </div>

        {/* Wraps instead of overflowing so every station filter stays reachable. */}
        <div className="flex flex-wrap gap-2">
          <Button variant={activeFilter === 'all' ? 'default' : 'outline'} onClick={() => setActiveFilter('all')}>All Stations</Button>
          <Button variant={activeFilter === 'tandoor' ? 'default' : 'outline'} onClick={() => setActiveFilter('tandoor')}><Flame className="w-4 h-4 mr-2"/> Tandoor</Button>
          <Button variant={activeFilter === 'main' ? 'default' : 'outline'} onClick={() => setActiveFilter('main')}><Utensils className="w-4 h-4 mr-2"/> Main Kitchen</Button>
          <Button variant={activeFilter === 'drinks' ? 'default' : 'outline'} onClick={() => setActiveFilter('drinks')}><CupSoda className="w-4 h-4 mr-2"/> Drinks</Button>
        </div>
      </div>

      {mounted && activeKots.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-muted-foreground">
          No active kitchen tickets. Add items from the Tables screen to see them routed here.
        </div>
      ) : (
        <div className="flex-1 flex overflow-x-auto">
          {renderStationColumn("Tandoor & Starters", "tandoor", <Flame className="w-5 h-5 text-orange-500" />)}
          {renderStationColumn("Main Meals & Curries", "main", <Utensils className="w-5 h-5 text-blue-500" />)}
          {renderStationColumn("Drinks & Packing", "drinks", <CupSoda className="w-5 h-5 text-cyan-500" />)}
        </div>
      )}
    </div>
  );
}
