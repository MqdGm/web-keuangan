-- ==========================================================
-- PRODUCTION SCHEMA: KEUANGAN PERSONAL FINANCE APP
-- ==========================================================

-- Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  currency TEXT NOT NULL DEFAULT 'IDR',
  locale TEXT NOT NULL DEFAULT 'id-ID',
  theme TEXT NOT NULL DEFAULT 'system',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. ACCOUNTS / WALLETS TABLE
CREATE TABLE IF NOT EXISTS public.accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('bank', 'ewallet', 'cash', 'credit_card', 'savings', 'investment', 'other')),
  balance NUMERIC(15,2) NOT NULL DEFAULT 0,
  initial_balance NUMERIC(15,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'IDR',
  color TEXT NOT NULL DEFAULT '#3B82F6',
  icon TEXT NOT NULL DEFAULT 'wallet',
  account_number TEXT,
  institution TEXT,
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('expense', 'income')),
  color TEXT NOT NULL DEFAULT '#10B981',
  icon TEXT NOT NULL DEFAULT 'tag',
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  to_account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('expense', 'income', 'transfer')),
  amount NUMERIC(15,2) NOT NULL CHECK (amount > 0),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  time TIME DEFAULT CURRENT_TIME,
  description TEXT NOT NULL,
  notes TEXT,
  tags TEXT[] DEFAULT '{}',
  receipt_url TEXT,
  recurring_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. BUDGETS & BUDGET CATEGORIES
CREATE TABLE IF NOT EXISTS public.budgets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  month DATE NOT NULL, -- e.g. '2026-09-01'
  total_limit NUMERIC(15,2),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, month)
);

CREATE TABLE IF NOT EXISTS public.budget_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  budget_id UUID NOT NULL REFERENCES public.budgets(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  amount_limit NUMERIC(15,2) NOT NULL CHECK (amount_limit >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(budget_id, category_id)
);

-- 6. SAVINGS GOALS & CONTRIBUTIONS
CREATE TABLE IF NOT EXISTS public.savings_goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  target_amount NUMERIC(15,2) NOT NULL CHECK (target_amount > 0),
  current_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  target_date DATE,
  color TEXT NOT NULL DEFAULT '#8B5CF6',
  icon TEXT NOT NULL DEFAULT 'target',
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.goal_contributions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  goal_id UUID NOT NULL REFERENCES public.savings_goals(id) ON DELETE CASCADE,
  account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  amount NUMERIC(15,2) NOT NULL CHECK (amount > 0),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. DEBTS & DEBT PAYMENTS
CREATE TABLE IF NOT EXISTS public.debts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  person_or_institution TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('debt', 'receivable')),
  total_amount NUMERIC(15,2) NOT NULL CHECK (total_amount > 0),
  remaining_amount NUMERIC(15,2) NOT NULL CHECK (remaining_amount >= 0),
  interest_rate NUMERIC(5,2) DEFAULT 0,
  due_date DATE,
  minimum_payment NUMERIC(15,2),
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paid')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.debt_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  debt_id UUID NOT NULL REFERENCES public.debts(id) ON DELETE CASCADE,
  account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  amount NUMERIC(15,2) NOT NULL CHECK (amount > 0),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. RECURRING TRANSACTIONS
CREATE TABLE IF NOT EXISTS public.recurring_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('expense', 'income')),
  amount NUMERIC(15,2) NOT NULL CHECK (amount > 0),
  description TEXT NOT NULL,
  frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly', 'yearly')),
  start_date DATE NOT NULL,
  end_date DATE,
  next_occurrence DATE NOT NULL,
  auto_create BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. NOTIFICATIONS
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('budget_warning', 'recurring_due', 'goal_reached', 'system')),
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  action_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. USER SETTINGS
CREATE TABLE IF NOT EXISTS public.user_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  google_connected BOOLEAN DEFAULT FALSE,
  google_sheet_id TEXT,
  google_backup_folder_id TEXT,
  auto_backup_enabled BOOLEAN DEFAULT FALSE,
  notify_budget_warning BOOLEAN DEFAULT TRUE,
  notify_recurring_due BOOLEAN DEFAULT TRUE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.savings_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goal_contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.debts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.debt_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recurring_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Profiles can be viewed by owner" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Profiles can be updated by owner" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Profiles can be inserted by owner" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Accounts Policies
