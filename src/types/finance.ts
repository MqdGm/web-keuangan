import { z } from 'zod';

export type AccountType = 'bank' | 'ewallet' | 'cash' | 'credit_card' | 'savings' | 'investment' | 'other';
export type TransactionType = 'expense' | 'income' | 'transfer';
export type RecurringFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly';
export type DebtType = 'debt' | 'receivable';
export type GoalStatus = 'active' | 'completed' | 'paused';
export type NotificationType = 'budget_warning' | 'recurring_due' | 'goal_reached' | 'system';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  currency: string;
  locale: string;
  theme: 'light' | 'dark' | 'system';
  created_at: string;
  updated_at: string;
}

export interface Account {
  id: string;
  user_id: string;
  name: string;
  type: AccountType;
  balance: number;
  initial_balance: number;
  currency: string;
  color: string;
  icon: string;
  account_number?: string;
  institution?: string;
  notes?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  user_id: string;
  name: string;
  type: 'expense' | 'income';
  color: string;
  icon: string;
  is_default: boolean;
  created_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  account_id: string;
  to_account_id?: string; // For transfers
  category_id?: string;
  type: TransactionType;
  amount: number;
  date: string; // YYYY-MM-DD
  time?: string; // HH:MM
  description: string;
  notes?: string;
  tags?: string[];
  receipt_url?: string;
  recurring_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Budget {
  id: string;
  user_id: string;
  month: string; // '2026-09-01'
  total_limit?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  categories?: BudgetCategory[];
}

export interface BudgetCategory {
  id: string;
  budget_id: string;
  category_id: string;
  amount_limit: number;
  created_at: string;
}

export interface SavingsGoal {
  id: string;
  user_id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  target_date?: string; // YYYY-MM-DD
  color: string;
  icon: string;
  notes?: string;
  status: GoalStatus;
  created_at: string;
  updated_at: string;
}

export interface GoalContribution {
  id: string;
  goal_id: string;
  account_id?: string;
  amount: number;
  date: string;
  notes?: string;
  created_at: string;
}

export interface Debt {
  id: string;
  user_id: string;
  name: string;
  person_or_institution: string;
  type: DebtType; // 'debt' = kita berhutang, 'receivable' = orang berhutang ke kita
  total_amount: number;
  remaining_amount: number;
  interest_rate?: number;
  due_date?: string;
  minimum_payment?: number;
  notes?: string;
  status: 'active' | 'paid';
  created_at: string;
  updated_at: string;
}

export interface DebtPayment {
  id: string;
  debt_id: string;
  account_id?: string;
  amount: number;
  date: string;
  notes?: string;
  created_at: string;
}

export interface RecurringTransaction {
  id: string;
  user_id: string;
  account_id: string;
  category_id?: string;
  type: 'expense' | 'income';
  amount: number;
  description: string;
  frequency: RecurringFrequency;
  start_date: string;
  end_date?: string;
  next_occurrence: string;
  auto_create: boolean;
  is_active: boolean;
  created_at: string;
}

export interface NotificationItem {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: NotificationType;
  is_read: boolean;
  action_url?: string;
  created_at: string;
}

export interface UserSettings {
  user_id: string;
  google_connected: boolean;
  google_sheet_id?: string;
  google_sheet_url?: string;
  google_backup_folder_id?: string;
  auto_backup_enabled: boolean;
  notify_budget_warning: boolean;
  notify_recurring_due: boolean;
  updated_at: string;
}

export type DateRangePreset = 
  | 'today' 
  | '7days' 
  | 'this_month' 
  | 'last_month' 
  | '3months' 
  | 'this_year' 
  | 'all' 
  | 'custom';

export interface TransactionFilter {
  search?: string;
  datePreset?: DateRangePreset;
  startDate?: string;
  endDate?: string;
  type?: TransactionType | 'all';
  accountId?: string | 'all';
  categoryId?: string | 'all';
  minAmount?: number;
  maxAmount?: number;
}

export interface FinanceExportData {
  version: string;
  exported_at: string;
  profile?: Profile;
  accounts: Account[];
  categories: Category[];
  transactions: Transaction[];
  budgets: Budget[];
  budget_categories: BudgetCategory[];
  savings_goals: SavingsGoal[];
  goal_contributions: GoalContribution[];
  debts: Debt[];
  debt_payments: DebtPayment[];
  recurring_transactions: RecurringTransaction[];
  settings?: UserSettings;
}

// ==========================================
// ZOD VALIDATION SCHEMAS
// ==========================================

export const TransactionSchema = z.object({
  type: z.enum(['expense', 'income', 'transfer']),
  amount: z.number().positive({ message: 'Nominal harus lebih besar dari 0' }),
  account_id: z.string().min(1, { message: 'Pilih rekening/dompet sumber' }),
  to_account_id: z.string().optional(),
  category_id: z.string().optional(),
  date: z.string().min(1, { message: 'Tanggal wajib diisi' }),
  time: z.string().optional(),
  description: z.string().min(1, { message: 'Deskripsi wajib diisi' }),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
}).refine(data => {
  if (data.type === 'transfer' && !data.to_account_id) {
    return false;
  }
  if (data.type === 'transfer' && data.account_id === data.to_account_id) {
    return false;
  }
  return true;
}, {
  message: 'Rekening tujuan harus dipilih dan berbeda dari rekening asal',
  path: ['to_account_id'],
});

export const AccountSchema = z.object({
  name: z.string().min(2, { message: 'Nama akun minimal 2 karakter' }),
  type: z.enum(['bank', 'ewallet', 'cash', 'credit_card', 'savings', 'investment', 'other']),
  initial_balance: z.number().min(0, { message: 'Saldo awal minimal 0' }),
  currency: z.string().default('IDR'),
  color: z.string().min(1, { message: 'Pilih warna' }),
  icon: z.string().min(1, { message: 'Pilih ikon' }),
  institution: z.string().optional(),
  account_number: z.string().optional(),
  notes: z.string().optional(),
});

export const CategorySchema = z.object({
  name: z.string().min(2, { message: 'Nama kategori minimal 2 karakter' }),
  type: z.enum(['expense', 'income']),
  color: z.string().min(1, { message: 'Pilih warna' }),
  icon: z.string().min(1, { message: 'Pilih ikon' }),
});

export const SavingsGoalSchema = z.object({
  name: z.string().min(2, { message: 'Nama target tabungan minimal 2 karakter' }),
  target_amount: z.number().positive({ message: 'Target nominal harus lebih dari 0' }),
  current_amount: z.number().min(0).default(0),
  target_date: z.string().optional(),
  color: z.string().default('#8B5CF6'),
  icon: z.string().default('target'),
  notes: z.string().optional(),
});

export const DebtSchema = z.object({
  name: z.string().min(2, { message: 'Keterangan hutang/piutang minimal 2 karakter' }),
  person_or_institution: z.string().min(2, { message: 'Nama pihak/lembaga wajib diisi' }),
  type: z.enum(['debt', 'receivable']),
  total_amount: z.number().positive({ message: 'Nominal harus lebih dari 0' }),
  remaining_amount: z.number().min(0),
  interest_rate: z.number().min(0).optional(),
  due_date: z.string().optional(),
  minimum_payment: z.number().min(0).optional(),
  notes: z.string().optional(),
});

export const RecurringSchema = z.object({
  description: z.string().min(2, { message: 'Deskripsi transaksi minimal 2 karakter' }),
  type: z.enum(['expense', 'income']),
  amount: z.number().positive({ message: 'Nominal harus lebih dari 0' }),
  account_id: z.string().min(1, { message: 'Pilih rekening' }),
  category_id: z.string().optional(),
  frequency: z.enum(['daily', 'weekly', 'monthly', 'yearly']),
  start_date: z.string().min(1, { message: 'Tanggal mulai wajib diisi' }),
  next_occurrence: z.string().min(1, { message: 'Jadwal berikutnya wajib diisi' }),
  auto_create: z.boolean().default(false),
});
