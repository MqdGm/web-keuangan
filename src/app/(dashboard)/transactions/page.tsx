'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useFinance } from '@/lib/storage/finance-store';
import { formatCurrency } from '@/lib/utils/currency';
import { formatFriendlyDate } from '@/lib/utils/dates';
import { downloadTransactionsCsv } from '@/lib/utils/export-helpers';
import { DynamicIcon } from '@/components/ui/icon-helper';
import { TransactionModal } from '@/components/transactions/transaction-modal';
import { useToast } from '@/components/ui/toast';
import { Transaction, TransactionType } from '@/types/finance';
import {
  Search,
  Filter,
  Download,
  Plus,
  ArrowRightLeft,
  TrendingDown,
  TrendingUp,
  MoreVertical,
  Copy,
  Pencil,
  Trash2,
  Calendar,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function TransactionsPage() {
  const { filteredTransactions, accounts, categories, deleteTransaction, duplicateTransaction } = useFinance();
  const { success, error } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<TransactionType | 'all'>('all');
  const [selectedAccount, setSelectedAccount] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc'>('date-desc');

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const accountMap = useMemo(() => new Map(accounts.map((a) => [a.id, a])), [accounts]);
  const categoryMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

  // Filter and sort logic
  const displayedTransactions = useMemo(() => {
    let list = [...filteredTransactions];

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (t) =>
          t.description.toLowerCase().includes(q) ||
          (t.notes && t.notes.toLowerCase().includes(q)) ||
          (t.tags && t.tags.some((tag) => tag.toLowerCase().includes(q)))
      );
    }

    // Type filter
    if (selectedType !== 'all') {
      list = list.filter((t) => t.type === selectedType);
    }

    // Account filter
    if (selectedAccount !== 'all') {
      list = list.filter((t) => t.account_id === selectedAccount || t.to_account_id === selectedAccount);
    }

    // Category filter
    if (selectedCategory !== 'all') {
      list = list.filter((t) => t.category_id === selectedCategory);
    }

    // Sorting
    list.sort((a, b) => {
      if (sortBy === 'date-desc') {
        return new Date(b.date + 'T' + (b.time || '00:00')).getTime() - new Date(a.date + 'T' + (a.time || '00:00')).getTime();
      }
      if (sortBy === 'date-asc') {
        return new Date(a.date + 'T' + (a.time || '00:00')).getTime() - new Date(b.date + 'T' + (b.time || '00:00')).getTime();
      }
      if (sortBy === 'amount-desc') {
        return Number(b.amount) - Number(a.amount);
      }
      if (sortBy === 'amount-asc') {
        return Number(a.amount) - Number(b.amount);
      }
      return 0;
    });

    return list;
  }, [filteredTransactions, searchQuery, selectedType, selectedAccount, selectedCategory, sortBy]);

  // Summary stats for currently displayed items
  const stats = useMemo(() => {
    let inc = 0;
    let exp = 0;
    displayedTransactions.forEach((t) => {
      if (t.type === 'income') inc += Number(t.amount);
      if (t.type === 'expense') exp += Number(t.amount);
    });
    return { income: inc, expense: exp, net: inc - exp };
  }, [displayedTransactions]);

  const handleDelete = (id: string, desc: string) => {
    if (confirm(`Hapus transaksi "${desc}"? Saldo rekening akan disesuaikan kembali.`)) {
      deleteTransaction(id);
      success('Transaksi dihapus', `"${desc}" telah dihapus.`);
    }
  };

  const handleDuplicate = (id: string) => {
    duplicateTransaction(id);
    success('Transaksi disalin', 'Salinan transaksi dibuat untuk hari ini.');
  };

  const handleExportCsv = () => {
    if (displayedTransactions.length === 0) {
      error('Tidak ada data', 'Tidak ada transaksi untuk diekspor.');
      return;
    }
    downloadTransactionsCsv(displayedTransactions, accounts, categories);
    success('Unduhan siap', 'Berkas CSV transaksi berhasil diunduh.');
  };

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedType('all');
    setSelectedAccount('all');
    setSelectedCategory('all');
  };

  return (
    <div className="space-y-6">
      {/* Page Header with Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Riwayat Transaksi
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Total {displayedTransactions.length} transaksi ditemukan
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            className="h-10 text-xs font-semibold gap-1.5"
          >
            <Download className="w-4 h-4" />
            <span>Ekspor CSV</span>
          </Button>

          <Button
            size="sm"
            onClick={() => setIsAddModalOpen(true)}
            className="h-10 text-xs font-semibold gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Tambah Transaksi</span>
          </Button>
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-xl border border-emerald-500/20 bg-emerald-50/40 dark:bg-emerald-950/20 flex justify-between items-center">
          <div>
            <p className="text-[11px] font-medium text-emerald-700 dark:text-emerald-300">Pemasukan</p>
            <p className="text-base font-bold text-emerald-700 dark:text-emerald-300">{formatCurrency(stats.income)}</p>
          </div>
          <TrendingUp className="w-5 h-5 text-emerald-600" />
        </div>
        <div className="p-3.5 rounded-xl border border-rose-500/20 bg-rose-50/40 dark:bg-rose-950/20 flex justify-between items-center">
          <div>
            <p className="text-[11px] font-medium text-rose-700 dark:text-rose-300">Pengeluaran</p>
            <p className="text-base font-bold text-rose-700 dark:text-rose-300">{formatCurrency(stats.expense)}</p>
          </div>
          <TrendingDown className="w-5 h-5 text-rose-600" />
        </div>
        <div className="p-3.5 rounded-xl border border-blue-500/20 bg-blue-50/40 dark:bg-blue-950/20 flex justify-between items-center">
          <div>
            <p className="text-[11px] font-medium text-blue-700 dark:text-blue-300">Selisih Bersih</p>
            <p className="text-base font-bold text-blue-700 dark:text-blue-300">{formatCurrency(stats.net)}</p>
          </div>
          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300">
            {stats.net >= 0 ? 'Surplus' : 'Defisit'}
          </span>
        </div>
      </div>

      {/* Filter Bar */}
      <Card className="border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search Input */}
          <div className="relative lg:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Cari transaksi, toko, catatan, tag..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10 text-xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Type Filter */}
          <div>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as any)}
              className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">Semua Tipe Transaksi</option>
              <option value="expense">Hanya Pengeluaran</option>
              <option value="income">Hanya Pemasukan</option>
              <option value="transfer">Hanya Transfer</option>
            </select>
          </div>

          {/* Account Filter */}
          <div>
            <select
              value={selectedAccount}
              onChange={(e) => setSelectedAccount(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">Semua Rekening</option>
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name}
                </option>
              ))}
            </select>
          </div>

          {/* Sort Filter */}
          <div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="date-desc">Tanggal: Terbaru</option>
              <option value="date-asc">Tanggal: Terlama</option>
              <option value="amount-desc">Nominal: Terbesar</option>
              <option value="amount-asc">Nominal: Terkecil</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Transaction List */}
      <div className="space-y-3">
        {displayedTransactions.length === 0 ? (
          <Card className="p-12 text-center border-slate-200/80 dark:border-slate-800/80">
            <div className="max-w-xs mx-auto space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Belum ada transaksi
              </h3>
              <p className="text-xs text-slate-400">
                Tidak ada data yang cocok dengan kriteria filter atau periode waktu saat ini.
              </p>
              <div className="pt-2 flex justify-center gap-2">
                <Button variant="outline" size="sm" onClick={resetFilters} className="text-xs">
                  Reset Filter
                </Button>
                <Button
                  size="sm"
                  onClick={() => setIsAddModalOpen(true)}
                  className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  + Tambah Transaksi
                </Button>
              </div>
            </div>
          </Card>
        ) : (
          displayedTransactions.map((tx) => {
            const acc = accountMap.get(tx.account_id);
            const toAcc = tx.to_account_id ? accountMap.get(tx.to_account_id) : null;
            const cat = tx.category_id ? categoryMap.get(tx.category_id) : null;

            const isExpense = tx.type === 'expense';
            const isIncome = tx.type === 'income';
            const isTransfer = tx.type === 'transfer';

            return (
              <Card
                key={tx.id}
                className="hover:shadow-md transition-all border-slate-200/80 dark:border-slate-800/80 bg-white/90 dark:bg-slate-900/90"
              >
                <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  {/* Left info */}
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div
                      className={cn(
                        'w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 mt-0.5 shadow-sm',
                        isTransfer && 'bg-blue-600',
                        isExpense && 'bg-rose-500',
                        isIncome && 'bg-emerald-600'
                      )}
                      style={!isTransfer && cat?.color ? { backgroundColor: cat.color } : undefined}
                    >
                      {isTransfer ? (
                        <ArrowRightLeft className="w-5 h-5" />
                      ) : cat ? (
                        <DynamicIcon name={cat.icon} className="w-5 h-5" />
                      ) : isExpense ? (
                        <TrendingDown className="w-5 h-5" />
                      ) : (
                        <TrendingUp className="w-5 h-5" />
                      )}
                    </div>

                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                          {tx.description}
                        </h4>
                        <Badge
                          variant={isExpense ? 'destructive' : isIncome ? 'default' : 'info'}
                          className="text-[10px] font-medium px-2 py-0.2"
                        >
                          {isExpense ? 'Pengeluaran' : isIncome ? 'Pemasukan' : 'Transfer'}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-slate-400 flex-wrap">
                        <span>{formatFriendlyDate(tx.date)}</span>
                        {tx.time && <span>• {tx.time}</span>}
                        <span>•</span>
                        <span className="font-medium text-slate-600 dark:text-slate-300">
                          {isTransfer
                            ? `${acc?.name || 'Rekening'} ➔ ${toAcc?.name || 'Tujuan'}`
                            : acc?.name || 'Rekening'}
                        </span>
                        {cat && (
                          <>
                            <span>•</span>
                            <span className="text-slate-500 dark:text-slate-400">{cat.name}</span>
                          </>
                        )}
                      </div>

                      {tx.notes && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 italic">
                          &quot;{tx.notes}&quot;
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right info & Actions */}
                  <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                    <p
                      className={cn(
                        'text-base font-extrabold tracking-tight',
                        isExpense && 'text-rose-600 dark:text-rose-400',
                        isIncome && 'text-emerald-600 dark:text-emerald-400',
                        isTransfer && 'text-blue-600 dark:text-blue-400'
                      )}
                    >
                      {isExpense ? '-' : isIncome ? '+' : ''}
                      {formatCurrency(tx.amount)}
                    </p>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleDuplicate(tx.id)}
                        className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
                        title="Duplikat Transaksi"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setEditingTransaction(tx)}
                        className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
                        title="Edit Transaksi"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(tx.id, tx.description)}
                        className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-400 hover:text-rose-600 transition-colors"
                        title="Hapus Transaksi"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Add / Edit Transaction Modals */}
      <TransactionModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />

      {editingTransaction && (
        <TransactionModal
          isOpen={Boolean(editingTransaction)}
          onClose={() => setEditingTransaction(null)}
          transactionToEdit={editingTransaction}
        />
      )}
    </div>
  );
}
