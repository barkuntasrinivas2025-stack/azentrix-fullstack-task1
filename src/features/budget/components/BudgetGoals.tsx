import React, { useState, useMemo } from "react";
import { CATEGORIES } from "../utils/categories";
import { BudgetGoalProgress, CategoryId } from "../types";

interface BudgetGoalsProps {
  budgetProgress: BudgetGoalProgress[];
  preferredCurrency: string;
  onAddGoal: (categoryId: CategoryId, monthlyLimit: number) => void;
  onDeleteGoal: (id: string) => void;
}

export function BudgetGoals({
  budgetProgress = [], // 👈 Default to safe empty array parameter allocation
  preferredCurrency,
  onAddGoal,
  onDeleteGoal,
}: BudgetGoalsProps) {
  const [selectedCategory, setSelectedCategory] = useState<CategoryId | "">("");
  const [limitInput, setLimitInput] = useState<string>("");

  const availableCategories = useMemo(() => {
    // Safely check array status to protect initialization mapping operations
    const safeProgress = Array.isArray(budgetProgress) ? budgetProgress : [];
    const existingIds = new Set(safeProgress.map((p) => p?.goal?.categoryId).filter(Boolean));
    const categoriesArray = Array.isArray(CATEGORIES) ? CATEGORIES : Object.values(CATEGORIES || {});

    return categoriesArray.filter(
      (cat) => cat && (cat.type === "expense" || cat.type === "both") && !existingIds.has(cat.id)
    );
  }, [budgetProgress]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const limit = parseFloat(limitInput);
    if (!selectedCategory || isNaN(limit) || limit <= 0) return;

    onAddGoal(selectedCategory, limit);
    setSelectedCategory("");
    setLimitInput("");
  };

  const safeProgressList = Array.isArray(budgetProgress) ? budgetProgress : [];

  return (
    <div className="p-5 bg-white border border-slate-200 rounded-xl space-y-5 shadow-xs">
      <div>
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">🎯 Budget Targets</h3>
        <p className="text-xs text-slate-400 mt-0.5">Set monthly limits per spending category</p>
      </div>

      {availableCategories.length > 0 ? (
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as CategoryId)}
              className="text-xs border border-slate-200 rounded-lg p-2 bg-slate-50 focus:outline-indigo-500"
              required
            >
              <option value="" disabled>Select Category</option>
              {availableCategories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.icon} {cat.label}
                </option>
              ))}
            </select>

            <input
              type="number"
              placeholder={`Limit (${preferredCurrency})`}
              value={limitInput}
              onChange={(e) => setLimitInput(e.target.value)}
              className="text-xs border border-slate-200 rounded-lg p-2 bg-slate-50 focus:outline-indigo-500"
              min="1"
              step="any"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full text-xs font-semibold py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors cursor-pointer"
          >
            ＋ Set Budget Goal
          </button>
        </form>
      ) : (
        <p className="text-xs text-slate-400 italic text-center py-2">
          All spending categories have configured limits!
        </p>
      )}

      <hr className="border-slate-100" />

      <div className="space-y-4">
        {safeProgressList.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-4">No budget caps defined yet.</p>
        ) : (
          safeProgressList.map((item) => {
            // Guard explicitly against empty structural properties inside the mapped target object
            if (!item || !item.goal) return null;
            const { goal, spent = 0, percentage = 0, isOverBudget = false } = item;

            const cat = Array.isArray(CATEGORIES)
              ? CATEGORIES.find((c) => c.id === goal.categoryId)
              : (CATEGORIES as any)[goal.categoryId];

            return (
              <div key={goal.id} className="space-y-1.5 group">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-medium text-slate-700">
                    {cat?.icon} {cat?.label || goal.categoryId}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className={`font-semibold ${isOverBudget ? "text-red-500" : "text-slate-600"}`}>
                      {(spent || 0).toFixed(0)} / {(goal.monthlyLimit || 0).toFixed(0)} {preferredCurrency}
                    </span>
                    <button
                      type="button"
                      onClick={() => onDeleteGoal(goal.id)}
                      className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-[11px]"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 rounded-full ${
                      isOverBudget ? "bg-red-500" : percentage > 85 ? "bg-amber-500" : "bg-indigo-500"
                    }`}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}