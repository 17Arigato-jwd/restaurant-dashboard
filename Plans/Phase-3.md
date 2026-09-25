# Phase 3: Kitchen Display System (KDS)

**Objective:** Build a robust, real-time KDS interface that automatically routes orders to specific kitchen stations and monitors preparation times to prevent delays.

## Technical Tasks & Deliverables

### 1. KDS Layout & Station Views
*   **Multi-Column UI:** Design a Kanban-style layout with columns representing different kitchen stations (e.g., Tandoor & Starters, Main Meals & Curries, Drinks & Packing).
*   **Station Filtering:** Allow the view to be filtered so a specific tablet in the kitchen only sees its relevant column/station.

### 2. Multi-Station Auto KOT Routing
*   **Routing Logic Engine:** Implement logic that intercepts a placed order and splits its items based on predefined item categories (e.g., Paneer Tikka goes to Tandoor, Mojito goes to Drinks).
*   **Websocket Simulation:** Set up a mechanism (using Zustand/Redux or mocked websockets) to simulate real-time injection of new tickets into the KDS columns as they are punched in the POS.

### 3. Station Order Cards (Tickets)
*   **Ticket UI Component:** Design clear, high-contrast order cards optimized for kitchen viewing from a distance.
*   **Core Information:** Display KOT number, Table Number (or Rider ID for delivery), and ordered item quantities.
*   **Dish Modifications:** Prominently highlight custom instructions (e.g., 'Extra Spicy', 'Jain', 'No Onion/Garlic').

### 4. Live Prep Timers & Visual Delay Escalation
*   **Elapsed Timer:** Add an active, counting-up timer to every order card starting from the moment it hits the KDS.
*   **Color-Coded Badges:** Implement logic to change the ticket color based on elapsed time:
    *   Green: < 10 mins (On-time)
    *   Amber: 10-18 mins (Warning/Getting Late)
    *   Red: > 18 mins (Critical/Breached SLA)
*   **Audio Alerts (Optional):** Add subtle audio chimes for new incoming tickets or critical SLA breaches.

### 5. One-Click Kitchen Order Bumping
*   **Bump Action Button:** Add a clear "Done" or "Bump" button to each ticket.
*   **Queue Management Logic:** When clicked, remove the ticket from the active station view.
*   **Order Coordination:** If a table's order was split across multiple stations, ensure the main POS/Expediter screen tracks when *all* parts of the order are bumped and ready for service.

## Exit Criteria
*   The KDS route displays distinct columns for kitchen stations.
*   Mocked orders automatically route to the correct columns based on item type.
*   Order cards clearly show items, modifiers, and an active ticking timer.
*   Cards visually change color (Green -> Amber -> Red) as time elapses.
*   Kitchen staff can "bump" orders to clear them from their screen.
