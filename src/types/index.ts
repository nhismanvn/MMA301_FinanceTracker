export type TransactionType = 'income' | 'expense';

export interface User {
  id: string;
  username: string;
  fullName: string;
}

export interface Transaction {
  id: string;
  userId: string;
  type: TransactionType;
  amount: number;
  category: string;
  date: string; // YYYY-MM-DD
  note?: string;
  createdAt: number;
}

export interface TransactionSummary {
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  transactionCount: number;
}

export interface CategoryDef {
  id: string;
  name: string;
  type: TransactionType;
  icon: string;
  color: string;
}

export const CATEGORIES: CategoryDef[] = [
  // Income
  { id: 'salary', name: 'Salary', type: 'income', icon: 'cash-outline', color: '#10B981' },
  { id: 'freelance', name: 'Freelance', type: 'income', icon: 'briefcase-outline', color: '#3B82F6' },
  { id: 'investment', name: 'Investment', type: 'income', icon: 'trending-up-outline', color: '#8B5CF6' },
  { id: 'bonus', name: 'Bonus & Gift', type: 'income', icon: 'gift-outline', color: '#F59E0B' },
  { id: 'other_income', name: 'Other Income', type: 'income', icon: 'wallet-outline', color: '#06B6D4' },
  // Expense
  { id: 'food', name: 'Food & Dining', type: 'expense', icon: 'restaurant-outline', color: '#EF4444' },
  { id: 'transport', name: 'Transport', type: 'expense', icon: 'car-outline', color: '#F97316' },
  { id: 'shopping', name: 'Shopping', type: 'expense', icon: 'cart-outline', color: '#EC4899' },
  { id: 'bills', name: 'Bills & Utilities', type: 'expense', icon: 'receipt-outline', color: '#6366F1' },
  { id: 'entertainment', name: 'Entertainment', type: 'expense', icon: 'film-outline', color: '#A855F7' },
  { id: 'health', name: 'Health & Medical', type: 'expense', icon: 'medkit-outline', color: '#14B8A6' },
  { id: 'education', name: 'Education', type: 'expense', icon: 'school-outline', color: '#0284C7' },
  { id: 'other_expense', name: 'Other Expense', type: 'expense', icon: 'ellipsis-horizontal-circle-outline', color: '#64748B' },
];