CREATE POLICY "Accounts owned by user" ON public.accounts FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Categories Policies
CREATE POLICY "Categories owned by user" ON public.categories FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Transactions Policies
CREATE POLICY "Transactions owned by user" ON public.transactions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Budgets Policies
CREATE POLICY "Budgets owned by user" ON public.budgets FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Budget Categories Policies
CREATE POLICY "Budget Categories owned by user" ON public.budget_categories FOR ALL USING (
  EXISTS (SELECT 1 FROM public.budgets b WHERE b.id = budget_categories.budget_id AND b.user_id = auth.uid())
) WITH CHECK (
  EXISTS (SELECT 1 FROM public.budgets b WHERE b.id = budget_categories.budget_id AND b.user_id = auth.uid())
);

-- Savings Goals Policies
CREATE POLICY "Savings Goals owned by user" ON public.savings_goals FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Goal Contributions Policies
CREATE POLICY "Goal Contributions owned by user" ON public.goal_contributions FOR ALL USING (
  EXISTS (SELECT 1 FROM public.savings_goals g WHERE g.id = goal_contributions.goal_id AND g.user_id = auth.uid())
) WITH CHECK (
  EXISTS (SELECT 1 FROM public.savings_goals g WHERE g.id = goal_contributions.goal_id AND g.user_id = auth.uid())
);

-- Debts Policies
CREATE POLICY "Debts owned by user" ON public.debts FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Debt Payments Policies
CREATE POLICY "Debt Payments owned by user" ON public.debt_payments FOR ALL USING (
  EXISTS (SELECT 1 FROM public.debts d WHERE d.id = debt_payments.debt_id AND d.user_id = auth.uid())
) WITH CHECK (
  EXISTS (SELECT 1 FROM public.debts d WHERE d.id = debt_payments.debt_id AND d.user_id = auth.uid())
);

-- Recurring Transactions Policies
CREATE POLICY "Recurring Transactions owned by user" ON public.recurring_transactions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Notifications Policies
CREATE POLICY "Notifications owned by user" ON public.notifications FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- User Settings Policies
CREATE POLICY "User Settings owned by user" ON public.user_settings FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ==========================================================
-- TRIGGERS & FUNCTIONS
-- ==========================================================

-- Function: Auto Create Profile & Default Categories on New User Signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert profile
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  );

  -- Insert user settings
  INSERT INTO public.user_settings (user_id)
  VALUES (NEW.id);

  -- Default Expense Categories
  INSERT INTO public.categories (user_id, name, type, color, icon, is_default) VALUES
    (NEW.id, 'Makanan & Minuman', 'expense', '#EF4444', 'utensils', TRUE),
    (NEW.id, 'Transportasi', 'expense', '#F97316', 'car', TRUE),
    (NEW.id, 'Belanja', 'expense', '#EC4899', 'shopping-bag', TRUE),
    (NEW.id, 'Tagihan & Utilitas', 'expense', '#F59E0B', 'receipt', TRUE),
    (NEW.id, 'Hiburan', 'expense', '#8B5CF6', 'film', TRUE),
    (NEW.id, 'Kesehatan', 'expense', '#10B981', 'heart-pulse', TRUE),
    (NEW.id, 'Pendidikan', 'expense', '#06B6D4', 'graduation-cap', TRUE),
    (NEW.id, 'Keluarga', 'expense', '#3B82F6', 'users', TRUE),
    (NEW.id, 'Langganan', 'expense', '#6366F1', 'sparkles', TRUE),
    (NEW.id, 'Lainnya', 'expense', '#6B7280', 'circle-ellipsis', TRUE);

  -- Default Income Categories
  INSERT INTO public.categories (user_id, name, type, color, icon, is_default) VALUES
    (NEW.id, 'Gaji', 'income', '#10B981', 'banknote', TRUE),
    (NEW.id, 'Freelance', 'income', '#3B82F6', 'laptop', TRUE),
    (NEW.id, 'Bisnis & Usaha', 'income', '#8B5CF6', 'store', TRUE),
    (NEW.id, 'Investasi & Bunga', 'income', '#F59E0B', 'trending-up', TRUE),
    (NEW.id, 'Bonus & Hadiah', 'income', '#EC4899', 'gift', TRUE),
    (NEW.id, 'Pemasukan Lain', 'income', '#6B7280', 'plus-circle', TRUE);

  -- Default Accounts
  INSERT INTO public.accounts (user_id, name, type, balance, initial_balance, color, icon, institution) VALUES
    (NEW.id, 'Tunai (Dompet)', 'cash', 0, 0, '#10B981', 'wallet', 'Cash'),
    (NEW.id, 'BCA', 'bank', 0, 0, '#00529C', 'building-2', 'Bank Central Asia');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Function & Trigger: Automatic Balance Recalculation on Transactions
