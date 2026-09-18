'use client';

import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
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
  FinanceExportData,
  DateRangePreset,
  TransactionType,
} from '@/types/finance';
import {
  INITIAL_PROFILE,
  INITIAL_ACCOUNTS,
  INITIAL_CATEGORIES,
  INITIAL_TRANSACTIONS,
  INITIAL_BUDGET,
  INITIAL_BUDGET_CATEGORIES,
  INITIAL_SAVINGS_GOALS,
  INITIAL_DEBTS,
  INITIAL_RECURRING,
  INITIAL_NOTIFICATIONS,
  INITIAL_SETTINGS,
} from './initial-data';
import { format, isWithinInterval, parseISO, startOfDay, endOfDay, subDays, addDays, startOfMonth, endOfMonth, subMonths, startOfYear, endOfYear } from 'date-fns';

const STORAGE_KEY = 'keuangan_finance_state_v2';

interface FinanceContextType {
  // State
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
  isDemoMode: boolean;
  isLoading: boolean;
  datePreset: DateRangePreset;
  customDateRange: { start: string; end: string };

  // Setters
  setDatePreset: (preset: DateRangePreset) => void;
  setCustomDateRange: (range: { start: string; end: string }) => void;

  // Account actions
  addAccount: (account: Omit<Account, 'id' | 'created_at' | 'updated_at' | 'user_id' | 'balance'>) => void;
  updateAccount: (id: string, data: Partial<Account>) => void;
  deleteAccount: (id: string) => void;
  transferBetweenAccounts: (fromId: string, toId: string, amount: number, notes?: string, date?: string) => void;

