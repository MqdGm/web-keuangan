'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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
import { Debt, DebtType } from '@/types/finance';
import {
  HandCoins,
  Plus,
  Pencil,
  Trash2,
  Calendar,
  CreditCard,
  UserCheck,
  CheckCircle2,
  ArrowDownLeft,
  ArrowUpRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function DebtsPage() {
  const { debts, accounts, addDebt, updateDebt, deleteDebt, recordDebtPayment } = useFinance();
  const { success, error } = useToast();

  const [isDebtModalOpen, setIsDebtModalOpen] = useState(false);
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null);

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedDebtForPayment, setSelectedDebtForPayment] = useState<Debt | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [person, setPerson] = useState('');
  const [type, setType] = useState<DebtType>('debt');
  const [totalAmountStr, setTotalAmountStr] = useState('');
  const [remainingAmountStr, setRemainingAmountStr] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [minPaymentStr, setMinPaymentStr] = useState('');
  const [notes, setNotes] = useState('');

  // Payment form states
  const [paymentAmountStr, setPaymentAmountStr] = useState('');
  const [paymentAccountId, setPaymentAccountId] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');

  const openAddDebt = (defaultType: DebtType = 'debt') => {
    setEditingDebt(null);
    setName('');
    setPerson('');
    setType(defaultType);
    setTotalAmountStr('');
    setRemainingAmountStr('');
    setDueDate('');
    setMinPaymentStr('');
    setNotes('');
    setIsDebtModalOpen(true);
  };

  const openEditDebt = (debt: Debt) => {
    setEditingDebt(debt);
    setName(debt.name);
    setPerson(debt.person_or_institution);
    setType(debt.type);
    setTotalAmountStr(formatCurrencyInputValue(debt.total_amount));
    setRemainingAmountStr(formatCurrencyInputValue(debt.remaining_amount));
    setDueDate(debt.due_date || '');
    setMinPaymentStr(debt.minimum_payment ? formatCurrencyInputValue(debt.minimum_payment) : '');
    setNotes(debt.notes || '');
    setIsDebtModalOpen(true);
  };

  const openPaymentModal = (debt: Debt) => {
    setSelectedDebtForPayment(debt);
    setPaymentAmountStr(debt.minimum_payment ? formatCurrencyInputValue(debt.minimum_payment) : '');
    setPaymentAccountId(accounts[0]?.id || '');
    setPaymentNotes('');
    setIsPaymentModalOpen(true);
  };

  const handleSaveDebt = (e: React.FormEvent) => {
    e.preventDefault();
    const total = parseCurrencyInput(totalAmountStr);
    const rem = remainingAmountStr ? parseCurrencyInput(remainingAmountStr) : total;
    const minPay = minPaymentStr ? parseCurrencyInput(minPaymentStr) : undefined;

    if (!name.trim() || !person.trim()) {
      error('Keterangan dan nama pihak/lembaga wajib diisi');
      return;
    }
    if (total <= 0) {
      error('Nominal harus lebih dari 0');
      return;
    }

    if (editingDebt) {
      updateDebt(editingDebt.id, {
        name: name.trim(),
        person_or_institution: person.trim(),
        type,
        total_amount: total,
        remaining_amount: rem,
        due_date: dueDate || undefined,
        minimum_payment: minPay,
        notes: notes.trim(),
        status: rem === 0 ? 'paid' : 'active',
      });
      success('Data diperbarui', `Catatan ${name} berhasil disimpan.`);
    } else {
      addDebt({
        name: name.trim(),
        person_or_institution: person.trim(),
        type,
        total_amount: total,
        remaining_amount: rem,
        due_date: dueDate || undefined,
        minimum_payment: minPay,
        notes: notes.trim(),
        status: rem === 0 ? 'paid' : 'active',
      });
      success('Catatan ditambahkan', `${name} berhasil ditambahkan.`);
    }
    setIsDebtModalOpen(false);
  };

  const handleSavePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDebtForPayment) return;

    const amount = parseCurrencyInput(paymentAmountStr);
    if (amount <= 0) {
      error('Nominal pembayaran harus lebih dari 0');
      return;
    }

    recordDebtPayment(selectedDebtForPayment.id, amount, paymentAccountId || undefined, paymentNotes);
    success(
      'Pembayaran dicatat',
      `Pembayaran ${formatCurrency(amount)} untuk ${selectedDebtForPayment.name} berhasil dicatat.`
    );
    setIsPaymentModalOpen(false);
  };

  const handleDeleteDebt = (id: string, debtName: string) => {
    if (confirm(`Hapus catatan "${debtName}"?`)) {
      deleteDebt(id);
      success('Data dihapus', `${debtName} telah dihapus.`);
    }
  };

  // Group debts into Hutang (we owe) and Piutang (they owe us)
  const myDebts = debts.filter((d) => d.type === 'debt');
  const myReceivables = debts.filter((d) => d.type === 'receivable');

  const totalDebtRemaining = myDebts.reduce((s, d) => s + Number(d.remaining_amount), 0);
  const totalReceivableRemaining = myReceivables.reduce((s, d) => s + Number(d.remaining_amount), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Hutang & Piutang
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Lacak pinjaman yang harus dibayar serta tagihan piutang dari rekan atau pihak lain
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => openAddDebt('debt')}
            className="h-10 text-xs font-semibold gap-1.5 bg-rose-600 hover:bg-rose-700 text-white"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>+ Catat Hutang</span>
          </Button>
          <Button
            size="sm"
            onClick={() => openAddDebt('receivable')}
            className="h-10 text-xs font-semibold gap-1.5 bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>+ Catat Piutang</span>
          </Button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="border-rose-200 dark:border-rose-900/50 bg-rose-50/40 dark:bg-rose-950/20 p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-700 dark:text-rose-300">
              Total Sisa Hutang Kita
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-600 flex items-center justify-center">
              <ArrowUpRight className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-rose-700 dark:text-rose-300 mt-2">
            {formatCurrency(totalDebtRemaining)}
          </p>
          <p className="text-xs text-rose-600/80 dark:text-rose-400/80 mt-1">
            {myDebts.filter((d) => d.status === 'active').length} kewajiban pinjaman aktif
          </p>
        </Card>

        <Card className="border-blue-200 dark:border-blue-900/50 bg-blue-50/40 dark:bg-blue-950/20 p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300">
              Total Sisa Piutang (Dipinjam Orang)
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-600 flex items-center justify-center">
              <ArrowDownLeft className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-blue-700 dark:text-blue-300 mt-2">
            {formatCurrency(totalReceivableRemaining)}
          </p>
          <p className="text-xs text-blue-600/80 dark:text-blue-400/80 mt-1">
            {myReceivables.filter((d) => d.status === 'active').length} piutang belum lunas
          </p>
        </Card>
      </div>

      {/* Debts List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Hutang Column */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              Daftar Hutang (Kewajiban)
            </h3>
            <span className="text-xs text-slate-400">{myDebts.length} catatan</span>
          </div>

          {myDebts.length === 0 ? (
            <Card className="p-6 text-center border-slate-200 dark:border-slate-800">
              <p className="text-xs text-slate-400">Tidak ada catatan hutang aktif</p>
            </Card>
          ) : (
            myDebts.map((d) => {
              const paid = d.total_amount - d.remaining_amount;
              const percent = Math.min(100, Math.round((paid / d.total_amount) * 100));
              const isPaid = d.remaining_amount === 0;

              return (
                <Card
                  key={d.id}
                  className="border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 p-5 space-y-4"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-base text-slate-900 dark:text-white">
                        {d.name}
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Kreditur: <span className="font-medium text-slate-600 dark:text-slate-300">{d.person_or_institution}</span>
                      </p>
                      {d.due_date && (
                        <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>Jatuh tempo: {formatDate(d.due_date, 'dd MMM yyyy')}</span>
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditDebt(d)}
                        className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteDebt(d.id, d.name)}
                        className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-400 hover:text-rose-600 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Progress and values */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-baseline">
                      <span className="text-lg font-extrabold text-rose-600 dark:text-rose-400">
                        Sisa: {formatCurrency(d.remaining_amount)}
                      </span>
                      <span className="text-xs text-slate-400">
                        Total: {formatCurrency(d.total_amount)}
                      </span>
                    </div>

                    <Progress value={percent} indicatorClassName="bg-rose-500" />

                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>Sudah dibayar: {formatCurrency(paid)} ({percent}%)</span>
                      {d.minimum_payment && (
                        <span>Min. bayar: {formatCurrency(d.minimum_payment)}</span>
                      )}
                    </div>
                  </div>

                  <Button
                    onClick={() => openPaymentModal(d)}
                    disabled={isPaid}
                    className={cn(
                      'w-full h-9 text-xs font-semibold text-white',
                      isPaid ? 'bg-slate-400 cursor-not-allowed' : 'bg-rose-600 hover:bg-rose-700'
                    )}
                  >
                    {isPaid ? 'Lunas Sepenuhnya' : 'Catat Pembayaran Hutang'}
                  </Button>
                </Card>
              );
            })
          )}
        </div>

        {/* Piutang Column */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
              Daftar Piutang (Dipinjam Pihak Lain)
            </h3>
            <span className="text-xs text-slate-400">{myReceivables.length} catatan</span>
          </div>

          {myReceivables.length === 0 ? (
            <Card className="p-6 text-center border-slate-200 dark:border-slate-800">
              <p className="text-xs text-slate-400">Tidak ada catatan piutang aktif</p>
            </Card>
          ) : (
            myReceivables.map((d) => {
              const paid = d.total_amount - d.remaining_amount;
              const percent = Math.min(100, Math.round((paid / d.total_amount) * 100));
              const isPaid = d.remaining_amount === 0;

              return (
                <Card
                  key={d.id}
                  className="border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 p-5 space-y-4"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-base text-slate-900 dark:text-white">
                        {d.name}
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Peminjam: <span className="font-medium text-slate-600 dark:text-slate-300">{d.person_or_institution}</span>
                      </p>
                      {d.due_date && (
                        <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>Janji bayar: {formatDate(d.due_date, 'dd MMM yyyy')}</span>
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditDebt(d)}
                        className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteDebt(d.id, d.name)}
                        className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-400 hover:text-rose-600 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Progress and values */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-baseline">
                      <span className="text-lg font-extrabold text-blue-600 dark:text-blue-400">
                        Sisa: {formatCurrency(d.remaining_amount)}
                      </span>
                      <span className="text-xs text-slate-400">
                        Total: {formatCurrency(d.total_amount)}
                      </span>
                    </div>

                    <Progress value={percent} indicatorClassName="bg-blue-500" />

                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>Sudah dikembalikan: {formatCurrency(paid)} ({percent}%)</span>
                    </div>
                  </div>

                  <Button
                    onClick={() => openPaymentModal(d)}
                    disabled={isPaid}
                    className={cn(
                      'w-full h-9 text-xs font-semibold text-white',
                      isPaid ? 'bg-slate-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                    )}
                  >
                    {isPaid ? 'Sudah Lunas' : 'Catat Penerimaan Cicilan'}
                  </Button>
                </Card>
              );
            })
          )}
        </div>
      </div>

      {/* Debt Add / Edit Modal */}
      <Dialog open={isDebtModalOpen} onOpenChange={setIsDebtModalOpen}>
        <DialogContent className="max-w-md w-[95vw] p-6 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              {editingDebt ? 'Edit Data Hutang/Piutang' : 'Catat Hutang / Piutang Baru'}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Lacak pinjaman, kredit bank, atau piutang ke rekan
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveDebt} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase">Tipe Catatan</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setType('debt')}
                  className={cn(
                    'h-10 rounded-xl text-xs font-bold border transition-all',
                    type === 'debt'
                      ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-500 text-rose-700 dark:text-rose-300'
                      : 'border-slate-200 dark:border-slate-700 text-slate-500'
                  )}
                >
                  Hutang (Kewajiban Kita)
                </button>
                <button
                  type="button"
                  onClick={() => setType('receivable')}
                  className={cn(
                    'h-10 rounded-xl text-xs font-bold border transition-all',
                    type === 'receivable'
                      ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-500 text-blue-700 dark:text-blue-300'
                      : 'border-slate-200 dark:border-slate-700 text-slate-500'
                  )}
                >
                  Piutang (Orang Lain)
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase">Keterangan Pinjaman</label>
              <Input
                placeholder="Contoh: Cicilan Smartphone BCA, Pinjaman ke Teman"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase">
                {type === 'debt' ? 'Nama Pemberi Pinjaman / Bank' : 'Nama Peminjam / Debitur'}
              </label>
              <Input
                placeholder="Contoh: Bank BCA, Budi Santoso"
                value={person}
                onChange={(e) => setPerson(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase">Total Pokok (IDR)</label>
                <Input
                  placeholder="0"
                  value={totalAmountStr}
                  onChange={(e) => {
                    const num = parseCurrencyInput(e.target.value);
                    setTotalAmountStr(num > 0 ? formatCurrencyInputValue(num) : '');
                  }}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase">Sisa Belum Lunas (IDR)</label>
                <Input
                  placeholder="0"
                  value={remainingAmountStr}
                  onChange={(e) => {
                    const num = parseCurrencyInput(e.target.value);
                    setRemainingAmountStr(num > 0 ? formatCurrencyInputValue(num) : '');
                  }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase">Jatuh Tempo</label>
                <Input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase">Min. Cicilan / Bln</label>
                <Input
                  placeholder="0"
                  value={minPaymentStr}
                  onChange={(e) => {
                    const num = parseCurrencyInput(e.target.value);
                    setMinPaymentStr(num > 0 ? formatCurrencyInputValue(num) : '');
                  }}
                />
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsDebtModalOpen(false)}>
                Batal
              </Button>
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white">
                {editingDebt ? 'Simpan Perubahan' : 'Simpan Data'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Record Payment Modal */}
      <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
        <DialogContent className="max-w-md w-[95vw] p-6 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-emerald-600" />
              {selectedDebtForPayment?.type === 'debt' ? 'Bayar Cicilan Hutang' : 'Terima Pembayaran Piutang'}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Catat mutasi untuk &quot;{selectedDebtForPayment?.name}&quot;
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSavePayment} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase">Nominal Pembayaran (IDR)</label>
              <Input
                placeholder="0"
                value={paymentAmountStr}
                onChange={(e) => {
                  const num = parseCurrencyInput(e.target.value);
                  setPaymentAmountStr(num > 0 ? formatCurrencyInputValue(num) : '');
                }}
                className="text-lg font-bold h-12"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase">
                {selectedDebtForPayment?.type === 'debt' ? 'Potong dari Rekening' : 'Masuk ke Rekening'}
              </label>
              <select
                value={paymentAccountId}
                onChange={(e) => setPaymentAccountId(e.target.value)}
                className="w-full h-11 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-medium"
              >
                <option value="">Jangan ubah saldo rekening (hanya update catatan hutang)</option>
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} ({formatCurrency(acc.balance)})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase">Catatan (Opsional)</label>
              <Input
                placeholder="Contoh: Cicilan bulan ke-3"
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.target.value)}
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsPaymentModalOpen(false)}>
                Batal
              </Button>
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">
                Simpan Pembayaran
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
