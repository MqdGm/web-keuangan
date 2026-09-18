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
import { DynamicIcon } from '@/components/ui/icon-helper';
import { useToast } from '@/components/ui/toast';
import { SavingsGoal } from '@/types/finance';
import confetti from 'canvas-confetti';
import {
  Target,
  Plus,
  Pencil,
  Trash2,
  Calendar,
  Sparkles,
  CheckCircle2,
  Coins,
  ArrowUpRight,
} from 'lucide-react';
import { differenceInMonths, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';

export default function SavingsPage() {
  const { savingsGoals, accounts, addSavingsGoal, updateSavingsGoal, deleteSavingsGoal, contributeToGoal } = useFinance();
  const { success, error } = useToast();

  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);

  const [isContributeModalOpen, setIsContributeModalOpen] = useState(false);
  const [contributingGoal, setContributingGoal] = useState<SavingsGoal | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [targetAmountStr, setTargetAmountStr] = useState('');
  const [currentAmountStr, setCurrentAmountStr] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [color, setColor] = useState('#8B5CF6');
  const [notes, setNotes] = useState('');

  // Contribution form states
  const [contribAmountStr, setContribAmountStr] = useState('');
  const [contribAccountId, setContribAccountId] = useState('');
  const [contribNotes, setContribNotes] = useState('');

  const openAddGoal = () => {
    setEditingGoal(null);
    setName('');
    setTargetAmountStr('');
    setCurrentAmountStr('0');
    setTargetDate('');
    setColor('#8B5CF6');
    setNotes('');
    setIsGoalModalOpen(true);
  };

  const openEditGoal = (goal: SavingsGoal) => {
    setEditingGoal(goal);
    setName(goal.name);
    setTargetAmountStr(formatCurrencyInputValue(goal.target_amount));
    setCurrentAmountStr(formatCurrencyInputValue(goal.current_amount));
    setTargetDate(goal.target_date || '');
    setColor(goal.color);
    setNotes(goal.notes || '');
    setIsGoalModalOpen(true);
  };

  const openContributeModal = (goal: SavingsGoal) => {
    setContributingGoal(goal);
    setContribAmountStr('');
    setContribAccountId(accounts[0]?.id || '');
    setContribNotes('');
    setIsContributeModalOpen(true);
  };

  const handleSaveGoal = (e: React.FormEvent) => {
    e.preventDefault();
    const target = parseCurrencyInput(targetAmountStr);
    const current = parseCurrencyInput(currentAmountStr);

    if (!name.trim()) {
      error('Nama target tabungan wajib diisi');
      return;
    }
    if (target <= 0) {
      error('Target nominal harus lebih dari 0');
      return;
    }

    if (editingGoal) {
      updateSavingsGoal(editingGoal.id, {
        name: name.trim(),
        target_amount: target,
        current_amount: current,
        target_date: targetDate || undefined,
        color,
        notes: notes.trim(),
      });
      success('Target diperbarui', `Target ${name} berhasil disimpan.`);
    } else {
      addSavingsGoal({
        name: name.trim(),
        target_amount: target,
        current_amount: current,
        target_date: targetDate || undefined,
        color,
        icon: 'Target',
        notes: notes.trim(),
        status: current >= target ? 'completed' : 'active',
      });
      success('Target dibuat', `Target tabungan ${name} berhasil ditambahkan.`);
    }
    setIsGoalModalOpen(false);
  };

  const handleSaveContribution = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contributingGoal) return;

    const amount = parseCurrencyInput(contribAmountStr);
    if (amount <= 0) {
      error('Nominal setoran harus lebih dari 0');
      return;
    }

    contributeToGoal(contributingGoal.id, amount, contribAccountId || undefined, contribNotes);

    const newTotal = Number(contributingGoal.current_amount) + amount;
    if (newTotal >= Number(contributingGoal.target_amount)) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
      success('🎉 Target Tercapai!', `Selamat! Anda telah mencapai target tabungan ${contributingGoal.name}.`);
    } else {
      success('Setoran berhasil', `Setoran ${formatCurrency(amount)} ditambahkan ke ${contributingGoal.name}.`);
    }

    setIsContributeModalOpen(false);
  };

  const handleDeleteGoal = (id: string, goalName: string) => {
    if (confirm(`Hapus target tabungan "${goalName}"?`)) {
      deleteSavingsGoal(id);
      success('Target dihapus', `${goalName} telah dihapus.`);
    }
  };

  // Aggregated totals
  const totalTarget = savingsGoals.reduce((s, g) => s + Number(g.target_amount), 0);
  const totalSaved = savingsGoals.reduce((s, g) => s + Number(g.current_amount), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Target Tabungan
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Wujudkan impian finansial Anda dengan target terukur dan kalkulasi menabung bulanan
          </p>
        </div>

        <Button
          onClick={openAddGoal}
          className="h-10 text-xs font-semibold gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Buat Target Baru</span>
        </Button>
      </div>

      {/* Overview stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 p-4">
          <p className="text-xs font-medium text-slate-500">Total Akumulasi Tabungan</p>
          <p className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
            {formatCurrency(totalSaved)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Dari total target {formatCurrency(totalTarget)}</p>
        </Card>

        <Card className="border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 p-4">
          <p className="text-xs font-medium text-slate-500">Persentase Rata-rata</p>
          <p className="text-xl font-extrabold text-purple-600 dark:text-purple-400 mt-1">
            {totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0}%
          </p>
          <p className="text-[11px] text-slate-400 mt-1">{savingsGoals.length} target terdaftar</p>
        </Card>

        <Card className="border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 p-4">
          <p className="text-xs font-medium text-slate-500">Sisa yang Harus Dikumpulkan</p>
          <p className="text-xl font-extrabold text-blue-600 dark:text-blue-400 mt-1">
            {formatCurrency(Math.max(0, totalTarget - totalSaved))}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Menuju kebebasan finansial</p>
        </Card>
      </div>

      {/* Goals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {savingsGoals.map((goal) => {
          const percent = Math.min(100, Math.round((goal.current_amount / goal.target_amount) * 100));
          const remaining = Math.max(0, goal.target_amount - goal.current_amount);

          // Suggested monthly savings calculation
          let monthlySuggestion: number | null = null;
          if (goal.target_date && remaining > 0) {
            try {
              const targetDt = parseISO(goal.target_date);
              const months = Math.max(1, differenceInMonths(targetDt, new Date()));
              monthlySuggestion = Math.round(remaining / months);
            } catch {}
          }

          const isCompleted = percent >= 100;

          return (
            <Card
              key={goal.id}
              className="hover:shadow-md transition-all border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 overflow-hidden"
            >
              <div className="h-1.5 w-full" style={{ backgroundColor: goal.color }} />

              <CardContent className="p-5 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-11 h-11 rounded-2xl flex items-center justify-center text-white shadow-sm shrink-0"
                      style={{ backgroundColor: goal.color }}
                    >
                      <Target className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-slate-900 dark:text-white leading-tight">
                        {goal.name}
                      </h3>
                      {goal.target_date && (
                        <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>Target: {formatDate(goal.target_date, 'dd MMM yyyy')}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditGoal(goal)}
                      className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 transition-colors"
                      title="Edit Target"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteGoal(goal.id, goal.name)}
                      className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-400 hover:text-rose-600 transition-colors"
                      title="Hapus Target"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Progress bar and values */}
                <div className="space-y-2">
                  <div className="flex justify-between items-baseline">
                    <span className="text-xl font-extrabold text-slate-900 dark:text-white">
                      {formatCurrency(goal.current_amount)}
                    </span>
                    <span className="text-xs font-bold text-purple-600 dark:text-purple-400">
                      {percent}%
                    </span>
                  </div>

                  <Progress value={percent} indicatorClassName="bg-purple-600" />

                  <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400">
                    <span>Target: {formatCurrency(goal.target_amount)}</span>
                    <span>Sisa: {formatCurrency(remaining)}</span>
                  </div>
                </div>

                {/* Monthly Suggestion box */}
                {monthlySuggestion !== null && (
                  <div className="p-2.5 rounded-xl bg-purple-50/50 dark:bg-purple-950/30 border border-purple-200/50 dark:border-purple-800/50 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-purple-900 dark:text-purple-300 font-medium">Saran Tabungan Bulanan:</span>
                      <span className="font-bold text-purple-700 dark:text-purple-300">
                        {formatCurrency(monthlySuggestion)} / bln
                      </span>
                    </div>
                  </div>
                )}

                {/* Contribute Button */}
                <Button
                  onClick={() => openContributeModal(goal)}
                  disabled={isCompleted}
                  className={cn(
                    'w-full h-10 text-xs font-semibold gap-1.5 transition-all text-white',
                    isCompleted
                      ? 'bg-slate-300 dark:bg-slate-700 cursor-not-allowed'
                      : 'bg-emerald-600 hover:bg-emerald-700'
                  )}
                >
                  {isCompleted ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Target Selesai Tercapai!</span>
                    </>
                  ) : (
                    <>
                      <Coins className="w-4 h-4" />
                      <span>+ Tambah Setoran Tabungan</span>
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Goal Add / Edit Modal */}
      <Dialog open={isGoalModalOpen} onOpenChange={setIsGoalModalOpen}>
        <DialogContent className="max-w-md w-[95vw] p-6 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              {editingGoal ? 'Edit Target Tabungan' : 'Buat Target Tabungan Baru'}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Tentukan impian finansial Anda dan rencanakan tabungan secara konsisten
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveGoal} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase">Nama Target</label>
              <Input
                placeholder="Contoh: MacBook Pro, Dana Darurat, Liburan Jepang"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase">Target Nominal (IDR)</label>
              <Input
                placeholder="0"
                value={targetAmountStr}
                onChange={(e) => {
                  const num = parseCurrencyInput(e.target.value);
                  setTargetAmountStr(num > 0 ? formatCurrencyInputValue(num) : '');
                }}
                className="text-lg font-bold h-12"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase">Saldo Terkumpul Saat Ini (IDR)</label>
              <Input
                placeholder="0"
                value={currentAmountStr}
                onChange={(e) => {
                  const num = parseCurrencyInput(e.target.value);
                  setCurrentAmountStr(num > 0 ? formatCurrencyInputValue(num) : '');
                }}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase">Target Tanggal Tercapai</label>
              <Input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase">Catatan / Alasan</label>
              <Input
                placeholder="Catatan motivasi atau rincian target..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsGoalModalOpen(false)}>
                Batal
              </Button>
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white">
                {editingGoal ? 'Simpan Perubahan' : 'Simpan Target'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Contribution Modal */}
      <Dialog open={isContributeModalOpen} onOpenChange={setIsContributeModalOpen}>
        <DialogContent className="max-w-md w-[95vw] p-6 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Coins className="w-5 h-5 text-emerald-600" />
              Tambah Setoran Tabungan
            </DialogTitle>
            <DialogDescription className="text-xs">
              Setorkan dana ke target tabungan &quot;{contributingGoal?.name}&quot;
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveContribution} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase">Jumlah Setoran (IDR)</label>
              <Input
                placeholder="0"
                value={contribAmountStr}
                onChange={(e) => {
                  const num = parseCurrencyInput(e.target.value);
                  setContribAmountStr(num > 0 ? formatCurrencyInputValue(num) : '');
                }}
                className="text-lg font-bold h-12"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase">Potong dari Rekening (Opsional)</label>
              <select
                value={contribAccountId}
                onChange={(e) => setContribAccountId(e.target.value)}
                className="w-full h-11 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-medium"
              >
                <option value="">Jangan potong rekening (hanya update progress)</option>
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} ({formatCurrency(acc.balance)})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase">Catatan Setoran (Opsional)</label>
              <Input
                placeholder="Contoh: Sisihan bonus project, tabungan gajian"
                value={contribNotes}
                onChange={(e) => setContribNotes(e.target.value)}
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsContributeModalOpen(false)}>
                Batal
              </Button>
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">
                Setor Sekarang
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
