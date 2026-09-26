import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AppState {
  // User Session
  token: string | null;
  role: string | null;
  setSession: (token: string, role: string) => void;
  logout: () => void;

  isManagerAuthorized: boolean;
  setManagerAuthorized: (status: boolean) => void;

  // System Status
  isTallyConnected: boolean;
  offlineSalesPending: number;
  setTallyConnection: (status: boolean) => void;
  setOfflineSales: (count: number) => void;

  // Delivery Channel Activity
  channels: {
    swiggy: boolean;
    zomato: boolean;
    ondc: boolean;
  };
  setChannelStatus: (channel: 'swiggy' | 'zomato' | 'ondc', status: boolean) => void;

  // Emergency States
  isEmergencyPaused: boolean;
  pauseTimerRemaining: number; // in seconds
  triggerEmergencyPause: () => void;
  tickEmergencyPause: () => void;
  cancelEmergencyPause: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Auth
      token: null,
      role: null,
      setSession: (token, role) => set({ token, role }),
      logout: () => set({ token: null, role: null, isManagerAuthorized: false }),

      isManagerAuthorized: false,
      setManagerAuthorized: (status) => set({ isManagerAuthorized: status }),

      isTallyConnected: true,
      offlineSalesPending: 0,
      setTallyConnection: (status) => set({ isTallyConnected: status }),
      setOfflineSales: (count) => set({ offlineSalesPending: count }),

      channels: {
        swiggy: true,
        zomato: true,
        ondc: true,
      },
      setChannelStatus: (channel, status) => 
        set((state) => ({
          channels: {
            ...state.channels,
            [channel]: status,
          }
        })),

      isEmergencyPaused: false,
      pauseTimerRemaining: 0,
      
      triggerEmergencyPause: () => {
        set({ isEmergencyPaused: true, pauseTimerRemaining: 30 * 60 });
      },
      
      tickEmergencyPause: () => {
        const { pauseTimerRemaining, isEmergencyPaused } = get();
        if (isEmergencyPaused && pauseTimerRemaining > 0) {
          set({ pauseTimerRemaining: pauseTimerRemaining - 1 });
        } else if (pauseTimerRemaining === 0 && isEmergencyPaused) {
          set({ isEmergencyPaused: false });
        }
      },
      
      cancelEmergencyPause: () => {
        set({ isEmergencyPaused: false, pauseTimerRemaining: 0 });
      },
    }),
    {
      name: 'restaurant-storage',
      partialize: (state) => ({ token: state.token, role: state.role }), // only persist auth
    }
  )
);
