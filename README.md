# Easy Restaurant Operations SPA

A comprehensive, real-time single-page application (SPA) built to streamline operations for Indian Casual Dining & QSR Outlets. This dashboard addresses the unique complexities of Indian restaurant operations, including high delivery aggregator reliance, multi-station kitchen routing, complex bank payout reconciliations, and instant accounting sync.

## Key Features

* **Command Center Dashboard:** Real-time visibility into total daily sales, channel revenue share, average prep times, and live kitchen active orders.
* **Aggregator Management:** Centralized hub for Swiggy, Zomato, and ONDC with Direct POS Order Ingestion and a 1-click "Panic Pause" for heavy kitchen rushes.
* **Live Digital Billing & Table Management:** Visual floor plan map with real-time status and WhatsApp digital bill transmission to save on paper rolls.
* **Kitchen Display System (KDS):** Multi-station ticket routing with automated prep timers and visual delay escalation.
* **Stock & Waste Tracking:** Automated BOM deduction from physical inventory with variance alerts for theft/waste.
* **Menu Engineering:** 4-Quadrant BCG Matrix classification (Stars, Puzzles, Plow Horses, Dogs) and an interactive dish margin simulator.
* **Financial Reconciliation:** Dispute claim generator and step-by-step order deduction subtraction stack for delivery partners.
* **Tally Prime Sync:** 1-Click integration to sync daily sales vouchers, payment breakdowns, and GST liabilities straight to Tally.

## Tech Stack

* **Framework:** [Next.js](https://nextjs.org/) (App Router)
* **Styling:** [Tailwind CSS](https://tailwindcss.com/)
* **UI Components:** [Shadcn UI](https://ui.shadcn.com/) / Base UI
* **State Management:** [Zustand](https://github.com/pmndrs/zustand)
* **Icons:** [Lucide React](https://lucide.dev/)

## Getting Started

First, install the dependencies. (Ensure you have Node.js installed on your system).

```bash
# Navigate to the web directory
cd web

# Install dependencies
npm install
```

Then, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result. The root page automatically redirects to the main `/dashboard` route.

## Project Structure

* `/Plans/`: Detailed feature catalogs and phase-by-phase development roadmaps.
* `/web/`: The Next.js web application.
  * `src/app/`: Next.js App Router pages (`/dashboard`, `/tables`, `/kds`, `/settings`).
  * `src/components/`: Reusable UI components (Modals, Headers, Buttons).
  * `src/store/`: Zustand global state management.
  * `src/lib/`: Utility functions.

## Development Phases

This project is being developed in 10 structured phases (refer to `Plans/PHASES.md` for full details):
1. Foundation & Navigation (Header & Emergency Controls) - *Completed*
2. Core Operations & Table Management
3. Kitchen Display System (KDS)
4. Daily Overview & Sales Command Center
5. Online Delivery Manager
6. Menu Profitability & Engineering
7. Stock & Ingredient Waste Tracker
8. Bank Payouts & Commission Reconciliation
9. Staff Activity Audit & Anti-Theft Security
10. Integrations & External Sync
