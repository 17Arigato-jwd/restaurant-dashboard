'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useAppStore } from '@/store/useAppStore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle2, WifiOff, User } from 'lucide-react';
import { StockoutModal } from './StockoutModal';
import { ManagerPinModal } from './ManagerPinModal';

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
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isEmergencyPaused && pauseTimerRemaining > 0) {
      interval = setInterval(() => {
        tickEmergencyPause();
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isEmergencyPaused, pauseTimerRemaining, tickEmergencyPause]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

  const profileMenuItems = [
    { label: "Your Profile", action: () => router.push('/settings') },
    { label: "Account Settings", action: () => router.push('/settings') },
    { label: "Account Notification", action: () => router.push('/settings') },
    { label: "Team", action: () => router.push('/settings') },
    { label: "Support", action: () => alert('Support module coming soon!') },
    { label: "Theme Toggle", action: () => setTheme(theme === 'dark' ? 'light' : 'dark') },
    { label: "Switch Account", action: () => { logout(); router.push('/login'); } },
    { label: "Sign out", action: () => { logout(); router.push('/login'); } },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center justify-between px-6">
        <div className="flex flex-col">
          <h1 className="text-xl font-bold tracking-tight">Easy Restaurant SPA</h1>
          <span className="text-xs text-muted-foreground">Casual Dining • Koramangala</span>
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
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={() => setIsStockoutOpen(true)}>
              Stockout Controls
            </Button>
            <Button 
              variant={isEmergencyPaused ? "destructive" : "default"} 
              size="sm"
              className={!isEmergencyPaused ? "bg-red-600 hover:bg-red-700 text-white" : ""}
              onClick={handlePanicClick}
            >
              <AlertCircle className="w-4 h-4 mr-2" />
              {isEmergencyPaused ? `Paused (${formatTime(pauseTimerRemaining)}) - Cancel` : "Panic Pause"}
            </Button>
          </div>

          <div className="relative border-l pl-4" ref={profileRef}>
            <Button 
              variant="ghost" 
              size="icon" 
              className="rounded-full bg-muted"
              onClick={() => setIsProfileOpen(!isProfileOpen)}
            >
              <User className="w-5 h-5" />
            </Button>

            {isProfileOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-md border bg-background shadow-lg ring-1 ring-black ring-opacity-5">
                <div className="py-1">
                  {profileMenuItems.map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        item.action();
                        setIsProfileOpen(false);
                      }}
                      className="block w-full px-4 py-2 text-left text-sm text-foreground hover:bg-muted"
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
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
