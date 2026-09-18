'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useFinance } from '@/lib/storage/finance-store';
import { formatCurrency } from '@/lib/utils/currency';
import { formatDate } from '@/lib/utils/dates';
import { useToast } from '@/components/ui/toast';
import { Repeat, Check, ChevronRight } from 'lucide-react';

export function UpcomingBillsWidget() {
  const { upcomingBills, executeRecurringNow } = useFinance();
  const { success } = useToast();

  const handlePay = (id: string, description: string) => {
    executeRecurringNow(id);
    success('Transaksi dicatat', `${description} berhasil dicatat dan jadwal diperbarui.`);
  };

  return (
    <Card className="border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/80">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base font-bold">Tagihan Mendatang</CardTitle>
          <CardDescription className="text-xs">
            Jadwal pembayaran dan langganan rutin
          </CardDescription>
        </div>
        <Link
          href="/recurring"
          className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-0.5"
        >
          Lihat Semua <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </CardHeader>
      <CardContent className="space-y-2.5">
        {upcomingBills.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-4">Tidak ada tagihan mendatang</p>
        ) : (
          upcomingBills.slice(0, 4).map((bill) => (
            <div
              key={bill.id}
              className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-800/30 hover:bg-slate-100/50 dark:hover:bg-slate-800/60 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                  <Repeat className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                    {bill.description}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Jatuh tempo: {formatDate(bill.next_occurrence, 'dd MMM yyyy')}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  {formatCurrency(bill.amount)}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handlePay(bill.id, bill.description)}
                  className="h-7 px-2 text-[11px] font-medium border-emerald-500 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                  title="Tandai Sudah Dibayar"
                >
                  <Check className="w-3 h-3 mr-1" />
                  Bayar
                </Button>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
