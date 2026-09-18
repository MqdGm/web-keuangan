import { Transaction, Account, Category, FinanceExportData } from '@/types/finance';

/**
 * Converts transactions into CSV format
 */
export function exportTransactionsToCSV(
  transactions: Transaction[],
  accounts: Account[],
  categories: Category[]
): string {
  const accountMap = new Map(accounts.map((a) => [a.id, a.name]));
  const categoryMap = new Map(categories.map((c) => [c.id, c.name]));

  const headers = ['ID', 'Tanggal', 'Waktu', 'Tipe', 'Kategori', 'Rekening/Dompet', 'Rekening Tujuan', 'Nominal (IDR)', 'Deskripsi', 'Catatan', 'Tags'];
  
  const rows = transactions.map((t) => {
    const accName = accountMap.get(t.account_id) || 'Tidak Diketahui';
    const toAccName = t.to_account_id ? accountMap.get(t.to_account_id) || '' : '';
    const catName = t.category_id ? categoryMap.get(t.category_id) || 'Tanpa Kategori' : '';
    const tagList = (t.tags || []).join(';');

    return [
      `"${t.id}"`,
      `"${t.date}"`,
      `"${t.time || ''}"`,
      `"${t.type}"`,
      `"${catName}"`,
      `"${accName}"`,
      `"${toAccName}"`,
      t.amount,
      `"${(t.description || '').replace(/"/g, '""')}"`,
      `"${(t.notes || '').replace(/"/g, '""')}"`,
      `"${tagList}"`,
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\r\n');
}

/**
 * Triggers in-browser file download
 */
export function downloadFile(content: string, fileName: string, contentType: string) {
  const blob = new Blob([content], { type: contentType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Downloads full JSON backup
 */
export function downloadJsonBackup(data: FinanceExportData) {
  const jsonStr = JSON.stringify(data, null, 2);
  const dateStr = new Date().toISOString().slice(0, 10);
  downloadFile(jsonStr, `keuangan-backup-${dateStr}.json`, 'application/json');
}

/**
 * Downloads CSV of transactions
 */
export function downloadTransactionsCsv(
  transactions: Transaction[],
  accounts: Account[],
  categories: Category[]
) {
  const csvStr = exportTransactionsToCSV(transactions, accounts, categories);
  const dateStr = new Date().toISOString().slice(0, 10);
  downloadFile(csvStr, `transaksi-keuangan-${dateStr}.csv`, 'text/csv;charset=utf-8;');
}
