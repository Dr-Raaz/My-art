/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import type { Category, Artwork } from '../data/defaultArtworks';
import { Search, Paintbrush, Sparkles, Filter, AlertCircle, CheckCircle2 } from 'lucide-react';
import { getAllSavedProgress, type SavedArtworkProgress } from '../utils/indexedDB';

interface ArtworkGalleryProps {
  artworks: Artwork[];
  categories: Category[];
  selectedCategoryId: string | null;
  onSelectCategory: (categoryId: string | null) => void;
  onSelectArtwork: (artwork: Artwork) => void;
  refreshKey?: number;
}

export const ArtworkGallery: React.FC<ArtworkGalleryProps> = ({
  artworks,
  categories,
  selectedCategoryId,
  onSelectCategory,
  onSelectArtwork,
  refreshKey = 0,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [savedProgressMap, setSavedProgressMap] = useState<Record<string, SavedArtworkProgress>>({});

  // Load all saved progress from IndexedDB on mount and on refresh
  useEffect(() => {
    let isMounted = true;
    getAllSavedProgress()
      .then((map) => {
        if (isMounted) {
          setSavedProgressMap(map);
        }
      })
      .catch((err) => {
        console.warn('Failed to load saved coloring progress:', err);
      });

    return () => {
      isMounted = false;
    };
  }, [refreshKey]);

  // Map of active category IDs
  const activeCategoryIds = useMemo(() => {
    return new Set(categories.filter(c => c.isActive).map(c => c.id));
  }, [categories]);

  // Category lookup by id
  const categoryMap = useMemo(() => {
    const map = new Map<string, Category>();
    categories.forEach(c => map.set(c.id, c));
    return map;
  }, [categories]);

  // Filter artworks:
  // 1. Must be isPublished
  // 2. Must belong to an active category
  // 3. Category match
  // 4. Difficulty match
  // 5. Search query match
  const filteredArtworks = useMemo(() => {
    return artworks.filter((item) => {
      if (!item.isPublished) return false;
      if (!activeCategoryIds.has(item.categoryId)) return false;

      if (selectedCategoryId && item.categoryId !== selectedCategoryId) {
        return false;
      }

      if (selectedDifficulty !== 'all' && item.difficulty !== selectedDifficulty) {
        return false;
      }

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(query);
        const matchesDesc = item.description?.toLowerCase().includes(query);
        const catName = categoryMap.get(item.categoryId)?.name.toLowerCase() || '';
        const matchesCat = catName.includes(query);
        if (!matchesTitle && !matchesDesc && !matchesCat) {
          return false;
        }
      }

      return true;
    });
  }, [artworks, activeCategoryIds, selectedCategoryId, selectedDifficulty, searchQuery, categoryMap]);

  const difficultyColors = {
    easy: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    medium: 'bg-amber-50 text-amber-700 border-amber-200',
    hard: 'bg-rose-50 text-rose-700 border-rose-200',
  };

  return (
    <section id="gallery-section" className="py-5 sm:py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Search and Filters Header */}
      <div className="bg-white p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl border border-purple-100 shadow-xs mb-5 sm:mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
          {/* Title and stats */}
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-800 font-['Fredoka']">
              Pick a Picture to Color
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              Showing {filteredArtworks.length} of {artworks.filter(a => a.isPublished).length} illustrations
            </p>
          </div>

          {/* Search Input & Difficulty Filter */}
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
            {/* Search Box */}
            <div className="relative flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search pictures..."
                className="w-full pl-8.5 pr-4 py-2 sm:py-2.5 rounded-xl border border-purple-100 bg-purple-50/30 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 focus:bg-white transition-all text-slate-700 placeholder-slate-400 font-medium"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600 cursor-pointer"
                  aria-label="Clear search"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Difficulty Selector */}
            <div className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl text-[11px] sm:text-xs font-semibold">
              <span className="px-1.5 text-slate-500 hidden sm:inline flex items-center gap-1">
                <Filter className="w-3.5 h-3.5" />
                Level:
              </span>
              {(['all', 'easy', 'medium', 'hard'] as const).map((diff) => (
                <button
                  key={diff}
                  onClick={() => setSelectedDifficulty(diff)}
                  className={`px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg capitalize transition-all cursor-pointer ${
                    selectedDifficulty === diff
                      ? 'bg-white text-purple-700 shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {diff}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Gallery Grid: 1 column on <380px, 2 columns on >=380px, 3 columns on tablet/desktop */}
      {filteredArtworks.length > 0 ? (
        <div className="grid grid-cols-1 min-[380px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-3.5 sm:gap-6 lg:gap-8">
          {filteredArtworks.map((artwork) => {
            const category = categoryMap.get(artwork.categoryId);
            const saved = savedProgressMap[artwork.id];
            const hasProgress = Boolean(saved && (saved.previewDataUrl || (saved.paintedPercentage && saved.paintedPercentage > 0)));
            const thumbnailSrc = hasProgress && saved?.previewDataUrl ? saved.previewDataUrl : artwork.imageUrl;
            const paintedPercentage = saved?.paintedPercentage ?? 0;

            return (
              <div
                key={artwork.id}
                onClick={() => onSelectArtwork(artwork)}
                className="bg-white rounded-2xl sm:rounded-3xl border border-purple-100 overflow-hidden shadow-xs hover:shadow-xl hover:border-purple-300 hover:translate-y-[-4px] transition-all duration-200 cursor-pointer group flex flex-col"
              >
                {/* Artwork Thumbnail Container */}
                <div className="relative aspect-square w-full bg-slate-50 flex items-center justify-center p-3 sm:p-6 overflow-hidden border-b border-slate-100">
                  <img
                    src={thumbnailSrc}
                    alt={artwork.title}
                    className="w-full h-full object-contain filter group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />

                  {/* Badges on top */}
                  <div className="absolute top-2 left-2 sm:top-3.5 sm:left-3.5 flex flex-wrap items-center gap-1 z-10 max-w-[75%]">
                    {category && (
                      <span className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full bg-white/95 backdrop-blur-xs text-[10px] sm:text-[11px] font-bold text-slate-700 shadow-xs border border-slate-200/60 flex items-center gap-0.5 sm:gap-1">
                        <span>{category.icon || '🎨'}</span>
                        <span className="truncate max-w-[80px] sm:max-w-none">{category.name}</span>
                      </span>
                    )}
                    {hasProgress && paintedPercentage > 0 && (
                      <span
                        data-testid={`progress-badge-${artwork.id}`}
                        className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full bg-gradient-to-r from-purple-600 to-pink-500 text-white text-[10px] sm:text-[11px] font-bold shadow-xs flex items-center gap-1 animate-in fade-in"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-300 animate-pulse" />
                        <span>{paintedPercentage}% colored</span>
                      </span>
                    )}
                  </div>

                  <div className="absolute top-2 right-2 sm:top-3.5 sm:right-3.5 z-10">
                    <span
                      className={`px-1.5 py-0.5 sm:px-2.5 rounded-full text-[9px] sm:text-[11px] font-bold uppercase tracking-wider border shadow-xs ${
                        difficultyColors[artwork.difficulty]
                      }`}
                    >
                      {artwork.difficulty}
                    </span>
                  </div>

                  {/* Hover Overlay Button */}
                  <div className="absolute inset-0 bg-purple-900/10 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10">
                    <span className="px-3.5 py-2 sm:px-5 sm:py-2.5 rounded-xl sm:rounded-2xl bg-white text-purple-700 font-bold text-xs sm:text-sm shadow-lg flex items-center gap-1.5 sm:gap-2 transform translate-y-2 group-hover:translate-y-0 transition-transform">
                      <Paintbrush className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-pink-500" />
                      <span>{hasProgress ? 'Continue' : 'Color Now'}</span>
                    </span>
                  </div>
                </div>

                {/* Card Info & Action */}
                <div className="p-3 sm:p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-sm sm:text-xl text-slate-800 font-['Fredoka'] group-hover:text-purple-700 transition-colors leading-snug sm:leading-tight line-clamp-1 sm:line-clamp-none">
                      {artwork.title}
                    </h3>
                    <p className="text-[11px] sm:text-sm text-slate-500 mt-0.5 sm:mt-1 line-clamp-2 font-medium">
                      {artwork.description || 'Bring this black and white picture to life with vibrant colors!'}
                    </p>

                    {/* Subtle mini progress bar if in progress */}
                    {hasProgress && paintedPercentage > 0 && (
                      <div className="mt-2 sm:mt-3">
                        <div className="flex items-center justify-between text-[10px] sm:text-[11px] font-bold text-purple-700 mb-0.5 sm:mb-1">
                          <span className="flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-pink-500" />
                            <span>In progress</span>
                          </span>
                          <span>{paintedPercentage}%</span>
                        </div>
                        <div className="w-full bg-purple-100 rounded-full h-1.5 sm:h-2 overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-purple-500 to-pink-500 h-full rounded-full transition-all duration-500"
                            style={{ width: `${paintedPercentage}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-2.5 sm:mt-4 pt-2.5 sm:pt-4 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] sm:text-xs font-semibold text-purple-600 flex items-center gap-0.5 sm:gap-1">
                      <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                      Free
                    </span>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectArtwork(artwork);
                      }}
                      className="px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-purple-50 hover:bg-purple-600 text-purple-700 hover:text-white font-bold text-[11px] sm:text-xs transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <Paintbrush className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                      <span>{hasProgress ? 'Continue' : 'Color Now'}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Friendly Empty State */
        <div className="bg-white rounded-3xl border border-purple-100 p-12 text-center max-w-xl mx-auto shadow-xs">
          <div className="w-16 h-16 rounded-full bg-purple-100 text-purple-500 mx-auto flex items-center justify-center mb-4">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h3 className="text-2xl font-bold text-slate-800 font-['Fredoka'] mb-2">
            No coloring pages found!
          </h3>
          <p className="text-sm text-slate-500 font-medium mb-6">
            We couldn't find any pictures matching your search or filters. Try clearing your search query or selecting a different category.
          </p>
          <div className="flex justify-center gap-3">
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedDifficulty('all');
                onSelectCategory(null);
              }}
              className="px-5 py-2.5 rounded-xl bg-purple-600 text-white font-bold text-sm shadow-sm hover:bg-purple-700 transition-colors cursor-pointer"
            >
              Reset All Filters
            </button>
          </div>
        </div>
      )}
    </section>
  );
};
