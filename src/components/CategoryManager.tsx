/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import type { Category, Artwork } from '../data/defaultArtworks';
import { Plus, Edit2, Trash2, Check, X, AlertCircle, Layers } from 'lucide-react';

interface CategoryManagerProps {
  categories: Category[];
  artworks: Artwork[];
  onSaveCategory: (category: Category) => Promise<void>;
  onDeleteCategory: (categoryId: string) => Promise<{ success: boolean; error?: string }>;
}

export const CategoryManager: React.FC<CategoryManagerProps> = ({
  categories,
  artworks,
  onSaveCategory,
  onDeleteCategory,
}) => {
  const [editingCategory, setEditingCategory] = useState<Partial<Category> | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Common emoji icons for categories
  const suggestedIcons = ['🐾', '🌸', '🌿', '🚀', '🏡', '🐦', '🍓', '🐬', '🚗', '🎨', '🦁', '🦄', '🚂', '🍕', '🏰'];

  const handleOpenCreate = () => {
    setEditingCategory({
      id: `cat-${Date.now()}`,
      name: '',
      description: '',
      icon: '🎨',
      sortOrder: categories.length + 1,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    setErrorMessage(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (category: Category) => {
    setEditingCategory({ ...category });
    setErrorMessage(null);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory || !editingCategory.name?.trim()) {
      setErrorMessage('Category name is required.');
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    try {
      const categoryToSave: Category = {
        id: editingCategory.id || `cat-${Date.now()}`,
        name: editingCategory.name.trim(),
        description: editingCategory.description?.trim() || '',
        icon: editingCategory.icon?.trim() || '🎨',
        sortOrder: Number(editingCategory.sortOrder) || 1,
        isActive: editingCategory.isActive ?? true,
        createdAt: editingCategory.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await onSaveCategory(categoryToSave);
      setIsModalOpen(false);
      setEditingCategory(null);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to save category');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (cat: Category) => {
    const associated = artworks.filter(a => a.categoryId === cat.id);
    if (associated.length > 0) {
      alert(`Cannot delete category "${cat.name}": It has ${associated.length} artwork(s) assigned to it. Please reassign or delete the associated artwork first.`);
      return;
    }

    if (!confirm(`Are you sure you want to delete the category "${cat.name}"?`)) {
      return;
    }

    const res = await onDeleteCategory(cat.id);
    if (!res.success) {
      alert(res.error || 'Failed to delete category.');
    }
  };

  const handleToggleActive = async (cat: Category) => {
    await onSaveCategory({
      ...cat,
      isActive: !cat.isActive,
      updatedAt: new Date().toISOString(),
    });
  };

  return (
    <div className="space-y-6">
      {/* Header & Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-800 font-['Fredoka']">
            Category Management
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Organize illustrations into themes. Active categories appear instantly in the public gallery.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Category</span>
        </button>
      </div>

      {/* Category List Table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
              <tr>
                <th className="py-3.5 px-4 w-16 text-center">Order</th>
                <th className="py-3.5 px-4">Icon & Name</th>
                <th className="py-3.5 px-4 hidden md:table-cell">Description</th>
                <th className="py-3.5 px-4 text-center">Artworks</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
              {categories
                .slice()
                .sort((a, b) => a.sortOrder - b.sortOrder)
                .map((cat) => {
                  const artworkCount = artworks.filter(a => a.categoryId === cat.id).length;

                  return (
                    <tr key={cat.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4 text-center font-bold text-slate-400">
                        {cat.sortOrder}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
                            {cat.icon || '🎨'}
                          </span>
                          <div>
                            <span className="font-bold text-sm text-slate-800 block">
                              {cat.name}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              ID: {cat.id}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 hidden md:table-cell text-slate-500 max-w-xs truncate">
                        {cat.description || '—'}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 font-bold text-[11px]">
                          {artworkCount}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => handleToggleActive(cat)}
                          className={`px-2.5 py-1 rounded-full text-[11px] font-bold cursor-pointer transition-colors ${
                            cat.isActive
                              ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                              : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                          }`}
                          title="Click to toggle status"
                        >
                          {cat.isActive ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(cat)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-purple-600 hover:bg-purple-50 transition-colors cursor-pointer"
                            title="Edit Category"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(cat)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Delete Category"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Category Modal */}
      {isModalOpen && editingCategory && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100 animate-in fade-in duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <h3 className="text-lg font-bold text-slate-800 font-['Fredoka']">
                {editingCategory.createdAt ? 'Edit Category' : 'Create New Category'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMessage && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  value={editingCategory.name || ''}
                  onChange={(e) =>
                    setEditingCategory({ ...editingCategory, name: e.target.value })
                  }
                  placeholder="e.g. Sea Animals, Space..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Icon (Emoji)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={editingCategory.icon || '🎨'}
                    onChange={(e) =>
                      setEditingCategory({ ...editingCategory, icon: e.target.value })
                    }
                    className="w-16 px-3 py-2 text-center text-xl rounded-xl border border-slate-200"
                    maxLength={4}
                  />
                  <div className="flex flex-wrap gap-1">
                    {suggestedIcons.map((ic) => (
                      <button
                        key={ic}
                        type="button"
                        onClick={() => setEditingCategory({ ...editingCategory, icon: ic })}
                        className="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center text-base cursor-pointer"
                      >
                        {ic}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={editingCategory.description || ''}
                  onChange={(e) =>
                    setEditingCategory({ ...editingCategory, description: e.target.value })
                  }
                  placeholder="Brief description for this category..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Sort Order
                  </label>
                  <input
                    type="number"
                    value={editingCategory.sortOrder ?? 1}
                    onChange={(e) =>
                      setEditingCategory({
                        ...editingCategory,
                        sortOrder: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingCategory.isActive ?? true}
                      onChange={(e) =>
                        setEditingCategory({ ...editingCategory, isActive: e.target.checked })
                      }
                      className="rounded accent-purple-600 w-4 h-4"
                    />
                    <span>Active & Visible</span>
                  </label>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : 'Save Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
