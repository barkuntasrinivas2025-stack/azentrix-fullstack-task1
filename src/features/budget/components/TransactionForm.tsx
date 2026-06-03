import React, { useState, useEffect } from 'react';
import { CategoryId, Transaction } from '../types';
import { CATEGORIES, detectCategory, getCategoryList } from '../utils/categories';

interface TransactionFormProps {
  onSubmit: (formData: {
    description: string;
    amount: number;
    type: 'income' | 'expense';
    categoryId: CategoryId;
    date: string;
    currencyCode: string;
    isRecurring: boolean;
  }) => void;
  preferredCurrency: string;
  defaultValues?: Transaction;
}

export function TransactionForm({
  onSubmit,
  preferredCurrency,
  defaultValues,
}: TransactionFormProps) {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [categoryId, setCategoryId] = useState<CategoryId>('other');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  // Sync state if form switches into edit mode or resets
  useEffect(() => {
    if (defaultValues) {
      setDescription(defaultValues.description);
      setAmount(defaultValues.amount.toString());
      setType(defaultValues.type);
      setCategoryId(defaultValues.categoryId);
      setDate(defaultValues.date);
    } else {
      setDescription('');
      setAmount('');
      setType('expense');
      setCategoryId('other');
      setDate(new Date().toISOString().slice(0, 10));
    }
  }, [defaultValues]);

  // Run O(1) keyword detection on description modification
  const handleDescriptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setDescription(val);
    if (!defaultValues) {
      const detected = detectCategory(val);
      setCategoryId(detected);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (!description || isNaN(parsedAmount) || parsedAmount <= 0) return;

    onSubmit({
      description,
      amount: parsedAmount,
      type,
      categoryId,
      date,
      currencyCode: preferredCurrency,
      isRecurring: false,
    });

    if (!defaultValues) {
      setDescription('');
      setAmount('');
      setCategoryId('other');
    }
  };

  const categories = getCategoryList(type);

  return (
    <form onSubmit={handleSubmit} className="p-5 bg-white border border-slate-200 rounded-xl space-y-4 shadow-xs">
      <div>
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
          {defaultValues ? '📝 Edit Transaction' : '➕ Add Transaction'}
        </h3>
      </div>

      <div className="flex border border-slate-200 rounded-lg p-0.5 bg-slate-50">
        <button
          type="button"
          onClick={() => { setType('expense'); setCategoryId('other'); }}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
            type === 'expense' ? 'bg-white text-red-500 shadow-xs' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Expense
        </button>
        <button
          type="button"
          onClick={() => { setType('income'); setCategoryId('other'); }}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
            type === 'income' ? 'bg-white text-emerald-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Income
        </button>
      </div>

      <div className="space-y-3">
        <input
          type="text"
          placeholder="Description (e.g., Zomato dinner, Freelance project)"
          value={description}
          onChange={handleDescriptionChange}
          className="w-full text-xs border border-slate-200 rounded-lg p-2.5 focus:outline-indigo-500 bg-slate-50/50"
          required
        />

        <div className="grid grid-cols-2 gap-2">
          <div className="relative">
            <span className="absolute left-2.5 top-2.5 text-xs font-medium text-slate-400">
              {preferredCurrency}
            </span>
            <input
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full text-xs border border-slate-200 rounded-lg p-2.5 pl-10 focus:outline-indigo-500 bg-slate-50/50"
              min="0.01"
              step="any"
              required
            />
          </div>

          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full text-xs border border-slate-200 rounded-lg p-2.5 focus:outline-indigo-500 bg-slate-50/50"
            required
          />
        </div>

        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value as CategoryId)}
          className="w-full text-xs border border-slate-200 rounded-lg p-2.5 focus:outline-indigo-500 bg-slate-50/50"
          required
        >
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.icon} {cat.label}
            </option>
          ))}
        </select>
      </div>

      <button
        type="submit"
        className={`w-full text-xs font-semibold py-2.5 text-white rounded-lg transition-colors cursor-pointer ${
          defaultValues ? 'bg-amber-500 hover:bg-amber-600' : 'bg-indigo-600 hover:bg-indigo-700'
        }`}
      >
        {defaultValues ? 'Save Changes' : 'Record Entry'}
      </button>
    </form>
  );
}