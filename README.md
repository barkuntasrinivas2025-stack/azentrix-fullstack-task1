# 💳 Azentrix Budget Tracker

> Personal Finance Dashboard | [Live Demo](https://azentrix-fullstack-task1-delta.vercel.app)

## Screenshots

![Dashboard](screenshots/Screenshot%202026-06-03%20114640.png)
![Charts & Ledger](screenshots/Screenshot%202026-06-03%20113205.png)
![Empty State](screenshots/Screenshot%202026-06-03%20113044.png)
![Mobile View](screenshots/Screenshot%202026-06-03%20093645.png)

## Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Frontend | React 18 + TypeScript | Type safety, component reuse |
| Styling | Tailwind CSS v3 | Utility-first, rapid UI |
| State | Custom hooks + localStorage | Zero dependencies, offline-first |
| Charts | Custom SVG + CSS | Lightweight, no library overhead |
| Deploy | Vercel | Free tier, instant CI/CD |

## Features

### ✅ Required (per spec)
- [x] Add, edit, delete income and expense entries
- [x] Category and date on every entry
- [x] Dashboard with monthly summary cards
- [x] Bar chart — 3-month spending trend
- [x] Category breakdown — Top Spending Sectors
- [x] Data persistence via localStorage
- [x] Fully responsive across mobile and desktop

### 🚀 Bonus (beyond spec)
- [x] AI-style category auto-detection via O(1) keyword reverse index
- [x] Monthly budget goals with animated progress bars
- [x] Over-budget detection with red highlighting
- [x] CSV export using Blob API (no library)
- [x] CSV import with full parse engine
- [x] JSON backup export
- [x] Indian locale currency formatting (₹)
- [x] Click-to-edit inline transaction editing
- [x] Edit mode indicator with cancel button

## Architecture Decisions

**localStorage over a backend** — Task 1 has no auth requirement. localStorage gives instant persistence with zero infrastructure cost, works offline, and removes an entire deployment dependency. The data layer is abstracted behind a `useTransactions` hook so swapping to an API later requires changing only one file.

**Functional setState pattern** — All CRUD operations use `setState(prev => ...)` instead of reading state directly in callbacks. This prevents stale closure bugs when multiple operations fire before a render cycle completes.

**O(1) category detection** — A keyword reverse index (`Map<string, CategoryId>`) is built once at module load. Description text is tokenized and each word is looked up in O(1). No regex, no loops over categories on every keystroke.

## Local Setup

```bash
git clone https://github.com/barkuntasrinivas2025-stack/azentrix-fullstack-task1
cd azentrix-fullstack-task1
npm install --legacy-peer-deps
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

## Performance Notes

- Category detection: O(1) per word, O(k) per description where k = word count
- All list renders use stable `transaction.id` keys, never array index
- Memoized monthly summaries — recomputes only when transactions change
- Functional setState prevents stale closure bugs on concurrent updates