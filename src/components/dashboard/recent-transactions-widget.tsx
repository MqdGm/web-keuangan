'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { useFinance } from '@/lib/storage/finance-store';
import { formatCurrency } from '@/lib/utils/currency';
import { formatFriendlyDate } from '@/lib/utils/dates';
import { DynamicIcon } from '@/components/ui/icon-helper';
import { ChevronRight, ArrowRightLeft, TrendingDown, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RecentTransactionsWidgetProps {
  onEditTransaction?: (tx: any) => void;
}

export function RecentTransactionsWidget({ onEditTransaction }: RecentTransactionsWidgetProps) {
  const { filteredTransactions, accounts, categories } = useFinance();

  const accountMap = new Map(accounts.map((a) => [a.id, a]));
  const categoryMap = new Map(categories.map((c) => [c.id, c]));

  const recent = filteredTransactions.slice(0, 6);

  return (
    <Card className="border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/80">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base font-bold">Transaksi Terkini</CardTitle>
          <CardDescription className="text-xs">
            Catatan mutasi keuangan terbaru Anda
          </CardDescription>
        </div>
        <Link
          href="/transactions"
          className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-0.5"
        >
          Lihat Semua <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </CardHeader>
      <CardContent className="space-y-2">
        {recent.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-xs text-slate-400">Belum ada transaksi pada periode ini</p>
          </div>
        ) : (
          recent.map((tx) => {
            const acc = accountMap.get(tx.account_id);
            const toAcc = tx.to_account_id ? accountMap.get(tx.to_account_id) : null;
            const cat = tx.category_id ? categoryMap.get(tx.category_id) : null;

            const isExpense = tx.type === 'expense';
            const isIncome = tx.type === 'income';
            const isTransfer = tx.type === 'transfer';

            return (
              <div
                key={tx.id}
                onClick={() => onEditTransaction && onEditTransaction(tx)}
                className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* Category/Type Icon */}
                  <div
                    className={cn(
                      'w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm transition-transform group-hover:scale-105',
                      isTransfer && 'bg-blue-600',
                      isExpense && 'bg-rose-500',
                      isIncome && 'bg-emerald-600'
                    )}
                    style={
                      !isTransfer && cat?.color
                        ? { backgroundColor: cat.color }
                        : undefined
                    }
                  >
                    {isTransfer ? (
                      <ArrowRightLeft className="w-4 h-4" />
                    ) : cat ? (
                      <DynamicIcon name={cat.icon} className="w-4 h-4" />
                    ) : isExpense ? (
                      <TrendingDown className="w-4 h-4" />
                    ) : (
                      <TrendingUp className="w-4 h-4" />
                    )}
                  </div>

                  {/* Description & Account */}
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                      {tx.description}
                    </p>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
                      <span>{formatFriendlyDate(tx.date)}</span>
                      <span>•</span>
                      <span className="truncate">
                        {isTransfer
                          ? `${acc?.name || 'Rekening'} ➔ ${toAcc?.name || 'Tujuan'}`
                          : acc?.name || 'Rekening'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Amount */}
                <div className="text-right shrink-0">
                  <p
                    className={cn(
                      'text-xs font-bold',
                      isExpense && 'text-rose-600 dark:text-rose-400',
                      isIncome && 'text-emerald-600 dark:text-emerald-400',
                      isTransfer && 'text-blue-600 dark:text-blue-400'
                    )}
                  >
                    {isExpense ? '-' : isIncome ? '+' : ''}
                    {formatCurrency(tx.amount)}
                  </p>
                  {cat && (
                    <span className="text-[10px] text-slate-400 font-medium">
                      {cat.name}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
