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
import { DynamicIcon } from '@/components/ui/icon-helper';
import { useToast } from '@/components/ui/toast';
import { PieChart, Plus, Pencil, ShieldCheck, AlertTriangle, AlertCircle, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getDaysInMonth, getDate } from 'date-fns';

export default function BudgetsPage() {
  const {
    budgets,
    budgetCategories,
    categories,
    filteredTransactions,
    setCategoryBudget,
    setTotalBudget,
  } = useFinance();
  const { success } = useToast();

  const [isTotalBudgetModalOpen, setIsTotalBudgetModalOpen] = useState(false);
  const [isCategoryBudgetModalOpen, setIsCategoryBudgetModalOpen] = useState(false);

  const [selectedCatId, setSelectedCatId] = useState('');
  const [catLimitStr, setCatLimitStr] = useState('');
  const [totalLimitStr, setTotalLimitStr] = useState('');

  const currentBudget = budgets[0];
  const totalLimit = currentBudget?.total_limit || 0;

  // Calculate actual spending in current period
  const totalSpent = filteredTransactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const totalRemaining = Math.max(0, totalLimit - totalSpent);
  const totalPercent = totalLimit > 0 ? Math.round((totalSpent / totalLimit) * 100) : 0;

  // Days remaining in current month for daily allowance calculation
  const today = new Date();
  const daysInMonth = getDaysInMonth(today);
  const daysPassed = getDate(today);
  const daysRemaining = Math.max(1, daysInMonth - daysPassed);
  const dailyAllowance = totalRemaining > 0 ? Math.round(totalRemaining / daysRemaining) : 0;

  // Category expense map
  const expenseCategories = categories.filter((c) => c.type === 'expense');

  const budgetItems = expenseCategories.map((cat) => {
    const bc = budgetCategories.find((b) => b.category_id === cat.id);
    const limit = bc?.amount_limit || 0;

    const spent = filteredTransactions
      .filter((t) => t.type === 'expense' && t.category_id === cat.id)
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const remaining = Math.max(0, limit - spent);
    const percent = limit > 0 ? Math.round((spent / limit) * 100) : 0;

    let status: 'safe' | 'warning' | 'over' = 'safe';
    if (percent >= 100) status = 'over';
    else if (percent >= 75) status = 'warning';

    return {
      categoryId: cat.id,
      name: cat.name,
      color: cat.color,
      icon: cat.icon,
      limit,
      spent,
      remaining,
      percent,
      status,
      hasBudget: limit > 0,
    };
  }).sort((a, b) => b.limit - a.limit);

  const openCategoryModal = (catId: string, currentLimit: number) => {
    setSelectedCatId(catId);
    setCatLimitStr(currentLimit > 0 ? formatCurrencyInputValue(currentLimit) : '');
    setIsCategoryBudgetModalOpen(true);
  };

  const handleSaveCategoryBudget = (e: React.FormEvent) => {
    e.preventDefault();
    const limit = parseCurrencyInput(catLimitStr);
    setCategoryBudget(selectedCatId, limit);
    const cat = categories.find((c) => c.id === selectedCatId);
    success('Anggaran disimpan', `Pagu untuk ${cat?.name} diatur ke ${formatCurrency(limit)}.`);
    setIsCategoryBudgetModalOpen(false);
  };

  const handleSaveTotalBudget = (e: React.FormEvent) => {
    e.preventDefault();
    const limit = parseCurrencyInput(totalLimitStr);
    setTotalBudget(limit);
    success('Total anggaran disimpan', `Pagu bulanan diatur ke ${formatCurrency(limit)}.`);
    setIsTotalBudgetModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Perencanaan Anggaran
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Kendalikan pengeluaran Anda dengan batas anggaran bulanan dan per kategori
          </p>
        </div>

        <Button
          onClick={() => {
            setTotalLimitStr(totalLimit > 0 ? formatCurrencyInputValue(totalLimit) : '');
            setIsTotalBudgetModalOpen(true);
          }}
          className="h-10 text-xs font-semibold gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          <Pencil className="w-4 h-4" />
          <span>Atur Pagu Bulanan</span>
        </Button>
      </div>

      {/* Main Budget Card */}
      <Card className="border-slate-200/80 dark:border-slate-800/80 bg-white/90 dark:bg-slate-900/90 overflow-hidden shadow-sm">
        <div className="p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Total Anggaran Bulan Ini
                </span>
                <Badge
                  variant={
                    totalPercent >= 100
                      ? 'destructive'
                      : totalPercent >= 75
                      ? 'warning'
                      : 'default'
                  }
                  className="text-xs"
                >
                  {totalPercent >= 100 ? 'Melebihi Anggaran' : totalPercent >= 75 ? 'Waspada' : 'Aman'} ({totalPercent}%)
                </Badge>
              </div>
              <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white mt-1">
                {formatCurrency(totalSpent)} <span className="text-lg font-normal text-slate-400">/ {formatCurrency(totalLimit)}</span>
              </h2>
            </div>

            {/* Daily allowance suggestion */}
            <div className="sm:text-right bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200/60 dark:border-slate-800/60">
              <p className="text-[11px] font-medium text-slate-400">Saran Pengeluaran Harian</p>
              <p className="text-base font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                {formatCurrency(dailyAllowance)} / hari
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">Sisa {daysRemaining} hari di bulan ini</p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="space-y-2">
            <Progress
              value={Math.min(100, totalPercent)}
              indicatorClassName={cn(
                'h-3.5',
                totalPercent >= 100
                  ? 'bg-rose-500'
                  : totalPercent >= 75
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              )}
            />
            <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
              <span>Terpakai: {formatCurrency(totalSpent)}</span>
              <span>Sisa Anggaran: {formatCurrency(totalRemaining)}</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Category Budgets Heading */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
          Anggaran per Kategori
        </h3>
        <p className="text-xs text-slate-400">Klik &quot;Atur Pagu&quot; untuk menetapkan limit</p>
      </div>

      {/* Category Budgets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {budgetItems.map((item) => (
          <Card
            key={item.categoryId}
            className="hover:shadow-md transition-all border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900"
          >
            <CardContent className="p-5 space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm"
                    style={{ backgroundColor: item.color }}
                  >
                    <DynamicIcon name={item.icon} className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white leading-tight">
                      {item.name}
                    </h4>
                    <Badge
                      variant={
                        !item.hasBudget
                          ? 'secondary'
                          : item.status === 'over'
                          ? 'destructive'
                          : item.status === 'warning'
                          ? 'warning'
                          : 'default'
                      }
                      className="text-[10px] mt-1"
                    >
                      {!item.hasBudget
                        ? 'Belum ada pagu'
                        : item.status === 'over'
                        ? 'Over Budget'
                        : item.status === 'warning'
                        ? 'Waspada'
                        : 'Aman'}
                    </Badge>
                  </div>
                </div>

                <button
                  onClick={() => openCategoryModal(item.categoryId, item.limit)}
                  className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                  title="Atur Limit Kategori"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              </div>

              {/* Progress & Values */}
              <div className="space-y-2">
                <div className="flex justify-between items-baseline text-xs">
                  <span className="font-extrabold text-slate-900 dark:text-white text-sm">
                    {formatCurrency(item.spent)}
                  </span>
                  <span className="text-slate-400 font-medium">
                    Pagu: {item.hasBudget ? formatCurrency(item.limit) : 'Rp 0'}
                  </span>
                </div>

                <Progress
                  value={item.hasBudget ? Math.min(100, item.percent) : 0}
                  indicatorClassName={cn(
                    item.status === 'over'
                      ? 'bg-rose-500'
                      : item.status === 'warning'
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                  )}
                />

                <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400">
                  <span>{item.hasBudget ? `${item.percent}% terpakai` : 'Tanpa batas'}</span>
                  <span>Sisa: {item.hasBudget ? formatCurrency(item.remaining) : '-'}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Set Total Budget Modal */}
      <Dialog open={isTotalBudgetModalOpen} onOpenChange={setIsTotalBudgetModalOpen}>
        <DialogContent className="max-w-md w-[95vw] p-6 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Atur Total Pagu Bulanan</DialogTitle>
            <DialogDescription className="text-xs">
              Tentukan batas total pengeluaran Anda untuk periode bulan berjalan
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveTotalBudget} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase">Total Limit (IDR)</label>
              <Input
                placeholder="Contoh: 10.000.000"
                value={totalLimitStr}
                onChange={(e) => {
                  const num = parseCurrencyInput(e.target.value);
                  setTotalLimitStr(num > 0 ? formatCurrencyInputValue(num) : '');
                }}
                className="text-lg font-bold h-12"
                required
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsTotalBudgetModalOpen(false)}>
                Batal
              </Button>
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white">
                Simpan Anggaran
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Set Category Budget Modal */}
      <Dialog open={isCategoryBudgetModalOpen} onOpenChange={setIsCategoryBudgetModalOpen}>
        <DialogContent className="max-w-md w-[95vw] p-6 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Atur Pagu Kategori</DialogTitle>
            <DialogDescription className="text-xs">
              Tentukan batas pengeluaran bulanan untuk kategori {categories.find((c) => c.id === selectedCatId)?.name}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveCategoryBudget} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase">Batas Anggaran (IDR)</label>
              <Input
                placeholder="0"
                value={catLimitStr}
                onChange={(e) => {
                  const num = parseCurrencyInput(e.target.value);
                  setCatLimitStr(num > 0 ? formatCurrencyInputValue(num) : '');
                }}
                className="text-lg font-bold h-12"
                required
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsCategoryBudgetModalOpen(false)}>
                Batal
              </Button>
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white">
                Simpan
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
