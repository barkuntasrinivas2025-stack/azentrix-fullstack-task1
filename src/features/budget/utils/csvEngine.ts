import { Transaction, CategoryId } from '../types';

/**
 * Converts the current ledger array into a standard RFC 4180 compliant CSV string.
 */
export function exportToCSV(transactions: Transaction[]): string {
  const headers = ['Date', 'Description', 'Type', 'Amount', 'Category', 'Currency'];
  const rows = transactions.map(tx => [
    tx.date,
    `"${tx.description.replace(/"/g, '""')}"`, // Escape quotes securely
    tx.type,
    tx.amount.toString(),
    tx.categoryId,
    tx.currencyCode
  ]);
  
  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}

/**
 * Parses raw CSV text safely back into structural transaction drafts.
 */
export function parseCSV(csvText: string): Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>[] {
  const lines = csvText.split(/\r?\n/).filter(line => line.trim() !== '');
  if (lines.length <= 1) return [];

  const parsedDrafts: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>[] = [];
  
  // Skip headers line and process body rows
  for (let i = 1; i < lines.length; i++) {
    // Basic comma splitter (handles encapsulated text minimally)
    const columns = lines[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
    if (columns.length < 5) continue;

    const date = columns[0].trim();
    const description = columns[1].replace(/^"| Font"$/g, '').replace(/""/g, '"').trim();
    const type = columns[2].trim() === 'income' ? 'income' : 'expense';
    const amount = parseFloat(columns[3]) || 0;
    const categoryId = columns[4].trim() as CategoryId;
    const currencyCode = columns[5]?.trim() || 'INR';

    if (description && amount > 0) {
      parsedDrafts.push({
        date,
        description,
        type,
        amount,
        categoryId,
        currencyCode,
        isRecurring: false
      });
    }
  }

  return parsedDrafts;
}