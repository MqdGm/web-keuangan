-- ==========================================================
-- SEED DATA FOR DEMO & TESTING (SUPABASE)
-- ==========================================================

-- Note: In Supabase, replace '00000000-0000-0000-0000-000000000000' with your actual user_id from auth.users

DO $$
DECLARE
  v_user_id UUID := '00000000-0000-0000-0000-000000000000';
  v_acc_bca UUID := uuid_generate_v4();
  v_acc_mandiri UUID := uuid_generate_v4();
  v_acc_gopay UUID := uuid_generate_v4();
  v_acc_cash UUID := uuid_generate_v4();

  v_cat_makan UUID := uuid_generate_v4();
  v_cat_transport UUID := uuid_generate_v4();
  v_cat_belanja UUID := uuid_generate_v4();
  v_cat_tagihan UUID := uuid_generate_v4();
  v_cat_gaji UUID := uuid_generate_v4();
  v_cat_freelance UUID := uuid_generate_v4();

  v_goal_laptop UUID := uuid_generate_v4();
  v_goal_darurat UUID := uuid_generate_v4();
  v_debt_cicilan UUID := uuid_generate_v4();
  v_budget_id UUID := uuid_generate_v4();
BEGIN
  -- Check if user exists before seeding
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = v_user_id) THEN
    -- Fallback for test runner if user doesn't exist
    RETURN;
  END IF;

  -- 1. Accounts
  INSERT INTO public.accounts (id, user_id, name, type, balance, initial_balance, color, icon, institution) VALUES
    (v_acc_bca, v_user_id, 'BCA Prioritas', 'bank', 18500000, 18500000, '#00529C', 'building-2', 'BCA'),
    (v_acc_mandiri, v_user_id, 'Mandiri Tabungan', 'bank', 8200000, 8200000, '#0F4C81', 'building', 'Mandiri'),
    (v_acc_gopay, v_user_id, 'GoPay', 'ewallet', 450000, 450000, '#00AED6', 'smartphone', 'GoPay'),
    (v_acc_cash, v_user_id, 'Uang Tunai', 'cash', 600000, 600000, '#10B981', 'wallet', 'Cash');

  -- 2. Categories
  INSERT INTO public.categories (id, user_id, name, type, color, icon, is_default) VALUES
    (v_cat_makan, v_user_id, 'Makanan & Minuman', 'expense', '#EF4444', 'utensils', TRUE),
    (v_cat_transport, v_user_id, 'Transportasi', 'expense', '#F97316', 'car', TRUE),
    (v_cat_belanja, v_user_id, 'Belanja', 'expense', '#EC4899', 'shopping-bag', TRUE),
    (v_cat_tagihan, v_user_id, 'Tagihan & Utilitas', 'expense', '#F59E0B', 'receipt', TRUE),
    (v_cat_gaji, v_user_id, 'Gaji Bulanan', 'income', '#10B981', 'banknote', TRUE),
    (v_cat_freelance, v_user_id, 'Proyek Freelance', 'income', '#3B82F6', 'laptop', TRUE);

  -- 3. Transactions
  INSERT INTO public.transactions (user_id, account_id, category_id, type, amount, date, time, description, notes, tags) VALUES
    (v_user_id, v_acc_bca, v_cat_gaji, 'income', 18000000, CURRENT_DATE - INTERVAL '10 days', '09:00', 'Gaji Bulanan PT Tech Nusantara', 'Gaji bersih setelah pajak', ARRAY['salary', 'primary']),
    (v_user_id, v_acc_bca, v_cat_freelance, 'income', 4500000, CURRENT_DATE - INTERVAL '5 days', '14:30', 'Proyek Web Design Client SG', 'Termin 1', ARRAY['freelance']),
    (v_user_id, v_acc_bca, v_cat_belanja, 'expense', 1250000, CURRENT_DATE - INTERVAL '8 days', '18:20', 'Belanja Bulanan GrandLucky', 'Kebutuhan pokok rumah tangga', ARRAY['groceries']),
    (v_user_id, v_acc_gopay, v_cat_makan, 'expense', 45000, CURRENT_DATE - INTERVAL '2 days', '12:15', 'Makan Siang Bebek Sinjay', 'Bareng tim kantor', ARRAY['food']),
    (v_user_id, v_acc_bca, v_cat_tagihan, 'expense', 485000, CURRENT_DATE - INTERVAL '3 days', '10:00', 'Token Listrik PLN 500rb', 'Meteran rumah', ARRAY['utilities']),
    (v_user_id, v_acc_bca, v_cat_tagihan, 'expense', 385000, CURRENT_DATE - INTERVAL '4 days', '11:00', 'Internet Indihome 50Mbps', 'Tagihan bulanan', ARRAY['bills']);

  -- 4. Budgets
  INSERT INTO public.budgets (id, user_id, month, total_limit) VALUES
    (v_budget_id, v_user_id, DATE_TRUNC('month', CURRENT_DATE)::DATE, 8000000);

  INSERT INTO public.budget_categories (budget_id, category_id, amount_limit) VALUES
    (v_budget_id, v_cat_makan, 2500000),
    (v_budget_id, v_cat_transport, 1000000),
    (v_budget_id, v_cat_belanja, 2500000),
    (v_budget_id, v_cat_tagihan, 2000000);

  -- 5. Savings Goals
  INSERT INTO public.savings_goals (id, user_id, name, target_amount, current_amount, target_date, color, icon) VALUES
    (v_goal_laptop, v_user_id, 'MacBook Pro M3 Max', 32000000, 18500000, CURRENT_DATE + INTERVAL '90 days', '#8B5CF6', 'laptop'),
    (v_goal_darurat, v_user_id, 'Dana Darurat 6 Bulan', 60000000, 35000000, CURRENT_DATE + INTERVAL '300 days', '#10B981', 'shield-check');

  -- 6. Debts
  INSERT INTO public.debts (id, user_id, name, person_or_institution, type, total_amount, remaining_amount, interest_rate, due_date, minimum_payment) VALUES
    (v_debt_cicilan, v_user_id, 'Cicilan Smartphone BCA', 'Bank BCA', 'debt', 12000000, 4000000, 0, CURRENT_DATE + INTERVAL '12 days', 1000000);

  -- 7. Recurring
  INSERT INTO public.recurring_transactions (user_id, account_id, category_id, type, amount, description, frequency, start_date, next_occurrence, is_active) VALUES
    (v_user_id, v_acc_bca, v_cat_tagihan, 'expense', 186000, 'Netflix Premium 4K', 'monthly', CURRENT_DATE - INTERVAL '60 days', CURRENT_DATE + INTERVAL '5 days', TRUE),
    (v_user_id, v_acc_bca, v_cat_tagihan, 'expense', 54990, 'Spotify Premium Individual', 'monthly', CURRENT_DATE - INTERVAL '60 days', CURRENT_DATE + INTERVAL '8 days', TRUE);

  -- 8. Notifications
  INSERT INTO public.notifications (user_id, title, message, type) VALUES
    (v_user_id, 'Tagihan Netflix Segera Tiba', 'Tagihan Netflix Premium sebesar Rp 186.000 jatuh tempo dalam 5 hari.', 'recurring_due'),
    (v_user_id, 'Target Tabungan Mendekati Target', 'Selamat! Tabungan MacBook Pro M3 Max sudah mencapai 57.8%.', 'goal_reached');
END $$;
