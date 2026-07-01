# 💳 Budget Tracker

> Personal Finance Dashboard | [Live Demo](https://personalbudgettracker-qcywr768r.vercel.app) | Built for Azentrix Summer Internship 2026

## Screenshots

![Dashboard with Data](screenshots/Screenshot%202026-06-04%20113615.png)
![Charts and Spending Sectors](screenshots/Screenshot%202026-06-04%20113758.png)
![Budget Goals Progress](screenshots/Screenshot%202026-06-04%20113911.png)
![Mobile Responsive View](screenshots/Screenshot%202026-06-04%20113931.png)

## Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Frontend | React 18 + TypeScript | Type safety, component reuse |
| Styling | Tailwind CSS v3 | Utility-first, rapid UI development |
| State Management | Custom hooks + localStorage | Zero dependencies, offline-first |
| Charts | Custom SVG bars + CSS | Lightweight, no library overhead |
| Deployment | Vercel | Free tier, automatic CI/CD from GitHub |

## Features

### ✅ Required (per spec)
- [x] Add, edit, and delete income and expense entries
- [x] Category and date attached to every transaction
- [x] Dashboard with monthly summary (Income / Expenses / Net Savings)
- [x] Bar chart showing 3-month spending trend
- [x] Category breakdown with percentage bars
- [x] Data persistence via localStorage — survives page refresh
- [x] Fully responsive across mobile and desktop

### 🚀 Bonus (beyond spec)
- [x] AI-style category auto-detection — O(1) keyword reverse index built at module load
- [x] Monthly budget goals with live progress bars
- [x] Over-budget detection — progress bar turns red automatically
- [x] CSV export using Blob API — no third-party library
- [x] CSV import with full RFC 4180 parse engine
- [x] JSON backup export for full data portability
- [x] Indian locale currency formatting — ₹1,00,000.00
- [x] Click-to-edit inline transaction editing
- [x] Edit mode indicator with one-click cancel

## Architecture Decisions

**localStorage over a backend** — Task 1 has no authentication requirement. localStorage gives instant persistence with zero infrastructure cost, works fully offline, and removes an entire deployment dependency. The storage layer is fully abstracted behind `useTransactions` — swapping to a REST API later only requires changing that one file.

**Functional setState pattern** — Every CRUD operation uses `setState(prev => ...)` instead of reading state directly inside `useCallback`. This prevents stale closure bugs when multiple operations fire before a render cycle completes — a real concurrency issue in React 18 concurrent mode.

**O(1) category auto-detection** — A `Map<string, CategoryId>` reverse index is built once at module load time from the CATEGORIES definition. Description text is tokenized and each word is looked up in O(1). No regex scanning, no loops over categories on every keystroke. Falls back to substring matching for compound words.

**Normalized state shape** — Transactions are stored as an array but exposed via a `Map<id, Transaction>` for O(1) lookup. The map is rebuilt via `useMemo` only when the transactions array reference changes.

## Local Setup

```bash
git clone https://github.com/barkuntasrinivas2025-stack/azentrix-fullstack-task1
cd azentrix-fullstack-task1
npm install --legacy-peer-deps
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

## Project Structure

```
src/
├── features/
│   └── budget/
│       ├── components/    # TransactionForm, BudgetGoals, BudgetCharts
│       ├── hooks/         # useTransactions — all state and persistence
│       ├── utils/         # categories.ts (O1 detection), csvEngine.ts
│       └── types.ts       # Transaction, BudgetGoal, MonthlySummary
├── shared/
│   └── utils/
│       └── formatCurrency.ts  # Intl.NumberFormat with en-IN locale
├── App.tsx
└── main.tsx
```


## Performance Notes

- Category detection: O(1) per word, O(k) per description where k = word count
- All list renders use stable `transaction.id` keys — never array index
- Monthly summaries memoized with `useMemo` — recomputes only when transactions change
- `useCallback` with empty deps on all CRUD handlers — stable function references
- Functional setState prevents stale closure bugs on concurrent updates
