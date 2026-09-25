# Indian Restaurant Operational Dashboard: Feature Catalog & Technical Specification Matrix

**System Name:** Easy Restaurant Operations SPA
**Target Segment:** Indian Casual Dining & QSR Outlets
**Primary Ecosystem:** Petpooja / Restroworks / Tally Prime
**Integrations:** Swiggy, Zomato, ONDC, WhatsApp

This document presents an exhaustive inventory of every operational feature, real-time control element, and business intelligence tool embedded in the Indian Restaurant Dashboard SPA. The system addresses the unique complexities of Indian restaurant operations, including high delivery aggregator reliance, multi-station kitchen KOT routing, ingredient-level waste monitoring, complex bank payout reconciliations, and 1-click accounting sync into Tally Prime. It is designed specifically to eliminate technical jargon for restaurant owners, managers, cashiers, and head chefs. The platform combines live order management with financial clarity and anti-theft controls.

## System Modules and Core Features

### 1. Navigation Header & Emergency Controls
*   **Outlet Branding & Metadata Display:** Displays the outlet name, concept classification (Casual Dining), physical location, and easy management software status.
*   **Real-time Connectivity Badges:** Provides visual indicators for live Tally Prime status ('Connected'), offline sales cache tracking ('0 pending'), and online delivery channel activity.
*   **One-Touch Emergency Aggregator Pause:** Features a global panic button that instantly pauses incoming orders across Swiggy, Zomato, and ONDC for 30 minutes during heavy kitchen rushes.
*   **Multi-Platform Stockout Controller:** Uses an instant modal enabling managers to toggle dishes as 'Sold Out' simultaneously across delivery apps, QR menus, and POS billing terminals.
*   **Manager PIN Authorization Gate:** Includes a security modal requiring a 4-digit PIN to approve bill voids, item cancellations, and custom discounts to prevent cashier fraud.

### 2. Daily Overview & Sales Command Center
*   **Live Gross & Net Revenue Tracker:** Uses a real-time metric card to display total daily sales, day-on-day comparison percentage (+14% vs yesterday), and net revenue breakdown.
*   **Payment Channel Split Breakdown:** Provides an instant percentage metric displaying the exact revenue distribution between UPI (PhonePe/Google Pay), Cash, and Cards.
*   **Active Order & Average Prep Counter:** Monitors active kitchen tickets, average preparation time (14 min target), and channel allocation (Dine-in vs Swiggy vs Zomato) live.
*   **Channel Revenue Ratio Monitor:** Uses a visual comparison card to compare Dine-In revenue against aggregate delivery revenue (₹28.0k vs ₹20.2k).
*   **Automated Low Stock Alerting:** Issues real-time warnings flagging ingredients that have breached minimum threshold limits (e.g., Paneer, Cream, Butter) alongside supplier auto-request status.
*   **Interactive Hourly Sales Flow Chart:** Displays a stacked bar visualization tracking hourly sales volume across lunch and dinner peak hours, with interactive filters toggling between 'Today' and 'Yesterday'.
*   **Revenue Channel Share Donut Chart:** Features a visual percentage distribution pie chart detailing Dine-in vs Swiggy vs Zomato vs ONDC orders, annotated with commission fee warnings.
*   **Active Orders Table with Delay Color-Coding:** Uses a color-coded order list to categorize prep status: Green (<10 min on-time), Amber (10-18 min getting late), and Red (>18 min late threshold).
*   **Delayed Order Filter Switch:** Includes a 1-click toggle isolating only delayed tickets requiring urgent manager attention.
*   **One-Click Kitchen Order Bumping:** Provides an action button allowing managers to bump completed orders out of the active queue upon dispatch.

### 3. Online Delivery Manager (Swiggy, Zomato & ONDC)
*   **Aggregator API Integration Hub:** Features status monitoring cards for Swiggy, Zomato, and ONDC, displaying auto-accept order status and live daily revenue per platform.
*   **Direct POS Order Ingestion:** Eliminates multiple aggregator tablets by feeding online orders directly into the main POS and KDS.
*   **ONDC Commission Savings Calculator:** Uses an interactive financial simulator to calculate monthly profit savings when shifting orders from traditional aggregators (22% commission) to ONDC (5% commission).
*   **Target Order Migration Slider:** Features an adjustable range input (10% to 80%) allowing owners to project monthly bottom-line profit gains based on target ONDC order adoption.

### 4. Floor Plan, Tables & Live Digital Billing (KOT)
*   **Visual Floor Plan Map:** Employs a color-coded grid layout representing physical restaurant tables with seating capacity tags.
*   **Real-Time Table Status Engine:** Uses dynamic state colors: Available (Gray), Seated (Blue), Food Ordered (Amber), and Bill Given (Green).
*   **Interactive Table Details Drawer:** Features a click-to-view sidebar displaying active table status, running ordered item lists, and the cumulative bill total.
*   **WhatsApp Digital Bill Transmission:** Includes a direct WhatsApp integration button that sends digital receipt links straight to the guest's mobile number, saving paper rolls.
*   **Instant Table Settlement & Reset:** Uses a one-click bill settlement button that marks the bill as paid, updates the cash/UPI ledger, and resets the table status to 'Available'.

### 5. Kitchen Display Screen (KDS by Station)
*   **Multi-Station Order Routing:** Features automated ticket routing that splits incoming orders into designated prep stations: Tandoor & Starters, Main Meals & Curries, and Drinks & Packing.
*   **Station Order Cards:** Displays the KOT number, table/rider ID, detailed dish modifications (e.g., 'Extra Spicy', 'Salted'), and a real-time elapsed prep timer.
*   **Visual Delay Escalation:** Uses timer badges to highlight order urgency to kitchen staff before orders exceed delivery SLA limits.

