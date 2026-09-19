import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import {
  Account,
  Category,
  Transaction,
  Budget,
  BudgetCategory,
  SavingsGoal,
  Debt,
  RecurringTransaction,
  NotificationItem,
  UserSettings,
  Profile,
} from '@/types/finance';
import {
  INITIAL_CATEGORIES,
  INITIAL_ACCOUNTS,
  INITIAL_BUDGET,
  INITIAL_BUDGET_CATEGORIES,
  INITIAL_SETTINGS,
} from '@/lib/storage/initial-data';

export interface UserRecord {
  id: string;
  email: string;
  password_hash: string;
  salt: string;
  full_name: string;
  currency: string;
  created_at: string;
  updated_at: string;
}

export interface SessionRecord {
  id: string;
  token: string;
  user_id: string;
  created_at: string;
  expires_at: string;
}

export interface UserFinanceData {
  user_id: string;
  profile: Profile;
  accounts: Account[];
  categories: Category[];
  transactions: Transaction[];
  budgets: Budget[];
  budgetCategories: BudgetCategory[];
  savingsGoals: SavingsGoal[];
  debts: Debt[];
  recurringTransactions: RecurringTransaction[];
  notifications: NotificationItem[];
  settings: UserSettings;
  updated_at: string;
}

interface DatabaseSchema {
  version: number;
  users: UserRecord[];
  sessions: SessionRecord[];
  finance_data: Record<string, UserFinanceData>;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'keuangan.json');

// In-memory cache & write mutex
let dbCache: DatabaseSchema | null = null;
let writeQueue: Promise<void> = Promise.resolve();

function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function getDefaultDatabase(): DatabaseSchema {
  return {
    version: 1,
    users: [],
    sessions: [],
    finance_data: {},
  };
}

function loadDatabaseSync(): DatabaseSchema {
  if (dbCache) return dbCache;
  ensureDataDir();

  if (!fs.existsSync(DB_FILE)) {
    const initial = getDefaultDatabase();
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), 'utf8');
    } catch (err) {
      console.error('[DB] Gagal menulis file db inisial:', err);
    }
    dbCache = initial;
    return dbCache;
  }

  try {
    const raw = fs.readFileSync(DB_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    dbCache = {
      version: parsed.version || 1,
      users: Array.isArray(parsed.users) ? parsed.users : [],
      sessions: Array.isArray(parsed.sessions) ? parsed.sessions : [],
      finance_data: parsed.finance_data || {},
    };
    return dbCache;
  } catch (err) {
    console.error('[DB] Gagal membaca atau mem-parse file database, memulihkan ke default:', err);
    dbCache = getDefaultDatabase();
    return dbCache;
  }
}

async function persistDatabase(): Promise<void> {
  writeQueue = writeQueue.then(async () => {
    if (!dbCache) return;
    ensureDataDir();
    const tempFile = path.join(DATA_DIR, `keuangan.${Date.now()}.${crypto.randomBytes(4).toString('hex')}.tmp`);
    const jsonStr = JSON.stringify(dbCache, null, 2);

    try {
      await fs.promises.writeFile(tempFile, jsonStr, 'utf8');
      try {
        // Atomic replace
        await fs.promises.rename(tempFile, DB_FILE);
      } catch {
        // Fallback for Windows if target file is temporarily locked
        await fs.promises.copyFile(tempFile, DB_FILE);
        await fs.promises.unlink(tempFile).catch(() => {});
      }
    } catch (err) {
      console.error('[DB] Gagal menyimpan basis data ke disk:', err);
      if (fs.existsSync(tempFile)) {
        await fs.promises.unlink(tempFile).catch(() => {});
      }
    }
  });

  return writeQueue;
}

// ----------------- User Queries -----------------

export async function getUserByEmail(email: string): Promise<UserRecord | null> {
  const db = loadDatabaseSync();
  const normalized = email.trim().toLowerCase();
  const user = db.users.find((u) => u.email.toLowerCase() === normalized);
  return user || null;
}

export async function getUserById(id: string): Promise<UserRecord | null> {
  const db = loadDatabaseSync();
  const user = db.users.find((u) => u.id === id);
  return user || null;
}

export async function createUser(data: {
  email: string;
  password_hash: string;
  salt: string;
  full_name: string;
  currency?: string;
}): Promise<UserRecord> {
  const db = loadDatabaseSync();
  const now = new Date().toISOString();
  const newUser: UserRecord = {
    id: crypto.randomUUID(),
    email: data.email.trim().toLowerCase(),
    password_hash: data.password_hash,
    salt: data.salt,
    full_name: data.full_name.trim(),
    currency: data.currency || 'IDR',
    created_at: now,
    updated_at: now,
  };

  db.users.push(newUser);
  await persistDatabase();
  return newUser;
}

