# SplitEasy 💸

**SplitEasy** is a modern, responsive group expense splitting and debt settlement web application built with Next.js (App Router), TypeScript, Tailwind CSS, and MongoDB.

---

## Problem Statement

When groups of people travel, share living spaces, or organize events, multiple participants pay for varying shared expenses. Splitting expenses manually often results in:
1. **Paisa rounding discrepancies**: Standard float division loses or duplicates fractions of paise.
2. **Web of tangled debts**: In a group of $N$ people, if everyone owes each other directly, there are up to $N(N-1)/2$ confusing pairwise transfers.
3. **Friction and lack of transparency**: Lack of live feedback on split shares, unclear net balances, and forgotten repayments cause social friction and financial inaccuracies.

---

## Target Users

- **Roommates & Flatmates**: Managing recurring household items, utilities, groceries, and rent.
- **Trip & Vacation Groups**: Splitting travel bookings, meals, rentals, and activities with varying participants per bill.
- **Colleagues & Teams**: Tracking group dinners, celebrations, and shared project supplies.
- **Event Organizers**: Handling collaborative gatherings and group purchases.

---

## Solution

SplitEasy delivers a streamlined, mathematically exact expense management system:
- **Zero Paisa Loss**: Implements integer-based arithmetic in paise, guaranteeing exact conservation of total amounts and deterministically distributing remainder paise.
- **Smart Debt Simplification**: Computes net balances and executes a greedy matching algorithm between the largest debtor and largest creditor with deterministic tie-breaking, reducing $O(N^2)$ pairwise debts to at most $N-1$ optimal transfers.
- **Transparent Workspaces**: Provides real-time balance calculations, live split previews, expense breakdowns, and direct settlement logging.
- **Resilient Architecture**: Uses server-only MongoDB connection pooling with automatic local session fallback if the database is temporarily unreachable.

---

## Key Features

- 👥 **Group & Member Management**: Create shared groups with customizable members; dynamically add new members at any time.
- ➗ **Zero-Loss Fair Split (`equalSplit`)**: Splits amounts in paise evenly, distributing remainder paise one-by-one to the first members so every single paisa is accounted for.
- ⚖️ **Live Net Balances (`computeBalances`)**: Instant calculation of each member's net position (positive = owed money, negative = owes money).
- ⚡ **Smart Debt Simplification (`simplifyDebts`)**: Calculates the minimum number of direct payments needed to completely settle all debts in the group.
- 🤝 **Quick Settle & Payments**: One-click settlement directly from simplified suggestions, or manual payment logging between any two members.
- 🗑️ **Expense Deletion**: Remove erroneously logged expenses with immediate, automatic recalculation of balances and debt suggestions.
- 👁️ **Live Split Preview**: Previews exact per-member shares in real time before an expense is saved.
- 🔒 **Server-Only MongoDB Persistence**: Secure API routes storing data in MongoDB with cached connection promises across serverless invocations.
- 🛡️ **Graceful Offline Mode**: Visual indicators and full local session operation if the database connection is interrupted.
- 🧪 **Unit Tested Engine**: Complete Vitest test suite covering mathematical edge cases, remainder distribution, and tie-breaking.

---

## Tech Stack

- **Framework**: Next.js 16 (App Router, Server & Client Components)
- **Language**: TypeScript (Strict typing across domain and API)
- **Styling**: Tailwind CSS
- **Database**: MongoDB (Official `mongodb` Node.js driver)
- **Testing**: Vitest
- **Code Quality**: ESLint 9

---

## Architecture

```text
┌───────────────────────────────────────────────────────────┐
│                    Next.js App Router                     │
│                                                           │
│  ┌───────────────────────┐     ┌───────────────────────┐  │
│  │   UI Components       │     │   API Route Handlers  │  │
│  │  - Dashboard & Groups │     │   - /api/groups       │  │
│  │  - Balances Card      │◄───►│   - /api/groups/[id]  │  │
│  │  - Expense List       │     │   - /expenses         │  │
│  │  - Settlement Modal   │     │   - /settlements      │  │
│  └──────────┬────────────┘     └───────────┬───────────┘  │
└─────────────┼──────────────────────────────┼──────────────┘
              │                              │
              ▼                              ▼
┌──────────────────────────┐    ┌───────────────────────────┐
│   Pure Domain Engine     │    │   Database Layer          │
│   (lib/settle.ts)        │    │   (lib/mongodb.ts)        │
│  - equalSplit()          │    │  - Cached MongoClient     │
│  - computeBalances()     │    │  - Connection Pooling     │
│  - simplifyDebts()       │    │  - Document Stores        │
│  - formatRupees()        │    │                           │
└──────────────────────────┘    └─────────────┬─────────────┘
                                              │
                                              ▼
                                ┌───────────────────────────┐
                                │   MongoDB Database        │
                                │   Collection: "groups"    │
                                └───────────────────────────┘
```

### Core Workflow:

```text
User creates Group & Members
          ↓
User adds Expense (Payer + Split Members)
          ↓
equalSplit() computes exact shares in paise
          ↓
Expense appended to Group in MongoDB
          ↓
computeBalances() evaluates net balances across all expenses and settlements
          ↓
simplifyDebts() iteratively pairs largest debtor with largest creditor
          ↓
User sees minimal settlement transfers (e.g. Charlie pays Alice ₹500)
          ↓
User clicks "Settle Up" -> Payment recorded -> Debts cleared to ₹0.00
```

---

## Local Setup

### Prerequisites

- Node.js 18+ (tested on Node 22+)
- MongoDB instance (local `mongodb://localhost:27017` or MongoDB Atlas)

### Installation

1. Clone repository and install dependencies:
   ```bash
   npm install
   ```

2. Configure environment variables:
   Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
   Set your MongoDB connection parameters in `.env.local`:
   ```env
   MONGODB_URI=your_mongodb_connection_string
   MONGODB_DB=spliteasy
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Environment Variables

| Variable | Description | Example |
| :--- | :--- | :--- |
| `MONGODB_URI` | MongoDB connection string (server-only, never exposed to client) | `mongodb://localhost:27017` or `mongodb+srv://...` |
| `MONGODB_DB` | Target database name | `spliteasy` |

---

## Available Scripts

- `npm run dev` - Start Next.js development server
- `npm run build` - Create optimized production build
- `npm run start` - Start production server
- `npm run lint` - Run ESLint code quality checks
- `npm test` - Run Vitest test suite

---

## API Endpoints

- `GET /api/groups` - Fetch all groups
- `POST /api/groups` - Create a group with initial members
- `GET /api/groups/[id]` - Retrieve a specific group
- `PATCH /api/groups/[id]` - Rename a group
- `DELETE /api/groups/[id]` - Delete a group
- `POST /api/groups/[id]/expenses` - Add an expense with calculated fair shares
- `DELETE /api/groups/[id]/expenses/[expenseId]` - Delete an expense and recalculate
- `POST /api/groups/[id]/settlements` - Record a debt settlement
- `POST /api/groups/[id]/members` - Add a member to a group

---

## Deployment

Deploy directly to **Vercel** or any cloud platform supporting Next.js:

1. Push your repository to GitHub.
2. Import the project into Vercel.
3. Configure the `MONGODB_URI` and `MONGODB_DB` environment variables in your deployment dashboard.
4. Deploy and verify your live URL.
