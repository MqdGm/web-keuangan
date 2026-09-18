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
import { DynamicIcon } from '@/components/ui/icon-helper';
import { useToast } from '@/components/ui/toast';
import { Account, AccountType } from '@/types/finance';
import {
  Wallet,
  Building2,
  Smartphone,
  CreditCard,
  PiggyBank,
  TrendingUp,
  Plus,
  ArrowRightLeft,
  Pencil,
  Trash2,
  CheckCircle2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const ACCOUNT_TYPE_LABELS: Record<AccountType, { label: string; icon: string }> = {
  bank: { label: 'Bank', icon: 'Building2' },
  ewallet: { label: 'E-Wallet', icon: 'Smartphone' },
  cash: { label: 'Uang Tunai', icon: 'Wallet' },
  credit_card: { label: 'Kartu Kredit', icon: 'CreditCard' },
  savings: { label: 'Tabungan Khusus', icon: 'PiggyBank' },
  investment: { label: 'Investasi', icon: 'TrendingUp' },
  other: { label: 'Lainnya', icon: 'Circle' },
};

const COLOR_PRESETS = [
  '#00529C', // BCA Blue
  '#0F4C81', // Mandiri Dark Blue
  '#00AED6', // GoPay Cyan
  '#118EEA', // DANA Blue
  '#EE4D2D', // ShopeePay Orange
  '#10B981', // Emerald Green
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#F59E0B', // Amber
  '#6B7280', // Slate Gray
];

export default function AccountsPage() {
  const {
    accounts,
    totalNetWorth,
    addAccount,
    updateAccount,
    deleteAccount,
    transferBetweenAccounts,
  } = useFinance();
  const { success, error } = useToast();

  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);

  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);

  // Form states for Account modal
  const [name, setName] = useState('');
  const [type, setType] = useState<AccountType>('bank');
  const [initialBalanceStr, setInitialBalanceStr] = useState('');
  const [institution, setInstitution] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [color, setColor] = useState('#00529C');
  const [notes, setNotes] = useState('');

  // Form states for Transfer modal
  const [transferFrom, setTransferFrom] = useState('');
  const [transferTo, setTransferTo] = useState('');
  const [transferAmountStr, setTransferAmountStr] = useState('');
  const [transferNotes, setTransferNotes] = useState('');

  const openAddAccount = () => {
    setEditingAccount(null);
    setName('');
    setType('bank');
    setInitialBalanceStr('');
    setInstitution('');
    setAccountNumber('');
    setColor('#00529C');
    setNotes('');
    setIsAccountModalOpen(true);
  };

  const openEditAccount = (acc: Account) => {
    setEditingAccount(acc);
    setName(acc.name);
    setType(acc.type);
    setInitialBalanceStr(formatCurrencyInputValue(acc.balance));
    setInstitution(acc.institution || '');
    setAccountNumber(acc.account_number || '');
    setColor(acc.color);
    setNotes(acc.notes || '');
    setIsAccountModalOpen(true);
  };

  const openTransferModal = (fromId?: string) => {
    setTransferFrom(fromId || accounts[0]?.id || '');
    setTransferTo(accounts.find((a) => a.id !== (fromId || accounts[0]?.id))?.id || '');
    setTransferAmountStr('');
    setTransferNotes('');
    setIsTransferModalOpen(true);
  };

  const handleSaveAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      error('Nama akun wajib diisi');
      return;
    }

    const initBal = parseCurrencyInput(initialBalanceStr);

    if (editingAccount) {
      const newBal = parseCurrencyInput(initialBalanceStr);
      updateAccount(editingAccount.id, {
        name: name.trim(),
        type,
        balance: newBal,
        initial_balance: newBal,
        institution: institution.trim(),
        account_number: accountNumber.trim(),
        color,
        notes: notes.trim(),
      });
      success('Akun diperbarui', `Rekening ${name} berhasil disimpan.`);
    } else {
      addAccount({
        name: name.trim(),
        type,
        initial_balance: initBal,
        currency: 'IDR',
        color,
        icon: ACCOUNT_TYPE_LABELS[type].icon,
        institution: institution.trim(),
        account_number: accountNumber.trim(),
        notes: notes.trim(),
        is_active: true,
      });
      success('Akun ditambahkan', `Rekening ${name} dengan saldo awal ${formatCurrency(initBal)} berhasil dibuat.`);
    }
    setIsAccountModalOpen(false);
  };

  const handleSaveTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseCurrencyInput(transferAmountStr);
    if (amount <= 0) {
      error('Nominal transfer harus lebih dari 0');
      return;
    }
    if (!transferFrom || !transferTo || transferFrom === transferTo) {
      error('Pilih dua rekening berbeda untuk transfer');
      return;
    }

    const fromAcc = accounts.find((a) => a.id === transferFrom);
    if (fromAcc && Number(fromAcc.balance) < amount) {
      if (!confirm(`Saldo rekening ${fromAcc.name} (${formatCurrency(fromAcc.balance)}) lebih kecil dari nominal transfer. Tetap lanjutkan?`)) {
        return;
      }
    }

    transferBetweenAccounts(transferFrom, transferTo, amount, transferNotes);
    success('Transfer berhasil', `Transfer ${formatCurrency(amount)} berhasil dicatat.`);
    setIsTransferModalOpen(false);
  };

  const handleDeleteAccount = (id: string, accName: string) => {
    if (confirm(`Hapus rekening "${accName}"? Semua riwayat transaksi pada rekening ini juga akan dihapus.`)) {
      deleteAccount(id);
      success('Rekening dihapus', `${accName} telah dihapus.`);
    }
  };

  // Group balances by type
  const bankTotal = accounts.filter((a) => a.type === 'bank' && a.is_active).reduce((s, a) => s + Number(a.balance), 0);
  const ewalletTotal = accounts.filter((a) => a.type === 'ewallet' && a.is_active).reduce((s, a) => s + Number(a.balance), 0);
  const cashTotal = accounts.filter((a) => a.type === 'cash' && a.is_active).reduce((s, a) => s + Number(a.balance), 0);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Rekening & Dompet
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Kelola saldo bank, e-wallet, uang tunai, dan transfer antar akun
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => openTransferModal()}
            className="h-10 text-xs font-semibold gap-1.5"
          >
            <ArrowRightLeft className="w-4 h-4 text-blue-600" />
            <span>Transfer Saldo</span>
          </Button>
          <Button
            size="sm"
            onClick={openAddAccount}
            className="h-10 text-xs font-semibold gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Tambah Akun</span>
          </Button>
        </div>
      </div>

      {/* Breakdown Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 p-4">
          <p className="text-xs font-medium text-slate-500">Total Kekayaan</p>
          <p className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">
            {formatCurrency(totalNetWorth)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">{accounts.length} rekening aktif</p>
        </Card>

        <Card className="border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-slate-500">Rekening Bank</p>
            <Building2 className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-xl font-extrabold text-blue-600 dark:text-blue-400 mt-1">
            {formatCurrency(bankTotal)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">BCA, Mandiri, dll.</p>
        </Card>

        <Card className="border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-slate-500">E-Wallet</p>
            <Smartphone className="w-4 h-4 text-teal-600" />
          </div>
          <p className="text-xl font-extrabold text-teal-600 dark:text-teal-400 mt-1">
            {formatCurrency(ewalletTotal)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">GoPay, DANA, OVO</p>
        </Card>

        <Card className="border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-slate-500">Uang Tunai</p>
            <Wallet className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
            {formatCurrency(cashTotal)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Dompet fisik</p>
        </Card>
      </div>

      {/* Accounts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {accounts.map((acc) => {
          const typeMeta = ACCOUNT_TYPE_LABELS[acc.type] || { label: acc.type, icon: 'Wallet' };
          return (
            <Card
              key={acc.id}
              className="hover:shadow-md transition-all border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 overflow-hidden"
            >
              {/* Account Color Bar */}
              <div className="h-1.5 w-full" style={{ backgroundColor: acc.color }} />

              <CardContent className="p-5 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-11 h-11 rounded-2xl flex items-center justify-center text-white shadow-sm shrink-0"
                      style={{ backgroundColor: acc.color }}
                    >
                      <DynamicIcon name={acc.icon || typeMeta.icon} className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-slate-900 dark:text-white leading-tight">
                        {acc.name}
                      </h3>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Badge variant="secondary" className="text-[10px] px-2 py-0">
                          {typeMeta.label}
                        </Badge>
                        {acc.account_number && (
                          <span className="text-[11px] text-slate-400 font-mono">
                            {acc.account_number}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditAccount(acc)}
                      className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                      title="Edit Akun"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteAccount(acc.id, acc.name)}
                      className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-400 hover:text-rose-600 transition-colors"
                      title="Hapus Akun"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Balance display */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80">
                  <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                    Saldo Saat Ini
                  </p>
                  <p className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white mt-0.5">
                    {formatCurrency(acc.balance)}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Saldo awal: {formatCurrency(acc.initial_balance)}
                  </p>
                </div>

                {/* Quick Transfer Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openTransferModal(acc.id)}
                  className="w-full h-9 text-xs font-semibold gap-1.5 border-slate-200 dark:border-slate-700"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5 text-blue-500" />
                  <span>Transfer dari Rekening Ini</span>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Account Add / Edit Modal */}
      <Dialog open={isAccountModalOpen} onOpenChange={setIsAccountModalOpen}>
        <DialogContent className="max-w-md w-[95vw] p-6 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              {editingAccount ? 'Edit Rekening / Dompet' : 'Tambah Rekening Baru'}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Rekening digunakan untuk memantau saldo dan mencatat transaksi
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveAccount} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase">Nama Rekening</label>
              <Input
                placeholder="Contoh: BCA Utama, GoPay, Dompet Tunai"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase">Tipe Akun</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as AccountType)}
                  className="w-full h-11 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm"
                >
                  <option value="bank">Bank</option>
                  <option value="ewallet">E-Wallet</option>
                  <option value="cash">Uang Tunai</option>
                  <option value="credit_card">Kartu Kredit</option>
                  <option value="savings">Tabungan Khusus</option>
                  <option value="investment">Investasi</option>
                  <option value="other">Lainnya</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase">Institusi</label>
                <Input
                  placeholder="Contoh: BCA, GoTo"
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase">
                {editingAccount ? 'Saldo Rekening Saat Ini (IDR)' : 'Saldo Awal (IDR)'}
              </label>
              <Input
                type="text"
                placeholder="0"
                value={initialBalanceStr}
                onChange={(e) => {
                  const num = parseCurrencyInput(e.target.value);
                  setInitialBalanceStr(num > 0 ? formatCurrencyInputValue(num) : '');
                }}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase">Nomor Rekening / HP (Opsional)</label>
              <Input
                placeholder="8291029381"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
              />
            </div>

            {/* Color selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase">Warna Kartu</label>
              <div className="flex flex-wrap gap-2 pt-1">
                {COLOR_PRESETS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={cn(
                      'w-7 h-7 rounded-full transition-transform',
                      color === c ? 'scale-125 ring-2 ring-emerald-500 ring-offset-2' : 'hover:scale-110'
                    )}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsAccountModalOpen(false)}>
                Batal
              </Button>
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white">
                {editingAccount ? 'Simpan Perubahan' : 'Buat Rekening'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Transfer Modal */}
      <Dialog open={isTransferModalOpen} onOpenChange={setIsTransferModalOpen}>
        <DialogContent className="max-w-md w-[95vw] p-6 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <ArrowRightLeft className="w-5 h-5 text-blue-600" />
              Transfer Antar Rekening
            </DialogTitle>
            <DialogDescription className="text-xs">
              Pindahkan saldo dari satu akun ke akun lain tanpa mengubah total kekayaan
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveTransfer} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase">Dari Rekening</label>
              <select
                value={transferFrom}
                onChange={(e) => setTransferFrom(e.target.value)}
                className="w-full h-11 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-medium"
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} ({formatCurrency(acc.balance)})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase">Ke Rekening Tujuan</label>
              <select
                value={transferTo}
                onChange={(e) => setTransferTo(e.target.value)}
                className="w-full h-11 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-medium"
              >
                {accounts
                  .filter((a) => a.id !== transferFrom)
                  .map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} ({formatCurrency(acc.balance)})
                    </option>
                  ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase">Nominal Transfer (IDR)</label>
              <Input
                placeholder="0"
                value={transferAmountStr}
                onChange={(e) => {
                  const num = parseCurrencyInput(e.target.value);
                  setTransferAmountStr(num > 0 ? formatCurrencyInputValue(num) : '');
                }}
                className="text-lg font-bold h-12"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase">Catatan Transfer (Opsional)</label>
              <Input
                placeholder="Contoh: Top Up e-wallet, Pindah saldo tabungan"
                value={transferNotes}
                onChange={(e) => setTransferNotes(e.target.value)}
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsTransferModalOpen(false)}>
                Batal
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
                Proses Transfer
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
