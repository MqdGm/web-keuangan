'use client';

import React, { useState, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useFinance } from '@/lib/storage/finance-store';
import { useToast } from '@/components/ui/toast';
import { useTheme } from 'next-themes';
import { downloadJsonBackup, downloadTransactionsCsv } from '@/lib/utils/export-helpers';
import { buildGoogleSheetsData } from '@/lib/google/sheets';
import { createGoogleDriveBackupPayload } from '@/lib/google/drive';
import {
  Settings,
  User,
  Sun,
  Moon,
  Laptop,
  Database,
  Download,
  Upload,
  RefreshCw,
  Trash2,
  FileSpreadsheet,
  Cloud,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function SettingsPage() {
  const {
    profile,
    updateProfile,
    accounts,
    categories,
    transactions,
    budgets,
    budgetCategories,
    exportBackupData,
    importBackupData,
    resetToDemoData,
    clearAllData,
  } = useFinance();
  const { theme, setTheme } = useTheme();
  const { success, error, info } = useToast();

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Profile Form states
  const [fullName, setFullName] = useState(profile.full_name);
  const [email, setEmail] = useState(profile.email);
  const [currency, setCurrency] = useState(profile.currency || 'IDR');

  // Google Integration states
  const [isSyncingSheets, setIsSyncingSheets] = useState(false);
  const [isBackingUpDrive, setIsBackingUpDrive] = useState(false);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      full_name: fullName.trim(),
      email: email.trim(),
      currency,
    });
    success('Profil diperbarui', 'Data profil Anda telah berhasil disimpan.');
  };

  const handleDownloadBackup = () => {
    const data = exportBackupData();
    downloadJsonBackup(data);
    success('Cadangan diunduh', 'Berkas JSON cadangan finansial berhasil diunduh.');
  };

  const handleDownloadCsv = () => {
    downloadTransactionsCsv(transactions, accounts, categories);
    success('CSV diunduh', 'Berkas CSV mutasi transaksi berhasil diunduh.');
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = evt.target?.result as string;
        const parsed = JSON.parse(text);

        if (!confirm(`Pulihkan data dari berkas "${file.name}"? Data yang ada saat ini akan digantikan.`)) {
          return;
        }

        const res = importBackupData(parsed);
        if (res.success) {
          success('Data berhasil dipulihkan', `Berhasil memulihkan ${parsed.accounts?.length || 0} akun dan ${parsed.transactions?.length || 0} transaksi.`);
        } else {
          error('Gagal memulihkan', res.error || 'Format berkas tidak valid.');
        }
      } catch (err: any) {
        error('Gagal membaca berkas', 'Berkas harus dalam format JSON yang valid.');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleResetDemo = () => {
    if (confirm('Atur ulang seluruh saldo ke Rp 0 dan hapus transaksi demo agar siap dipakai sehari-hari?')) {
      resetToDemoData();
      success('Saldo Direset ke Rp 0', 'Seluruh data siap digunakan untuk pencatatan keuangan nyata Anda.');
    }
  };

  const handleClearAll = () => {
    if (confirm('PERINGATAN: Hapus seluruh data transaksi, akun, anggaran, dan target tabungan? Tindakan ini tidak dapat dibatalkan.')) {
      clearAllData();
      success('Data dibersihkan', 'Semua data finansial telah dihapus.');
    }
  };

  const handleTestGoogleSheetsSync = async () => {
    setIsSyncingSheets(true);
    try {
      const payload = buildGoogleSheetsData(transactions, accounts, categories, budgets, budgetCategories);
      const res = await fetch('/api/google/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payload }),
      });
      const data = await res.json();

      if (data.requiresAuth) {
        info(
          'Format Siap Sinkronisasi',
          `${data.sheetsPreview.sheetNames.length} lembar kerja (Transactions, Accounts, Categories, Budgets, Monthly Summary) telah siap.`
        );
      } else if (data.success) {
        success('Sinkronisasi Sukses', data.message);
      }
    } catch (e: any) {
      error('Gagal sinkronisasi', e.message);
    } finally {
      setIsSyncingSheets(false);
    }
  };

  const handleTestGoogleDriveBackup = async () => {
    setIsBackingUpDrive(true);
    try {
      const backupData = exportBackupData();
      const payload = createGoogleDriveBackupPayload(backupData);

      const res = await fetch('/api/google/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ backupPayload: payload }),
      });
      const data = await res.json();

      if (data.requiresAuth) {
        info(
          'Arsitektur Backup Siap',
          `Payload JSON cadangan (${data.metadata?.recordCount.transactions} transaksi) siap diunggah ke Google Drive.`
        );
      } else if (data.success) {
        success('Cadangan Google Drive Tersimpan', data.message);
      }
    } catch (e: any) {
      error('Gagal cadangan Google Drive', e.message);
    } finally {
      setIsBackingUpDrive(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Pengaturan Aplikasi
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Kelola profil pengguna, tema tampilan, mata uang, pencadangan data, dan integrasi cloud
        </p>
      </div>

      {/* 1. Profile & Currency */}
      <Card className="border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900">
        <CardHeader>
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <User className="w-5 h-5 text-emerald-600" />
            Profil & Mata Uang
          </CardTitle>
          <CardDescription className="text-xs">
            Informasi identitas akun dan format mata uang utama
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase">Nama Lengkap</label>
                <Input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Nama Anda"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase">Alamat Email</label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@example.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase">Mata Uang Utama</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full h-11 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-medium"
              >
                <option value="IDR">Rupiah Indonesia (Rp / IDR)</option>
                <option value="USD">US Dollar ($ / USD)</option>
                <option value="EUR">Euro (€ / EUR)</option>
              </select>
            </div>

            <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">
              Simpan Profil
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* 2. Appearance */}
      <Card className="border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900">
        <CardHeader>
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Sun className="w-5 h-5 text-amber-500" />
            Tema & Tampilan
          </CardTitle>
          <CardDescription className="text-xs">
            Pilih preferensi mode terang, mode gelap, atau ikuti tema sistem perangkat
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3 max-w-md">
            <button
              type="button"
              onClick={() => setTheme('light')}
              className={cn(
                'p-4 rounded-xl border flex flex-col items-center gap-2 transition-all',
                theme === 'light'
                  ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 font-bold shadow-sm'
                  : 'border-slate-200 dark:border-slate-800 text-slate-600 hover:bg-slate-50'
              )}
            >
              <Sun className="w-5 h-5" />
              <span className="text-xs">Terang</span>
            </button>

            <button
              type="button"
              onClick={() => setTheme('dark')}
              className={cn(
                'p-4 rounded-xl border flex flex-col items-center gap-2 transition-all',
                theme === 'dark'
                  ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 font-bold shadow-sm'
                  : 'border-slate-200 dark:border-slate-800 text-slate-600 hover:bg-slate-50'
              )}
            >
              <Moon className="w-5 h-5" />
              <span className="text-xs">Gelap</span>
            </button>

            <button
              type="button"
              onClick={() => setTheme('system')}
              className={cn(
                'p-4 rounded-xl border flex flex-col items-center gap-2 transition-all',
                theme === 'system'
                  ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 font-bold shadow-sm'
                  : 'border-slate-200 dark:border-slate-800 text-slate-600 hover:bg-slate-50'
              )}
            >
              <Laptop className="w-5 h-5" />
              <span className="text-xs">Sistem</span>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* 3. Data Management & Backup */}
      <Card className="border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900">
        <CardHeader>
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Database className="w-5 h-5 text-blue-600" />
            Manajemen & Pencadangan Data
          </CardTitle>
          <CardDescription className="text-xs">
            Ekspor seluruh catatan keuangan ke berkas JSON atau CSV, pulihkan data, atau kelola data demo
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Export JSON */}
            <div className="p-4 rounded-xl border border-slate-200/60 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-800/30 space-y-2">
              <div className="flex items-center gap-2 font-bold text-sm text-slate-900 dark:text-white">
                <Download className="w-4 h-4 text-emerald-600" />
                <span>Unduh Cadangan Lengkap</span>
              </div>
              <p className="text-xs text-slate-400">
                Mencadangkan seluruh akun, transaksi, kategori, anggaran, dan target ke berkas JSON.
              </p>
              <Button size="sm" onClick={handleDownloadBackup} className="w-full text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white">
                Unduh Berkas JSON
              </Button>
            </div>

            {/* Export CSV */}
            <div className="p-4 rounded-xl border border-slate-200/60 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-800/30 space-y-2">
              <div className="flex items-center gap-2 font-bold text-sm text-slate-900 dark:text-white">
                <FileSpreadsheet className="w-4 h-4 text-teal-600" />
                <span>Ekspor Transaksi CSV</span>
              </div>
              <p className="text-xs text-slate-400">
                Format tabel spreadsheet yang dapat dibuka langsung di Microsoft Excel atau Google Sheets.
              </p>
              <Button size="sm" variant="outline" onClick={handleDownloadCsv} className="w-full text-xs font-semibold">
                Unduh Berkas CSV
              </Button>
            </div>
          </div>

          {/* Restore / Import */}
          <div className="p-4 rounded-xl border border-slate-200/60 dark:border-slate-800/60 space-y-2">
            <div className="flex items-center gap-2 font-bold text-sm text-slate-900 dark:text-white">
              <Upload className="w-4 h-4 text-purple-600" />
              <span>Pulihkan / Impor Cadangan</span>
            </div>
            <p className="text-xs text-slate-400">
              Unggah berkas cadangan JSON yang sebelumnya pernah Anda unduh dari aplikasi ini.
            </p>
            <input
              type="file"
              ref={fileInputRef}
              accept=".json"
              onChange={handleImportFile}
              className="hidden"
            />
            <Button
              size="sm"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="text-xs font-semibold gap-1.5"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Pilih Berkas JSON</span>
            </Button>
          </div>

          {/* Reset Demo / Clear Data */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetDemo}
              className="text-xs font-semibold gap-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Setel Ulang ke Saldo Rp 0 (Mulai dari Awal)</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleClearAll}
              className="text-xs font-semibold gap-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Kosongkan Semua Data</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 4. Google Sheets & Google Drive Integration Architecture */}
      <Card className="border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Cloud className="w-5 h-5 text-emerald-600" />
              Integrasi Google Sheets & Google Drive
            </CardTitle>
            <Badge variant="outline" className="text-[10px]">
              Cloud Architecture Ready
            </Badge>
          </div>
          <CardDescription className="text-xs">
            Sinkronisasi otomatis ke spreadsheet multi-tab dan pencadangan terenkripsi ke Google Drive
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800/60 space-y-3">
            <div className="flex items-start gap-3">
              <FileSpreadsheet className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                  Struktur Multi-Sheet Google Spreadsheet
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  Aplikasi telah dikonfigurasi dengan arsitektur 5 lembar kerja otomatis:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 text-xs text-slate-600 dark:text-slate-300">
                  <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border">
                    <span className="font-bold">Sheet 1:</span> Transactions (Semua mutasi)
                  </div>
                  <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border">
                    <span className="font-bold">Sheet 2:</span> Accounts (Daftar rekening & saldo)
                  </div>
                  <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border">
                    <span className="font-bold">Sheet 3:</span> Categories (Kategori pengeluaran/pemasukan)
                  </div>
                  <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border">
                    <span className="font-bold">Sheet 4:</span> Budgets (Pagu & limit anggaran)
                  </div>
                  <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border sm:col-span-2">
                    <span className="font-bold">Sheet 5:</span> Monthly Summary (Ringkasan per bulan & savings rate)
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-2 flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={isSyncingSheets}
                onClick={handleTestGoogleSheetsSync}
                className="text-xs font-semibold gap-1.5"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>{isSyncingSheets ? 'Memproses...' : 'Uji Generator Google Sheets'}</span>
              </Button>

              <Button
                size="sm"
                variant="outline"
                disabled={isBackingUpDrive}
                onClick={handleTestGoogleDriveBackup}
                className="text-xs font-semibold gap-1.5"
              >
                <Cloud className="w-3.5 h-3.5 text-blue-600" />
                <span>{isBackingUpDrive ? 'Memproses...' : 'Uji Cadangan Google Drive'}</span>
              </Button>
            </div>
          </div>

          {/* Setup documentation */}
          <div className="p-4 rounded-xl border border-slate-200/60 dark:border-slate-800/60 space-y-2 text-xs">
            <h5 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Panduan Konfigurasi Google Cloud OAuth:
            </h5>
            <ol className="list-decimal list-inside space-y-1 text-slate-500 dark:text-slate-400 pl-1 leading-relaxed">
              <li>Buka <strong>Google Cloud Console</strong> (console.cloud.google.com).</li>
              <li>Buat project baru dan aktifkan <strong>Google Sheets API</strong> dan <strong>Google Drive API</strong>.</li>
              <li>Buat <strong>OAuth 2.0 Client ID</strong> (pilih Web Application).</li>
              <li>Tambahkan Authorized redirect URI: <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-[11px]">https://your-domain.vercel.app/api/google/callback</code>.</li>
              <li>Masukkan kredensial ke file <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-[11px]">.env.local</code>:
                <pre className="mt-1 p-2 rounded bg-slate-900 text-slate-100 text-[11px] font-mono overflow-x-auto">
{`GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret`}
                </pre>
              </li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
