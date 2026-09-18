'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
import { createClient } from '@/lib/supabase/client';
import { Sparkles, Lock, Mail, User } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const { success, error } = useToast();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim() || !password.trim()) {
      error('Input belum lengkap', 'Harap isi semua kolom pendaftaran.');
      return;
    }
    if (password.length < 6) {
      error('Kata sandi terlalu pendek', 'Kata sandi minimal 6 karakter.');
      return;
    }

    setIsLoading(true);

    try {
      const supabase = createClient();
      if (!supabase) {
        success('Pendaftaran Berhasil', 'Akun demo berhasil dibuat! Mengalihkan ke dashboard...');
        router.push('/');
        return;
      }

      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (signUpError) {
        error('Pendaftaran Gagal', signUpError.message);
        return;
      }

      success('Pendaftaran Berhasil!', 'Silakan periksa email Anda untuk verifikasi atau masuk langsung.');
      router.push('/login');
    } catch (err: any) {
      error('Kesalahan Sistem', err.message);
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
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Daftar akun gratis dan mulai rapikan finansial Anda
          </p>
        </div>

        <Card className="border-slate-200/80 dark:border-slate-800/80 shadow-lg bg-white dark:bg-slate-900">
          <CardHeader>
            <CardTitle className="text-lg font-bold">Buat Akun Baru</CardTitle>
            <CardDescription className="text-xs">
              Satu akun untuk seluruh rekening, anggaran, dan target tabungan
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase">Nama Lengkap</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <Input
                    placeholder="Nama Lengkap Anda"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="pl-10 h-11 text-sm"
                    required
                  />
                </div>
              </div>

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

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase">Kata Sandi</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <Input
                    type="password"
                    placeholder="Minimal 6 karakter"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
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
                {isLoading ? 'Mendaftarkan...' : 'Daftar Akun'}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="pt-0 justify-center text-xs text-slate-500">
            <span>Sudah memiliki akun?</span>
            <Link href="/login" className="ml-1 font-semibold text-emerald-600 hover:underline">
              Masuk di sini
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
