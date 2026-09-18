'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useFinance } from '@/lib/storage/finance-store';
import { formatCurrency } from '@/lib/utils/currency';
import { Target, ChevronRight } from 'lucide-react';

export function SavingsGoalsWidget() {
  const { savingsGoals } = useFinance();

  const activeGoals = savingsGoals.filter((g) => g.status === 'active');

  return (
    <Card className="border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/80">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base font-bold">Target Tabungan</CardTitle>
          <CardDescription className="text-xs">
            Rencana keuangan jangka pendek & panjang
          </CardDescription>
        </div>
        <Link
          href="/savings"
          className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-0.5"
        >
          Lihat Semua <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </CardHeader>
      <CardContent className="space-y-3">
        {activeGoals.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-4">Belum ada target tabungan aktif</p>
        ) : (
          activeGoals.slice(0, 3).map((goal) => {
            const percent = Math.min(100, Math.round((goal.current_amount / goal.target_amount) * 100));
            return (
              <div
                key={goal.id}
                className="p-3 rounded-xl border border-slate-200/60 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-800/30 space-y-2"
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-6 h-6 rounded-lg flex items-center justify-center text-white shrink-0"
                      style={{ backgroundColor: goal.color }}
                    >
                      <Target className="w-3.5 h-3.5" />
                    </div>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">
                      {goal.name}
                    </span>
                  </div>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    {percent}%
                  </span>
                </div>

                <Progress value={percent} indicatorClassName="bg-purple-500" />

                <div className="flex justify-between items-center text-[11px] text-slate-500 dark:text-slate-400">
                  <span>Terkumpul: {formatCurrency(goal.current_amount)}</span>
                  <span>Target: {formatCurrency(goal.target_amount)}</span>
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
