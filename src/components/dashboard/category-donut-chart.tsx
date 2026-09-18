'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { useFinance } from '@/lib/storage/finance-store';
import { formatCurrency } from '@/lib/utils/currency';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';

export function CategoryDonutChart() {
  const { expenseByCategory, filteredExpense } = useFinance();

  const data = expenseByCategory.slice(0, 6);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      return (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-3 shadow-xl text-xs space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
            <p className="font-bold text-slate-900 dark:text-white">{d.categoryName}</p>
          </div>
          <p className="font-semibold text-emerald-600 dark:text-emerald-400">
            {formatCurrency(d.amount)}
          </p>
          <p className="text-slate-400 text-[10px]">{d.percentage}% dari total pengeluaran</p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/80">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-bold">Pengeluaran per Kategori</CardTitle>
        <CardDescription className="text-xs">
          Distribusi pengeluaran periode ini ({formatCurrency(filteredExpense)})
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        {data.length === 0 ? (
          <div className="h-[280px] flex items-center justify-center text-center p-4">
            <p className="text-xs text-slate-400">Belum ada pengeluaran pada periode ini</p>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="h-[210px] w-full sm:w-1/2 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip content={<CustomTooltip />} />
                  <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="amount"
                  >
                    {data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              {/* Center Donut Label */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[10px] uppercase font-semibold text-slate-400">Total</span>
                <span className="text-xs font-bold text-slate-800 dark:text-white">
                  {data.length} Kategori
                </span>
              </div>
            </div>

            {/* Custom Legend List */}
            <div className="w-full sm:w-1/2 space-y-2 max-h-[220px] overflow-y-auto pr-1">
              {data.map((cat) => (
                <div
                  key={cat.categoryId}
                  className="flex items-center justify-between text-xs p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span className="font-medium text-slate-700 dark:text-slate-300 truncate">
                      {cat.categoryName}
                    </span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-semibold text-slate-900 dark:text-slate-100">
                      {formatCurrency(cat.amount)}
                    </span>
                    <span className="text-[10px] text-slate-400 ml-1.5">
                      ({cat.percentage}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