CREATE OR REPLACE FUNCTION public.handle_transaction_balance_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Handle INSERT
  IF (TG_OP = 'INSERT') THEN
    IF (NEW.type = 'expense') THEN
      UPDATE public.accounts SET balance = balance - NEW.amount WHERE id = NEW.account_id;
    ELSIF (NEW.type = 'income') THEN
      UPDATE public.accounts SET balance = balance + NEW.amount WHERE id = NEW.account_id;
    ELSIF (NEW.type = 'transfer') THEN
      UPDATE public.accounts SET balance = balance - NEW.amount WHERE id = NEW.account_id;
      IF (NEW.to_account_id IS NOT NULL) THEN
        UPDATE public.accounts SET balance = balance + NEW.amount WHERE id = NEW.to_account_id;
      END IF;
    END IF;
    RETURN NEW;

  -- Handle DELETE
  ELSIF (TG_OP = 'DELETE') THEN
    IF (OLD.type = 'expense') THEN
      UPDATE public.accounts SET balance = balance + OLD.amount WHERE id = OLD.account_id;
    ELSIF (OLD.type = 'income') THEN
      UPDATE public.accounts SET balance = balance - OLD.amount WHERE id = OLD.account_id;
    ELSIF (OLD.type = 'transfer') THEN
      UPDATE public.accounts SET balance = balance + OLD.amount WHERE id = OLD.account_id;
      IF (OLD.to_account_id IS NOT NULL) THEN
        UPDATE public.accounts SET balance = balance - OLD.amount WHERE id = OLD.to_account_id;
      END IF;
    END IF;
    RETURN OLD;

  -- Handle UPDATE
  ELSIF (TG_OP = 'UPDATE') THEN
    -- Revert OLD
    IF (OLD.type = 'expense') THEN
      UPDATE public.accounts SET balance = balance + OLD.amount WHERE id = OLD.account_id;
    ELSIF (OLD.type = 'income') THEN
      UPDATE public.accounts SET balance = balance - OLD.amount WHERE id = OLD.account_id;
    ELSIF (OLD.type = 'transfer') THEN
      UPDATE public.accounts SET balance = balance + OLD.amount WHERE id = OLD.account_id;
      IF (OLD.to_account_id IS NOT NULL) THEN
        UPDATE public.accounts SET balance = balance - OLD.amount WHERE id = OLD.to_account_id;
      END IF;
    END IF;

    -- Apply NEW
    IF (NEW.type = 'expense') THEN
      UPDATE public.accounts SET balance = balance - NEW.amount WHERE id = NEW.account_id;
    ELSIF (NEW.type = 'income') THEN
      UPDATE public.accounts SET balance = balance + NEW.amount WHERE id = NEW.account_id;
    ELSIF (NEW.type = 'transfer') THEN
      UPDATE public.accounts SET balance = balance - NEW.amount WHERE id = NEW.account_id;
      IF (NEW.to_account_id IS NOT NULL) THEN
        UPDATE public.accounts SET balance = balance + NEW.amount WHERE id = NEW.to_account_id;
      END IF;
    END IF;
    RETURN NEW;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_transaction_balance_change ON public.transactions;
CREATE TRIGGER on_transaction_balance_change
  AFTER INSERT OR UPDATE OR DELETE ON public.transactions
  FOR EACH ROW EXECUTE PROCEDURE public.handle_transaction_balance_change();

-- Indexes for maximum query performance
CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON public.transactions(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_account ON public.transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON public.transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_accounts_user ON public.accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_categories_user ON public.categories(user_id);
CREATE INDEX IF NOT EXISTS idx_budgets_user_month ON public.budgets(user_id, month);
CREATE INDEX IF NOT EXISTS idx_savings_user ON public.savings_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_debts_user ON public.debts(user_id);
CREATE INDEX IF NOT EXISTS idx_recurring_user ON public.recurring_transactions(user_id);
