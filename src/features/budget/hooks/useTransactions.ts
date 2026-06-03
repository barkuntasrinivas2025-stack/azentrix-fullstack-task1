import { useState, useCallback, useMemo } from 'react';
import type {
  Transaction, CategoryId,
  MonthlySummary, BudgetGoalProgress, AppStorageState, BudgetGoal
} from '../types';

const STORAGE_KEY = 'azentrix:budget:v1';
const SCHEMA_VERSION = 1;

// ─── Storage Helpers ──────────────────────────────────────────────────────────

function loadState(): AppStorageState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw) as AppStorageState;
    if (parsed.schemaVersion !== SCHEMA_VERSION) return defaultState();
    return parsed;
  } catch {
    return defaultState();
  }
}

function saveState(state: AppStorageState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.warn('[Budget] localStorage write failed:', err);
    throw new Error('Storage full. Please export and clear old entries.');
  }
}

function defaultState(): AppStorageState {
  return {
    transactions: [],
    budgetGoals: [],
    recurringTemplates: [],
    preferredCurrency: 'INR',
    schemaVersion: SCHEMA_VERSION,
  };
}

// ─── Universal Date Formatter Helper ──────────────────────────────────────────
/**
 * Normalizes input date strings securely to a clean "YYYY-MM" target anchor.
 * Gracefully processes variants like "2026-06-02", "2026-6-2", "02/06/2026", or standard ISO string structures.
 */
function normalizeToYearMonth(dateStr: string): string {
  if (!dateStr) return '';
  
  // Standardize hyphens: handle variations like YYYY-M-DD by parsing split structures
  if (dateStr.includes('-')) {
    const parts = dateStr.split('-');
    if (parts[0].length === 4) {
      const year = parts[0];
      const month = parts[1].padStart(2, '0');
      return `${year}-${month}`;
    }
  }

  // Fallback handler parsing native string arrays or slashes
  try {
    const dateObj = new Date(dateStr);
    if (isNaN(dateObj.getTime())) {
      return dateStr.slice(0, 7); // Safe fallback slice if parsing fails
    }
    return dateObj.toISOString().slice(0, 7);
  } catch {
    return dateStr.slice(0, 7);
  }
}

// ─── Hook Implementation ──────────────────────────────────────────────────────