  // Transaction actions
  addTransaction: (tx: Omit<Transaction, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => void;
  updateTransaction: (id: string, tx: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  duplicateTransaction: (id: string) => void;

  // Budget actions
  setCategoryBudget: (categoryId: string, amountLimit: number, month?: string) => void;
  setTotalBudget: (totalLimit: number, month?: string) => void;

  // Savings actions
  addSavingsGoal: (goal: Omit<SavingsGoal, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => void;
  updateSavingsGoal: (id: string, data: Partial<SavingsGoal>) => void;
  deleteSavingsGoal: (id: string) => void;
  contributeToGoal: (goalId: string, amount: number, accountId?: string, notes?: string) => void;

  // Debt actions
  addDebt: (debt: Omit<Debt, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => void;
  updateDebt: (id: string, data: Partial<Debt>) => void;
  deleteDebt: (id: string) => void;
  recordDebtPayment: (debtId: string, amount: number, accountId?: string, notes?: string) => void;

  // Recurring actions
  addRecurring: (rec: Omit<RecurringTransaction, 'id' | 'created_at' | 'user_id'>) => void;
  updateRecurring: (id: string, data: Partial<RecurringTransaction>) => void;
  deleteRecurring: (id: string) => void;
  executeRecurringNow: (id: string) => void;

  // Category actions
  addCategory: (cat: Omit<Category, 'id' | 'created_at' | 'user_id'>) => void;
  updateCategory: (id: string, data: Partial<Category>) => void;
  deleteCategory: (id: string) => void;

  // Notifications
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  clearNotifications: () => void;

  // Settings & System
  updateProfile: (data: Partial<Profile>) => void;
  updateSettings: (data: Partial<UserSettings>) => void;
  resetToDemoData: () => void;
  clearAllData: () => void;
  exportBackupData: () => FinanceExportData;
  importBackupData: (data: FinanceExportData) => { success: boolean; error?: string };

  // Calculated Metrics
  filteredTransactions: Transaction[];
  totalNetWorth: number;
  filteredIncome: number;
  filteredExpense: number;
  filteredNet: number;
  savingsRate: number;
  expenseByCategory: Array<{
    categoryId: string;
    categoryName: string;
    color: string;
    icon: string;
    amount: number;
    percentage: number;
  }>;
  monthlyCashflowTrend: Array<{
    monthKey: string;
    monthLabel: string;
    income: number;
    expense: number;
    net: number;
  }>;
  upcomingBills: RecurringTransaction[];
  unreadNotificationCount: number;
}

const FinanceContext = createContext<FinanceContextType | null>(null);

export function FinanceProvider({ children }: { children: React.ReactNode }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [profile, setProfile] = useState<Profile>(INITIAL_PROFILE);
  const [accounts, setAccounts] = useState<Account[]>(INITIAL_ACCOUNTS);
  const [categories, setCategories] = useState<Category[]>(INITIAL_CATEGORIES);
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);
  const [budgets, setBudgets] = useState<Budget[]>([INITIAL_BUDGET]);
  const [budgetCategories, setBudgetCategories] = useState<BudgetCategory[]>(INITIAL_BUDGET_CATEGORIES);
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>(INITIAL_SAVINGS_GOALS);
  const [debts, setDebts] = useState<Debt[]>(INITIAL_DEBTS);
  const [recurringTransactions, setRecurringTransactions] = useState<RecurringTransaction[]>(INITIAL_RECURRING);
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [settings, setSettings] = useState<UserSettings>(INITIAL_SETTINGS);

  const [datePreset, setDatePreset] = useState<DateRangePreset>('this_month');
  const [customDateRange, setCustomDateRange] = useState<{ start: string; end: string }>({
    start: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    end: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
  });

  // Load from localStorage on client mount
  useEffect(() => {
    try {
      localStorage.removeItem('keuangan_finance_state_v1');
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.profile) setProfile(parsed.profile);
        if (parsed.accounts) setAccounts(parsed.accounts);
        if (parsed.categories) setCategories(parsed.categories);
        if (parsed.transactions) setTransactions(parsed.transactions);
        if (parsed.budgets) setBudgets(parsed.budgets);
        if (parsed.budgetCategories) setBudgetCategories(parsed.budgetCategories);
        if (parsed.savingsGoals) setSavingsGoals(parsed.savingsGoals);
        if (parsed.debts) setDebts(parsed.debts);
        if (parsed.recurringTransactions) setRecurringTransactions(parsed.recurringTransactions);
        if (parsed.notifications) setNotifications(parsed.notifications);
        if (parsed.settings) setSettings(parsed.settings);
      }
    } catch (e) {
      console.warn('Failed to load local finance storage', e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Sync to localStorage on changes
  useEffect(() => {
    if (!isLoaded) return;
    try {
      const stateToPersist = {
        profile,
        accounts,
        categories,
        transactions,
        budgets,
        budgetCategories,
        savingsGoals,
        debts,
        recurringTransactions,
        notifications,
        settings,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToPersist));
    } catch (e) {
      console.warn('Failed to persist finance state', e);
    }
  }, [
    isLoaded,
    profile,
    accounts,
    categories,
    transactions,
    budgets,
    budgetCategories,
    savingsGoals,
    debts,
    recurringTransactions,
    notifications,
    settings,
  ]);

  // Helper for date interval calculation
  const getDateInterval = useCallback((): { start: Date; end: Date } => {
    const now = new Date();
    switch (datePreset) {
      case 'today':
        return { start: startOfDay(now), end: endOfDay(now) };
      case '7days':
        return { start: startOfDay(subDays(now, 6)), end: endOfDay(now) };
      case 'this_month':
        return { start: startOfMonth(now), end: endOfMonth(now) };
      case 'last_month': {
        const prev = subMonths(now, 1);
        return { start: startOfMonth(prev), end: endOfMonth(prev) };
      }
      case '3months':
        return { start: startOfMonth(subMonths(now, 2)), end: endOfMonth(now) };
      case 'this_year':
        return { start: startOfYear(now), end: endOfYear(now) };
      case 'custom':
        return {
          start: startOfDay(parseISO(customDateRange.start)),
          end: endOfDay(parseISO(customDateRange.end)),
        };
      case 'all':
      default:
        return { start: new Date(2000, 0, 1), end: new Date(2099, 11, 31) };
    }
  }, [datePreset, customDateRange]);

  // Filtered transactions based on active Date Range
  const filteredTransactions = useMemo(() => {
    const { start, end } = getDateInterval();
    return transactions.filter((t) => {
      try {
        const txDate = parseISO(t.date);
        return isWithinInterval(txDate, { start, end });
      } catch {
        return true;
      }
    }).sort((a, b) => new Date(b.date + 'T' + (b.time || '00:00')).getTime() - new Date(a.date + 'T' + (a.time || '00:00')).getTime());
  }, [transactions, getDateInterval]);

  // Metrics
  const totalNetWorth = useMemo(() => {
    return accounts
      .filter((a) => a.is_active)
      .reduce((sum, a) => sum + Number(a.balance || 0), 0);
  }, [accounts]);

  const filteredIncome = useMemo(() => {
    return filteredTransactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);
  }, [filteredTransactions]);

  const filteredExpense = useMemo(() => {
    return filteredTransactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);
  }, [filteredTransactions]);

  const filteredNet = filteredIncome - filteredExpense;

  const savingsRate = useMemo(() => {
    if (filteredIncome <= 0) return 0;
    const rate = ((filteredIncome - filteredExpense) / filteredIncome) * 100;
    return Math.max(0, Math.round(rate * 10) / 10);
  }, [filteredIncome, filteredExpense]);

  // Category Breakdown for Charts
  const expenseByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    filteredTransactions
      .filter((t) => t.type === 'expense')
      .forEach((t) => {
        const catId = t.category_id || 'uncategorized';
        map[catId] = (map[catId] || 0) + Number(t.amount);
      });

    const total = filteredExpense > 0 ? filteredExpense : 1;
    return Object.entries(map)
      .map(([catId, amount]) => {
        const cat = categories.find((c) => c.id === catId);
        return {
          categoryId: catId,
          categoryName: cat?.name || 'Lainnya',
          color: cat?.color || '#6B7280',
          icon: cat?.icon || 'CircleEllipsis',
          amount,
          percentage: Math.round((amount / total) * 1000) / 10,
        };
      })
      .sort((a, b) => b.amount - a.amount);
  }, [filteredTransactions, categories, filteredExpense]);

