'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useAppStore } from '@/store/useAppStore';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle2, WifiOff, User, Settings, Users, Sun, Moon, LogOut } from 'lucide-react';
import { StockoutModal } from './StockoutModal';
import { ManagerPinModal } from './ManagerPinModal';
import { GlobalSearch } from './GlobalSearch';
import { GlobalBreadcrumb } from './GlobalBreadcrumb';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { toast } from '@/components/ui/toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';

export function Header() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  // Ensure we don't render theme toggle until hydration is complete
  const [mounted, setMounted] = useState(false);
  
  const { 
    isTallyConnected, 
    offlineSalesPending, 
    channels, 
    isEmergencyPaused, 
    pauseTimerRemaining,
    triggerEmergencyPause,
    cancelEmergencyPause,
    tickEmergencyPause,
    logout,
    currentUser,
    refreshCurrentUser
  } = useAppStore();

  const [isStockoutOpen, setIsStockoutOpen] = useState(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [isLogoutDrawerOpen, setIsLogoutDrawerOpen] = useState(false);
  useEffect(() => {
    refreshCurrentUser();
  }, [refreshCurrentUser]);

  useEffect(() => {
    setMounted(true);
  }, []);

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

  const handlePinSuccess = () => {
    setIsPinModalOpen(false);
    triggerEmergencyPause();
    toast.add({ type: "error", title: "Emergency Pause Active", description: "Aggregators suspended.", priority: "high" });
  };

  const handleCancelPanic = () => {
    cancelEmergencyPause();
    toast.add({ type: "success", title: "Emergency Pause Cancelled", description: "Aggregators resumed normally." });
  };

  const handlePanicClick = () => {
    if (isEmergencyPaused) {
      handleCancelPanic();
    } else {
      setIsPinModalOpen(true);
    }
  };

  const handleThemeToggle = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    toast.add({ description: `Switched to ${newTheme} theme.` });
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
    toast.add({ type: "success", title: "Logged Out", description: "You have been successfully logged out." });
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b-2 border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center justify-between px-6 gap-4">
        <div className="flex items-center gap-4">
          <SidebarTrigger />
          <div className="flex flex-col hidden sm:flex border-l-2 border-border pl-4">
            <GlobalBreadcrumb />
          </div>
        </div>

        <div className="hidden lg:flex items-center space-x-4">
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

        <div className="flex items-center space-x-2 md:space-x-4 ml-auto">
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
            
            {mounted && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleThemeToggle}
                className="ml-2 rounded-full border border-border"
                aria-label="Toggle theme"
              >
                {theme === "dark" ? (
                  <Moon className="h-5 w-5" />
                ) : (
                  <Sun className="h-5 w-5" />
                )}
              </Button>
            )}
          </div>

          <div className="relative border-l-2 pl-4 border-border">
            <DropdownMenu>
              <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="rounded-full overflow-hidden" />}>
                {currentUser?.avatarUrl ? (
                  <Avatar className="w-full h-full">
                    <AvatarImage src={currentUser.avatarUrl} />
                    <AvatarFallback>{currentUser.name?.substring(0, 2).toUpperCase() || 'US'}</AvatarFallback>
                  </Avatar>
                ) : (
                  <Avatar className="w-full h-full">
                    <AvatarFallback className="bg-main text-main-foreground font-bold">
                      {currentUser?.name?.substring(0, 2).toUpperCase() || 'US'}
                    </AvatarFallback>
                  </Avatar>
                )}
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem onClick={() => router.push('/account?tab=profile')}><User /> <span>Profile</span></DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push('/account?tab=settings')}><Settings /> <span>Account Settings</span></DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push('/account?tab=team')}><Users /> <span>Team</span></DropdownMenuItem>
                  <DropdownMenuItem onClick={handleThemeToggle}>
                    {theme === 'dark' ? <Sun /> : <Moon />}
                    <span>Toggle Theme</span>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setIsLogoutDrawerOpen(true)}>
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

      <Drawer open={isLogoutDrawerOpen} onOpenChange={setIsLogoutDrawerOpen}>
        <DrawerContent>
          <div className="mx-auto w-[400px]">
            <DrawerHeader>
              <DrawerTitle>Are you absolutely sure?</DrawerTitle>
              <DrawerDescription>
                You are about to sign out. All unsaved changes will be lost.
              </DrawerDescription>
            </DrawerHeader>
            <DrawerFooter className="grid grid-cols-2">
              <Button variant="destructive" onClick={handleLogout}>Sign Out</Button>
              <DrawerClose render={<Button className="bg-secondary-background text-foreground" variant="noShadow" />}>
                Cancel
              </DrawerClose>
            </DrawerFooter>
          </div>
        </DrawerContent>
      </Drawer>
    </header>
  );
}
