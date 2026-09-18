'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useFinance } from '@/lib/storage/finance-store';
import { formatCurrency } from '@/lib/utils/currency';
import { ChevronRight, ShieldCheck, AlertTriangle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export function BudgetProgressWidget() {
  const { budgets, budgetCategories, categories, filteredTransactions } = useFinance();

  const currentBudget = budgets[0];
  const totalLimit = currentBudget?.total_limit || 0;

  // Calculate current month's expenses
  const currentMonthExpenses = filteredTransactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const overallPercent = totalLimit > 0 ? Math.round((currentMonthExpenses / totalLimit) * 100) : 0;

  // Category specific spend vs limit
  const categoryBudgets = budgetCategories.map((bc) => {
    const cat = categories.find((c) => c.id === bc.category_id);
    const spent = filteredTransactions
      .filter((t) => t.type === 'expense' && t.category_id === bc.category_id)
      .reduce((sum, t) => sum + Number(t.amount), 0);
    const percent = bc.amount_limit > 0 ? Math.round((spent / bc.amount_limit) * 100) : 0;

    let status: 'safe' | 'warning' | 'over' = 'safe';
    if (percent >= 100) status = 'over';
    else if (percent >= 75) status = 'warning';

    return {
      id: bc.id,
      name: cat?.name || 'Kategori',
      color: cat?.color || '#6B7280',
      spent,
      limit: bc.amount_limit,
      remaining: Math.max(0, bc.amount_limit - spent),
      percent,
      status,
    };
  }).sort((a, b) => b.percent - a.percent);

  return (
    <Card className="border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/80">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base font-bold">Kesehatan Anggaran</CardTitle>
          <CardDescription className="text-xs">
            Batas pengeluaran bulan ini
          </CardDescription>
        </div>
        <Link
          href="/budgets"
          className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-0.5"
        >
          Kelola <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Total Month Budget Bar */}
        {totalLimit > 0 && (
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800/60 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-200">
                {overallPercent >= 100 ? (
                  <AlertCircle className="w-4 h-4 text-rose-500" />
                ) : overallPercent >= 75 ? (
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                ) : (
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                )}
                <span>Total Pagu Anggaran</span>
              </div>
              <Badge
                variant={
                  overallPercent >= 100
                    ? 'destructive'
                    : overallPercent >= 75
                    ? 'warning'
                    : 'default'
                }
                className="text-[10px]"
              >
                {overallPercent >= 100 ? 'Melampaui Pagu' : overallPercent >= 75 ? 'Waspada' : 'Aman'} ({overallPercent}%)
              </Badge>
            </div>
            <Progress
              value={Math.min(100, overallPercent)}
              indicatorClassName={cn(
                overallPercent >= 100
                  ? 'bg-rose-500'
                  : overallPercent >= 75
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              )}
            />
            <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400">
              <span>Terpakai: {formatCurrency(currentMonthExpenses)}</span>
              <span>Pagu: {formatCurrency(totalLimit)}</span>
            </div>
          </div>
        )}

        {/* Categories breakdown */}
        <div className="space-y-3">
          {categoryBudgets.slice(0, 4).map((item) => (
            <div key={item.id} className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-medium text-slate-700 dark:text-slate-300 truncate">
                  {item.name}
                </span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  {formatCurrency(item.spent)} / {formatCurrency(item.limit)}
                </span>
              </div>
              <Progress
                value={Math.min(100, item.percent)}
                indicatorClassName={cn(
                  item.status === 'over'
                    ? 'bg-rose-500'
                    : item.status === 'warning'
                    ? 'bg-amber-500'
                    : 'bg-emerald-500'
                )}
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
