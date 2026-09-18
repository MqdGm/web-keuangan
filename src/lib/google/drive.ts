import { FinanceExportData } from '@/types/finance';

export interface GoogleDriveBackupMetadata {
  fileId?: string;
  fileName: string;
  backupDate: string;
  sizeBytes: number;
  recordCount: {
    accounts: number;
    transactions: number;
    budgets: number;
    savingsGoals: number;
    debts: number;
  };
}

export function createGoogleDriveBackupPayload(data: FinanceExportData): {
  fileName: string;
  mimeType: string;
  body: string;
  metadata: GoogleDriveBackupMetadata;
} {
  const jsonString = JSON.stringify(data, null, 2);
  const dateStr = new Date().toISOString().slice(0, 10);
  const fileName = `keuangan_backup_${dateStr}.json`;

  return {
    fileName,
    mimeType: 'application/json',
    body: jsonString,
    metadata: {
      fileName,
      backupDate: new Date().toISOString(),
      sizeBytes: new Blob([jsonString]).size,
      recordCount: {
        accounts: data.accounts.length,
        transactions: data.transactions.length,
        budgets: data.budgets.length,
        savingsGoals: data.savings_goals.length,
        debts: data.debts.length,
      },
    },
  };
}
