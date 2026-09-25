# Phase 9: Staff Activity Audit & Anti-Theft Security

**Objective:** Implement strict access controls and monitor user activity to detect and prevent unauthorized actions, voids, and financial theft at the POS level.

## Technical Tasks & Deliverables

### 1. Timestamped Action Audit Trail
*   **Logging Engine:** Create a middleware or global listener in the state management that records critical system events (Bill generation, Table settlement, Item cancellation, Bill void, WhatsApp receipt sent, Stockout toggled).
*   **Audit Data Structure:** Each log entry must capture: Timestamp, User ID (Cashier/Manager), Action Type, Target (Table/Item), and Value (if financial).
*   **Audit Log UI:** Build a secure, filterable data table view (`/audit-logs`) accessible only to owners/admins to review this history.

### 2. Manager Authorization Counter
*   **Action Tracking:** Specifically track occurrences where the Manager PIN Authorization Gate (built in Phase 1) is successfully used.
*   **Metrics UI:** Create a dashboard widget specifically showing: Total Voided Bills, Value of Cancelled Orders, and Frequency of Manager PIN overrides for the current day.

### 3. Suspicious Cashier Risk Score Engine
*   **Anomaly Detection Logic:** Build an algorithm that analyzes the Audit Trail data over a rolling window (e.g., past 7 days).
*   **Risk Metric Calculation:** Calculate the average rate of bill cancellations or voids per cashier.
*   **Flagging System:** If a specific cashier's void rate exceeds a threshold (e.g., '2.5x higher than the restaurant average'), generate a high-priority "Suspicious Activity" alert for the owner.
*   **Cashier Profile View:** (Optional) Create a simple view detailing a specific staff member's shift activity and risk score.

## Exit Criteria
*   All sensitive actions (voids, cancellations, stockouts) are permanently logged with timestamps and user IDs.
*   A secure UI exists to view, sort, and filter the audit log.
*   A dashboard widget accurately tracks the total value and count of manager overrides and voids.
*   The Risk Engine successfully identifies and flags simulated cashier profiles that exhibit unusually high rates of voided transactions.
