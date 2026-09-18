'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { useFinance } from '@/lib/storage/finance-store';
import { formatCurrency, parseCurrencyInput, formatCurrencyInputValue } from '@/lib/utils/currency';
import { formatDate } from '@/lib/utils/dates';
import { useToast } from '@/components/ui/toast';
import { RecurringTransaction, RecurringFrequency } from '@/types/finance';
import {
  Repeat,
  Plus,
  Pencil,
  Trash2,
  Calendar,
  Check,
  TrendingDown,
  TrendingUp,
  Clock,
  Play,
  Pause,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, addDays } from 'date-fns';

const FREQUENCY_LABELS: Record<RecurringFrequency, string> = {
  daily: 'Harian',
  weekly: 'Mingguan',
  monthly: 'Bulanan',
  yearly: 'Tahunan',
};

export default function RecurringPage() {
  const {
    recurringTransactions,
    accounts,
    categories,
    addRecurring,
    updateRecurring,
    deleteRecurring,
    executeRecurringNow,
  } = useFinance();
  const { success, error } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecurring, setEditingRecurring] = useState<RecurringTransaction | null>(null);

  // Form states
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [amountStr, setAmountStr] = useState('');
  const [accountId, setAccountId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [frequency, setFrequency] = useState<RecurringFrequency>('monthly');
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [nextOccurrence, setNextOccurrence] = useState(format(new Date(), 'yyyy-MM-dd'));

  const accountMap = new Map(accounts.map((a) => [a.id, a]));
  const categoryMap = new Map(categories.map((c) => [c.id, c]));

  const openAddModal = () => {
    setEditingRecurring(null);
    setDescription('');
    setType('expense');
    setAmountStr('');
    setAccountId(accounts[0]?.id || '');
    setCategoryId(categories.find((c) => c.type === 'expense')?.id || '');
    setFrequency('monthly');
    setStartDate(format(new Date(), 'yyyy-MM-dd'));
    setNextOccurrence(format(new Date(), 'yyyy-MM-dd'));
    setIsModalOpen(true);
  };

  const openEditModal = (rec: RecurringTransaction) => {
    setEditingRecurring(rec);
    setDescription(rec.description);
    setType(rec.type);
    setAmountStr(formatCurrencyInputValue(rec.amount));
    setAccountId(rec.account_id);
    setCategoryId(rec.category_id || '');
    setFrequency(rec.frequency);
    setStartDate(rec.start_date);
    setNextOccurrence(rec.next_occurrence);
    setIsModalOpen(true);
  };

  const handleSaveRecurring = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseCurrencyInput(amountStr);

    if (!description.trim()) {
      error('Keterangan wajib diisi');
      return;
    }
    if (amount <= 0) {
      error('Nominal harus lebih dari 0');
      return;
    }
    if (!accountId) {
      error('Pilih rekening untuk transaksi berulang');
      return;
    }

    if (editingRecurring) {
      updateRecurring(editingRecurring.id, {
        description: description.trim(),
        type,
        amount,
        account_id: accountId,
        category_id: categoryId || undefined,
        frequency,
        start_date: startDate,
        next_occurrence: nextOccurrence,
      });
      success('Jadwal diperbarui', `Transaksi berulang ${description} berhasil disimpan.`);
    } else {
      addRecurring({
        description: description.trim(),
        type,
        amount,
        account_id: accountId,
        category_id: categoryId || undefined,
        frequency,
        start_date: startDate,
        next_occurrence: nextOccurrence,
        auto_create: false,
        is_active: true,
      });
      success('Jadwal dibuat', `Transaksi berulang ${description} berhasil ditambahkan.`);
    }
    setIsModalOpen(false);
  };

  const handleExecuteNow = (id: string, desc: string) => {
    executeRecurringNow(id);
    success('Transaksi dicatat', `"${desc}" telah dicatat pada pembukuan dan tanggal berikutnya telah dimajukan.`);
  };

  const handleToggleActive = (rec: RecurringTransaction) => {
    updateRecurring(rec.id, { is_active: !rec.is_active });
    success(rec.is_active ? 'Jadwal dinonaktifkan' : 'Jadwal diaktifkan');
  };

  const handleDelete = (id: string, desc: string) => {
    if (confirm(`Hapus jadwal transaksi berulang "${desc}"?`)) {
      deleteRecurring(id);
      success('Jadwal dihapus', `"${desc}" telah dihapus.`);
    }
  };

  // Monthly commitments calculation
  const monthlyCommitment = recurringTransactions
    .filter((r) => r.is_active && r.type === 'expense')
    .reduce((sum, r) => {
      let monthlyAmt = Number(r.amount);
      if (r.frequency === 'daily') monthlyAmt = Number(r.amount) * 30;
      else if (r.frequency === 'weekly') monthlyAmt = Number(r.amount) * 4;
      else if (r.frequency === 'yearly') monthlyAmt = Math.round(Number(r.amount) / 12);
      return sum + monthlyAmt;
    }, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Transaksi Berulang & Langganan
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Atur tagihan rutin, biaya sewa, internet, dan langganan bulanan tanpa terlewat
          </p>
        </div>

        <Button
          onClick={openAddModal}
          className="h-10 text-xs font-semibold gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>+ Buat Jadwal Berulang</span>
        </Button>
      </div>

      {/* KPI Card */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="border-indigo-200 dark:border-indigo-900/50 bg-indigo-50/40 dark:bg-indigo-950/20 p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
              Estimasi Pengeluaran Rutin / Bulan
            </span>
            <Repeat className="w-5 h-5 text-indigo-600" />
          </div>
          <p className="text-2xl font-black text-indigo-700 dark:text-indigo-300 mt-2">
            {formatCurrency(monthlyCommitment)}
          </p>
          <p className="text-xs text-indigo-600/80 dark:text-indigo-400/80 mt-1">
            Dari {recurringTransactions.filter((r) => r.is_active).length} jadwal aktif
          </p>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Tagihan Terdekat
            </span>
            <Clock className="w-5 h-5 text-emerald-600" />
          </div>
          <p className="text-xl font-bold text-slate-900 dark:text-white mt-2">
            {recurringTransactions[0]?.description || 'Tidak ada'}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            {recurringTransactions[0]?.next_occurrence
              ? `Jatuh tempo: ${formatDate(recurringTransactions[0].next_occurrence, 'dd MMMM yyyy')}`
              : 'Semua tagihan terkendali'}
          </p>
        </Card>
      </div>

      {/* List */}
      <div className="space-y-3">
        {recurringTransactions.length === 0 ? (
          <Card className="p-12 text-center border-slate-200 dark:border-slate-800">
            <div className="max-w-xs mx-auto space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                <Repeat className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Belum ada transaksi berulang
              </h3>
              <p className="text-xs text-slate-400">
                Tambahkan biaya langganan seperti Wifi, Netflix, atau tagihan listrik untuk pengingat otomatis.
              </p>
              <Button onClick={openAddModal} size="sm" className="text-xs bg-emerald-600 text-white">
                + Tambah Sekarang
              </Button>
            </div>
          </Card>
        ) : (
          recurringTransactions.map((rec) => {
            const acc = accountMap.get(rec.account_id);
            const cat = rec.category_id ? categoryMap.get(rec.category_id) : null;
            const isExpense = rec.type === 'expense';

            return (
              <Card
                key={rec.id}
                className={cn(
                  'border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 transition-all',
                  !rec.is_active && 'opacity-60 bg-slate-50 dark:bg-slate-950'
                )}
              >
                <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div
                      className={cn(
                        'w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0',
                        isExpense ? 'bg-rose-500' : 'bg-emerald-600'
                      )}
                    >
                      {isExpense ? <TrendingDown className="w-5 h-5" /> : <TrendingUp className="w-5 h-5" />}
                    </div>

                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                          {rec.description}
                        </h4>
                        <Badge variant="secondary" className="text-[10px] uppercase">
                          {FREQUENCY_LABELS[rec.frequency]}
                        </Badge>
                        {!rec.is_active && (
                          <Badge variant="outline" className="text-[10px]">
                            Jeda
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-xs text-slate-400 flex-wrap">
                        <span className="flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300">
                          <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                          Berikutnya: {formatDate(rec.next_occurrence, 'dd MMM yyyy')}
                        </span>
                        <span>•</span>
                        <span>{acc?.name || 'Rekening'}</span>
                        {cat && (
                          <>
                            <span>•</span>
                            <span>{cat.name}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions & Price */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                    <div className="text-left sm:text-right">
                      <p
                        className={cn(
                          'text-base font-extrabold',
                          isExpense ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
                        )}
                      >
                        {formatCurrency(rec.amount)}
                      </p>
                      <p className="text-[10px] text-slate-400">per {FREQUENCY_LABELS[rec.frequency].toLowerCase()}</p>
                    </div>

                    <Button
                      size="sm"
                      onClick={() => handleExecuteNow(rec.id, rec.description)}
                      className="h-8 text-xs font-semibold gap-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                      title="Catat transaksi sekarang dan perbarui jadwal"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Catat Sekarang</span>
                    </Button>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleToggleActive(rec)}
                        className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors"
                        title={rec.is_active ? 'Jeda Jadwal' : 'Aktifkan Jadwal'}
                      >
                        {rec.is_active ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => openEditModal(rec)}
                        className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 transition-colors"
                        title="Edit Jadwal"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(rec.id, rec.description)}
                        className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-400 hover:text-rose-600 transition-colors"
                        title="Hapus Jadwal"
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

      {/* Add / Edit Recurring Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md w-[95vw] p-6 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              {editingRecurring ? 'Edit Jadwal Berulang' : 'Buat Transaksi Berulang Baru'}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Otomatisasi pengingat dan pencatatan pengeluaran atau pemasukan rutin
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveRecurring} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase">Keterangan Transaksi</label>
              <Input
                placeholder="Contoh: Netflix Family, Tagihan Wifi, Gaji"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase">Tipe</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as any)}
                  className="w-full h-11 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-medium"
                >
                  <option value="expense">Pengeluaran</option>
                  <option value="income">Pemasukan</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase">Frekuensi</label>
                <select
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value as RecurringFrequency)}
                  className="w-full h-11 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-medium"
                >
                  <option value="daily">Harian</option>
                  <option value="weekly">Mingguan</option>
                  <option value="monthly">Bulanan</option>
                  <option value="yearly">Tahunan</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase">Nominal (IDR)</label>
              <Input
                placeholder="0"
                value={amountStr}
                onChange={(e) => {
                  const num = parseCurrencyInput(e.target.value);
                  setAmountStr(num > 0 ? formatCurrencyInputValue(num) : '');
                }}
                className="text-lg font-bold h-12"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase">Rekening</label>
                <select
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  className="w-full h-11 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-medium"
                >
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase">Kategori</label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full h-11 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-medium"
                >
                  <option value="">Pilih Kategori</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase">Tanggal Mulai</label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase">Jadwal Pertama</label>
                <Input
                  type="date"
                  value={nextOccurrence}
                  onChange={(e) => setNextOccurrence(e.target.value)}
                />
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                Batal
              </Button>
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white">
                {editingRecurring ? 'Simpan Perubahan' : 'Buat Jadwal'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
