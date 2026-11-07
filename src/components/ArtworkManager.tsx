/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import type { Category, Artwork } from '../data/defaultArtworks';
import {
  Search,
  Plus,
  Trash2,
  Edit,
  Eye,
  EyeOff,
  Upload,
  Filter,
  CheckCircle2,
  X,
  FileImage,
} from 'lucide-react';

interface ArtworkManagerProps {
  artworks: Artwork[];
  categories: Category[];
  onOpenUpload: () => void;
  onSaveArtwork: (artwork: Artwork) => Promise<void>;
  onDeleteArtwork: (artworkId: string) => Promise<void>;
}

export const ArtworkManager: React.FC<ArtworkManagerProps> = ({
  artworks,
  categories,
  onOpenUpload,
  onSaveArtwork,
  onDeleteArtwork,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Edit modal state
  const [editingArtwork, setEditingArtwork] = useState<Artwork | null>(null);

  const categoryMap = new Map<string, Category>();
  categories.forEach(c => categoryMap.set(c.id, c));

  const filtered = artworks.filter((item) => {
    if (filterCategory !== 'all' && item.categoryId !== filterCategory) return false;
    if (filterStatus === 'published' && !item.isPublished) return false;
    if (filterStatus === 'draft' && item.isPublished) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        item.title.toLowerCase().includes(q) ||
        (item.description && item.description.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const handleTogglePublish = async (artwork: Artwork) => {
    await onSaveArtwork({
      ...artwork,
      isPublished: !artwork.isPublished,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleDelete = async (artwork: Artwork) => {
    if (confirm(`Are you sure you want to delete "${artwork.title}"? This cannot be undone.`)) {
      await onDeleteArtwork(artwork.id);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingArtwork) return;

    await onSaveArtwork({
      ...editingArtwork,
      updatedAt: new Date().toISOString(),
    });
    setEditingArtwork(null);
  };

  return (
    <div className="space-y-6">
      {/* Header & Upload Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-800 font-['Fredoka']">
            Artwork Library
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Manage coloring illustrations, toggle public availability, or add new line art.
          </p>
        </div>

        <button
          onClick={onOpenUpload}
          className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Upload Artwork</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search illustrations by title..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Category Filter */}
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white focus:outline-none"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.icon || '🎨'} {c.name}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="published">Published</option>
            <option value="draft">Drafts</option>
          </select>
        </div>
      </div>

      {/* Artwork Table / Grid */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
              <tr>
                <th className="py-3.5 px-4 w-16">Preview</th>
                <th className="py-3.5 px-4">Title & Details</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4 text-center">Difficulty</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
              {filtered.map((item) => {
                const cat = categoryMap.get(item.categoryId);

                return (
                  <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4">
                      <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-200 p-1 flex items-center justify-center overflow-hidden">
                        <img
                          src={item.imageUrl}
                          alt={item.title}
                          className="w-full h-full object-contain"
                        />
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-sm text-slate-800 block">
                        {item.title}
                      </span>
                      <span className="text-[11px] text-slate-400 line-clamp-1">
                        {item.description || 'No description provided.'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 font-bold text-[11px]">
                        {cat ? `${cat.icon || ''} ${cat.name}` : item.categoryId}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          item.difficulty === 'easy'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : item.difficulty === 'medium'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {item.difficulty}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleTogglePublish(item)}
                        className={`px-2.5 py-1 rounded-full text-[11px] font-bold cursor-pointer transition-colors ${
                          item.isPublished
                            ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                            : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                        }`}
                        title="Click to toggle publication"
                      >
                        {item.isPublished ? 'Published' : 'Draft'}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setEditingArtwork(item)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-purple-600 hover:bg-purple-50 transition-colors cursor-pointer"
                          title="Edit Artwork Metadata"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Delete Artwork"
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

      {/* Edit Artwork Modal */}
      {editingArtwork && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100 animate-in fade-in duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <h3 className="text-lg font-bold text-slate-800 font-['Fredoka']">
                Edit Artwork Metadata
              </h3>
              <button
                onClick={() => setEditingArtwork(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Artwork Title
                </label>
                <input
                  type="text"
                  required
                  value={editingArtwork.title}
                  onChange={(e) =>
                    setEditingArtwork({ ...editingArtwork, title: e.target.value })
                  }
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={editingArtwork.description}
                  onChange={(e) =>
                    setEditingArtwork({ ...editingArtwork, description: e.target.value })
                  }
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Category
                  </label>
                  <select
                    value={editingArtwork.categoryId}
                    onChange={(e) =>
                      setEditingArtwork({ ...editingArtwork, categoryId: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.icon || '🎨'} {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Difficulty
                  </label>
                  <select
                    value={editingArtwork.difficulty}
                    onChange={(e) =>
                      setEditingArtwork({
                        ...editingArtwork,
                        difficulty: e.target.value as any,
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="editPublished"
                  checked={editingArtwork.isPublished}
                  onChange={(e) =>
                    setEditingArtwork({
                      ...editingArtwork,
                      isPublished: e.target.checked,
                    })
                  }
                  className="rounded accent-purple-600 w-4 h-4 cursor-pointer"
                />
                <label htmlFor="editPublished" className="text-xs font-bold text-slate-700 cursor-pointer">
                  Published to Public Gallery
                </label>
              </div>

              <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingArtwork(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
