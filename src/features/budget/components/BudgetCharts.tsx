// src/features/budget/components/BudgetCharts.tsx

import React, { useMemo } from 'react';
// So these paths should be:
import type { MonthlySummary } from '../types';
import { CATEGORIES } from '../utils/categories';
import { fmt } from '../../../shared/utils/formatCurrency';

interface BudgetChartsProps {
  currentMonth: MonthlySummary;
  monthHistory: MonthlySummary[];
}

export function BudgetCharts({ currentMonth, monthHistory = [] }: BudgetChartsProps) {

  // ── Bar chart: max value for scaling — computed once ─────────────────────
  const maxExpense = useMemo(
    () => Math.max(...monthHistory.map(h => h.totalExpenses), 1),
    [monthHistory]
  );

  // ── Pie data: sorted largest first, labels resolved from CATEGORIES ───────
  const categoryRows = useMemo(() => {
    const totalExp = currentMonth.totalExpenses; // never divide by this if 0
    if (totalExp <= 0) return [];

    return Object.entries(currentMonth.byCategory)
      .filter(([, amount]) => amount > 0)
      .map(([catId, amount]) => ({
        catId,
        label: CATEGORIES[catId as keyof typeof CATEGORIES]?.label ?? catId,
        icon:  CATEGORIES[catId as keyof typeof CATEGORIES]?.icon  ?? '📦',
        amount,
        pct: (amount / totalExp) * 100,
      }))
      .sort((a, b) => b.amount - a.amount); // largest first
  }, [currentMonth.byCategory, currentMonth.totalExpenses]);

  // ── Month label: "2026-06" → "Jun" ───────────────────────────────────────
  function shortMonth(month: string): string {
    const [year, m] = month.split('-');
    return new Date(Number(year), Number(m) - 1).toLocaleString('default', { month: 'short' });
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

      {/* ── 3-Month Bar Chart ─────────────────────────────────────────────── */}
      <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-4 shadow-xs">
        <div>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            3-Month Spending Trend
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">Historical monthly comparison</p>
        </div>

        {monthHistory.length === 0 ? (
          <div className="h-32 flex items-center justify-center text-xs text-slate-400 italic">
            No history to display yet.
          </div>
        ) : (
          <div className="h-32 flex items-end gap-4 pt-4 px-2">
            {monthHistory.map((h, i) => {
              const heightPct = (h.totalExpenses / maxExpense) * 100;
              return (
                <div
                  key={h.month ?? i}
                  className="flex-1 flex flex-col items-center gap-2 h-full justify-end"
                >
                  <div className="w-full bg-slate-100 rounded-t-md relative group flex items-end h-full">
                    <div
                      className="w-full bg-indigo-500 rounded-t-md transition-all duration-500 hover:bg-indigo-600"
                      style={{ height: `${Math.max(heightPct, 4)}%` }}
                    />
                    {/* Tooltip */}
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                      {fmt(h.totalExpenses, 'INR')}
                    </div>
                  </div>
                  <span className="text-[10px] font-medium text-slate-400">
                    {shortMonth(h.month)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Top Spending Sectors ──────────────────────────────────────────── */}
      <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3 shadow-xs">
        <div>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Top Spending Sectors
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">Current statement cycle values</p>
        </div>

        <div className="space-y-2.5 max-h-36 overflow-y-auto pr-1 pt-1">
          {categoryRows.length === 0 ? (
            <p className="text-xs text-slate-400 italic text-center py-8">
              No expenses recorded this month.
            </p>
          ) : (
            categoryRows.map(({ catId, label, icon, amount, pct }) => (
              <div key={catId} className="space-y-1">
                <div className="flex justify-between items-baseline text-[11px]">
                  <span className="font-medium text-slate-600">
                    {icon} {label}
                  </span>
                  <span className="text-slate-400 font-mono tabular-nums">
                    {pct.toFixed(0)}%
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-indigo-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(pct, 100)}%` }}
                  />
                </div>
                <div className="text-[10px] text-slate-400 text-right">
                  {fmt(amount, 'INR')}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
}