// ----------------- Session Queries -----------------

export async function createSession(userId: string): Promise<SessionRecord> {
  const db = loadDatabaseSync();
  const now = new Date();
  const expires = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

  const session: SessionRecord = {
    id: crypto.randomUUID(),
    token: crypto.randomBytes(32).toString('hex'),
    user_id: userId,
    created_at: now.toISOString(),
    expires_at: expires.toISOString(),
  };

  // Bersihkan sesi usang milik user yang sama
  db.sessions = db.sessions.filter((s) => s.user_id !== userId || new Date(s.expires_at) > now);
  db.sessions.push(session);

  await persistDatabase();
  return session;
}

export async function getSession(token: string): Promise<(SessionRecord & { user: UserRecord }) | null> {
  if (!token) return null;
  const db = loadDatabaseSync();
  const now = new Date();

  const session = db.sessions.find((s) => s.token === token && new Date(s.expires_at) > now);
  if (!session) return null;

  const user = db.users.find((u) => u.id === session.user_id);
  if (!user) return null;

  return { ...session, user };
}

export async function deleteSession(token: string): Promise<void> {
  const db = loadDatabaseSync();
  db.sessions = db.sessions.filter((s) => s.token !== token);
  await persistDatabase();
}

// ----------------- Finance Data Queries -----------------

export function createDefaultUserFinance(userId: string, fullName: string, email: string): UserFinanceData {
  const now = new Date().toISOString();

  // Buat kategori bawaan yang terikat dengan user_id ini
  const userCategories: Category[] = INITIAL_CATEGORIES.map((cat, idx) => ({
    ...cat,
    id: `cat-${userId.slice(0, 8)}-${idx + 1}`,
    user_id: userId,
    created_at: now,
  }));

  // Buat akun bawaan yang terikat dengan user_id ini
  const userAccounts: Account[] = INITIAL_ACCOUNTS.map((acc, idx) => ({
    ...acc,
    id: `acc-${userId.slice(0, 8)}-${idx + 1}`,
    user_id: userId,
    balance: 0,
    initial_balance: 0,
    created_at: now,
    updated_at: now,
  }));

  const userProfile: Profile = {
    id: userId,
    email: email,
    full_name: fullName,
    avatar_url: '',
    currency: 'IDR',
    locale: 'id-ID',
    theme: 'system',
    created_at: now,
    updated_at: now,
  };

  return {
    user_id: userId,
    profile: userProfile,
    accounts: userAccounts,
    categories: userCategories,
    transactions: [],
    budgets: [{ ...INITIAL_BUDGET, id: `bgt-${userId.slice(0, 8)}-1`, user_id: userId }],
    budgetCategories: INITIAL_BUDGET_CATEGORIES.map((bc, idx) => ({
      ...bc,
      id: `bc-${userId.slice(0, 8)}-${idx + 1}`,
      budget_id: `bgt-${userId.slice(0, 8)}-1`,
    })),
    savingsGoals: [],
    debts: [],
    recurringTransactions: [],
    notifications: [
      {
        id: `notif-${userId.slice(0, 8)}-1`,
        user_id: userId,
        title: 'Selamat Datang di Keuangan!',
        message: `Halo ${fullName}, akun Anda telah berhasil didaftarkan dan siap digunakan. Catat transaksi pertama Anda sekarang.`,
        type: 'system',
        is_read: false,
        created_at: now,
      },
    ],
    settings: { ...INITIAL_SETTINGS, user_id: userId },
    updated_at: now,
  };
}

export async function getUserFinanceData(userId: string): Promise<UserFinanceData> {
  const db = loadDatabaseSync();
  let data = db.finance_data[userId];

  if (!data) {
    const user = await getUserById(userId);
    data = createDefaultUserFinance(userId, user?.full_name || 'Pengguna', user?.email || '');
    db.finance_data[userId] = data;
    await persistDatabase();
  }

  return data;
}

export async function saveUserFinanceData(
  userId: string,
  updates: Partial<Omit<UserFinanceData, 'user_id'>>
): Promise<UserFinanceData> {
  const db = loadDatabaseSync();
  let existing = db.finance_data[userId];

  if (!existing) {
    const user = await getUserById(userId);
    existing = createDefaultUserFinance(userId, user?.full_name || 'Pengguna', user?.email || '');
  }

  const updated: UserFinanceData = {
    ...existing,
    ...updates,
    user_id: userId,
    updated_at: new Date().toISOString(),
  };

  db.finance_data[userId] = updated;
  await persistDatabase();
  return updated;
}
