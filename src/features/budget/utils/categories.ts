import type { Category, CategoryId } from '../types';

export const CATEGORIES: Readonly<Record<CategoryId, Category>> = {
  food:          { id: 'food',          label: 'Food & Dining',    icon: '🍛', type: 'expense',  keywords: ['food','lunch','dinner','breakfast','restaurant','zomato','swiggy','grocery','groceries','cafe','coffee','snack','biryani'] },
  transport:     { id: 'transport',     label: 'Transport',        icon: '🚌', type: 'expense',  keywords: ['uber','ola','auto','bus','metro','fuel','petrol','diesel','cab','taxi','train','flight','rapido'] },
  housing:       { id: 'housing',       label: 'Housing',          icon: '🏠', type: 'expense',  keywords: ['housing','house','home','flat','rent','maintenance','society','electricity','water','gas','wifi','internet','broadband'] },
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
 * Cleans up syntax details, applies exact maps, and utilizes bi-directional substring checks.
 */
export function detectCategory(description: string): CategoryId {
  if (!description || description.trim().length < 2) return 'other';

  const lower = description.toLowerCase().trim();
  const words = lower.split(/\s+/);

  // Pass 1: Strict Exact Word Matching (Stripping punctuation marks like trailing commas)
  for (const word of words) {
    const cleanWord = word.replace(/^[.,\/#!$%\^&\*;:{}=\-_`~()]+/g, "").replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]+$/g, "");
    const match = KEYWORD_INDEX.get(cleanWord);
    if (match) return match;
  }

  // Pass 2: Bi-directional Substring Fallback Match
  for (const [kw, catId] of KEYWORD_INDEX.entries()) {
    if (lower.includes(kw) || kw.includes(lower)) {
      return catId;
    }
  }

  return 'other';
}

export const getCategoryList = (type?: 'income' | 'expense') =>
  Object.values(CATEGORIES).filter(c =>
    !type || c.type === type || c.type === 'both'
  );