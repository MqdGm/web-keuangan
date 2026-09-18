'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, ReceiptText, Plus, PieChart, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFinance } from '@/lib/storage/finance-store';

interface MobileBottomNavProps {
  onOpenQuickAdd: () => void;
}

export function MobileBottomNav({ onOpenQuickAdd }: MobileBottomNavProps) {
  const pathname = usePathname();
  const { unreadNotificationCount } = useFinance();

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 safe-bottom">
      <div className="flex items-center justify-around h-16 px-2 relative">
        {/* Ringkasan */}
        <Link
          href="/"
          className={cn(
            'flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors',
            pathname === '/'
              ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
              : 'text-slate-500 dark:text-slate-400'
          )}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[10px]">Ringkasan</span>
        </Link>

        {/* Transaksi */}
        <Link
          href="/transactions"
          className={cn(
            'flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors',
            pathname === '/transactions'
              ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
              : 'text-slate-500 dark:text-slate-400'
          )}
        >
          <ReceiptText className="w-5 h-5" />
          <span className="text-[10px]">Transaksi</span>
        </Link>

        {/* Center Elevated Quick Add Action Button */}
        <div className="flex-1 flex justify-center -mt-6">
          <button
            onClick={onOpenQuickAdd}
            className="w-13 h-13 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/30 flex items-center justify-center transition-transform active:scale-95 focus:outline-none border-4 border-white dark:border-slate-900"
            aria-label="Catat Transaksi Cepat"
          >
            <Plus className="w-6 h-6 stroke-[2.5]" />
          </button>
        </div>

        {/* Anggaran */}
        <Link
          href="/budgets"
          className={cn(
            'flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors',
            pathname === '/budgets'
              ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
              : 'text-slate-500 dark:text-slate-400'
          )}
        >
          <PieChart className="w-5 h-5" />
          <span className="text-[10px]">Anggaran</span>
        </Link>

        {/* Lainnya / Pengaturan */}
        <Link
          href="/settings"
          className={cn(
            'flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors relative',
            pathname === '/settings' || pathname.startsWith('/settings')
              ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
              : 'text-slate-500 dark:text-slate-400'
          )}
        >
          <Menu className="w-5 h-5" />
          <span className="text-[10px]">Lainnya</span>
          {unreadNotificationCount > 0 && (
            <span className="absolute top-2 right-4 w-2 h-2 rounded-full bg-rose-500" />
          )}
        </Link>
      </div>
    </div>
  );
}
