# Phase 4: Daily Overview & Sales Command Center

**Objective:** Create a comprehensive managerial dashboard providing real-time visibility into sales metrics, kitchen performance, and active orders.

## Technical Tasks & Deliverables

### 1. Dashboard Layout & Architecture
*   **Grid Framework:** Establish a responsive masonry or grid layout for the dashboard view (`/dashboard`).
*   **Data Aggregation Engine:** Create selector functions in the state store to calculate live metrics based on the day's transactions and active KOTs.

### 2. Live KPI Metric Cards
*   **Gross & Net Revenue Tracker:** Build a card displaying total sales, calculating net revenue (minus taxes/discounts), and showing a Day-on-Day (DoD) trend indicator (e.g., +14% vs yesterday, using mock historical data).
*   **Active Order & Avg Prep Counter:** Display the current number of live tickets and calculate the real-time average preparation time against a 14-minute target.
*   **Payment Channel Split:** Create a metric showing the percentage breakdown of revenue by UPI, Cash, and Cards.

### 3. Data Visualizations (Chart.js / Recharts)
*   **Hourly Sales Flow Chart:** Implement a stacked bar chart mapping sales volume across hours (lunch vs. dinner peaks). Add a toggle filter to compare 'Today' vs. 'Yesterday'.
*   **Revenue Channel Share Donut Chart:** Build a pie/donut chart showing the percentage distribution between Dine-In, Swiggy, Zomato, and ONDC. Add tooltips highlighting commission fee warnings on aggregator slices.
*   **Channel Revenue Ratio Monitor:** Create a specific visual card contrasting total Dine-In revenue directly against aggregated delivery revenue.

### 4. Automated Low Stock Alerting Widget
*   **Alert Panel:** Create a dashboard widget dedicated to inventory warnings.
*   **Threshold Logic:** Implement logic that reads mock inventory levels and triggers red alerts when critical items (Paneer, Cream) drop below minimum thresholds.
*   **Auto-Request Status:** Display a badge indicating if a supplier re-order request has been mocked/sent.

### 5. Active Orders Table & Filtering
*   **Live Data Grid:** Build a sortable data table displaying all currently active orders across the restaurant and delivery platforms.
*   **Delay Color-Coding:** Apply the same Red/Amber/Green logic from the KDS to the rows in this table.
*   **Delayed Order Filter Switch:** Add a quick-toggle switch above the table to instantly filter and show *only* Amber and Red (delayed) tickets for immediate manager intervention.

## Exit Criteria
*   The dashboard dynamically renders KPI cards with aggregated data.
*   The Hourly Sales and Channel Share charts render correctly using a charting library.
*   The low stock widget accurately flags items below a mocked threshold.
*   The Active Orders table displays live tickets, color-codes them based on age, and can be filtered to show only delayed orders.
