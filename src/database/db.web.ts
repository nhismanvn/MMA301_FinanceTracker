import AsyncStorage from '@react-native-async-storage/async-storage';
import { Transaction, TransactionSummary, User, TransactionType } from '@/types';

const STORAGE_KEY_USERS = '@ft_users_store';
const STORAGE_KEY_TRANSACTIONS = '@ft_transactions_store';

// Default seeded users for quick testing & grading
const INITIAL_USERS = [
  { id: 'u_user1', username: 'user1', password: 'password123', fullName: 'An' },
  { id: 'u_user2', username: 'user2', password: 'password123', fullName: 'An2' },
  { id: 'u_admin', username: 'admin', password: 'admin123', fullName: 'Administrator' },
];

const INITIAL_TRANSACTIONS: Transaction[] = [
  // User 1 transactions
  {
    id: 'tx_seed_1',
    userId: 'u_user1',
    type: 'income',
    amount: 3500,
    category: 'Salary',
    date: '2026-10-25',
    note: 'Monthly salary deposit',
    createdAt: Date.now() - 86400000 * 2,
  },
  {
    id: 'tx_seed_2',
    userId: 'u_user1',
    type: 'expense',
    amount: 85.5,
    category: 'Food & Dining',
    date: '2026-10-26',
    note: 'Dinner with team',
    createdAt: Date.now() - 86400000,
  },
  {
    id: 'tx_seed_3',
    userId: 'u_user1',
    type: 'expense',
    amount: 25,
    category: 'Transport',
    date: '2026-10-27',
    note: 'Subway pass reload',
    createdAt: Date.now(),
  },
  // User 2 transactions (Isolated data)
  {
    id: 'tx_seed_4',
    userId: 'u_user2',
    type: 'income',
    amount: 1200,
    category: 'Freelance',
    date: '2026-10-24',
    note: 'UI design project payment',
    createdAt: Date.now() - 86400000 * 3,
  },
  {
    id: 'tx_seed_5',
    userId: 'u_user2',
    type: 'expense',
    amount: 140,
    category: 'Shopping',
    date: '2026-10-26',
    note: 'Weekly groceries',
    createdAt: Date.now() - 86400000,
  },
];

async function webGetUsers(): Promise<any[]> {
  const data = await AsyncStorage.getItem(STORAGE_KEY_USERS);
  if (!data) {
    await AsyncStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(INITIAL_USERS));
    return INITIAL_USERS;
  }
  return JSON.parse(data);
}

async function webSaveUsers(users: any[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
}

async function webGetTransactions(): Promise<Transaction[]> {
  const data = await AsyncStorage.getItem(STORAGE_KEY_TRANSACTIONS);
  if (!data) {
    await AsyncStorage.setItem(STORAGE_KEY_TRANSACTIONS, JSON.stringify(INITIAL_TRANSACTIONS));
    return INITIAL_TRANSACTIONS;
  }
  return JSON.parse(data);
}

async function webSaveTransactions(transactions: Transaction[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY_TRANSACTIONS, JSON.stringify(transactions));
}

export async function initDatabase(): Promise<void> {
  await webGetUsers();
  await webGetTransactions();
}

export async function authenticateUser(username: string, password: string): Promise<User | null> {
  const cleanUsername = username.trim().toLowerCase();
  const users = await webGetUsers();
  const found = users.find(
    (u) => u.username.toLowerCase() === cleanUsername && u.password === password
  );
  if (!found) return null;
  return { id: found.id, username: found.username, fullName: found.fullName };
}

export async function registerUser(username: string, password: string, fullName: string): Promise<User> {
  const cleanUsername = username.trim().toLowerCase();
  const id = 'u_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
  const users = await webGetUsers();
  if (users.some((u) => u.username.toLowerCase() === cleanUsername)) {
    throw new Error('Username already exists. Please choose a different username.');
  }
  const newUser = { id, username: cleanUsername, password, fullName: fullName.trim() };
  users.push(newUser);
  await webSaveUsers(users);
  return { id: newUser.id, username: newUser.username, fullName: newUser.fullName };
}

export async function getUserTransactions(
  userId: string,
  search?: string,
  typeFilter?: 'all' | 'income' | 'expense',
  categoryFilter?: string
): Promise<Transaction[]> {
  let list = await webGetTransactions();
  list = list.filter((t) => t.userId === userId);

  if (typeFilter && typeFilter !== 'all') {
    list = list.filter((t) => t.type === typeFilter);
  }
  if (categoryFilter && categoryFilter !== 'all') {
    list = list.filter((t) => t.category.toLowerCase() === categoryFilter.toLowerCase());
  }
  if (search && search.trim() !== '') {
    const q = search.trim().toLowerCase();
    list = list.filter(
      (t) =>
        t.category.toLowerCase().includes(q) || (t.note && t.note.toLowerCase().includes(q))
    );
  }
  return list.sort((a, b) => {
    const dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime();
    if (dateDiff !== 0) return dateDiff;
    return b.createdAt - a.createdAt;
  });
}

export async function getTransactionById(id: string, userId: string): Promise<Transaction | null> {
  const list = await webGetTransactions();
  const item = list.find((t) => t.id === id && t.userId === userId);
  return item || null;
}

export async function createTransaction(data: {
  userId: string;
  type: TransactionType;
  amount: number;
  category: string;
  date: string;
  note?: string;
}): Promise<Transaction> {
  const id = 'tx_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
  const createdAt = Date.now();
  const newTx: Transaction = {
    id,
    userId: data.userId,
    type: data.type,
    amount: Number(data.amount),
    category: data.category.trim(),
    date: data.date,
    note: data.note ? data.note.trim() : '',
    createdAt,
  };

  const list = await webGetTransactions();
  list.unshift(newTx);
  await webSaveTransactions(list);
  return newTx;
}

export async function updateTransaction(
  id: string,
  userId: string,
  data: {
    type: TransactionType;
    amount: number;
    category: string;
    date: string;
    note?: string;
  }
): Promise<Transaction> {
  const list = await webGetTransactions();
  const idx = list.findIndex((t) => t.id === id && t.userId === userId);
  if (idx === -1) throw new Error('Transaction not found or unauthorized');

  const updated: Transaction = {
    ...list[idx],
    type: data.type,
    amount: Number(data.amount),
    category: data.category.trim(),
    date: data.date,
    note: data.note ? data.note.trim() : '',
  };
  list[idx] = updated;
  await webSaveTransactions(list);
  return updated;
}

export async function deleteTransaction(id: string, userId: string): Promise<boolean> {
  const list = await webGetTransactions();
  const initialLen = list.length;
  const filtered = list.filter((t) => !(t.id === id && t.userId === userId));
  if (filtered.length === initialLen) return false;
  await webSaveTransactions(filtered);
  return true;
}

export async function getUserSummary(userId: string): Promise<TransactionSummary> {
  const list = await webGetTransactions();
  const userList = list.filter((t) => t.userId === userId);
  let totalIncome = 0;
  let totalExpenses = 0;

  for (const t of userList) {
    if (t.type === 'income') {
      totalIncome += Number(t.amount);
    } else {
      totalExpenses += Number(t.amount);
    }
  }

  return {
    totalIncome,
    totalExpenses,
    balance: totalIncome - totalExpenses,
    transactionCount: userList.length,
  };
}
