'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { useFinance } from '@/lib/storage/finance-store';
import { DynamicIcon } from '@/components/ui/icon-helper';
import { useToast } from '@/components/ui/toast';
import { Category } from '@/types/finance';
import { Tags, Plus, Pencil, Trash2, TrendingDown, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

const ICON_OPTIONS = [
  'Utensils',
  'Car',
  'ShoppingBag',
  'Receipt',
  'Film',
  'HeartPulse',
  'GraduationCap',
  'Users',
  'Sparkles',
  'Plane',
  'Laptop',
  'Banknote',
  'Store',
  'TrendingUp',
  'Gift',
  'PlusCircle',
  'ShieldCheck',
  'CircleEllipsis',
];

const COLOR_OPTIONS = [
  '#EF4444', // Red
  '#F97316', // Orange
  '#F59E0B', // Amber
  '#10B981', // Emerald
  '#06B6D4', // Cyan
  '#3B82F6', // Blue
  '#6366F1', // Indigo
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#6B7280', // Slate
];

export default function CategoriesPage() {
  const { categories, addCategory, updateCategory, deleteCategory, transactions } = useFinance();
  const { success, error } = useToast();

  const [activeTab, setActiveTab] = useState<'expense' | 'income'>('expense');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [color, setColor] = useState('#EF4444');
  const [icon, setIcon] = useState('Utensils');

  const openAddModal = (defaultType: 'expense' | 'income') => {
    setEditingCategory(null);
    setName('');
    setType(defaultType);
    setColor(defaultType === 'expense' ? '#EF4444' : '#10B981');
    setIcon(defaultType === 'expense' ? 'Utensils' : 'Banknote');
    setIsModalOpen(true);
  };

  const openEditModal = (cat: Category) => {
    setEditingCategory(cat);
    setName(cat.name);
    setType(cat.type);
    setColor(cat.color);
    setIcon(cat.icon);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      error('Nama kategori wajib diisi');
      return;
    }

    if (editingCategory) {
      updateCategory(editingCategory.id, {
        name: name.trim(),
        type,
        color,
        icon,
      });
      success('Kategori diperbarui', `Kategori "${name}" berhasil disimpan.`);
    } else {
      addCategory({
        name: name.trim(),
        type,
        color,
        icon,
        is_default: false,
      });
      success('Kategori ditambahkan', `Kategori "${name}" berhasil dibuat.`);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string, catName: string) => {
    const usageCount = transactions.filter((t) => t.category_id === id).length;
    const confirmMsg =
      usageCount > 0
        ? `Kategori "${catName}" digunakan pada ${usageCount} transaksi. Yakin ingin menghapus? Transaksi terkait akan menjadi tanpa kategori.`
        : `Hapus kategori "${catName}"?`;

    if (confirm(confirmMsg)) {
      deleteCategory(id);
      success('Kategori dihapus', `"${catName}" telah dihapus.`);
    }
  };

  const filteredCategories = categories.filter((c) => c.type === activeTab);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Kategori Finansial
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Sesuaikan label kategori pengeluaran dan pemasukan dengan ikon dan warna pilihan
          </p>
        </div>

        <Button
          onClick={() => openAddModal(activeTab)}
          className="h-10 text-xs font-semibold gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>+ Tambah Kategori {activeTab === 'expense' ? 'Pengeluaran' : 'Pemasukan'}</span>
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl max-w-sm">
        <button
          onClick={() => setActiveTab('expense')}
          className={cn(
            'flex-1 h-9 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all',
            activeTab === 'expense'
              ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-sm'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-100'
          )}
        >
          <TrendingDown className="w-4 h-4" />
          <span>Kategori Pengeluaran ({categories.filter((c) => c.type === 'expense').length})</span>
        </button>
        <button
          onClick={() => setActiveTab('income')}
          className={cn(
            'flex-1 h-9 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all',
            activeTab === 'income'
              ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-100'
          )}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Kategori Pemasukan ({categories.filter((c) => c.type === 'income').length})</span>
        </button>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredCategories.map((cat) => {
          const usageCount = transactions.filter((t) => t.category_id === cat.id).length;
          return (
            <Card
              key={cat.id}
              className="hover:shadow-md transition-all border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900"
            >
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm"
                    style={{ backgroundColor: cat.color }}
                  >
                    <DynamicIcon name={cat.icon} className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                      {cat.name}
                    </h4>
                    <p className="text-[11px] text-slate-400">{usageCount} transaksi</p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(cat)}
                    className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 transition-colors"
                    title="Edit Kategori"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(cat.id, cat.name)}
                    className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-400 hover:text-rose-600 transition-colors"
                    title="Hapus Kategori"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Add / Edit Category Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md w-[95vw] p-6 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              {editingCategory ? 'Edit Kategori' : 'Tambah Kategori Baru'}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Pilih nama, warna, dan ikon untuk kategori keuangan Anda
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase">Nama Kategori</label>
              <Input
                placeholder="Contoh: Langganan Kursus, Hobi, Donasi"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase">Tipe</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="w-full h-11 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-medium"
              >
                <option value="expense">Pengeluaran</option>
                <option value="income">Pemasukan</option>
              </select>
            </div>

            {/* Color selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase">Warna</label>
              <div className="flex flex-wrap gap-2 pt-1">
                {COLOR_OPTIONS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={cn(
                      'w-7 h-7 rounded-full transition-transform',
                      color === c ? 'scale-125 ring-2 ring-emerald-500 ring-offset-2' : 'hover:scale-110'
                    )}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            {/* Icon selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase">Ikon Kategori</label>
              <div className="grid grid-cols-6 gap-2 pt-1 max-h-40 overflow-y-auto pr-1">
                {ICON_OPTIONS.map((iconName) => (
                  <button
                    key={iconName}
                    type="button"
                    onClick={() => setIcon(iconName)}
                    className={cn(
                      'h-10 rounded-xl flex items-center justify-center border transition-all',
                      icon === iconName
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 scale-105'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
                    )}
                  >
                    <DynamicIcon name={iconName} className="w-5 h-5" />
                  </button>
                ))}
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                Batal
              </Button>
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white">
                {editingCategory ? 'Simpan Perubahan' : 'Buat Kategori'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
