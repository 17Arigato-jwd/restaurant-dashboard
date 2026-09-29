import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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
  currentUser: any | null;
  setCurrentUser: (user: any | null) => void;
  refreshCurrentUser: () => Promise<void>;
  setSession: (token: string, role: string) => void;
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
}

const initialTables: Table[] = [
  { id: 'T1', name: 'T-01', capacity: 2, state: 'available', orders: [] },
  { id: 'T2', name: 'T-02', capacity: 2, state: 'seated', seatedAt: 1700000000000 - 300000, orders: [], waiter: 'Rahul' },
  { id: 'T3', name: 'T-03', capacity: 4, state: 'ordered', seatedAt: 1700000000000 - 1500000, orders: [{ id: '1', name: 'Butter Chicken', price: 340, qty: 1 }, { id: '2', name: 'Garlic Naan', price: 60, qty: 3 }], waiter: 'Amit' },
  { id: 'T4', name: 'T-04', capacity: 4, state: 'billed', seatedAt: 1700000000000 - 3600000, orders: [{ id: '3', name: 'Paneer Tikka', price: 280, qty: 1 }], waiter: 'Amit' },
  { id: 'T5', name: 'T-05', capacity: 6, state: 'available', orders: [] },
  { id: 'T6', name: 'T-06', capacity: 6, state: 'available', orders: [] },
  { id: 'T7', name: 'T-07', capacity: 2, state: 'available', orders: [] },
  { id: 'T8', name: 'T-08', capacity: 4, state: 'available', orders: [] },
];

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Auth
      token: null,
      role: null,
      currentUser: null,
      setCurrentUser: (user) => set({ currentUser: user }),
      refreshCurrentUser: async () => {
        try {
          const res = await fetch("/api/team/u1");
          if (res.ok) {
            const data = await res.json();
            set({ currentUser: data });
          }
        } catch (e) { console.error(e); }
      },
      setSession: (token, role) => set({ token, role }),
      logout: () => set({ token: null, role: null,
      currentUser: null,
      setCurrentUser: (user) => set({ currentUser: user }),
      refreshCurrentUser: async () => {
        try {
          const res = await fetch("/api/team/u1");
          if (res.ok) {
            const data = await res.json();
            set({ currentUser: data });
          }
        } catch (e) { console.error(e); }
      }, isManagerAuthorized: false }),

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
      tables: initialTables,
      updateTableState: (id, newState) => set((state) => ({
        tables: state.tables.map(t => {
          if (t.id === id) {
            return {
              ...t,
              state: newState,
              seatedAt: (newState === 'seated' && t.state === 'available') ? 1700000000000 : t.seatedAt
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
      partialize: (state) => ({ token: state.token, role: state.role, currentUser: state.currentUser }), // only persist auth so tables reset on reload for dev
    }
  )
);

