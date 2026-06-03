// ─── Primitives ───────────────────────────────────────────────────────────────

export type TransactionType = 'income' | 'expense';

export type CategoryId =
  | 'food' | 'transport' | 'housing' | 'utilities' | 'health'
  | 'entertainment' | 'shopping' | 'education' | 'salary' | 'freelance'
  | 'investment' | 'gift' | 'other';

// ─── Core domain types ────────────────────────────────────────────────────────

export interface Transaction {
  id: string;                  // crypto.randomUUID()
  type: TransactionType;
  amount: number;              // always positive, sign determined by `type`
  description: string;
  categoryId: CategoryId;
  date: string;                // ISO 8601: "2026-06-02"
  currencyCode: string;        // "INR" | "USD" | …
  isRecurring: boolean;
  recurringTemplateId?: string; // links to RecurringTemplate
  createdAt: string;           // ISO 8601 datetime
  updatedAt: string;
}

export interface Category {
  id: CategoryId;
  label: string;
  icon: string;               // emoji for now, swap to lucide icon name later
  type: TransactionType | 'both';
  keywords: readonly string[]; // for O(1) auto-detection (lowercased)
}

export interface BudgetGoal {
  id: string;
  categoryId: CategoryId;
  monthlyLimit: number;
  currencyCode: string;
  createdAt: string;
}

export interface RecurringTemplate {
  id: string;
  name: string;
  type: TransactionType;
  amount: number;
  categoryId: CategoryId;
  currencyCode: string;
  dayOfMonth: number;         // 1–28 (safe across all months)
  isActive: boolean;
}

// ─── Derived / computed types (never persisted) ───────────────────────────────

export interface MonthlySummary {
  month: string;              // "2026-06"
  totalIncome: number;
  totalExpenses: number;
  netSavings: number;
  byCategory: Record<CategoryId, number>;
}

export interface BudgetGoalProgress {
  goal: BudgetGoal;
  spent: number;
  percentage: number;         // 0–100+, can exceed 100 if over budget
  isOverBudget: boolean;
}

// ─── Storage shape ────────────────────────────────────────────────────────────

export interface AppStorageState {
  transactions: Transaction[];
  budgetGoals: BudgetGoal[];
  recurringTemplates: RecurringTemplate[];
  preferredCurrency: string;
  schemaVersion: number;      // increment when storage shape changes
}