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
  LogOut,
  User,
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
  const { totalNetWorth, unreadNotificationCount, currentUser, logout, isSaving } = useFinance();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);


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
      <div className="p-4 border-t border-slate-100 dark:border-slate-800/80 space-y-2">
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
              onClick={() => setTheme((mounted ? resolvedTheme : theme) === 'dark' ? 'light' : 'dark')}
              className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 transition-colors cursor-pointer"
              title="Ganti Tema"
            >
              {mounted && (resolvedTheme === 'dark' ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-indigo-400" />)}
              {!mounted && <Sun className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Logged in User Bar */}
        <div className="px-3 py-2 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/40 dark:border-slate-800/40 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-emerald-600/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <User className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                {currentUser?.full_name || 'Pengguna'}
              </p>
              <p className="text-[10px] text-slate-400 truncate">
                {currentUser?.email || 'Akun Lokal'}
              </p>
            </div>
          </div>

          <button
            onClick={logout}
            className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer shrink-0"
            title="Keluar / Logout"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
