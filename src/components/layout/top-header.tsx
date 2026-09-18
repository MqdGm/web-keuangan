'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Bell,
  Calendar,
  Search,
  Plus,
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import { useFinance } from '@/lib/storage/finance-store';
import { DateRangePreset } from '@/types/finance';
import { cn } from '@/lib/utils';

interface TopHeaderProps {
  onOpenQuickAdd: () => void;
}

const PRESET_LABELS: Record<DateRangePreset, string> = {
  today: 'Hari Ini',
  '7days': '7 Hari Terakhir',
  this_month: 'Bulan Ini',
  last_month: 'Bulan Lalu',
  '3months': '3 Bulan Terakhir',
  this_year: 'Tahun Ini',
  all: 'Semua Waktu',
  custom: 'Kustom',
};

export function TopHeader({ onOpenQuickAdd }: TopHeaderProps) {
  const pathname = usePathname();
  const { datePreset, setDatePreset, unreadNotificationCount } = useFinance();
  const [dropdownOpen, setDropdownOpen] = React.useState(false);

  // Global keyboard shortcut Shift + A for quick add
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.shiftKey && (e.key === 'A' || e.key === 'a')) {
        // Prevent if user is typing in an input
        if (
          ['INPUT', 'TEXTAREA', 'SELECT'].includes(
            (document.activeElement?.tagName || '').toUpperCase()
          )
        ) {
          return;
        }
        e.preventDefault();
        onOpenQuickAdd();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onOpenQuickAdd]);

  // Page title resolution
  const getPageTitle = () => {
    switch (pathname) {
      case '/':
        return 'Ringkasan Finansial';
      case '/transactions':
        return 'Daftar Transaksi';
      case '/accounts':
        return 'Rekening & Dompet';
      case '/budgets':
        return 'Manajemen Anggaran';
      case '/savings':
        return 'Target Tabungan';
      case '/debts':
        return 'Hutang & Piutang';
      case '/recurring':
        return 'Transaksi Berulang';
      case '/reports':
        return 'Laporan & Analitik';
      case '/categories':
        return 'Kategori Keuangan';
      case '/notifications':
        return 'Notifikasi & Pengingat';
      case '/settings':
        return 'Pengaturan & Ekspor';
      default:
        return 'Keuangan';
    }
  };

  return (
    <header className="sticky top-0 z-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 px-4 md:px-6 h-16 flex items-center justify-between">
      {/* Mobile Branding / Desktop Title */}
      <div className="flex items-center gap-3">
        <div className="lg:hidden flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-sm">
            <Sparkles className="w-4 h-4" />
          </div>
          <span className="font-bold text-base text-slate-900 dark:text-white">Keuangan</span>
        </div>
        <h2 className="hidden lg:block text-lg font-bold text-slate-900 dark:text-white">
          {getPageTitle()}
        </h2>
      </div>

      {/* Actions & Filters */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Date Range Preset Selector */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 flex items-center gap-1.5 transition-all"
          >
            <Calendar className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>{PRESET_LABELS[datePreset] || 'Pilih Periode'}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {dropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-20"
                onClick={() => setDropdownOpen(false)}
              />
              <div className="absolute right-0 mt-1 w-44 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl py-1 z-30 animate-in fade-in zoom-in-95 text-xs">
                {(Object.keys(PRESET_LABELS) as DateRangePreset[]).map((presetKey) => (
                  <button
                    key={presetKey}
                    onClick={() => {
                      setDatePreset(presetKey);
                      setDropdownOpen(false);
                    }}
                    className={cn(
                      'w-full text-left px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center justify-between',
                      datePreset === presetKey
                        ? 'font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/30'
                        : 'text-slate-700 dark:text-slate-300'
                    )}
                  >
                    <span>{PRESET_LABELS[presetKey]}</span>
                    {datePreset === presetKey && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400" />
                    )}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Search quick navigation link */}
        <Link
          href="/transactions"
          className="h-9 w-9 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 flex items-center justify-center transition-colors"
          title="Cari Transaksi"
        >
          <Search className="w-4 h-4" />
        </Link>

        {/* Notifications Icon with Counter */}
        <Link
          href="/notifications"
          className="relative h-9 w-9 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 flex items-center justify-center transition-colors"
          title="Notifikasi"
        >
          <Bell className="w-4 h-4" />
          {unreadNotificationCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
              {unreadNotificationCount}
            </span>
          )}
        </Link>

        {/* Desktop Quick Add Button */}
        <button
          onClick={onOpenQuickAdd}
          className="hidden md:flex h-9 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold items-center gap-1.5 shadow-sm transition-all active:scale-[0.98]"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>+ Transaksi</span>
        </button>
      </div>
    </header>
  );
}
