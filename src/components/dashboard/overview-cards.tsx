'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useFinance } from '@/lib/storage/finance-store';
import { formatCurrency } from '@/lib/utils/currency';
import { Wallet, TrendingUp, TrendingDown, Scale, PiggyBank } from 'lucide-react';
import { cn } from '@/lib/utils';

export function OverviewCards() {
  const { totalNetWorth, filteredIncome, filteredExpense, filteredNet, savingsRate } = useFinance();

  const isNetPositive = filteredNet >= 0;

  const cards = [
    {
      title: 'Total Kekayaan',
      subtitle: 'Saldo seluruh akun aktif',
      amount: formatCurrency(totalNetWorth),
      icon: Wallet,
      iconBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
      changeText: 'Semua dompet & bank',
    },
    {
      title: 'Total Pemasukan',
      subtitle: 'Periode terpilih',
      amount: formatCurrency(filteredIncome),
      icon: TrendingUp,
      iconBg: 'bg-teal-500/10 text-teal-600 dark:text-teal-400',
      changeText: 'Arus kas masuk',
      textColor: 'text-emerald-600 dark:text-emerald-400',
    },
    {
      title: 'Total Pengeluaran',
      subtitle: 'Periode terpilih',
      amount: formatCurrency(filteredExpense),
      icon: TrendingDown,
      iconBg: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
      changeText: 'Arus kas keluar',
      textColor: 'text-rose-600 dark:text-rose-400',
    },
    {
      title: 'Arus Kas Bersih',
      subtitle: 'Pemasukan - Pengeluaran',
      amount: `${isNetPositive ? '+' : ''}${formatCurrency(filteredNet)}`,
      icon: Scale,
      iconBg: isNetPositive
        ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
        : 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
      changeText: isNetPositive ? 'Surplus finansial' : 'Defisit bulan ini',
      textColor: isNetPositive
        ? 'text-blue-600 dark:text-blue-400'
        : 'text-amber-600 dark:text-amber-400',
    },
    {
      title: 'Rasio Tabungan',
      subtitle: 'Persentase pendapatan tersisa',
      amount: `${savingsRate}%`,
      icon: PiggyBank,
      iconBg: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
      changeText: savingsRate >= 20 ? 'Target sehat (>=20%)' : 'Di bawah rekomendasi 20%',
      textColor: savingsRate >= 20 ? 'text-purple-600 dark:text-purple-400' : 'text-slate-600 dark:text-slate-400',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <Card
            key={idx}
            className="hover:shadow-md transition-all duration-200 border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm"
          >
            <CardContent className="p-5 flex flex-col justify-between h-full space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    {card.title}
                  </p>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500">
                    {card.subtitle}
                  </p>
                </div>
                <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center shrink-0', card.iconBg)}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>

              <div>
                <h3 className={cn('text-xl xl:text-2xl font-extrabold tracking-tight', card.textColor || 'text-slate-900 dark:text-white')}>
                  {card.amount}
                </h3>
                <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500 mt-1">
                  {card.changeText}
                </p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
