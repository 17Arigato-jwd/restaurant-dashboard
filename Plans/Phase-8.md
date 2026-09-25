# Phase 8: Bank Payouts & Commission Reconciliation

**Objective:** Demystify the complex financial deductions imposed by delivery aggregators, ensuring the restaurant can reconcile expected bank payouts and dispute discrepancies.

## Technical Tasks & Deliverables

### 1. Step-by-Step Order Deduction Subtraction Stack
*   **Financial Math Engine:** Build a utility function that takes a gross online order value and sequentially applies standard Indian deduction rules:
    1.  Platform Commission (e.g., 22%)
    2.  18% GST on that Commission
    3.  Sec 194O TDS (0.1% on Gross)
    4.  Sec 52 TCS (0.5% on Net)
    5.  5% Sec 9E Food GST liability (if applicable)
*   **Visual Waterfall/Stack Component:** Create a UI component that clearly shows the ₹1,000 starting value and visualizes every deduction step down to the final net bank deposit.

### 2. Interactive Order & Commission Inputs
*   **Calculator UI:** Build a form alongside the deduction stack allowing users to input a custom order value and tweak the platform commission percentage.
*   **Reactive Updates:** Ensure the subtraction stack updates instantly as these inputs change.

### 3. Payment Discrepancy & Overcharge Audit
*   **Audit Table:** Create a data grid (`/reconciliation`) that logs past delivery orders, comparing the 'Expected Payout' (calculated by our engine) against the 'Actual Payout' received in the bank (mock data).
*   **Anomaly Highlighting:** Use conditional formatting (red text/backgrounds) to highlight rows where incorrect customer refunds or commission miscalculations have resulted in a payout shortage.

### 4. One-Click Dispute Claim File Generator
*   **Export Logic:** Integrate a library like `xlsx` or standard CSV generation.
*   **Formatter:** Write a function that takes filtered discrepancy rows from the Audit Table and formats them into the specific Excel structures required by Swiggy/Zomato merchant support for dispute filing.
*   **Action Button:** Provide an "Export Dispute Claim" button that triggers the download of this formatted file.

## Exit Criteria
*   The Deduction Stack visually and accurately calculates the final bank payout from a gross online order, applying all necessary taxes and commissions.
*   Users can input custom values to see theoretical deductions.
*   The Audit table highlights discrepancies between expected and actual payouts.
*   The system can export a correctly formatted Excel/CSV file containing discrepancy data for filing disputes.
