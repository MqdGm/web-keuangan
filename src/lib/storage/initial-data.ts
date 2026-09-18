import { Account, Category, Transaction, Budget, BudgetCategory, SavingsGoal, Debt, RecurringTransaction, NotificationItem, UserSettings, Profile } from '@/types/finance';
import { format, startOfMonth } from 'date-fns';

const today = new Date();
const currentMonthStr = format(startOfMonth(today), 'yyyy-MM-dd');

export const INITIAL_PROFILE: Profile = {
  id: 'user-primary-id',
  email: 'miqdad@example.com',
  full_name: 'Miqdad',
  avatar_url: '',
  currency: 'IDR',
  locale: 'id-ID',
  theme: 'system',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export const INITIAL_CATEGORIES: Category[] = [
  // Expense
  { id: 'cat-food', user_id: 'user-primary-id', name: 'Makanan & Minuman', type: 'expense', color: '#EF4444', icon: 'Utensils', is_default: true, created_at: new Date().toISOString() },
  { id: 'cat-trans', user_id: 'user-primary-id', name: 'Transportasi', type: 'expense', color: '#F97316', icon: 'Car', is_default: true, created_at: new Date().toISOString() },
  { id: 'cat-shop', user_id: 'user-primary-id', name: 'Belanja', type: 'expense', color: '#EC4899', icon: 'ShoppingBag', is_default: true, created_at: new Date().toISOString() },
  { id: 'cat-bills', user_id: 'user-primary-id', name: 'Tagihan & Utilitas', type: 'expense', color: '#F59E0B', icon: 'Receipt', is_default: true, created_at: new Date().toISOString() },
  { id: 'cat-entertain', user_id: 'user-primary-id', name: 'Hiburan', type: 'expense', color: '#8B5CF6', icon: 'Film', is_default: true, created_at: new Date().toISOString() },
  { id: 'cat-health', user_id: 'user-primary-id', name: 'Kesehatan', type: 'expense', color: '#10B981', icon: 'HeartPulse', is_default: true, created_at: new Date().toISOString() },
  { id: 'cat-edu', user_id: 'user-primary-id', name: 'Pendidikan', type: 'expense', color: '#06B6D4', icon: 'GraduationCap', is_default: true, created_at: new Date().toISOString() },
  { id: 'cat-family', user_id: 'user-primary-id', name: 'Keluarga', type: 'expense', color: '#3B82F6', icon: 'Users', is_default: true, created_at: new Date().toISOString() },
  { id: 'cat-sub', user_id: 'user-primary-id', name: 'Langganan', type: 'expense', color: '#6366F1', icon: 'Sparkles', is_default: true, created_at: new Date().toISOString() },
  { id: 'cat-other-exp', user_id: 'user-primary-id', name: 'Lainnya', type: 'expense', color: '#6B7280', icon: 'CircleEllipsis', is_default: true, created_at: new Date().toISOString() },

  // Income
  { id: 'cat-salary', user_id: 'user-primary-id', name: 'Gaji Bulanan', type: 'income', color: '#10B981', icon: 'Banknote', is_default: true, created_at: new Date().toISOString() },
  { id: 'cat-freelance', user_id: 'user-primary-id', name: 'Freelance & Side Project', type: 'income', color: '#3B82F6', icon: 'Laptop', is_default: true, created_at: new Date().toISOString() },
  { id: 'cat-biz', user_id: 'user-primary-id', name: 'Bisnis & Usaha', type: 'income', color: '#8B5CF6', icon: 'Store', is_default: true, created_at: new Date().toISOString() },
  { id: 'cat-invest', user_id: 'user-primary-id', name: 'Investasi & Dividen', type: 'income', color: '#F59E0B', icon: 'TrendingUp', is_default: true, created_at: new Date().toISOString() },
  { id: 'cat-bonus', user_id: 'user-primary-id', name: 'Bonus & Hadiah', type: 'income', color: '#EC4899', icon: 'Gift', is_default: true, created_at: new Date().toISOString() },
  { id: 'cat-other-inc', user_id: 'user-primary-id', name: 'Pemasukan Lain', type: 'income', color: '#6B7280', icon: 'PlusCircle', is_default: true, created_at: new Date().toISOString() },
];

export const INITIAL_ACCOUNTS: Account[] = [
  {
    id: 'acc-bca',
    user_id: 'user-primary-id',
    name: 'BCA Utama',
    type: 'bank',
    balance: 0,
    initial_balance: 0,
    currency: 'IDR',
    color: '#00529C',
    icon: 'Building2',
    institution: 'Bank Central Asia',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'acc-mandiri',
    user_id: 'user-primary-id',
    name: 'Mandiri Tabungan',
    type: 'bank',
    balance: 0,
    initial_balance: 0,
    currency: 'IDR',
    color: '#0F4C81',
    icon: 'Building',
    institution: 'Bank Mandiri',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'acc-gopay',
    user_id: 'user-primary-id',
    name: 'GoPay',
    type: 'ewallet',
    balance: 0,
    initial_balance: 0,
    currency: 'IDR',
    color: '#00AED6',
    icon: 'Smartphone',
    institution: 'GoTo',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'acc-dana',
    user_id: 'user-primary-id',
    name: 'DANA',
    type: 'ewallet',
    balance: 0,
    initial_balance: 0,
    currency: 'IDR',
    color: '#118EEA',
    icon: 'Smartphone',
    institution: 'DANA Indonesia',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'acc-cash',
    user_id: 'user-primary-id',
    name: 'Dompet Tunai',
    type: 'cash',
    balance: 0,
    initial_balance: 0,
    currency: 'IDR',
    color: '#10B981',
    icon: 'Wallet',
    institution: 'Cash',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

// Clean slate: 0 transactions
export const INITIAL_TRANSACTIONS: Transaction[] = [];

export const INITIAL_BUDGET: Budget = {
  id: 'budget-curr-month',
  user_id: 'user-primary-id',
  month: currentMonthStr,
  total_limit: 0,
  notes: 'Pagu anggaran bulanan',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export const INITIAL_BUDGET_CATEGORIES: BudgetCategory[] = [];
export const INITIAL_SAVINGS_GOALS: SavingsGoal[] = [];
export const INITIAL_DEBTS: Debt[] = [];
export const INITIAL_RECURRING: RecurringTransaction[] = [];

export const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-welcome',
    user_id: 'user-primary-id',
    title: 'Selamat Datang di Keuangan! 👋',
    message: 'Aplikasi siap digunakan sehari-hari. Mulai dengan mencatat saldo awal rekening Anda atau buat transaksi pertama.',
    type: 'system',
    is_read: false,
    action_url: '/accounts',
    created_at: new Date().toISOString(),
  },
];

export const INITIAL_SETTINGS: UserSettings = {
  user_id: 'user-primary-id',
  google_connected: false,
  google_sheet_id: '',
  google_sheet_url: '',
  auto_backup_enabled: false,
  notify_budget_warning: true,
  notify_recurring_due: true,
  updated_at: new Date().toISOString(),
};
