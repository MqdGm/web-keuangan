'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { useFinance } from '@/lib/storage/finance-store';
import { formatCurrency, formatCompactCurrency } from '@/lib/utils/currency';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';

export function CashFlowChart() {
  const { monthlyCashflowTrend } = useFinance();

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-3.5 shadow-xl text-xs space-y-1.5">
          <p className="font-bold text-slate-800 dark:text-slate-100">{label}</p>
          <div className="flex items-center justify-between gap-4 text-emerald-600 dark:text-emerald-400">
            <span>Pemasukan:</span>
            <span className="font-semibold">{formatCurrency(payload[0]?.value || 0)}</span>
          </div>
          <div className="flex items-center justify-between gap-4 text-rose-600 dark:text-rose-400">
            <span>Pengeluaran:</span>
            <span className="font-semibold">{formatCurrency(payload[1]?.value || 0)}</span>
          </div>
          <div className="border-t border-slate-100 dark:border-slate-800 pt-1 flex items-center justify-between gap-4 font-bold text-slate-900 dark:text-white">
            <span>Selisih:</span>
            <span>{formatCurrency((payload[0]?.value || 0) - (payload[1]?.value || 0))}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/80">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-bold">Tren Arus Kas (6 Bulan Terakhir)</CardTitle>
            <CardDescription className="text-xs">
              Perbandingan pemasukan dan pengeluaran bulanan
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={monthlyCashflowTrend}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              barGap={6}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.15} />
              <XAxis
                dataKey="monthLabel"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: '#888888' }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: '#888888' }}
                tickFormatter={(val) => formatCompactCurrency(val)}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="top"
                align="right"
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: 11, paddingBottom: 12 }}
              />
              <Bar
                name="Pemasukan"
                dataKey="income"
                fill="#10B981"
                radius={[6, 6, 0, 0]}
                maxBarSize={28}
              />
              <Bar
                name="Pengeluaran"
                dataKey="expense"
                fill="#EF4444"
                radius={[6, 6, 0, 0]}
                maxBarSize={28}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