  // 6-Month Trend Data for Cash Flow Chart
  const monthlyCashflowTrend = useMemo(() => {
    const result: Array<{
      monthKey: string;
      monthLabel: string;
      income: number;
      expense: number;
      net: number;
    }> = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const d = subMonths(now, i);
      const mKey = format(d, 'yyyy-MM');
      const mLabel = format(d, 'MMM yyyy');

      const mStart = startOfMonth(d);
      const mEnd = endOfMonth(d);

      const mIncome = transactions
        .filter((t) => t.type === 'income')
        .filter((t) => {
          try {
            const dt = parseISO(t.date);
            return isWithinInterval(dt, { start: mStart, end: mEnd });
          } catch {
            return false;
          }
        })
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const mExpense = transactions
        .filter((t) => t.type === 'expense')
        .filter((t) => {
          try {
            const dt = parseISO(t.date);
            return isWithinInterval(dt, { start: mStart, end: mEnd });
          } catch {
            return false;
          }
        })
        .reduce((sum, t) => sum + Number(t.amount), 0);

      result.push({
        monthKey: mKey,
        monthLabel: mLabel,
        income: mIncome,
        expense: mExpense,
        net: mIncome - mExpense,
      });
    }
    return result;
  }, [transactions]);

  // Upcoming bills in the next 14 days
  const upcomingBills = useMemo(() => {
    return recurringTransactions
      .filter((r) => r.is_active)
      .sort((a, b) => a.next_occurrence.localeCompare(b.next_occurrence));
  }, [recurringTransactions]);

  const unreadNotificationCount = useMemo(() => {
    return notifications.filter((n) => !n.is_read).length;
  }, [notifications]);

  // ==========================================
  // TRANSACTION OPERATIONS WITH BALANCE SYNC
  // ==========================================
  const addTransaction = useCallback((txData: Omit<Transaction, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => {
    const newId = 'tx-' + Date.now();
    const nowIso = new Date().toISOString();
    const newTx: Transaction = {
      ...txData,
      id: newId,
      user_id: profile.id,
      created_at: nowIso,
      updated_at: nowIso,
    };

    setTransactions((prev) => [newTx, ...prev]);

    // Update account balances
    setAccounts((prevAccounts) =>
      prevAccounts.map((acc) => {
        if (newTx.type === 'expense' && acc.id === newTx.account_id) {
          return { ...acc, balance: Number(acc.balance) - Number(newTx.amount), updated_at: nowIso };
        }
        if (newTx.type === 'income' && acc.id === newTx.account_id) {
          return { ...acc, balance: Number(acc.balance) + Number(newTx.amount), updated_at: nowIso };
        }
        if (newTx.type === 'transfer') {
          if (acc.id === newTx.account_id) {
            return { ...acc, balance: Number(acc.balance) - Number(newTx.amount), updated_at: nowIso };
          }
          if (acc.id === newTx.to_account_id) {
            return { ...acc, balance: Number(acc.balance) + Number(newTx.amount), updated_at: nowIso };
          }
        }
        return acc;
      })
    );
  }, [profile.id]);

  const updateTransaction = useCallback((id: string, updatedFields: Partial<Transaction>) => {
    const existing = transactions.find((t) => t.id === id);
    if (!existing) return;

    const merged = { ...existing, ...updatedFields, updated_at: new Date().toISOString() };

    setTransactions((prev) => prev.map((t) => (t.id === id ? merged : t)));

    // Revert old impact, apply new impact on accounts
    setAccounts((prevAccounts) =>
      prevAccounts.map((acc) => {
        let b = Number(acc.balance);

        // Revert OLD
        if (existing.type === 'expense' && acc.id === existing.account_id) {
          b += Number(existing.amount);
        } else if (existing.type === 'income' && acc.id === existing.account_id) {
          b -= Number(existing.amount);
        } else if (existing.type === 'transfer') {
          if (acc.id === existing.account_id) b += Number(existing.amount);
          if (acc.id === existing.to_account_id) b -= Number(existing.amount);
        }

        // Apply NEW
        if (merged.type === 'expense' && acc.id === merged.account_id) {
          b -= Number(merged.amount);
        } else if (merged.type === 'income' && acc.id === merged.account_id) {
          b += Number(merged.amount);
        } else if (merged.type === 'transfer') {
          if (acc.id === merged.account_id) b -= Number(merged.amount);
          if (acc.id === merged.to_account_id) b += Number(merged.amount);
        }

        return { ...acc, balance: b, updated_at: new Date().toISOString() };
      })
    );
  }, [transactions]);

  const deleteTransaction = useCallback((id: string) => {
    const tx = transactions.find((t) => t.id === id);
    if (!tx) return;

    setTransactions((prev) => prev.filter((t) => t.id !== id));

    // Revert account balance impact
    setAccounts((prevAccounts) =>
      prevAccounts.map((acc) => {
        let b = Number(acc.balance);
        if (tx.type === 'expense' && acc.id === tx.account_id) {
          b += Number(tx.amount);
        } else if (tx.type === 'income' && acc.id === tx.account_id) {
          b -= Number(tx.amount);
        } else if (tx.type === 'transfer') {
          if (acc.id === tx.account_id) b += Number(tx.amount);
          if (acc.id === tx.to_account_id) b -= Number(tx.amount);
        }
        return { ...acc, balance: b, updated_at: new Date().toISOString() };
      })
    );
  }, [transactions]);

  const duplicateTransaction = useCallback((id: string) => {
    const tx = transactions.find((t) => t.id === id);
    if (!tx) return;
    addTransaction({
      account_id: tx.account_id,
      to_account_id: tx.to_account_id,
      category_id: tx.category_id,
      type: tx.type,
      amount: tx.amount,
      date: format(new Date(), 'yyyy-MM-dd'),
      time: format(new Date(), 'HH:mm'),
      description: `${tx.description} (Salinan)`,
      notes: tx.notes,
      tags: tx.tags,
    });
  }, [transactions, addTransaction]);

  // ==========================================
  // ACCOUNT ACTIONS
  // ==========================================
  const addAccount = useCallback((accData: Omit<Account, 'id' | 'created_at' | 'updated_at' | 'user_id' | 'balance'>) => {
    const id = 'acc-' + Date.now();
    const nowIso = new Date().toISOString();
    const newAcc: Account = {
      ...accData,
      id,
      user_id: profile.id,
      balance: accData.initial_balance,
      created_at: nowIso,
      updated_at: nowIso,
    };
    setAccounts((prev) => [...prev, newAcc]);
  }, [profile.id]);

  const updateAccount = useCallback((id: string, data: Partial<Account>) => {
    setAccounts((prev) =>
      prev.map((acc) => (acc.id === id ? { ...acc, ...data, updated_at: new Date().toISOString() } : acc))
    );
  }, []);

  const deleteAccount = useCallback((id: string) => {
    setAccounts((prev) => prev.filter((acc) => acc.id !== id));
    // Also remove associated transactions or retain them
    setTransactions((prev) => prev.filter((t) => t.account_id !== id && t.to_account_id !== id));
  }, []);

  const transferBetweenAccounts = useCallback((fromId: string, toId: string, amount: number, notes?: string, date?: string) => {
    const fromAcc = accounts.find((a) => a.id === fromId);
    const toAcc = accounts.find((a) => a.id === toId);
    if (!fromAcc || !toAcc || amount <= 0) return;

    addTransaction({
      account_id: fromId,
      to_account_id: toId,
      type: 'transfer',
      amount,
      date: date || format(new Date(), 'yyyy-MM-dd'),
      time: format(new Date(), 'HH:mm'),
      description: `Transfer ${fromAcc.name} ke ${toAcc.name}`,
      notes: notes || '',
      tags: ['transfer'],
    });
  }, [accounts, addTransaction]);

  // ==========================================
  // BUDGET ACTIONS
  // ==========================================
  const setCategoryBudget = useCallback((categoryId: string, amountLimit: number, month?: string) => {
    const targetMonth = month || format(startOfMonth(new Date()), 'yyyy-MM-dd');
    let currentBudget = budgets.find((b) => b.month === targetMonth);
    const budgetId = currentBudget ? currentBudget.id : 'budget-' + Date.now();

    if (!currentBudget) {
      currentBudget = {
        id: budgetId,
        user_id: profile.id,
        month: targetMonth,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setBudgets((prev) => [...prev, currentBudget!]);
    }

    setBudgetCategories((prev) => {
      const existing = prev.find((bc) => bc.budget_id === budgetId && bc.category_id === categoryId);
      if (existing) {
        return prev.map((bc) => (bc.id === existing.id ? { ...bc, amount_limit: amountLimit } : bc));
      }
      return [
        ...prev,
        {
          id: 'bc-' + Date.now(),
          budget_id: budgetId,
          category_id: categoryId,
          amount_limit: amountLimit,
          created_at: new Date().toISOString(),
        },
      ];
    });
  }, [budgets, profile.id]);

  const setTotalBudget = useCallback((totalLimit: number, month?: string) => {
    const targetMonth = month || format(startOfMonth(new Date()), 'yyyy-MM-dd');
    setBudgets((prev) => {
      const existing = prev.find((b) => b.month === targetMonth);
      if (existing) {
        return prev.map((b) => (b.id === existing.id ? { ...b, total_limit: totalLimit } : b));
      }
      return [
        ...prev,
        {
          id: 'budget-' + Date.now(),
          user_id: profile.id,
          month: targetMonth,
          total_limit: totalLimit,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];
    });
  }, [profile.id]);

  // ==========================================
  // SAVINGS GOALS ACTIONS
  // ==========================================
  const addSavingsGoal = useCallback((goal: Omit<SavingsGoal, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => {
    const id = 'goal-' + Date.now();
    const nowIso = new Date().toISOString();
    setSavingsGoals((prev) => [
      ...prev,
      {
        ...goal,
        id,
        user_id: profile.id,
        created_at: nowIso,
        updated_at: nowIso,
      },
    ]);
  }, [profile.id]);

  const updateSavingsGoal = useCallback((id: string, data: Partial<SavingsGoal>) => {
    setSavingsGoals((prev) =>
      prev.map((g) => (g.id === id ? { ...g, ...data, updated_at: new Date().toISOString() } : g))
    );
  }, []);

  const deleteSavingsGoal = useCallback((id: string) => {
    setSavingsGoals((prev) => prev.filter((g) => g.id !== id));
  }, []);

  const contributeToGoal = useCallback((goalId: string, amount: number, accountId?: string, notes?: string) => {
    setSavingsGoals((prev) =>
      prev.map((g) => {
        if (g.id !== goalId) return g;
        const updatedCurrent = Number(g.current_amount) + Number(amount);
        const isCompleted = updatedCurrent >= Number(g.target_amount);
        return {
          ...g,
          current_amount: updatedCurrent,
          status: isCompleted ? 'completed' : g.status,
          updated_at: new Date().toISOString(),
        };
      })
    );

    // If deducted from an account, create an expense/transfer
    if (accountId) {
      const goal = savingsGoals.find((g) => g.id === goalId);
      addTransaction({
        account_id: accountId,
        type: 'expense',
        amount,
        date: format(new Date(), 'yyyy-MM-dd'),
        time: format(new Date(), 'HH:mm'),
        description: `Setoran Tabungan: ${goal?.name || 'Target Tabungan'}`,
        notes: notes || '',
        tags: ['tabungan', 'savings'],
      });
    }
  }, [savingsGoals, addTransaction]);

  // ==========================================
  // DEBTS ACTIONS
  // ==========================================
  const addDebt = useCallback((debt: Omit<Debt, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => {
    const id = 'debt-' + Date.now();
    const nowIso = new Date().toISOString();
    setDebts((prev) => [
      ...prev,
      {
        ...debt,
        id,
        user_id: profile.id,
        created_at: nowIso,
        updated_at: nowIso,
      },
    ]);
  }, [profile.id]);

  const updateDebt = useCallback((id: string, data: Partial<Debt>) => {
    setDebts((prev) =>
      prev.map((d) => (d.id === id ? { ...d, ...data, updated_at: new Date().toISOString() } : d))
    );
  }, []);

  const deleteDebt = useCallback((id: string) => {
    setDebts((prev) => prev.filter((d) => d.id !== id));
  }, []);

  const recordDebtPayment = useCallback((debtId: string, amount: number, accountId?: string, notes?: string) => {
    const targetDebt = debts.find((d) => d.id === debtId);
    if (!targetDebt) return;

    setDebts((prev) =>
      prev.map((d) => {
        if (d.id !== debtId) return d;
        const newRemaining = Math.max(0, Number(d.remaining_amount) - Number(amount));
        return {
          ...d,
          remaining_amount: newRemaining,
          status: newRemaining === 0 ? 'paid' : 'active',
          updated_at: new Date().toISOString(),
        };
      })
    );

    if (accountId) {
      const isDebtWeOwe = targetDebt.type === 'debt';
      addTransaction({
        account_id: accountId,
        type: isDebtWeOwe ? 'expense' : 'income',
        amount,
        date: format(new Date(), 'yyyy-MM-dd'),
        time: format(new Date(), 'HH:mm'),
        description: isDebtWeOwe
          ? `Bayar Hutang: ${targetDebt.name} (${targetDebt.person_or_institution})`
          : `Terima Piutang: ${targetDebt.name} (${targetDebt.person_or_institution})`,
        notes: notes || '',
        tags: ['hutang', 'debt'],
      });
    }
  }, [debts, addTransaction]);

  // ==========================================
  // RECURRING ACTIONS
  // ==========================================
  const addRecurring = useCallback((rec: Omit<RecurringTransaction, 'id' | 'created_at' | 'user_id'>) => {
    const id = 'rec-' + Date.now();
    setRecurringTransactions((prev) => [
      ...prev,
      {
        ...rec,
        id,
        user_id: profile.id,
        created_at: new Date().toISOString(),
      },
    ]);
  }, [profile.id]);

  const updateRecurring = useCallback((id: string, data: Partial<RecurringTransaction>) => {
    setRecurringTransactions((prev) => prev.map((r) => (r.id === id ? { ...r, ...data } : r)));
  }, []);

  const deleteRecurring = useCallback((id: string) => {
    setRecurringTransactions((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const executeRecurringNow = useCallback((id: string) => {
    const rec = recurringTransactions.find((r) => r.id === id);
    if (!rec) return;

    addTransaction({
      account_id: rec.account_id,
      category_id: rec.category_id,
      type: rec.type,
      amount: rec.amount,
      date: format(new Date(), 'yyyy-MM-dd'),
      time: format(new Date(), 'HH:mm'),
      description: rec.description,
      notes: `Dibuat dari transaksi berulang (${rec.frequency})`,
      tags: ['recurring'],
    });

    // Advance next occurrence
    const currentNext = parseISO(rec.next_occurrence);
    let nextDate = currentNext;
    if (rec.frequency === 'monthly') nextDate = addDays(currentNext, 30);
    else if (rec.frequency === 'weekly') nextDate = addDays(currentNext, 7);
    else if (rec.frequency === 'yearly') nextDate = addDays(currentNext, 365);
    else if (rec.frequency === 'daily') nextDate = addDays(currentNext, 1);

    updateRecurring(id, { next_occurrence: format(nextDate, 'yyyy-MM-dd') });
  }, [recurringTransactions, addTransaction, updateRecurring]);

  // ==========================================
  // CATEGORIES ACTIONS
  // ==========================================
  const addCategory = useCallback((cat: Omit<Category, 'id' | 'created_at' | 'user_id'>) => {
    const id = 'cat-' + Date.now();
    setCategories((prev) => [
      ...prev,
      {
        ...cat,
        id,
        user_id: profile.id,
        created_at: new Date().toISOString(),
      },
    ]);
  }, [profile.id]);

  const updateCategory = useCallback((id: string, data: Partial<Category>) => {
    setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, ...data } : c)));
  }, []);

  const deleteCategory = useCallback((id: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== id));
  }, []);

  // ==========================================
  // NOTIFICATIONS ACTIONS
  // ==========================================
  const markNotificationRead = useCallback((id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
  }, []);

  const markAllNotificationsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // ==========================================
  // SETTINGS & SYSTEM ACTIONS
  // ==========================================
  const updateProfile = useCallback((data: Partial<Profile>) => {
    setProfile((prev) => ({ ...prev, ...data, updated_at: new Date().toISOString() }));
  }, []);

  const updateSettings = useCallback((data: Partial<UserSettings>) => {
    setSettings((prev) => ({ ...prev, ...data, updated_at: new Date().toISOString() }));
  }, []);

  const resetToDemoData = useCallback(() => {
    setProfile(INITIAL_PROFILE);
    setAccounts(INITIAL_ACCOUNTS);
    setCategories(INITIAL_CATEGORIES);
    setTransactions(INITIAL_TRANSACTIONS);
    setBudgets([INITIAL_BUDGET]);
    setBudgetCategories(INITIAL_BUDGET_CATEGORIES);
    setSavingsGoals(INITIAL_SAVINGS_GOALS);
    setDebts(INITIAL_DEBTS);
    setRecurringTransactions(INITIAL_RECURRING);
    setNotifications(INITIAL_NOTIFICATIONS);
    setSettings(INITIAL_SETTINGS);
  }, []);

  const clearAllData = useCallback(() => {
    setAccounts([]);
    setTransactions([]);
    setBudgets([]);
    setBudgetCategories([]);
    setSavingsGoals([]);
    setDebts([]);
    setRecurringTransactions([]);
    setNotifications([]);
  }, []);

  const exportBackupData = useCallback((): FinanceExportData => {
    return {
      version: '1.0.0',
      exported_at: new Date().toISOString(),
      profile,
      accounts,
      categories,
      transactions,
      budgets,
      budget_categories: budgetCategories,
      savings_goals: savingsGoals,
      goal_contributions: [],
      debts,
      debt_payments: [],
      recurring_transactions: recurringTransactions,
      settings,
    };
  }, [
    profile,
    accounts,
    categories,
    transactions,
    budgets,
    budgetCategories,
    savingsGoals,
    debts,
    recurringTransactions,
    settings,
  ]);

  const importBackupData = useCallback((data: FinanceExportData): { success: boolean; error?: string } => {
    try {
      if (!data || !data.accounts || !data.transactions) {
        return { success: false, error: 'Format berkas cadangan tidak valid (kurang akun atau transaksi)' };
      }
      if (data.profile) setProfile(data.profile);
      if (data.accounts) setAccounts(data.accounts);
      if (data.categories) setCategories(data.categories);
      if (data.transactions) setTransactions(data.transactions);
      if (data.budgets) setBudgets(data.budgets);
      if (data.budget_categories) setBudgetCategories(data.budget_categories);
      if (data.savings_goals) setSavingsGoals(data.savings_goals);
      if (data.debts) setDebts(data.debts);
      if (data.recurring_transactions) setRecurringTransactions(data.recurring_transactions);
      if (data.settings) setSettings(data.settings);
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message || 'Gagal memulihkan data' };
    }
  }, []);

  const value = {
    profile,
    accounts,
    categories,
    transactions,
    budgets,
    budgetCategories,
    savingsGoals,
    debts,
    recurringTransactions,
    notifications,
    settings,
    isDemoMode: true,
    isLoading: !isLoaded,
    datePreset,
    customDateRange,
    setDatePreset,
    setCustomDateRange,

    addAccount,
    updateAccount,
    deleteAccount,
    transferBetweenAccounts,

    addTransaction,
    updateTransaction,
    deleteTransaction,
    duplicateTransaction,

    setCategoryBudget,
    setTotalBudget,

    addSavingsGoal,
    updateSavingsGoal,
    deleteSavingsGoal,
    contributeToGoal,

    addDebt,
    updateDebt,
    deleteDebt,
    recordDebtPayment,

    addRecurring,
    updateRecurring,
    deleteRecurring,
    executeRecurringNow,

    addCategory,
    updateCategory,
    deleteCategory,

    markNotificationRead,
    markAllNotificationsRead,
    clearNotifications,

    updateProfile,
    updateSettings,
    resetToDemoData,
    clearAllData,
    exportBackupData,
    importBackupData,

    filteredTransactions,
    totalNetWorth,
    filteredIncome,
    filteredExpense,
    filteredNet,
    savingsRate,
    expenseByCategory,
    monthlyCashflowTrend,
    upcomingBills,
    unreadNotificationCount,
  };

  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>;
}

export function useFinance() {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
}
