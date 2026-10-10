import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface SessionRole {
  id: string;
  name: string;
  level: number;
  canEditLevelsAbove: number;
}

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  roleId: string;
  avatarUrl?: string;
  status?: string;
  role?: SessionRole;
  teamId?: string | null;
  restaurantId?: string;
  mustChangePassword?: boolean;
}

export type TableState = 'available' | 'seated' | 'ordered' | 'billed';

export interface OrderItem {
  id: string;
  name: string;
  price: number;
  qty: number;
}

export interface Table {
  id: string;
  name: string;
  capacity: number;
  state: TableState;
  seatedAt?: number;
  orders: OrderItem[];
  waiter?: string;
}

interface AppState {
  // User Session
  token: string | null;
  role: string | null;
  currentUser: SessionUser | null;
  mustChangePassword: boolean;
  setCurrentUser: (user: SessionUser | null) => void;
  setMustChangePassword: (value: boolean) => void;
  refreshCurrentUser: () => Promise<void>;
  setSession: (token: string, role: string, userId: string, user?: SessionUser) => void;
  logout: () => void;

  isManagerAuthorized: boolean;
  setManagerAuthorized: (status: boolean) => void;

  // System Status
  isPosConnected: boolean;
  setPosConnection: (status: boolean) => void;
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
  pauseTimerRemaining: number;
  triggerEmergencyPause: () => void;
  tickEmergencyPause: () => void;
  cancelEmergencyPause: () => void;

  // Tables & Operations (Phase 2)
  tables: Table[];
  updateTableState: (id: string, newState: TableState) => void;
  addOrderToTable: (id: string, order: OrderItem) => void;
  settleTable: (id: string) => void;
  fetchLiveTables: () => Promise<void>;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Auth
      token: null,
      role: null,
      currentUser: null,
      mustChangePassword: false,
      setCurrentUser: (user) => set({ currentUser: user }),
      setMustChangePassword: (value) => set({ mustChangePassword: value }),
      refreshCurrentUser: async () => {
        const { currentUser, token } = get();
        const userId = currentUser?.id;
        if (!userId || !token) return;
        try {
          const res = await fetch(`/api/team/${userId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            const data = await res.json();
            set({ currentUser: data, role: data.roleId });
          }
        } catch (e) { console.error(e); }
      },
      setSession: (token, role, userId, user) => {
        set({ token, role });
        const resolved = user ?? { id: userId, name: '', email: '', roleId: role, status: 'active' };
        set({ currentUser: resolved, mustChangePassword: Boolean(resolved?.mustChangePassword) });
        if (!user) get().refreshCurrentUser();
      },
      logout: () => set({ token: null, role: null, currentUser: null, isManagerAuthorized: false, mustChangePassword: false }),

      isManagerAuthorized: false,
      setManagerAuthorized: (status) => set({ isManagerAuthorized: status }),

      isPosConnected: true,
      setPosConnection: (status) => set({ isPosConnected: status }),

      isTallyConnected: true,
      offlineSalesPending: 0,
      setTallyConnection: (status) => set({ isTallyConnected: status }),
      setOfflineSales: (count) => set({ offlineSalesPending: count }),

      channels: { swiggy: true, zomato: true, ondc: true },
      setChannelStatus: (channel, status) => 
        set((state) => ({
          channels: { ...state.channels, [channel]: status }
        })),

      isEmergencyPaused: false,
      pauseTimerRemaining: 0,
      triggerEmergencyPause: () => set({ isEmergencyPaused: true, pauseTimerRemaining: 30 * 60 }),
      tickEmergencyPause: () => {
        const { pauseTimerRemaining, isEmergencyPaused } = get();
        if (isEmergencyPaused && pauseTimerRemaining > 0) {
          set({ pauseTimerRemaining: pauseTimerRemaining - 1 });
        } else if (pauseTimerRemaining === 0 && isEmergencyPaused) {
          set({ isEmergencyPaused: false });
        }
      },
      cancelEmergencyPause: () => set({ isEmergencyPaused: false, pauseTimerRemaining: 0 }),

      // Tables
      tables: [],
      fetchLiveTables: async () => {
        const { token } = get();
        if (!token) return;
        try {
          const res = await fetch('http://127.0.0.1:8000/api/tables', {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            set({ tables: data });
          }
        } catch (e) { console.error("Failed to fetch live tables:", e); }
      },
      updateTableState: (id, newState) => set((state) => ({
        tables: state.tables.map(t => {
          if (t.id === id) {
            return {
              ...t,
              state: newState,
              seatedAt: (newState === 'seated' && t.state === 'available') ? Date.now() : t.seatedAt
            };
          }
          return t;
        })
      })),
      addOrderToTable: (id, order) => set((state) => ({
        tables: state.tables.map(t => {
          if (t.id === id) {
            const existingOrder = t.orders.find(o => o.id === order.id);
            const newOrders = existingOrder 
              ? t.orders.map(o => o.id === order.id ? { ...o, qty: o.qty + order.qty } : o)
              : [...t.orders, order];
            return { ...t, state: 'ordered', orders: newOrders };
          }
          return t;
        })
      })),
      settleTable: (id) => set((state) => ({
        tables: state.tables.map(t => t.id === id ? { ...t, state: 'available', orders: [], seatedAt: undefined, waiter: undefined } : t)
      }))
    }),
    {
      name: 'restaurant-storage',
      partialize: (state) => ({ token: state.token, role: state.role, currentUser: state.currentUser, mustChangePassword: state.mustChangePassword }), // only persist auth so tables reset on reload for dev
    }
  )
);

