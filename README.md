# Easy Restaurant Operations SPA 🍛

An ultra-performant, real-time Restaurant Operations Dashboard designed specifically for the unique complexities of Indian Casual Dining and QSR outlets. This platform merges live order management, kitchen display systems (KDS), delivery aggregator integration, and advanced analytics into a single cohesive interface.

## Tech Stack
*   **Frontend**: Next.js 15 (App Router), React, Tailwind CSS v4, Shadcn UI, Zustand (State Management).
*   **Backend**: Rust, Axum (Web Framework), Tokio (Async runtime), SQLx (SQLite Database), jsonwebtoken (Auth).

---

## Prerequisites
Before you begin, ensure you have the following installed on your machine:
1.  [Node.js](https://nodejs.org/) (v18 or higher) & `npm`
2.  [Rust & Cargo](https://rustup.rs/) (latest stable)

---

## 🚀 Setup & Running Locally

To run this application, you will need to run the frontend and backend servers simultaneously in two separate terminal windows.

### 1. Start the Rust Backend
The backend uses a local SQLite database. You don't need to install any external database servers; the application will automatically create the `restaurant.db` file and run the necessary schema migrations on startup.

Open your first terminal and run:
```bash
cd backend
cargo run
```
*Note: The first time you run this, Cargo will take a minute or two to download and compile the dependencies. Once finished, you should see:* `Rust backend listening on 0.0.0.0:8000`.

### 2. Start the Next.js Frontend
Open a second terminal window and run:
```bash
cd web
npm install
npm run dev
```
*Once the server starts, open your browser and navigate to:* [http://localhost:3000](http://localhost:3000)

> The Next.js app talks to the Rust API through its own `/api/*` routes (see `web/src/lib/backend.ts`), so the backend must be running on port **8000** first.

---

## 🛠️ Usage Guide

1.  **Authentication**: When you first launch the app, you will be greeted by the login screen. Since there are no users yet, click **"Need an account? Register here."**
2.  **Registration**: Register with any email (e.g., `owner@test.com`) and password. The backend securely hashes this password using `bcrypt` and stores it in the local SQLite database. Every new outlet is also seeded with a starter floor plan (tables T-01 → T-08) so the Tables and KDS screens are immediately usable.
3.  **Dashboard**: After logging in, you will be redirected to the Dashboard Overview. Your session is managed securely via JWT and persisted using Zustand, meaning you will stay logged in even if you refresh the page.
4.  **Features**:
    *   **Theme Toggle**: Click the user profile icon in the top right to switch between Dark and Light mode.
    *   **Emergency Controls**: Test out the highly visible "Panic Pause" button in the header.
    *   **Tables & KDS**: Add items from the Tables drawer; they are persisted through the API and appear live on the Kitchen Display (bump removes the line item).
    *   **Employee Schedule**: Pick a team member to see their details and week of shifts; managers can file/clear leave and departed shifts are flagged.
    *   **Inventory Expiry**: Add stock with an expiry date to track what is about to expire.

---

## ⚠️ Troubleshooting: Application Control / AppLocker blocks the Rust build

If Windows Application Control (Smart App Control / WDAC / AppLocker) is enforced on your machine, the Rust build can fail with an error like:

```
error: .../target/debug/deps/serde_derive-....dll: LoadLibraryExW failed:
An Application Control policy has blocked this file. (os error 4551)
```

This happens when the existing `backend/target` folder contains compiled `.dll`
files the policy no longer trusts (typically after the folder was copied from
another machine). Deleting the build cache and rebuilding regenerates the
libraries locally so they are trusted again:

```bash
cd backend
rm -rf target        # PowerShell: Remove-Item -Recurse -Force target
cargo build          # or: cargo run
```

If a rebuild still fails, point Cargo at a fresh target directory instead:

```bash
CARGO_TARGET_DIR="$(pwd)/target-fresh" cargo run
```

---

## Project Structure
*   `/Plans` - Contains detailed Markdown specifications for the 10-phase development roadmap.
*   `/web` - The Next.js frontend application.
*   `/backend` - The Rust/Axum backend API.
