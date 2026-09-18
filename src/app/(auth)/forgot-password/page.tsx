'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
import { createClient } from '@/lib/supabase/client';
import { Sparkles, Mail, ArrowLeft } from 'lucide-react';

export default function ForgotPasswordPage() {
  const { success, error } = useToast();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      error('Email belum diisi');
      return;
    }

    setIsLoading(true);

    try {
      const supabase = createClient();
      if (supabase) {
        await supabase.auth.resetPasswordForEmail(email);
      }
      setSubmitted(true);
      success('Tautan Terkirim', 'Tautan pemulihan kata sandi telah dikirim ke email Anda.');
    } catch (err: any) {
      error('Gagal mengirim', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 items-center justify-center text-white shadow-lg shadow-emerald-500/20">
            <Sparkles className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Keuangan
          </h1>
        </div>

        <Card className="border-slate-200/80 dark:border-slate-800/80 shadow-lg bg-white dark:bg-slate-900">
          <CardHeader>
            <CardTitle className="text-lg font-bold">Lupa Kata Sandi?</CardTitle>
            <CardDescription className="text-xs">
              Masukkan email Anda dan kami akan mengirimkan tautan untuk mengatur ulang kata sandi
            </CardDescription>
          </CardHeader>

          <CardContent>
            {submitted ? (
              <div className="text-center space-y-3 p-4 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800">
                <p className="text-xs text-emerald-800 dark:text-emerald-200 font-medium">
                  Tautan pemulihan kata sandi telah dikirim ke <strong>{email}</strong>. Silakan periksa kotak masuk atau spam email Anda.
                </p>
              </div>
            ) : (
              <form onSubmit={handleReset} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 uppercase">Alamat Email</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <Input
                      type="email"
                      placeholder="nama@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 h-11 text-sm"
                      required
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-11 text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {isLoading ? 'Mengirim...' : 'Kirim Tautan Pemulihan'}
                </Button>
              </form>
            )}
          </CardContent>

          <CardFooter className="pt-0 justify-center text-xs">
            <Link
              href="/login"
              className="flex items-center gap-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali ke halaman Masuk</span>
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
