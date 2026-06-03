// src/App.tsx

import React, { useState, useMemo } from 'react';
import { TransactionForm } from './features/budget/components/TransactionForm';
import { useTransactions } from './features/budget/hooks/useTransactions';
import { CATEGORIES } from './features/budget/utils/categories';
import { BudgetGoals } from './features/budget/components/BudgetGoals';
import { BudgetCharts } from './features/budget/components/BudgetCharts';
import { Transaction, CategoryId } from './features/budget/types';
import { fmt } from './shared/utils/formatCurrency';
import { exportToCSV, parseCSV } from './features/budget/utils/csvEngine';

export default function App() {
  const {
    transactions = [],
    addTransaction,
    updateTransaction,
    deleteTransaction,
    getMonthlySummary,
    preferredCurrency = 'INR',
    budgetProgress = [],
    currentMonthlySummary,
    addBudgetGoal,
    deleteBudgetGoal,
  } = useTransactions();

  const [editingTx, setEditingTx] = useState<Transaction | null>(null);

  const currentMonthStr = currentMonthlySummary?.month ?? new Date().toISOString().slice(0, 7);

  // ─── Month history for bar chart ───────────────────────────────────────────
  const monthHistory = useMemo(() => {
    try {
      const now = new Date();
      return [2, 1, 0]
        .map((monthsAgo) => {
          const d = new Date(now.getFullYear(), now.getMonth() - monthsAgo, 1);
          const year = d.getFullYear();
          const month = String(d.getMonth() + 1).padStart(2, '0');
          const targetString = `${year}-${month}`;
          return getMonthlySummary(targetString) ?? {
            month: targetString,
            totalIncome: 0,
            totalExpenses: 0,
            netSavings: 0,
            byCategory: {} as Record<CategoryId, number>,
          };
        })
        .filter(m => m.totalIncome > 0 || m.totalExpenses > 0);
    } catch (err) {
      console.error('[Budget] Failed to generate month history:', err);
      return [];
    }
  }, [getMonthlySummary]);

  // ─── Handlers ──────────────────────────────────────────────────────────────

  const handleFormSubmit = (formData: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editingTx) {
      updateTransaction(editingTx.id, formData);
      setEditingTx(null);
    } else {
      addTransaction(formData);
    }
  };

  const exportDataBackup = () => {
    const dataStr = "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(transactions, null, 2));
    const a = document.createElement('a');
    a.setAttribute('href', dataStr);
    a.setAttribute('download', `azentrix_ledger_${currentMonthStr}.json`);
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const handleCSVExport = () => {
    const csvContent = exportToCSV(transactions);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', `azentrix_statement_${currentMonthStr}.csv`);
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url); // release blob memory — was missing before
  };

  const handleCSVImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const drafts = parseCSV(text);
        drafts.forEach(draft => addTransaction(draft));
      } catch (err) {
        console.error('[Budget] CSV parse failed:', err);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // ─── Ledger row helper — defined outside map, stable reference ─────────────
  const categoriesList = Object.values(CATEGORIES);

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 antialiased p-6">

      {/* Header */}
      <header className="max-w-6xl mx-auto mb-8 pb-4 border-b border-slate-200 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">💳 Azentrix Budget Tracker</h1>
          <p className="text-xs text-slate-400 mt-0.5">Personal Finance Dashboard</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="text-xs font-medium px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer">
            📤 Import CSV
            <input type="file" accept=".csv" onChange={handleCSVImport} className="hidden" />
          </label>
          <button
            onClick={handleCSVExport}
            className="text-xs font-medium px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors"
          >
            📊 Export CSV
          </button>
          <button
            onClick={exportDataBackup}
            className="text-xs font-medium px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors"
          >
            📥 Export JSON
          </button>
          <span className="text-xs text-slate-400">{currentMonthStr}</span>
        </div>
      </header>

      {/* Main grid */}
      <main className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">

        {/* ── Left column ─────────────────────────────────────────────────── */}
        <div className="space-y-6">

          {/* Transaction form */}
          <div className="relative">
            {editingTx && (
              <div className="absolute -top-3 right-3 z-10 bg-amber-500 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md flex items-center gap-1.5">
                <span>⚡ Edit Mode</span>
                <button
                  onClick={() => setEditingTx(null)}
                  className="hover:text-slate-200 font-extrabold cursor-pointer"
                >
                  ✕
                </button>
              </div>
            )}
            <TransactionForm
              onSubmit={handleFormSubmit}
              preferredCurrency={preferredCurrency}
              defaultValues={editingTx ?? undefined}
              key={editingTx ? editingTx.id : 'create-mode'}
            />
          </div>

          {/* Summary card */}
          <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3 shadow-xs">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Summary ({currentMonthStr})
            </h3>
            <div className="flex justify-between border-b pb-2 text-sm">
              <span className="text-slate-500">Income:</span>
              <span className="font-semibold text-emerald-600">
                {fmt(currentMonthlySummary?.totalIncome ?? 0, preferredCurrency)}
              </span>
            </div>
            <div className="flex justify-between border-b pb-2 text-sm">
              <span className="text-slate-500">Expenses:</span>
              <span className="font-semibold text-red-500">
                -{fmt(currentMonthlySummary?.totalExpenses ?? 0, preferredCurrency)}
              </span>
            </div>
            <div className="flex justify-between pt-1 text-sm">
              <span className="font-medium">Net Savings:</span>
              <span className={`font-bold ${
                (currentMonthlySummary?.netSavings ?? 0) >= 0
                  ? 'text-emerald-600'
                  : 'text-red-500'
              }`}>
                {fmt(currentMonthlySummary?.netSavings ?? 0, preferredCurrency)}
              </span>
            </div>
          </div>

          {/* Budget goals */}
          <BudgetGoals
            budgetProgress={budgetProgress}
            preferredCurrency={preferredCurrency}
            onAddGoal={(categoryId, monthlyLimit) => {
              addBudgetGoal({
                categoryId: categoryId as CategoryId,
                monthlyLimit: Number(monthlyLimit),
                currencyCode: preferredCurrency,
              });
            }}
            onDeleteGoal={deleteBudgetGoal}
          />
        </div>

        {/* ── Right column ─────────────────────────────────────────────────── */}
        <div className="md:col-span-2 space-y-6">

          {/* Charts — only render when there is data */}
          {monthHistory.length > 0 && currentMonthlySummary && (
            <BudgetCharts
              currentMonth={currentMonthlySummary}
              monthHistory={monthHistory}
            />
          )}

          {/* Transaction ledger */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold">
              Transaction Ledger ({transactions.length})
            </h2>

            {transactions.length === 0 ? (
              <div className="p-12 bg-white border border-dashed rounded-xl text-center text-slate-400 text-sm">
                No transactions recorded yet. Add one on the left to get started.
              </div>
            ) : (
              <div className="bg-white border rounded-xl divide-y overflow-hidden shadow-xs">
                {transactions.map((tx) => {
                  const categoryInfo = categoriesList.find(c => c.id === tx.categoryId);
                  return (
                    <div
                      key={tx.id}
                      className={`p-4 flex justify-between items-center hover:bg-slate-50/80 transition-colors group ${
                        editingTx?.id === tx.id
                          ? 'bg-amber-50/50 border-l-4 border-amber-500'
                          : ''
                      }`}
                    >
                      <div className="cursor-pointer flex-1" onClick={() => setEditingTx(tx)}>
                        <h4 className="text-sm font-semibold text-slate-800 group-hover:text-indigo-600 transition-colors flex items-center gap-2">
                          {tx.description}
                          <span className="text-[10px] text-slate-400 font-normal opacity-0 group-hover:opacity-100 transition-opacity">
                            ✏️ Click to edit
                          </span>
                        </h4>
                        <p className="text-xs text-slate-400">
                          {categoryInfo
                            ? `${categoryInfo.icon} ${categoryInfo.label}`
                            : tx.categoryId
                          } • {tx.date}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className={`text-sm font-bold ${
                          tx.type === 'income' ? 'text-emerald-600' : 'text-slate-700'
                        }`}>
                          {tx.type === 'income' ? '+' : '-'}{fmt(tx.amount, tx.currencyCode)}
                        </span>
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteTransaction(tx.id); }}
                          className="text-slate-300 hover:text-red-500 transition-colors p-1"
                          aria-label="Delete transaction"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}