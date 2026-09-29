'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/components/ThemeProvider';
import { useAppStore } from '@/store/useAppStore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle2, WifiOff, User, Settings, Users, Sun, Moon, LogOut } from 'lucide-react';
import { StockoutModal } from './StockoutModal';
import { ManagerPinModal } from './ManagerPinModal';
import { GlobalSearch } from './GlobalSearch';
import { SidebarTrigger } from '@/components/ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function Header() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  
  const { 
    isTallyConnected, 
    offlineSalesPending, 
    channels, 
    isEmergencyPaused, 
    pauseTimerRemaining,
    triggerEmergencyPause,
    cancelEmergencyPause,
    tickEmergencyPause,
    logout
  } = useAppStore();

  const [isStockoutOpen, setIsStockoutOpen] = useState(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isEmergencyPaused && pauseTimerRemaining > 0) {
      interval = setInterval(() => {
        tickEmergencyPause();
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isEmergencyPaused, pauseTimerRemaining, tickEmergencyPause]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePanicClick = () => {
    if (isEmergencyPaused) {
      cancelEmergencyPause();
    } else {
      setIsPinModalOpen(true);
    }
  };

  const handlePinSuccess = () => {
    setIsPinModalOpen(false);
    triggerEmergencyPause();
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b-2 border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center justify-between px-6 gap-4">
        <div className="flex items-center gap-4">
          <SidebarTrigger />
          <div className="flex flex-col hidden sm:flex">
            <h1 className="text-xl font-bold tracking-tight">Easy Restaurant SPA</h1>
            <span className="text-xs text-muted-foreground font-bold">Casual Dining • Koramangala</span>
          </div>
        </div>

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

        <div className="flex items-center space-x-4">
          <GlobalSearch />
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={() => setIsStockoutOpen(true)}>
              Stockout Controls
            </Button>
            <Button 
              variant={isEmergencyPaused ? "destructive" : "default"} 
              size="icon"
              className={!isEmergencyPaused ? "bg-red-600 hover:bg-red-700 text-white" : ""}
              onClick={handlePanicClick}
              title={isEmergencyPaused ? `Paused (${formatTime(pauseTimerRemaining)}) - Cancel` : "Panic Pause"}
            >
              <AlertCircle className="w-5 h-5" />
            </Button>
          </div>

          <div className="relative border-l-2 pl-4 border-border">
            <DropdownMenu>
              <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="rounded-full bg-muted" />}>
                <User className="w-5 h-5" />
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem onClick={() => router.push('/restaurant-settings')}><User /> <span>Profile</span></DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push('/restaurant-settings')}><Settings /> <span>Account Settings</span></DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push('/restaurant-settings')}><Users /> <span>Team</span></DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
                    {theme === 'dark' ? <Sun /> : <Moon />}
                    <span>Toggle Theme</span>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => { logout(); router.push('/login'); }}>
                  <LogOut />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      <StockoutModal 
        isOpen={isStockoutOpen} 
        onClose={() => setIsStockoutOpen(false)} 
      />
      <ManagerPinModal 
        isOpen={isPinModalOpen} 
        onClose={() => setIsPinModalOpen(false)} 
        onSuccess={handlePinSuccess}
        actionName="Emergency Aggregator Pause"
      />
    </header>
  );
}
