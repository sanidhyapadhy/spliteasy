# SplitEasy 💸

**Split smart. Settle simply.**

SplitEasy is a web application for managing shared group expenses. It helps people record who paid for an expense, divide the cost fairly among selected group members, track net balances, and calculate suggested payments to settle outstanding debts.

**Live Demo:** https://spliteasy-arhf.vercel.app/  
**Source Code:** https://github.com/sanidhyapadhy/spliteasy

---

## 1. Problem Statement

When friends travel together, roommates share household expenses, or colleagues organize group events, different people often pay for shared costs at different times. Calculating each person's share and tracking repayments manually can become confusing and error-prone.

Common challenges include:

- **Unequal contributions:** One person may pay for groceries while another pays for transport or accommodation.
- **Rounding errors:** Dividing an amount among several people can leave fractional currency units.
- **Complicated debts:** Multiple expenses can result in several people owing money to different members.
- **Poor visibility:** Without a central record, it can be difficult to determine who owes money and who should receive it.
- **Settlement tracking:** Repayments need to be recorded so that outstanding balances can be recalculated.

### Proposed Solution

SplitEasy provides a centralized workspace for group expense management. Users can create groups, add members, record expenses, review balances, and record repayments. The application calculates fair shares using integer arithmetic in Indian paise and suggests simplified transfers between members.

The goal is to make shared expenses easier to understand, easier to track, and less awkward to settle.

## 2. Key Features

- **Group Management:** Create expense groups with a name and initial members.
- **Member Management:** Add members to an existing group.
- **Expense Recording:** Record an expense description, amount, payer, and participating members.
- **Fair Equal Splitting:** Divide an expense equally among the selected participants while accounting for every paisa.
- **Expense History:** Review recorded expenses, search the list, and inspect individual share breakdowns.
- **Net Balance Calculation:** Determine how much each member owes or is owed after accounting for expenses and recorded settlements.
- **Simplified Settlement Suggestions:** Generate suggested transfers between debtors and creditors using a greedy matching algorithm.
- **Payment Recording:** Record repayments between group members and update outstanding balances.
- **Responsive Interface:** Use the dashboard and group workspaces across desktop and smaller screens.
- **Database Status Feedback:** Display database connection problems and provide a retry option.
- **Unit Tests:** Test the core splitting, balance calculation, debt simplification, and currency formatting logic.

## 3. Technologies Used

| Technology | Purpose |
|---|---|
| Next.js 16 — App Router | Application framework, routing, and API endpoints |
| React 19 | Interactive user interface and component state |
| TypeScript | Type safety for application data, business logic, and API handlers |
| Tailwind CSS 4 | Responsive styling and interface design |
| MongoDB | Persistent storage for groups, members, expenses, and settlements |
| Official MongoDB Node.js Driver | Database connectivity and CRUD operations |
| Vitest | Unit testing of expense-splitting and settlement logic |
| ESLint 9 | Code quality and linting |
| Vercel | Cloud deployment and hosting |
| Git and GitHub | Version control and source-code hosting |

## 4. How It Works

1. **Create a group:** Give the group a name and add at least two distinct members.
2. **Record an expense:** Enter the description and amount, select the payer, and choose the members sharing the cost.
3. **Calculate shares:** Split the total equally among the selected members.
4. **Calculate balances:** Account for what each member paid, their allocated shares, and repayments already recorded.
5. **Simplify debts:** Match members who owe money with members who are owed money to generate suggested transfers.
6. **Record repayment:** Record a settlement and recalculate the remaining balances.

## 5. Core Algorithms

The main business logic is implemented in `lib/settle.ts`, separately from the user interface and database routes.

### `equalSplit()`

Divides a positive integer amount in paise among the selected members.

For example, ₹1.00 divided among three members becomes ₹0.34, ₹0.33, and ₹0.33. The extra paisa is assigned deterministically so the shares always add up to the original total.

### `computeBalances()`

Calculates each member's net position:

- A positive balance means the member is owed money.
- A negative balance means the member owes money.
- A zero balance means the member has no outstanding net balance.

The calculation considers recorded expenses and settlements.

### `simplifyDebts()`

Uses a greedy matching strategy that repeatedly pairs the largest debtor with the largest creditor and transfers the smaller of the two outstanding amounts.

Ties are broken deterministically by member ID. This produces an understandable set of suggested transfers without requiring every debtor to pay every creditor individually.

### `formatRupees()`

Formats integer paise values as Indian Rupee amounts, such as `₹1,234.50`, without relying on floating-point arithmetic for the currency conversion.

## 6. Architecture

