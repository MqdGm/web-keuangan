'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useFinance } from '@/lib/storage/finance-store';
import { formatRelativeTime } from '@/lib/utils/dates';
import { Bell, CheckCheck, Trash2, ArrowRight, AlertTriangle, Calendar, Target, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function NotificationsPage() {
  const { notifications, markNotificationRead, markAllNotificationsRead, clearNotifications } = useFinance();

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'budget_warning':
        return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      case 'recurring_due':
        return <Calendar className="w-5 h-5 text-blue-500" />;
      case 'goal_reached':
        return <Target className="w-5 h-5 text-purple-500" />;
      default:
        return <Info className="w-5 h-5 text-emerald-500" />;
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Pusat Notifikasi & Pengingat
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Pemberitahuan penting tentang batas pagu anggaran, tagihan rutin, dan capaian target
          </p>
        </div>

        {notifications.length > 0 && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={markAllNotificationsRead}
              className="h-9 text-xs font-semibold gap-1.5"
            >
              <CheckCheck className="w-4 h-4" />
              <span>Tandai Semua Dibaca</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={clearNotifications}
              className="h-9 text-xs font-semibold gap-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
            >
              <Trash2 className="w-4 h-4" />
              <span>Bersihkan</span>
            </Button>
          </div>
        )}
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {notifications.length === 0 ? (
          <Card className="p-12 text-center border-slate-200 dark:border-slate-800">
            <div className="max-w-xs mx-auto space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                <Bell className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Tidak ada notifikasi baru
              </h3>
              <p className="text-xs text-slate-400">
                Semua kondisi keuangan Anda dalam keadaan aman dan terkendali.
              </p>
            </div>
          </Card>
        ) : (
          notifications.map((notif) => (
            <Card
              key={notif.id}
              onClick={() => !notif.is_read && markNotificationRead(notif.id)}
              className={cn(
                'border-slate-200/80 dark:border-slate-800/80 transition-all cursor-pointer',
                notif.is_read
                  ? 'bg-white/60 dark:bg-slate-900/60'
                  : 'bg-white dark:bg-slate-900 shadow-sm border-l-4 border-l-emerald-500'
              )}
            >
              <CardContent className="p-4 flex items-start justify-between gap-4">
                <div className="flex items-start gap-3.5 min-w-0">
                  <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 shrink-0 mt-0.5">
                    {getNotificationIcon(notif.type)}
                  </div>

                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4
                        className={cn(
                          'text-sm font-bold',
                          notif.is_read
                            ? 'text-slate-700 dark:text-slate-300'
                            : 'text-slate-900 dark:text-white'
                        )}
                      >
                        {notif.title}
                      </h4>
                      {!notif.is_read && (
                        <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                      )}
                    </div>

                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {notif.message}
                    </p>

                    <p className="text-[10px] text-slate-400 mt-1">
                      {formatRelativeTime(notif.created_at)}
                    </p>
                  </div>
                </div>

                {notif.action_url && (
                  <Link
                    href={notif.action_url}
                    className="shrink-0 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-emerald-600 transition-colors"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
