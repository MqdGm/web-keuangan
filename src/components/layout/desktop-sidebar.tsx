'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ReceiptText,
  Wallet,
  PieChart,
  Target,
  HandCoins,
  Repeat,
  BarChart3,
  Tags,
  Bell,
  Settings,
  Plus,
  Sparkles,
  Sun,
  Moon,
  Laptop,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFinance } from '@/lib/storage/finance-store';
import { formatCompactCurrency } from '@/lib/utils/currency';
import { useTheme } from 'next-themes';

interface DesktopSidebarProps {
  onOpenQuickAdd: () => void;
}

export function DesktopSidebar({ onOpenQuickAdd }: DesktopSidebarProps) {
  const pathname = usePathname();
  const { totalNetWorth, unreadNotificationCount, isDemoMode } = useFinance();
  const { theme, setTheme } = useTheme();

  const navItems = [
    { label: 'Ringkasan', href: '/', icon: LayoutDashboard },
    { label: 'Transaksi', href: '/transactions', icon: ReceiptText },
    { label: 'Rekening & Dompet', href: '/accounts', icon: Wallet },
    { label: 'Anggaran', href: '/budgets', icon: PieChart },
    { label: 'Target Tabungan', href: '/savings', icon: Target },
    { label: 'Hutang & Piutang', href: '/debts', icon: HandCoins },
    { label: 'Transaksi Berulang', href: '/recurring', icon: Repeat },
    { label: 'Laporan Finansial', href: '/reports', icon: BarChart3 },
    { label: 'Kategori', href: '/categories', icon: Tags },
    {
      label: 'Notifikasi',
      href: '/notifications',
      icon: Bell,
      badge: unreadNotificationCount > 0 ? unreadNotificationCount : undefined,
    },
    { label: 'Pengaturan & Backup', href: '/settings', icon: Settings },
  ];

  return (
    <aside className="hidden lg:flex flex-col w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/95 h-screen sticky top-0 z-30 select-none">
      {/* App Branding */}
      <div className="p-5 flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight tracking-tight text-slate-900 dark:text-white">
              Keuangan
            </h1>
            <p className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
              Personal Command Center
            </p>
          </div>
        </Link>
        {isDemoMode && (
          <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            Lokal
          </span>
        )}
      </div>

      {/* Quick Add Button */}
      <div className="p-4">
        <button
          onClick={onOpenQuickAdd}
          className="w-full h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm flex items-center justify-center gap-2 shadow-sm hover:shadow-md transition-all active:scale-[0.98]"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Catat Transaksi</span>
          <kbd className="hidden xl:inline-block ml-auto text-[10px] bg-emerald-700/80 px-1.5 py-0.5 rounded text-emerald-100 font-mono">
            Shift+A
          </kbd>
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto px-3 py-1 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all group',
                isActive
                  ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100'
              )}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={cn(
                    'w-4 h-4 transition-transform group-hover:scale-110',
                    isActive
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-slate-400 dark:text-slate-500'
                  )}
                />
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span className="text-[11px] font-bold px-1.5 py-0.2 rounded-full bg-rose-500 text-white min-w-5 text-center">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Profile & Net Worth Summary */}
      <div className="p-4 border-t border-slate-100 dark:border-slate-800/80 space-y-3">
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
              Total Kekayaan
            </p>
            <p className="text-sm font-bold text-slate-900 dark:text-white">
              {formatCompactCurrency(totalNetWorth)}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 transition-colors"
              title="Ganti Tema"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
