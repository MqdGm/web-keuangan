'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useFinance } from '@/lib/storage/finance-store';
import { formatCurrency, formatCompactCurrency } from '@/lib/utils/currency';
import { downloadTransactionsCsv, downloadJsonBackup } from '@/lib/utils/export-helpers';
import { useToast } from '@/components/ui/toast';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import {
  BarChart3,
  Download,
  Printer,
  TrendingUp,
  TrendingDown,
  PieChart,
  Calendar,
  Wallet,
} from 'lucide-react';

export default function ReportsPage() {
  const {
    filteredTransactions,
    accounts,
    categories,
    filteredIncome,
    filteredExpense,
    filteredNet,
    savingsRate,
    monthlyCashflowTrend,
    expenseByCategory,
    exportBackupData,
  } = useFinance();
  const { success } = useToast();

  const [activeTab, setActiveTab] = useState<'cashflow' | 'categories' | 'accounts'>('cashflow');

  const accountMap = new Map(accounts.map((a) => [a.id, a]));

  // Account spending aggregation
  const spendingByAccount = accounts.map((acc) => {
    const totalOut = filteredTransactions
      .filter((t) => t.type === 'expense' && t.account_id === acc.id)
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const totalIn = filteredTransactions
      .filter((t) => t.type === 'income' && t.account_id === acc.id)
      .reduce((sum, t) => sum + Number(t.amount), 0);

    return {
      id: acc.id,
      name: acc.name,
      institution: acc.institution,
      color: acc.color,
      totalOut,
      totalIn,
      net: totalIn - totalOut,
    };
  }).filter((a) => a.totalOut > 0 || a.totalIn > 0);

  const handlePrint = () => {
    window.print();
  };

  const handleExportCsv = () => {
    downloadTransactionsCsv(filteredTransactions, accounts, categories);
    success('Ekspor berhasil', 'Berkas CSV laporan keuangan telah diunduh.');
  };

  const handleExportJson = () => {
    const backup = exportBackupData();
    downloadJsonBackup(backup);
    success('Ekspor berhasil', 'Cadangan lengkap data keuangan telah diunduh.');
  };

  return (
    <div className="space-y-6 print:p-0 print:space-y-4">
      {/* Header with Export & Print */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Laporan Finansial & Analitik
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Analisis mendalam arus kas, kebiasaan belanja, dan pertumbuhan tabungan Anda
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            className="h-10 text-xs font-semibold gap-1.5"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak / PDF</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            className="h-10 text-xs font-semibold gap-1.5"
          >
            <Download className="w-4 h-4" />
            <span>Ekspor CSV</span>
          </Button>

          <Button
            size="sm"
            onClick={handleExportJson}
            className="h-10 text-xs font-semibold gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <Download className="w-4 h-4" />
            <span>Ekspor JSON Lengkap</span>
          </Button>
        </div>
      </div>

      {/* Printable Report Header */}
      <div className="hidden print:block border-b pb-4">
        <h1 className="text-xl font-bold">Laporan Finansial Pribadi</h1>
        <p className="text-xs text-slate-500">
          Tanggal Cetak: {new Date().toLocaleDateString('id-ID', { dateStyle: 'full' })}
        </p>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-400">Total Pemasukan</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-2">
            {formatCurrency(filteredIncome)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Akumulasi periode terpilih</p>
        </Card>

        <Card className="p-5 border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-400">Total Pengeluaran</span>
            <TrendingDown className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-2">
            {formatCurrency(filteredExpense)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Konsumsi & pembayaran</p>
        </Card>

        <Card className="p-5 border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-400">Arus Kas Bersih</span>
            <span className="text-xs font-bold text-blue-600">Net Flow</span>
          </div>
          <p className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-2">
            {filteredNet >= 0 ? '+' : ''}{formatCurrency(filteredNet)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Surplus bersih tersisa</p>
        </Card>

        <Card className="p-5 border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-400">Rasio Tabungan</span>
            <Badge variant={savingsRate >= 20 ? 'default' : 'warning'} className="text-[10px]">
              {savingsRate >= 20 ? 'Sehat' : 'Perlu Ditingkatkan'}
            </Badge>
          </div>
          <p className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-2">
            {savingsRate}%
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Benchmark keuangan: minimal 20%</p>
        </Card>
      </div>

      {/* Main Chart: Arus Kas Trend */}
      <Card className="border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900">
        <CardHeader>
          <CardTitle className="text-base font-bold">Tren Arus Kas Bulanan</CardTitle>
          <CardDescription className="text-xs">
            Evaluasi perbandingan pemasukan vs pengeluaran dalam kurva area
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={monthlyCashflowTrend}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorInc" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.15} />
                <XAxis dataKey="monthLabel" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v) => formatCompactCurrency(v)}
                />
                <Tooltip
                  formatter={(val: any) => formatCurrency(Number(val))}
                  contentStyle={{
                    borderRadius: '12px',
                    fontSize: '12px',
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    color: '#ffffff',
                    border: 'none',
                  }}
                />
                <Legend verticalAlign="top" align="right" iconType="circle" />
                <Area
                  type="monotone"
                  dataKey="income"
                  name="Pemasukan"
                  stroke="#10B981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorInc)"
                />
                <Area
                  type="monotone"
                  dataKey="expense"
                  name="Pengeluaran"
                  stroke="#EF4444"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorExp)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Breakdown Section: Category Pareto & Account Spending */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Pareto Breakdown */}
        <Card className="border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900">
          <CardHeader>
            <CardTitle className="text-base font-bold">Rincian Pengeluaran per Kategori</CardTitle>
            <CardDescription className="text-xs">
              Kategori dengan kontribusi nominal tertinggi
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {expenseByCategory.map((cat, idx) => (
                <div key={cat.categoryId} className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 font-bold text-[11px] w-4">{idx + 1}.</span>
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {cat.categoryName}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-slate-900 dark:text-white">
                        {formatCurrency(cat.amount)}
                      </span>
                      <span className="text-[11px] text-slate-400 ml-1.5 font-medium">
                        ({cat.percentage}%)
                      </span>
                    </div>
                  </div>
                  <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${cat.percentage}%`, backgroundColor: cat.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Account Flow Breakdown */}
        <Card className="border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900">
          <CardHeader>
            <CardTitle className="text-base font-bold">Arus Rekening / Dompet</CardTitle>
            <CardDescription className="text-xs">
              Mutasi dana masuk dan keluar pada masing-masing rekening
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {spendingByAccount.map((acc) => (
                <div
                  key={acc.id}
                  className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0"
                      style={{ backgroundColor: acc.color }}
                    >
                      <Wallet className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-slate-900 dark:text-white">
                        {acc.name}
                      </h4>
                      <p className="text-[10px] text-slate-400">{acc.institution || 'Rekening'}</p>
                    </div>
                  </div>

                  <div className="text-right text-xs">
                    <div className="flex items-center justify-end gap-2 text-emerald-600 dark:text-emerald-400">
                      <span>Masuk:</span>
                      <span className="font-semibold">{formatCurrency(acc.totalIn)}</span>
                    </div>
                    <div className="flex items-center justify-end gap-2 text-rose-600 dark:text-rose-400 mt-0.5">
                      <span>Keluar:</span>
                      <span className="font-semibold">{formatCurrency(acc.totalOut)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
