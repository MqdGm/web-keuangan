'use client';

import React, { useState } from 'react';
import { DesktopSidebar } from '@/components/layout/desktop-sidebar';
import { MobileBottomNav } from '@/components/layout/mobile-bottom-nav';
import { TopHeader } from '@/components/layout/top-header';
import { TransactionModal } from '@/components/transactions/transaction-modal';
import { useFinance } from '@/lib/storage/finance-store';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const { isLoading } = useFinance();

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 flex flex-col lg:flex-row">
      {/* Desktop Navigation Sidebar */}
      <DesktopSidebar onOpenQuickAdd={() => setIsQuickAddOpen(true)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 pb-20 lg:pb-8">
        <TopHeader onOpenQuickAdd={() => setIsQuickAddOpen(true)} />
        
        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {isLoading ? (
            <div className="flex items-center justify-center min-h-[60vh]">
              <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm font-medium text-slate-500">Memuat data finansial...</p>
              </div>
            </div>
          ) : (
            children
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav onOpenQuickAdd={() => setIsQuickAddOpen(true)} />

      {/* Global Quick Add Transaction Modal */}
      <TransactionModal
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
      />
    </div>
  );
}
