# Phase 7: Stock & Ingredient Waste Tracker

**Objective:** Implement inventory control mechanisms that automatically track raw material usage against sales to highlight waste, over-portioning, and potential theft.

## Technical Tasks & Deliverables

### 1. Recipe BOM (Bill of Materials) Data Structure
*   **Ingredient Database:** Create a mocked inventory state containing raw ingredients (e.g., Paneer, Chicken, Butter, Onion Gravy) with current stock weights in kg/liters.
*   **Recipe Mapping:** Link menu items to ingredients (e.g., 1 Paneer Butter Masala = 150g Paneer, 50g Butter, 200ml Gravy).

### 2. Recipe BOM Auto-Deduction Engine
*   **Consumption Logic:** Implement a listener on the billing cycle. Every time a bill is settled (Phase 2), trigger a function that calculates the theoretical consumption of raw materials based on the items sold.
*   **Inventory Update:** Automatically deduct these calculated weights from the global inventory state.

### 3. Expected vs. Actual Usage Variance Chart
*   **Data Entry Mocking:** Provide a way to input "Physical Stock Check" numbers (actual inventory on hand).
*   **Dual-Bar Chart Visualization:** Build a chart comparing the 'Theoretical Stock' (calculated by the deduction engine) against the 'Actual Stock' (physical count) for key ingredients.

### 4. Waste & Theft Escalation Warning System
*   **Threshold Monitoring:** Implement logic that calculates the variance percentage between theoretical and actual stock.
*   **Alert Generation:** If the variance for a high-value item (like Fresh Paneer or Butter) exceeds the allowable 2% threshold, generate a prominent red warning alert in the dashboard and inventory view.

### 5. Standard Recipe Portion Guide
*   **Reference UI:** Create a quick-reference side panel or modal accessible to kitchen and management staff.
*   **Portion Display:** Clearly list the exact standardized weight required for each ingredient per dish to enforce consistency and reduce accidental over-portioning.

## Exit Criteria
*   Selling an item on the POS automatically reduces the corresponding raw ingredient weights in the simulated inventory.
*   The system can compare this auto-deducted amount against a physical stock count.
*   A variance chart visualizes the discrepancy.
*   Alerts are triggered when ingredient waste exceeds the defined 2% threshold.
*   A portion guide is accessible for reference.
