# Phase 2: Core Operations & Table Management

**Objective:** Digitize the physical restaurant layout, manage live table states, and handle the end-to-end billing workflow including digital receipt delivery.

## Technical Tasks & Deliverables

### 1. Visual Floor Plan Map
*   **Grid Layout Setup:** Build a responsive grid or flexible layout area to represent the restaurant floor.
*   **Table Components:** Create clickable table UI elements indicating table number and seating capacity tags (e.g., "T4 - 4 Pax").
*   **Drag & Drop (Optional/Stretch):** Implement basic drag-and-drop functionality for managers to rearrange tables.

### 2. Real-Time Table Status Engine
*   **State Machine Logic:** Implement logic to handle table transitions: Available (Gray) -> Seated (Blue) -> Food Ordered (Amber) -> Bill Given (Green).
*   **Dynamic Styling:** Bind the table component styles to their current state in the global store.
*   **Timer Integration:** Add a timer to track how long a table has been in the 'Seated' or 'Bill Given' state to highlight slow turnarounds.

### 3. Interactive Table Details Drawer
*   **Sidebar/Drawer Component:** Build a sliding drawer that opens when a table is clicked.
*   **Active Status Display:** Show current table status, waiter assigned, and time seated.
*   **KOT (Kitchen Order Ticket) List:** Display the running list of ordered items with quantities and prices.
*   **Cumulative Total:** Calculate and display the live running bill total, including taxes.

### 4. Instant Table Settlement & Reset
*   **Payment Modal:** Create a settlement screen displaying the final amount and payment method selection (Cash, UPI, Card).
*   **1-Click Settlement Button:** Implement logic to mark the bill as paid, record the transaction in the daily ledger (state), and instantly transition the table state back to 'Available'.
*   **PIN Integration:** Trigger the Manager PIN Authorization Gate (built in Phase 1) if a discount or item void is applied during settlement.

### 5. WhatsApp Digital Bill Transmission
*   **Customer Details Input:** Add a field in the settlement modal to capture the guest's mobile number.
*   **WhatsApp API Mock/Integration:** Implement a button that triggers an API call (or mock) to send a digital receipt link via WhatsApp.
*   **Success Notification:** Show a toast notification confirming the bill was sent successfully, reducing reliance on physical paper rolls.

## Exit Criteria
*   Users can view a digital floor plan with color-coded tables.
*   Clicking a table opens a drawer showing its active orders and live total.
*   Tables can be transitioned through states (Seated -> Ordered -> Billed).
*   Bills can be settled, resetting the table to available and logging the payment type.
*   A mocked WhatsApp bill sending feature is integrated into the checkout flow.
