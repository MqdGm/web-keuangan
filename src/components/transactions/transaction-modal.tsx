'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useFinance } from '@/lib/storage/finance-store';
import { useToast } from '@/components/ui/toast';
import { Transaction, TransactionType } from '@/types/finance';
import { formatCurrency, parseCurrencyInput, formatCurrencyInputValue } from '@/lib/utils/currency';
import { DynamicIcon } from '@/components/ui/icon-helper';
import { format } from 'date-fns';
import { ArrowRightLeft, TrendingDown, TrendingUp, Calendar, Clock, FileText, Wallet } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactionToEdit?: Transaction | null;
}

const QUICK_AMOUNTS = [
  { label: '+10rb', value: 10000 },
  { label: '+25rb', value: 25000 },
  { label: '+50rb', value: 50000 },
  { label: '+100rb', value: 100000 },
  { label: '+500rb', value: 500000 },
  { label: '+1jt', value: 1000000 },
];

export function TransactionModal({ isOpen, onClose, transactionToEdit }: TransactionModalProps) {
  const { accounts, categories, addTransaction, updateTransaction } = useFinance();
  const { success, error } = useToast();

  const [type, setType] = useState<TransactionType>('expense');
  const [amountStr, setAmountStr] = useState<string>('');
  const [accountId, setAccountId] = useState<string>('');
  const [toAccountId, setToAccountId] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [date, setDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [time, setTime] = useState<string>(format(new Date(), 'HH:mm'));
  const [description, setDescription] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize or reset form on open/edit
  useEffect(() => {
    if (transactionToEdit) {
      setType(transactionToEdit.type);
      setAmountStr(formatCurrencyInputValue(transactionToEdit.amount));
      setAccountId(transactionToEdit.account_id);
      setToAccountId(transactionToEdit.to_account_id || '');
      setCategoryId(transactionToEdit.category_id || '');
      setDate(transactionToEdit.date);
      setTime(transactionToEdit.time || format(new Date(), 'HH:mm'));
      setDescription(transactionToEdit.description);
      setNotes(transactionToEdit.notes || '');
    } else {
      setType('expense');
      setAmountStr('');
      setAccountId(accounts[0]?.id || '');
      setToAccountId(accounts[1]?.id || '');
      setCategoryId(categories.find((c) => c.type === 'expense')?.id || '');
      setDate(format(new Date(), 'yyyy-MM-dd'));
      setTime(format(new Date(), 'HH:mm'));
      setDescription('');
      setNotes('');
    }
  }, [transactionToEdit, isOpen, accounts, categories]);

  // Update default category when type changes
  const handleTypeChange = (newType: string) => {
    const t = newType as TransactionType;
    setType(t);
    if (t === 'expense' || t === 'income') {
      const matchCat = categories.find((c) => c.type === t);
      if (matchCat) setCategoryId(matchCat.id);
    }
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    const num = parseCurrencyInput(rawVal);
    setAmountStr(num > 0 ? formatCurrencyInputValue(num) : '');
  };

  const addQuickAmount = (val: number) => {
    const current = parseCurrencyInput(amountStr);
    const updated = current + val;
    setAmountStr(formatCurrencyInputValue(updated));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmount = parseCurrencyInput(amountStr);

    if (numericAmount <= 0) {
      error('Nominal tidak valid', 'Masukkan jumlah uang lebih dari 0');
      return;
    }

    if (!accountId) {
      error('Rekening belum dipilih', 'Pilih rekening asal untuk transaksi');
      return;
    }

    if (type === 'transfer' && (!toAccountId || toAccountId === accountId)) {
      error('Rekening tujuan tidak valid', 'Pilih rekening tujuan yang berbeda dari rekening asal');
      return;
    }

    if (!description.trim()) {
      error('Keterangan kosong', 'Isi deskripsi atau nama transaksi');
      return;
    }

    setIsSubmitting(true);

    try {
      if (transactionToEdit) {
        updateTransaction(transactionToEdit.id, {
          type,
          amount: numericAmount,
          account_id: accountId,
          to_account_id: type === 'transfer' ? toAccountId : undefined,
          category_id: type === 'transfer' ? undefined : categoryId,
          date,
          time,
          description: description.trim(),
          notes: notes.trim(),
        });
        success('Transaksi diperbarui', `${description} berhasil disimpan.`);
      } else {
        addTransaction({
          type,
          amount: numericAmount,
          account_id: accountId,
          to_account_id: type === 'transfer' ? toAccountId : undefined,
          category_id: type === 'transfer' ? undefined : categoryId,
          date,
          time,
          description: description.trim(),
          notes: notes.trim(),
        });
        success('Transaksi tersimpan', `${description} sejumlah ${formatCurrency(numericAmount)} tercatat.`);
      }

      onClose();
    } catch (err: any) {
      error('Gagal menyimpan', err.message || 'Terjadi kesalahan sistem');
    } finally {
      setIsSubmitting(false);
    }
  };

  const availableCategories = categories.filter((c) => c.type === (type === 'income' ? 'income' : 'expense'));

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md w-[95vw] p-5 sm:p-6 rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {transactionToEdit ? 'Edit Transaksi' : 'Catat Transaksi Cepat'}
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            {transactionToEdit
              ? 'Perbarui detail transaksi Anda'
              : 'Catat pemasukan, pengeluaran, atau transfer dalam hitungan detik'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {/* Transaction Type Tabs */}
          <Tabs value={type} onValueChange={handleTypeChange} className="w-full">
            <TabsList className="grid grid-cols-3 w-full h-11 p-1 bg-slate-100 dark:bg-slate-800">
              <TabsTrigger
                value="expense"
                className="text-xs font-semibold data-[state=active]:text-rose-600 dark:data-[state=active]:text-rose-400"
              >
                <TrendingDown className="w-3.5 h-3.5 mr-1.5" />
                Pengeluaran
              </TabsTrigger>
              <TabsTrigger
                value="income"
                className="text-xs font-semibold data-[state=active]:text-emerald-600 dark:data-[state=active]:text-emerald-400"
              >
                <TrendingUp className="w-3.5 h-3.5 mr-1.5" />
                Pemasukan
              </TabsTrigger>
              <TabsTrigger
                value="transfer"
                className="text-xs font-semibold data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400"
              >
                <ArrowRightLeft className="w-3.5 h-3.5 mr-1.5" />
                Transfer
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Big Amount Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Nominal (IDR)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-lg text-slate-400">
                Rp
              </span>
              <Input
                type="text"
                inputMode="numeric"
                autoFocus={!transactionToEdit}
                placeholder="0"
                value={amountStr}
                onChange={handleAmountChange}
                className="pl-12 text-2xl font-extrabold tracking-tight h-14 bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>

            {/* Quick Amount Chips */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {QUICK_AMOUNTS.map((q) => (
                <button
                  key={q.label}
                  type="button"
                  onClick={() => addQuickAmount(q.value)}
                  className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                >
                  {q.label}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Keterangan / Merchant
            </label>
            <Input
              type="text"
              placeholder="Contoh: Makan Siang, Beli Bensin, Gaji"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="h-11"
            />
          </div>

          {/* Account Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Wallet className="w-3.5 h-3.5" />
                <span>{type === 'transfer' ? 'Dari Rekening' : 'Rekening / Dompet'}</span>
              </label>
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="w-full h-11 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} ({formatCurrency(acc.balance)})
                  </option>
                ))}
              </select>
            </div>

            {type === 'transfer' ? (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <ArrowRightLeft className="w-3.5 h-3.5" />
                  <span>Ke Rekening</span>
                </label>
                <select
                  value={toAccountId}
                  onChange={(e) => setToAccountId(e.target.value)}
                  className="w-full h-11 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">Pilih Rekening Tujuan</option>
                  {accounts
                    .filter((a) => a.id !== accountId)
                    .map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name} ({formatCurrency(acc.balance)})
                      </option>
                    ))}
                </select>
              </div>
            ) : (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Kategori
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full h-11 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {availableCategories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>Tanggal</span>
              </label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="h-11"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                <span>Waktu</span>
              </label>
              <Input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="h-11"
              />
            </div>
          </div>

          {/* Notes (Optional) */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <FileText className="w-3.5 h-3.5" />
              <span>Catatan Tambahan (Opsional)</span>
            </label>
            <Input
              type="text"
              placeholder="Tambahkan catatan singkat..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="h-10 text-xs"
            />
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="h-11"
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className={cn(
                'h-11 font-semibold text-white transition-all',
                type === 'expense' && 'bg-rose-600 hover:bg-rose-700',
                type === 'income' && 'bg-emerald-600 hover:bg-emerald-700',
                type === 'transfer' && 'bg-blue-600 hover:bg-blue-700'
              )}
            >
              {transactionToEdit ? 'Simpan Perubahan' : 'Catat Sekarang'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