export function useTransactions() {
  const [state, setState] = useState<AppStorageState>(loadState);

  // ─── O(1) Lookup Map — rebuilt only when transactions array changes ────────
  const transactionMap = useMemo<Map<string, Transaction>>(
    () => new Map(state.transactions.map(t => [t.id, t])),
    [state.transactions]
  );

  // ─── Transaction CRUD ──────────────────────────────────────────────────────

  const addTransaction = useCallback((
    draft: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>
  ): Transaction => {
    const now = new Date().toISOString();
    const tx: Transaction = {
      ...draft,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    };
    setState(prev => {
      const next: AppStorageState = {
        ...prev,
        transactions: [tx, ...prev.transactions],
      };
      saveState(next);
      return next;
    });
    return tx;
  }, []);

  const updateTransaction = useCallback((
    id: string,
    patch: Partial<Omit<Transaction, 'id' | 'createdAt'>>
  ): void => {
    setState(prev => {
      const existing = prev.transactions.find(t => t.id === id);
      if (!existing) {
        console.warn(`[Budget] updateTransaction: id ${id} not found`);
        return prev;
      }
      const updated: Transaction = {
        ...existing,
        ...patch,
        updatedAt: new Date().toISOString(),
      };
      const next: AppStorageState = {
        ...prev,
        transactions: prev.transactions.map(t => t.id === id ? updated : t),
      };
      saveState(next);
      return next;
    });
  }, []);

  const deleteTransaction = useCallback((id: string): void => {
    setState(prev => {
      const next: AppStorageState = {
        ...prev,
        transactions: prev.transactions.filter(t => t.id !== id),
      };
      saveState(next);
      return next;
    });
  }, []);

  // ─── Budget Goal CRUD ──────────────────────────────────────────────────────

  const addBudgetGoal = useCallback((
    draft: Omit<BudgetGoal, 'id' | 'createdAt'>
  ): BudgetGoal => {
    const goal: BudgetGoal = {
      ...draft,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    setState(prev => {
      // Deduplicate: filter out any existing goal for this category before appending
      const filteredGoals = prev.budgetGoals.filter(g => g.categoryId !== draft.categoryId);
      const next: AppStorageState = {
        ...prev,
        budgetGoals: [...filteredGoals, goal],
      };
      saveState(next);
      return next;
    });
    return goal;
  }, []);

  const updateBudgetGoal = useCallback((
    id: string,
    patch: Partial<Omit<BudgetGoal, 'id' | 'createdAt'>>
  ): void => {
    setState(prev => {
      const next: AppStorageState = {
        ...prev,
        budgetGoals: prev.budgetGoals.map(g =>
          g.id === id ? { ...g, ...patch } : g
        ),
      };
      saveState(next);
      return next;
    });
  }, []);

  const deleteBudgetGoal = useCallback((id: string): void => {
    setState(prev => {
      const next: AppStorageState = {
        ...prev,
        budgetGoals: prev.budgetGoals.filter(g => g.id !== id),
      };
      saveState(next);
      return next;
    });
  }, []);

  // ─── Derived Data Metrics ──────────────────────────────────────────────────

  const currentMonth = useMemo(
    () => new Date().toISOString().slice(0, 7), // "2026-06"
    []
  );

  const currentMonthlySummary = useMemo((): MonthlySummary => {
    const targetMonth = normalizeToYearMonth(currentMonth);
    
    const monthlyTxs = state.transactions.filter(
      t => normalizeToYearMonth(t.date) === targetMonth
    );

    const byCategory = {} as Record<CategoryId, number>;
    let totalIncome = 0;
    let totalExpenses = 0;

    for (const tx of monthlyTxs) {
      if (tx.type === 'income') {
        totalIncome += tx.amount;
      } else {
        totalExpenses += tx.amount;
        byCategory[tx.categoryId] = (byCategory[tx.categoryId] ?? 0) + tx.amount;
      }
    }

    return {
      month: currentMonth,
      totalIncome,
      totalExpenses,
      netSavings: totalIncome - totalExpenses,
      byCategory,
    };
  }, [state.transactions, currentMonth]);

  // For historical lookups used by chart components
  const getMonthlySummary = useCallback((month: string): MonthlySummary => {
    const targetMonth = normalizeToYearMonth(month);
    
    const monthlyTxs = state.transactions.filter(
      t => normalizeToYearMonth(t.date) === targetMonth
    );
    
    const byCategory = {} as Record<CategoryId, number>;
    let totalIncome = 0;
    let totalExpenses = 0;

    for (const tx of monthlyTxs) {
      if (tx.type === 'income') {
        totalIncome += tx.amount;
      } else {
        totalExpenses += tx.amount;
        byCategory[tx.categoryId] = (byCategory[tx.categoryId] ?? 0) + tx.amount;
      }
    }

    return { 
      month, 
      totalIncome, 
      totalExpenses, 
      netSavings: totalIncome - totalExpenses, 
      byCategory 
    };
  }, [state.transactions]);

  const budgetProgress = useMemo((): BudgetGoalProgress[] => {
    return state.budgetGoals.map(goal => {
      // Critical fallback handler: ensuring baseline evaluation returns 0, never undefined
      const spent = currentMonthlySummary.byCategory[goal.categoryId] ?? 0;
      const percentage = goal.monthlyLimit > 0
        ? (spent / goal.monthlyLimit) * 100
        : 0;
      return {
        goal,
        spent,
        percentage,
        isOverBudget: spent > goal.monthlyLimit,
      };
    });
  }, [state.budgetGoals, currentMonthlySummary]);

  return {
    transactions: state.transactions,
    transactionMap,
    budgetGoals: state.budgetGoals,
    budgetProgress,
    currentMonthlySummary,
    preferredCurrency: state.preferredCurrency,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    addBudgetGoal,
    updateBudgetGoal,
    deleteBudgetGoal,
    getMonthlySummary,
  };
}