### 6. Menu Profitability & Engineering Planner
*   **4-Quadrant BCG Menu Engineering Matrix:** Classifies dishes into four actionable operational categories based on margin percentage and order popularity: Stars (Best Sellers), Puzzles (High Margin/Low Sales), Plow Horses (Popular/Low Margin), and Dogs (Low Margin/Low Sales).
*   **Operational Strategy Recommendations:** Provides contextual action plans for each category, such as recommending upsells for Puzzles or optimizing recipe costs for Plow Horses.
*   **Interactive Dish Margin Simulator:** Acts as a pricing tool allowing managers to select menu items, adjust retail selling prices, and immediately analyze Bill of Materials (BOM) cost, rupee margin, and percentage profit margin.
*   **Automated Classification Classifier:** Uses a dynamic badge that automatically reclassifies dishes (Star, Moderate, Low) as price adjustments are made in the simulator.

### 7. Stock & Ingredient Waste Tracker
*   **Recipe BOM Auto-Deduction Engine:** Automatically calculates and subtracts raw ingredient weights (Paneer, Cream, Butter, Gravy base) from physical inventory every time a dish is billed.
*   **Expected vs. Actual Usage Variance Chart:** Features a dual-bar Chart.js visualization comparing theoretical ingredient consumption against actual physical kitchen stock usage.
*   **Waste & Theft Escalation Warning:** Flags specific ingredients that exceed the 2% allowable waste threshold, such as Fresh Paneer & Butter variance warnings.
*   **Standard Recipe Portion Guide:** Includes a reference panel breaking down standardized ingredient portion weights per dish to ensure kitchen consistency.

### 8. Bank Payouts & Commission Reconciliation Engine
*   **Step-by-Step Order Deduction Subtraction Stack:** Functions as a financial math engine breaking down a ₹1,000 online order to show exact net bank deposits after deducting Platform Commissions (22%), 18% GST on Commissions, Sec 194O TDS (0.1%), Sec 52 TCS (0.5%), and 5% Sec 9E Food GST.
*   **Interactive Order & Commission Inputs:** Allows custom order values and platform commission percentages to immediately calculate projected bank payouts.
*   **Payment Discrepancy & Overcharge Audit:** Uses a table to log missing payout amounts, incorrect customer refund deductions, and commission rate miscalculations by delivery partners.
*   **One-Click Dispute Claim File Generator:** Features an export button that produces formatted dispute Excel reports for submission to Swiggy and Zomato merchant support teams.

### 9. Staff Activity Audit & Anti-Theft Security
*   **Suspicious Cashier Risk Score Engine:** Acts as an automated anomaly detector flagging cashiers with unusually high bill cancellation or void rates, such as '2.8x higher than average'.
*   **Manager Authorization Counter:** Tracks the total voided bills, the value of cancelled orders, and the frequency of Manager PIN overrides.
*   **Timestamped Action Audit Trail:** Provides a complete terminal activity log capturing bill cancellations, WhatsApp receipt dispatches, and catalog updates with user ID tags.

### 10. POS Software Comparison & Tally Accounting Sync
*   **Indian POS Software Comparison Matrix:** Serves as a benchmark evaluation comparing top Indian POS platforms (Petpooja, Restroworks/POSist, GoFrugal) across offline reliability, Tally sync capabilities, aggregator support, and target outlet suitability.
*   **1-Click Direct Tally Prime Sync:** Features an instant accounting integration button that compiles daily sales vouchers, payment breakdowns (UPI/Cash/Card), and GST tax liabilities directly into Tally Prime for CA tax filings.

## Summary Feature Capabilities Matrix

| Module Name | Primary Feature Capability | Operational Impact | Key Stakeholder |
| :--- | :--- | :--- | :--- |
| **Header Controls** | Emergency Aggregator Pause & Stockout Toggles | Prevents kitchen overload & bad reviews | Restaurant Manager |
| **Daily Overview** | Live KPIs & Hourly Sales Stacked Bar Chart | Real-time visibility into revenue & rush times | Owner / Manager |
| **Online Delivery** | ONDC Commission Calculator & Direct POS Ingestion | Saves up to 17% in delivery commissions | Owner / Accountant |
| **Table Management** | Visual Floor Map & WhatsApp Digital Billing | Faster table turns & zero paper bill costs | Wait Staff / Cashier |
| **Kitchen Display** | Multi-Station Auto KOT Routing & Prep Timers | Eliminates ticket mix-ups & reduces prep delay | Head Chef / Cooks |
| **Menu Profitability** | 4-Quadrant BCG Matrix & Dish Margin Simulator | Optimizes dish pricing & maximizes margins | Owner / Chef |
| **Stock & Inventory** | BOM Auto-Deduction & Variance Analytics | Detects kitchen waste, portioning errors & theft | Store Manager / Chef |
| **Bank Reconciliation** | Deduction Stack Math Engine & Dispute File Generator | Recovers missing payouts & audit discrepancies | Accountant / Owner |
| **Staff Security** | Suspicious Cashier Risk Alert & Manager PIN Logs | Prevents unauthorized bill voids & cash theft | Owner / Security |
| **POS & Tally Sync** | Benchmark Matrix & 1-Click Tally Prime Sync | Automates GST filing & accounting vouchers | Chartered Accountant |
