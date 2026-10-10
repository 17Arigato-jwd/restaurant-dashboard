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
  /** Epoch milliseconds (server-set) used for KOT prep timers. */
  createdAt?: number;
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

  restaurant: { name: string; logoUrl?: string } | null;
  setRestaurant: (restaurant: { name: string; logoUrl?: string }) => void;

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
  updateTableState: (id: string, newState: TableState) => Promise<void>;
  placeOrder: (tableId: string, order: { name: string; price: number; qty: number }) => Promise<boolean>;
  bumpOrder: (orderId: string) => Promise<void>;
  settleTable: (id: string) => Promise<void>;
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
            
            if (data.restaurantId) {
              const rRes = await fetch(`/api/restaurants/${data.restaurantId}`, {
                headers: { Authorization: `Bearer ${token}` }
              });
              if (rRes.ok) {
                const rData = await rRes.json();
                if (rData?.settings) {
                  set({ restaurant: { name: rData.settings.name, logoUrl: rData.settings.logoUrl } });
                }
              }
            }
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

      restaurant: null,
      setRestaurant: (restaurant) => set({ restaurant }),

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
          const res = await fetch('/api/tables', {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data)) set({ tables: data });
          }
        } catch (e) { console.error("Failed to fetch live tables:", e); }
      },
      updateTableState: async (id, newState) => {
        // Optimistic local update so the floor plan responds instantly...
        set((state) => ({
          tables: state.tables.map(t => {
            if (t.id !== id) return t;
            return {
              ...t,
              state: newState,
              seatedAt: newState === 'seated' && !t.seatedAt ? Date.now()
                : newState === 'available' ? undefined
                : t.seatedAt,
            };
          })
        }));
        // ...then persist so the 3-second live poll does not revert it.
        const { token } = get();
        if (!token) return;
        try {
          await fetch(`/api/tables/${id}`, {
            method: 'PUT',
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ state: newState }),
          });
          await get().fetchLiveTables();
        } catch (e) { console.error("Failed to update table state:", e); }
      },
      placeOrder: async (tableId, order) => {
        const { token } = get();
        if (!token) return false;
        try {
          const res = await fetch('/api/orders', {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ tableId, name: order.name, price: order.price, qty: order.qty }),
          });
          if (res.ok) {
            await get().fetchLiveTables();
            return true;
          }
        } catch (e) { console.error("Failed to place order:", e); }
        return false;
      },
      bumpOrder: async (orderId) => {
        const { token } = get();
        if (!token) return;
        try {
          await fetch(`/api/orders/${orderId}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
          });
          await get().fetchLiveTables();
        } catch (e) { console.error("Failed to bump order:", e); }
      },
      settleTable: async (id) => {
        set((state) => ({
          tables: state.tables.map(t => t.id === id ? { ...t, state: 'available', orders: [], seatedAt: undefined, waiter: undefined } : t)
        }));
        const { token } = get();
        if (!token) return;
        try {
          await fetch(`/api/tables/${id}`, {
            method: 'PUT',
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ state: 'available', clearOrders: true }),
          });
          await get().fetchLiveTables();
        } catch (e) { console.error("Failed to settle table:", e); }
      }
    }),
    {
      name: 'restaurant-storage',
      partialize: (state) => ({ token: state.token, role: state.role, currentUser: state.currentUser, mustChangePassword: state.mustChangePassword }), // only persist auth so tables reset on reload for dev
    }
  )
);

