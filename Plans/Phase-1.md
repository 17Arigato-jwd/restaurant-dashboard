# Phase 1: Foundation & Navigation (Header & Emergency Controls)

**Objective:** Set up the project architecture, global state, and build the persistent header navigation with core operational and emergency controls.

## Technical Tasks & Deliverables

### 1. Project Initialization & Architecture Setup
*   **Initialize Repository:** Scaffold the SPA using React (Next.js or Vite) with TypeScript.
*   **Styling & UI Library:** Install and configure Tailwind CSS and a UI component library (e.g., Shadcn UI or Material UI).
*   **State Management Setup:** Implement global state management using Zustand or Redux Toolkit for user sessions, system status, and emergency states.
*   **Routing Setup:** Configure fundamental routes (`/dashboard`, `/tables`, `/kds`, `/settings`).

### 2. Header & Branding Component
*   **Outlet Branding Display:** Create a persistent header component. Display the restaurant name, concept type (e.g., "Casual Dining"), and location.
*   **System Status Indicator:** Add a badge showing the status of the local POS software connection.

### 3. Real-Time Connectivity Badges
*   **Tally Sync Status:** Implement a UI badge indicating live connection to Tally Prime (e.g., Green 'Connected', Red 'Offline').
*   **Offline Sales Cache Tracking:** Display a badge showing the number of offline sales pending synchronization (e.g., '0 pending').
*   **Delivery Channel Activity:** Add visual indicators for active connections to Swiggy, Zomato, and ONDC APIs.

### 4. Emergency Aggregator Pause (Panic Button)
*   **Global Pause UI:** Implement a prominent, high-visibility "Emergency Pause" button in the header.
*   **Confirmation Modal:** Create a confirmation dialog to prevent accidental triggers.
*   **Timer & Logic:** Implement a countdown timer (e.g., 30 minutes) when activated, dispatching an event to the global state to mock API calls pausing incoming orders across all aggregator platforms.

### 5. Multi-Platform Stockout Controller
*   **Stockout Modal:** Build a modal accessible from the header to quickly search and select menu items.
*   **Toggle Mechanism:** Implement switches to instantly toggle items as 'Sold Out' or 'Available'.
*   **Platform Checkboxes:** Allow the user to specify which platforms (Dine-in POS, QR Menu, Swiggy, Zomato) the stockout applies to.

### 6. Manager PIN Authorization Gate
*   **Security Component:** Create a reusable modal component that requires a 4-digit PIN entry.
*   **Action Interception:** Integrate this component to intercept sensitive actions (to be used later for voids, discounts, etc.).
*   **Validation Logic:** Mock the validation logic against a predefined manager PIN stored securely (or mocked in state).

## Exit Criteria
*   The SPA shell is fully running with routing.
*   The header is visible on all pages with branding and working connectivity badges.
*   The emergency pause button triggers a state change and shows a timer.
*   The stockout controller modal opens and allows toggling item states.
*   The PIN authorization gate component is built, tested standalone, and ready for integration.