```text
User Interface
  └── Next.js / React Components
       ├── Dashboard and Group Workspace
       ├── Group and Member Modals
       ├── Expense History
       ├── Balance Summary
       └── Settlement Interface
                │
                ▼
       Next.js API Route Handlers
                │
          ┌─────┴──────┐
          ▼            ▼
   Settlement Logic   MongoDB Helper
   lib/settle.ts      lib/mongodb.ts
          │            │
          ▼            ▼
   Shares, Balances   MongoDB Atlas
   and Transfers      groups collection
```

The frontend communicates with the application's API routes. The server-side database helper uses the official MongoDB driver, while the settlement engine contains reusable calculation functions.

## 7. Project Structure

```text
spliteasy/
├── app/
│   ├── api/
│   │   └── groups/
│   │       ├── route.ts
│   │       └── [id]/
│   │           ├── route.ts
│   │           ├── members/route.ts
│   │           ├── expenses/route.ts
│   │           └── settlements/route.ts
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── Navbar.tsx
│   ├── GroupCard.tsx
│   ├── CreateGroupModal.tsx
│   ├── AddMemberModal.tsx
│   ├── AddExpenseModal.tsx
│   ├── BalancesCard.tsx
│   ├── ExpenseList.tsx
│   ├── SettlementList.tsx
│   └── RecordSettlementModal.tsx
├── lib/
│   ├── mongodb.ts
│   ├── settle.ts
│   ├── settle.test.ts
│   └── types.ts
├── .env.example
├── package.json
└── README.md
```

## 8. API Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/api/groups` | Retrieve all groups |
| `POST` | `/api/groups` | Create a group with initial members |
| `GET` | `/api/groups/[id]` | Retrieve a specific group |
| `PATCH` | `/api/groups/[id]` | Rename a group |
| `DELETE` | `/api/groups/[id]` | Delete a group |
| `POST` | `/api/groups/[id]/members` | Add a member |
| `POST` | `/api/groups/[id]/expenses` | Record an expense |
| `POST` | `/api/groups/[id]/settlements` | Record a repayment |

The API validates important inputs, checks group membership where applicable, and returns JSON responses with appropriate status codes.

## 9. Getting Started

### Prerequisites

- Node.js compatible with Next.js 16 (Node.js 20.9 or newer is recommended).
- npm.
- A MongoDB instance, either local or hosted on MongoDB Atlas.

### Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/sanidhyapadhy/spliteasy.git
cd spliteasy
npm install
```

Create a local environment file by copying the example:

```bash
cp .env.example .env.local
```

On Windows PowerShell, use:

```powershell
Copy-Item .env.example .env.local
```

Configure `.env.local`:

```env
MONGODB_URI=your_mongodb_connection_string
MONGODB_DB=spliteasy
```

Replace the placeholder URI with your own valid MongoDB connection string. Never commit `.env.local` or expose database credentials publicly.

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## 10. Environment Variables

| Variable | Required | Description |
|---|---|---|
| `MONGODB_URI` | Yes for database persistence | MongoDB connection string |
| `MONGODB_DB` | Optional | Database name; defaults to the database specified in the connection URI |

The MongoDB connection string must remain server-side and must not be exposed through client-side code.

## 11. Available Scripts

```bash
npm run dev    # Start the development server
npm run build  # Build the production application
npm run start  # Start the production server
npm run lint   # Run ESLint
npm test       # Run the Vitest unit tests
```

The unit tests cover equal splitting and remainder distribution, balance calculations, settlement behavior, deterministic tie-breaking, and currency formatting.

## 12. Deployment

SplitEasy is deployed on Vercel.

To deploy your own instance:

1. Import the GitHub repository into Vercel.
2. Configure `MONGODB_URI` and, if needed, `MONGODB_DB` in the project's environment variables.
3. Deploy the application.
4. Test group creation, expense recording, balance calculations, settlement recording, and persistence after refreshing the page.

## 13. Current Limitations

- The current application does not implement user authentication or authorization. It should be treated as a prototype, not a secure multi-user financial service.
- The application records settlements; it does not initiate bank transfers or process actual payments.
- If MongoDB is unavailable, the interface can fall back to in-memory session state. Such data is not durably saved and may be lost on refresh.
- Expense splitting is equal among the selected participants; custom percentage or weighted splits are not currently documented as supported.
- The settlement algorithm generates simplified suggestions using a greedy strategy; it does not claim to find a globally optimal solution for every possible group.

## 14. Future Improvements

- User authentication and group-level access control.
- Custom split amounts and percentage-based expense allocation.
- A complete and tested expense deletion API.
- Improved transaction handling and concurrency safeguards.
- Shared group access and collaborative updates.
- More integration and end-to-end tests.

---

**Built with Next.js, TypeScript, React, Tailwind CSS, and MongoDB.**

