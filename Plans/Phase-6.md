# Phase 6: Menu Profitability & Engineering

**Objective:** Implement analytical tools to help management optimize menu pricing, understand dish profitability, and adjust recipes based on cost analysis.

## Technical Tasks & Deliverables

### 1. Menu Engineering Data Structure
*   **Data Modeling:** Extend the menu item data model to include `bomCost` (Bill of Materials cost), `retailPrice`, `marginRupee`, `marginPercentage`, and `salesVolume` (mocked historical data).

### 2. 4-Quadrant BCG Menu Engineering Matrix
*   **Matrix Visualization:** Build a scatter plot chart (using Recharts or Chart.js) or a custom 4-grid CSS layout for the Menu Engineering view (`/menu-engineering`).
*   **Axes Definition:** X-axis represents Sales Volume (Popularity); Y-axis represents Profit Margin Percentage.
*   **Data Plotting:** Plot all menu items onto the matrix.

### 3. Automated Classification Classifier
*   **Categorization Logic:** Implement a function that automatically assigns a category badge to each dish based on its position in the matrix:
    *   **Stars:** High Margin, High Sales
    *   **Puzzles:** High Margin, Low Sales
    *   **Plow Horses:** Low Margin, High Sales
    *   **Dogs:** Low Margin, Low Sales
*   **Dynamic Badging:** Display these badges prominently next to dishes in the menu lists and matrix tooltips.

### 4. Operational Strategy Recommendations
*   **Contextual Advice Engine:** Build a component that displays text recommendations based on a selected dish's classification (e.g., "Plow Horse: Consider reducing portion size slightly or seeking cheaper ingredient alternatives to boost margin without raising the price.").

### 5. Interactive Dish Margin Simulator
*   **Pricing Tool UI:** Create a specialized calculator form.
*   **Dynamic Inputs:** Allow the user to select a dish, modify the `retailPrice` input, and alter hypothetical `bomCost` inputs.
*   **Real-time Output:** As inputs change, instantly recalculate and display the resulting Rupee margin and percentage profit margin.
*   **Live Reclassification:** Show a preview badge of how the dish's classification (Star, Dog, etc.) would change based on the simulated pricing.

## Exit Criteria
*   Menu items include cost and volume data.
*   The BCG Matrix accurately plots dishes into the four distinct quadrants based on margin and popularity.
*   Dishes receive automated classification badges (Star, Puzzle, etc.).
*   The Margin Simulator allows users to tweak price/cost and see real-time updates to margin percentages and projected BCG classification.
