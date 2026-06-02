import type { Category, CategoryId } from '../types';

export const CATEGORIES: Readonly<Record<CategoryId, Category>> = {
  food:          { id: 'food',          label: 'Food & Dining',    icon: '🍛', type: 'expense',  keywords: ['food','lunch','dinner','breakfast','restaurant','zomato','swiggy','grocery','groceries','cafe','coffee','snack','biryani'] },
  transport:     { id: 'transport',     label: 'Transport',        icon: '🚌', type: 'expense',  keywords: ['uber','ola','auto','bus','metro','fuel','petrol','diesel','cab','taxi','train','flight','rapido'] },
  housing:       { id: 'housing',       label: 'Housing',          icon: '🏠', type: 'expense',  keywords: ['rent','maintenance','society','electricity','water','gas','wifi','internet','broadband'] },
  utilities:     { id: 'utilities',     label: 'Utilities',        icon: '💡', type: 'expense',  keywords: ['phone','mobile','recharge','sim','bill','subscription','netflix','spotify','amazon','prime','hotstar'] },
  health:        { id: 'health',        label: 'Health',           icon: '🏥', type: 'expense',  keywords: ['doctor','medicine','pharmacy','hospital','gym','fitness','yoga','medical','health','chemist','apollo'] },
  entertainment: { id: 'entertainment', label: 'Entertainment',    icon: '🎮', type: 'expense',  keywords: ['movie','cinema','pvr','inox','game','steam','fun','outing','party','concert','bowling'] },
  shopping:      { id: 'shopping',      label: 'Shopping',         icon: '🛍️', type: 'expense',  keywords: ['amazon','flipkart','myntra','ajio','clothes','shoes','shopping','mall','order','purchase'] },
  education:     { id: 'education',     label: 'Education',        icon: '📚', type: 'both',     keywords: ['course','udemy','coursera','book','study','tuition','college','exam','certification'] },
  salary:        { id: 'salary',        label: 'Salary',           icon: '💼', type: 'income',   keywords: ['salary','stipend','payroll','pay','wages','ctc','incentive'] },
  freelance:     { id: 'freelance',     label: 'Freelance',        icon: '💻', type: 'income',   keywords: ['freelance','client','project','consulting','gig','upwork','fiverr','contract'] },
  investment:    { id: 'investment',    label: 'Investment',       icon: '📈', type: 'both',     keywords: ['mutual fund','sip','stocks','zerodha','groww','returns','dividend','interest','fd','rd','crypto'] },
  gift:          { id: 'gift',          label: 'Gift / Transfer',  icon: '🎁', type: 'both',     keywords: ['gift','transfer','gpay','phonepe','paytm','upi','birthday','wedding','donation'] },
  other:         { id: 'other',         label: 'Other',            icon: '📦', type: 'both',     keywords: [] },
} as const;

// O(1) keyword → categoryId reverse index, built once at module load
const KEYWORD_INDEX = new Map<string, CategoryId>();
for (const [catId, cat] of Object.entries(CATEGORIES)) {
  for (const kw of cat.keywords) {
    KEYWORD_INDEX.set(kw, catId as CategoryId);
  }
}

/**
 * Auto-detect category from description text.
 * O(k) where k = number of words in description (typically < 10).
 * Falls back to 'other'.
 */
export function detectCategory(description: string): CategoryId {
  const words = description.toLowerCase().split(/\s+/);
  for (const word of words) {
    const match = KEYWORD_INDEX.get(word);
    if (match) return match;
  }
  // try substring match for compound words (e.g. "phonepe" contains "phone")
  const lower = description.toLowerCase();
  for (const [kw, catId] of KEYWORD_INDEX) {
    if (lower.includes(kw)) return catId;
  }
  return 'other';
}

export const getCategoryList = (type?: 'income' | 'expense') =>
  Object.values(CATEGORIES).filter(c =>
    !type || c.type === type || c.type === 'both'
  );