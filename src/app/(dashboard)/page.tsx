'use client';

import React, { useState } from 'react';
import { OverviewCards } from '@/components/dashboard/overview-cards';
import { CashFlowChart } from '@/components/dashboard/cash-flow-chart';
import { CategoryDonutChart } from '@/components/dashboard/category-donut-chart';
import { BudgetProgressWidget } from '@/components/dashboard/budget-progress-widget';
import { SavingsGoalsWidget } from '@/components/dashboard/savings-goals-widget';
import { UpcomingBillsWidget } from '@/components/dashboard/upcoming-bills-widget';
import { RecentTransactionsWidget } from '@/components/dashboard/recent-transactions-widget';
import { TransactionModal } from '@/components/transactions/transaction-modal';
import { Transaction } from '@/types/finance';

export default function DashboardPage() {
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  return (
    <div className="space-y-6">
      {/* 1. Overview Metric Cards */}
      <OverviewCards />

      {/* 2. Main Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CashFlowChart />
        <CategoryDonutChart />
      </div>

      {/* 3. Budget & Financial Goals Progress */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <BudgetProgressWidget />
        <SavingsGoalsWidget />
        <UpcomingBillsWidget />
      </div>

      {/* 4. Recent Transactions Table / Feed */}
      <div>
        <RecentTransactionsWidget onEditTransaction={(tx) => setEditingTransaction(tx)} />
      </div>

      {/* Edit Transaction Modal */}
      {editingTransaction && (
        <TransactionModal
          isOpen={Boolean(editingTransaction)}
          onClose={() => setEditingTransaction(null)}
          transactionToEdit={editingTransaction}
        />
      )}
    </div>
  );
}
