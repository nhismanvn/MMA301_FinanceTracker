import * as SQLite from 'expo-sqlite';
import { Transaction, TransactionSummary, User, TransactionType } from '@/types';

let dbInstance: SQLite.SQLiteDatabase | null = null;

// Default seeded users for quick testing & grading
const INITIAL_USERS = [
  { id: 'u_user1', username: 'user1', password: 'password123', fullName: 'Alex Johnson' },
  { id: 'u_user2', username: 'user2', password: 'password123', fullName: 'Sarah Miller' },
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

async function getDB(): Promise<SQLite.SQLiteDatabase> {
  if (!dbInstance) {
    dbInstance = await SQLite.openDatabaseAsync('finance_tracker.db');
  }
  return dbInstance;
}

export async function initDatabase(): Promise<void> {
  try {
    const db = await getDB();

    await db.execAsync(`
      PRAGMA journal_mode = WAL;
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY NOT NULL,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        fullName TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY NOT NULL,
        userId TEXT NOT NULL,
        type TEXT NOT NULL,
        amount REAL NOT NULL,
        category TEXT NOT NULL,
        date TEXT NOT NULL,
        note TEXT,
        createdAt INTEGER NOT NULL
      );
    `);

    // Check if initial users exist, if not seed them
    const existingUsers = await db.getAllAsync<{ id: string }>('SELECT id FROM users LIMIT 1');
    if (existingUsers.length === 0) {
      for (const u of INITIAL_USERS) {
        await db.runAsync(
          'INSERT INTO users (id, username, password, fullName) VALUES (?, ?, ?, ?)',
          [u.id, u.username, u.password, u.fullName]
        );
      }
    }

    // Check if initial transactions exist, if not seed them
    const existingTx = await db.getAllAsync<{ id: string }>('SELECT id FROM transactions LIMIT 1');
    if (existingTx.length === 0) {
      for (const tx of INITIAL_TRANSACTIONS) {
        await db.runAsync(
          'INSERT INTO transactions (id, userId, type, amount, category, date, note, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [tx.id, tx.userId, tx.type, tx.amount, tx.category, tx.date, tx.note || '', tx.createdAt]
        );
      }
    }
  } catch (error) {
    console.error('Failed to initialize SQLite database:', error);
  }
}

export async function authenticateUser(username: string, password: string): Promise<User | null> {
  const cleanUsername = username.trim().toLowerCase();
  try {
    const db = await getDB();
    const row = await db.getFirstAsync<{ id: string; username: string; fullName: string }>(
      'SELECT id, username, fullName FROM users WHERE LOWER(username) = ? AND password = ?',
      [cleanUsername, password]
    );

    if (!row) return null;
    return { id: row.id, username: row.username, fullName: row.fullName };
  } catch (error) {
    console.error('authenticateUser error:', error);
    return null;
  }
}

export async function registerUser(username: string, password: string, fullName: string): Promise<User> {
  const cleanUsername = username.trim().toLowerCase();
  const id = 'u_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
  const db = await getDB();

  const existing = await db.getFirstAsync<{ id: string }>(
    'SELECT id FROM users WHERE LOWER(username) = ?',
    [cleanUsername]
  );
  if (existing) {
    throw new Error('Username already exists. Please choose a different username.');
  }

  await db.runAsync(
    'INSERT INTO users (id, username, password, fullName) VALUES (?, ?, ?, ?)',
    [id, cleanUsername, password, fullName.trim()]
  );

  return { id, username: cleanUsername, fullName: fullName.trim() };
}

export async function getUserTransactions(
  userId: string,
  search?: string,
  typeFilter?: 'all' | 'income' | 'expense',
  categoryFilter?: string
): Promise<Transaction[]> {
  const db = await getDB();

  let query = 'SELECT * FROM transactions WHERE userId = ?';
  const params: any[] = [userId];

  if (typeFilter && typeFilter !== 'all') {
    query += ' AND type = ?';
    params.push(typeFilter);
  }

  if (categoryFilter && categoryFilter !== 'all') {
    query += ' AND LOWER(category) = LOWER(?)';
    params.push(categoryFilter);
  }

  if (search && search.trim() !== '') {
    query += ' AND (LOWER(category) LIKE ? OR LOWER(note) LIKE ?)';
    const wildcard = `%${search.trim().toLowerCase()}%`;
    params.push(wildcard, wildcard);
  }

  query += ' ORDER BY date DESC, createdAt DESC';

  const rows = await db.getAllAsync<Transaction>(query, params);
  return rows.map((r) => ({
    ...r,
    amount: Number(r.amount),
  }));
}

export async function getTransactionById(id: string, userId: string): Promise<Transaction | null> {
  const db = await getDB();
  const row = await db.getFirstAsync<Transaction>(
    'SELECT * FROM transactions WHERE id = ? AND userId = ?',
    [id, userId]
  );
  if (!row) return null;
  return {
    ...row,
    amount: Number(row.amount),
  };
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

  const db = await getDB();
  await db.runAsync(
    'INSERT INTO transactions (id, userId, type, amount, category, date, note, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [newTx.id, newTx.userId, newTx.type, newTx.amount, newTx.category, newTx.date, newTx.note || '', newTx.createdAt]
  );

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
  const db = await getDB();
  const result = await db.runAsync(
    'UPDATE transactions SET type = ?, amount = ?, category = ?, date = ?, note = ? WHERE id = ? AND userId = ?',
    [data.type, Number(data.amount), data.category.trim(), data.date, data.note ? data.note.trim() : '', id, userId]
  );

  if (result.changes === 0) {
    throw new Error('Transaction not found or unauthorized');
  }

  return {
    id,
    userId,
    type: data.type,
    amount: Number(data.amount),
    category: data.category.trim(),
    date: data.date,
    note: data.note ? data.note.trim() : '',
    createdAt: Date.now(),
  };
}

export async function deleteTransaction(id: string, userId: string): Promise<boolean> {
  const db = await getDB();
  const result = await db.runAsync(
    'DELETE FROM transactions WHERE id = ? AND userId = ?',
    [id, userId]
  );
  return result.changes > 0;
}

export async function getUserSummary(userId: string): Promise<TransactionSummary> {
  const db = await getDB();
  const rows = await db.getAllAsync<{ type: string; total: number; count: number }>(
    'SELECT type, SUM(amount) as total, COUNT(*) as count FROM transactions WHERE userId = ? GROUP BY type',
    [userId]
  );

  let totalIncome = 0;
  let totalExpenses = 0;
  let transactionCount = 0;

  for (const r of rows) {
    const amt = Number(r.total) || 0;
    const cnt = Number(r.count) || 0;
    transactionCount += cnt;
    if (r.type === 'income') {
      totalIncome = amt;
    } else if (r.type === 'expense') {
      totalExpenses = amt;
    }
  }

  return {
    totalIncome,
    totalExpenses,
    balance: totalIncome - totalExpenses,
    transactionCount,
  };
}
