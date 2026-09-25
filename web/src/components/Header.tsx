'use client';
import { useAppStore } from '@/store/useAppStore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle2, WifiOff } from 'lucide-react';

export function Header() {
  const { isTallyConnected, offlineSalesPending, channels, isEmergencyPaused, triggerEmergencyPause } = useAppStore();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center justify-between px-6">
        {/* Branding */}
        <div className="flex flex-col">
          <h1 className="text-xl font-bold tracking-tight">Easy Restaurant SPA</h1>
          <span className="text-xs text-muted-foreground">Casual Dining • Koramangala</span>
        </div>

        {/* Connectivity Badges */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 border-r pr-4">
            {isTallyConnected ? (
              <Badge variant="outline" className="text-green-600 border-green-600">
                <CheckCircle2 className="w-3 h-3 mr-1" /> Tally Connected
              </Badge>
            ) : (
              <Badge variant="destructive">
                <WifiOff className="w-3 h-3 mr-1" /> Tally Offline
              </Badge>
            )}
            
            {offlineSalesPending > 0 && (
              <Badge variant="secondary" className="text-amber-600">
                {offlineSalesPending} Pending Sync
              </Badge>
            )}
          </div>

          <div className="flex items-center space-x-2">
             <Badge variant={channels.swiggy ? "default" : "secondary"} className={channels.swiggy ? "bg-orange-500" : ""}>Swiggy</Badge>
             <Badge variant={channels.zomato ? "default" : "secondary"} className={channels.zomato ? "bg-red-500" : ""}>Zomato</Badge>
             <Badge variant={channels.ondc ? "default" : "secondary"} className={channels.ondc ? "bg-blue-600" : ""}>ONDC</Badge>
          </div>
        </div>

        {/* Emergency Controls */}
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">Stockout Controls</Button>
          <Button 
            variant={isEmergencyPaused ? "destructive" : "default"} 
            size="sm"
            className={!isEmergencyPaused ? "bg-red-600 hover:bg-red-700 text-white" : ""}
            onClick={triggerEmergencyPause}
          >
            <AlertCircle className="w-4 h-4 mr-2" />
            {isEmergencyPaused ? "Emergency Paused" : "Panic Pause"}
          </Button>
        </div>
      </div>
    </header>
  );
}
