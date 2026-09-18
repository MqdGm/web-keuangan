'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { Sparkles, ArrowRight, Lock, Mail, Play } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { success, error } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      error('Input belum lengkap', 'Masukkan email dan kata sandi Anda.');
      return;
    }

    setIsLoading(true);

    try {
      const supabase = createClient();
      if (!supabase) {
        // Fallback for demo mode
        success('Selamat Datang!', 'Masuk ke Dashboard Mode Lokal/Demo.');
        router.push('/');
        return;
      }

      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        error('Gagal Masuk', authError.message);
        return;
      }

      success('Masuk Berhasil', `Selamat datang kembali, ${data.user?.email}!`);
      router.push('/');
    } catch (err: any) {
      error('Kesalahan Sistem', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = () => {
    success('Mode Demo Diaktifkan', 'Menjelajahi aplikasi dengan akun demo finansial Indonesia.');
    router.push('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950">
      <div className="max-w-md w-full space-y-6">
        {/* App Logo */}
        <div className="text-center space-y-2">
          <div className="inline-flex w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 items-center justify-center text-white shadow-lg shadow-emerald-500/20">
            <Sparkles className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Keuangan
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Personal Finance Command Center
          </p>
        </div>

        {/* Login Card */}
        <Card className="border-slate-200/80 dark:border-slate-800/80 shadow-lg bg-white dark:bg-slate-900">
          <CardHeader>
            <CardTitle className="text-lg font-bold">Masuk ke Akun Anda</CardTitle>
            <CardDescription className="text-xs">
              Kelola seluruh transaksi, anggaran, dan tabungan Anda
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Quick Demo Access button */}
            <Button
              type="button"
              variant="outline"
              onClick={handleDemoLogin}
              className="w-full h-11 border-emerald-500/40 text-emerald-700 dark:text-emerald-300 bg-emerald-50/50 dark:bg-emerald-950/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 text-xs font-bold gap-2"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Coba Demo Mode (1-Klik Langsung Masuk)</span>
            </Button>

            <div className="relative flex items-center justify-center">
              <div className="border-t border-slate-200 dark:border-slate-800 w-full" />
              <span className="bg-white dark:bg-slate-900 px-3 text-[11px] uppercase font-semibold text-slate-400 shrink-0">
                Atau Masuk dengan Email
              </span>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase">Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <Input
                    type="email"
                    placeholder="nama@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-11 text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-500 uppercase">Kata Sandi</label>
                  <Link
                    href="/forgot-password"
                    className="text-xs text-emerald-600 hover:underline"
                  >
                    Lupa sandi?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 h-11 text-sm"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {isLoading ? 'Memverifikasi...' : 'Masuk Sekarang'}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="pt-0 justify-center text-xs text-slate-500">
            <span>Belum memiliki akun?</span>
            <Link href="/register" className="ml-1 font-semibold text-emerald-600 hover:underline">
              Daftar akun baru
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
