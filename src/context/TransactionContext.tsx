import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Transaction, TransactionSummary, TransactionType } from '@/types';
import { useAuth } from './AuthContext';
import {
  getUserTransactions,
  getUserSummary,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getTransactionById,
} from '@/database/db';

interface TransactionFilters {
  search?: string;
  type?: 'all' | 'income' | 'expense';
  category?: string;
}

interface TransactionContextType {
  transactions: Transaction[];
  allTransactions: Transaction[];
  summary: TransactionSummary;
  isLoading: boolean;
  filters: TransactionFilters;
  setFilters: React.Dispatch<React.SetStateAction<TransactionFilters>>;
  refresh: () => Promise<void>;
  addTransaction: (data: {
    type: TransactionType;
    amount: number;
    category: string;
    date: string;
    note?: string;
  }) => Promise<Transaction>;
  editTransaction: (
    id: string,
    data: {
      type: TransactionType;
      amount: number;
      category: string;
      date: string;
      note?: string;
    }
  ) => Promise<Transaction>;
  removeTransaction: (id: string) => Promise<boolean>;
  getTransaction: (id: string) => Promise<Transaction | null>;
}

const defaultSummary: TransactionSummary = {
  totalIncome: 0,
  totalExpenses: 0,
  balance: 0,
  transactionCount: 0,
};

const TransactionContext = createContext<TransactionContextType | undefined>(undefined);

export function TransactionProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<TransactionSummary>(defaultSummary);
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState<TransactionFilters>({
    search: '',
    type: 'all',
    category: 'all',
  });

  const loadData = useCallback(async () => {
    if (!user) {
      setTransactions([]);
      setAllTransactions([]);
      setSummary(defaultSummary);
      return;
    }

    setIsLoading(true);
    try {
      const [filteredTx, allTx, sum] = await Promise.all([
        getUserTransactions(user.id, filters.search, filters.type, filters.category),
        getUserTransactions(user.id),
        getUserSummary(user.id),
      ]);
      setTransactions(filteredTx);
      setAllTransactions(allTx);
      setSummary(sum);
    } catch (error) {
      console.error('Failed to load transaction data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user, filters]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const add = async (data: {
    type: TransactionType;
    amount: number;
    category: string;
    date: string;
    note?: string;
  }): Promise<Transaction> => {
    if (!user) throw new Error('User not authenticated');
    if (data.amount <= 0 || isNaN(data.amount)) {
      throw new Error('Amount must be greater than zero.');
    }
    if (!data.category.trim()) {
      throw new Error('Category is required.');
    }
    if (!data.date) {
      throw new Error('Transaction date is required.');
    }

    const created = await createTransaction({
      userId: user.id,
      ...data,
    });

    // Refresh immediately to update both list and summary
    await loadData();
    return created;
  };

  const edit = async (
    id: string,
    data: {
      type: TransactionType;
      amount: number;
      category: string;
      date: string;
      note?: string;
    }
  ): Promise<Transaction> => {
    if (!user) throw new Error('User not authenticated');
    if (data.amount <= 0 || isNaN(data.amount)) {
      throw new Error('Amount must be greater than zero.');
    }
    if (!data.category.trim()) {
      throw new Error('Category is required.');
    }
    if (!data.date) {
      throw new Error('Transaction date is required.');
    }

    const updated = await updateTransaction(id, user.id, data);
    await loadData();
    return updated;
  };

  const remove = async (id: string): Promise<boolean> => {
    if (!user) throw new Error('User not authenticated');
    const success = await deleteTransaction(id, user.id);
    if (success) {
      await loadData();
    }
    return success;
  };

  const getTransaction = async (id: string): Promise<Transaction | null> => {
    if (!user) return null;
    return getTransactionById(id, user.id);
  };

  return (
    <TransactionContext.Provider
      value={{
        transactions,
        allTransactions,
        summary,
        isLoading,
        filters,
        setFilters,
        refresh: loadData,
        addTransaction: add,
        editTransaction: edit,
        removeTransaction: remove,
        getTransaction,
      }}>
      {children}
    </TransactionContext.Provider>
  );
}

export function useTransactions(): TransactionContextType {
  const context = useContext(TransactionContext);
  if (!context) {
    throw new Error('useTransactions must be used within a TransactionProvider');
  }
  return context;
}
