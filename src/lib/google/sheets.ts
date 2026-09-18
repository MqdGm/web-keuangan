import { Account, Category, Transaction, Budget, BudgetCategory } from '@/types/finance';

export interface GoogleSheetsSyncPayload {
  spreadsheetTitle: string;
  sheets: {
    transactions: (string | number)[][];
    accounts: (string | number)[][];
    categories: (string | number)[][];
    budgets: (string | number)[][];
    monthlySummary: (string | number)[][];
  };
}

/**
 * Builds the complete 5-sheet workbook structure for Google Sheets
 */
export function buildGoogleSheetsData(
  transactions: Transaction[],
  accounts: Account[],
  categories: Category[],
  budgets: Budget[],
  budgetCategories: BudgetCategory[]
): GoogleSheetsSyncPayload {
  const accountMap = new Map(accounts.map((a) => [a.id, a.name]));
  const categoryMap = new Map(categories.map((c) => [c.id, c.name]));

  // 1. Transactions Sheet
  const txHeader = ['ID', 'Tanggal', 'Waktu', 'Tipe', 'Kategori', 'Rekening', 'Tujuan', 'Nominal (IDR)', 'Keterangan', 'Catatan'];
  const txRows = transactions.map((t) => [
    t.id,
    t.date,
    t.time || '',
    t.type.toUpperCase(),
    t.category_id ? categoryMap.get(t.category_id) || 'Lainnya' : 'Lainnya',
    accountMap.get(t.account_id) || '',
    t.to_account_id ? accountMap.get(t.to_account_id) || '' : '',
    t.amount,
    t.description,
    t.notes || '',
  ]);

  // 2. Accounts Sheet
  const accHeader = ['ID', 'Nama Rekening', 'Tipe', 'Saldo Saat Ini (IDR)', 'Saldo Awal (IDR)', 'Institusi', 'Nomor Rekening', 'Status'];
  const accRows = accounts.map((a) => [
    a.id,
    a.name,
    a.type.toUpperCase(),
    a.balance,
    a.initial_balance,
    a.institution || '',
    a.account_number || '',
    a.is_active ? 'AKTIF' : 'NONAKTIF',
  ]);

  // 3. Categories Sheet
  const catHeader = ['ID', 'Nama Kategori', 'Tipe', 'Warna', 'Ikon'];
  const catRows = categories.map((c) => [
    c.id,
    c.name,
    c.type.toUpperCase(),
    c.color,
    c.icon,
  ]);

  // 4. Budgets Sheet
  const budgetHeader = ['Bulan', 'Kategori', 'Batas Anggaran (IDR)'];
  const budgetRows: (string | number)[][] = [];
  budgetCategories.forEach((bc) => {
    const b = budgets.find((item) => item.id === bc.budget_id);
    budgetRows.push([
      b?.month || 'Bulan Ini',
      categoryMap.get(bc.category_id) || 'Kategori',
      bc.amount_limit,
    ]);
  });

  // 5. Monthly Summary Sheet
  const summaryHeader = ['Bulan', 'Total Pemasukan (IDR)', 'Total Pengeluaran (IDR)', 'Net Cashflow (IDR)', 'Savings Rate (%)'];
  const monthMap: Record<string, { inc: number; exp: number }> = {};
  transactions.forEach((t) => {
    const m = t.date.slice(0, 7);
    if (!monthMap[m]) monthMap[m] = { inc: 0, exp: 0 };
    if (t.type === 'income') monthMap[m].inc += Number(t.amount);
    if (t.type === 'expense') monthMap[m].exp += Number(t.amount);
  });

  const summaryRows = Object.entries(monthMap)
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([m, val]) => {
      const net = val.inc - val.exp;
      const rate = val.inc > 0 ? Math.round(((val.inc - val.exp) / val.inc) * 100) : 0;
      return [m, val.inc, val.exp, net, `${rate}%`];
    });

  return {
    spreadsheetTitle: `Keuangan Finansial Sync - ${new Date().toISOString().slice(0, 10)}`,
    sheets: {
      transactions: [txHeader, ...txRows],
      accounts: [accHeader, ...accRows],
      categories: [catHeader, ...catRows],
      budgets: [budgetHeader, ...budgetRows],
      monthlySummary: [summaryHeader, ...summaryRows],
    },
  };
}
