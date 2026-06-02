import { useState, useCallback, useMemo } from 'react';
import type {
  Transaction, TransactionType, CategoryId,
  MonthlySummary, AppStorageState
} from '../types';

const STORAGE_KEY = 'azentrix:budget:v1';
const SCHEMA_VERSION = 1;

// ─── Storage helpers ──────────────────────────────────────────────────────────

function loadState(): AppStorageState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw) as AppStorageState;
    if (parsed.schemaVersion !== SCHEMA_VERSION) return defaultState(); // migration point
    return parsed;
  } catch {
    return defaultState();
  }
}

function saveState(state: AppStorageState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    // localStorage full (5MB limit) — surface to UI via thrown error
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

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useTransactions() {
  const [state, setState] = useState<AppStorageState>(loadState);

  // Normalized O(1) lookup map — rebuilt only when transactions change
  const transactionMap = useMemo<Map<string, Transaction>>(
    () => new Map(state.transactions.map(t => [t.id, t])),
    [state.transactions]
  );

  const persist = useCallback((next: AppStorageState) => {
    saveState(next);
    setState(next);
  }, []);

  // ─── CRUD ──────────────────────────────────────────────────────────────────

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
    persist({
      ...state,
      transactions: [tx, ...state.transactions], // prepend for most-recent-first
    });
    return tx;
  }, [state, persist]);

  const updateTransaction = useCallback((
    id: string,
    patch: Partial<Omit<Transaction, 'id' | 'createdAt'>>
  ): void => {
    const existing = transactionMap.get(id);
    if (!existing) throw new Error(`Transaction ${id} not found`);
    const updated: Transaction = {
      ...existing,
      ...patch,
      updatedAt: new Date().toISOString(),
    };
    persist({
      ...state,
      transactions: state.transactions.map(t => t.id === id ? updated : t),
    });
  }, [state, transactionMap, persist]);

  const deleteTransaction = useCallback((id: string): void => {
    persist({
      ...state,
      transactions: state.transactions.filter(t => t.id !== id),
    });
  }, [state, persist]);

  // ─── Derived data (memoized, O(n) computed once per transactions change) ───

  const getMonthlySummary = useCallback((month: string): MonthlySummary => {
    // month = "2026-06"
    const monthlyTxs = state.transactions.filter(t => t.date.startsWith(month));

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
      byCategory,
    };
  }, [state.transactions]);

  return {
    transactions: state.transactions,
    transactionMap,
    budgetGoals: state.budgetGoals,
    preferredCurrency: state.preferredCurrency,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    getMonthlySummary,
  };
}