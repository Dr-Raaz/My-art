/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import type { Category, Artwork } from '../data/defaultArtworks';
import { Layers } from 'lucide-react';

interface CategoryListProps {
  categories: Category[];
  artworks: Artwork[];
  selectedCategoryId: string | null;
  onSelectCategory: (categoryId: string | null) => void;
}

export const CategoryList: React.FC<CategoryListProps> = ({
  categories,
  artworks,
  selectedCategoryId,
  onSelectCategory,
}) => {
  // Only display active categories
  const activeCategories = categories
    .filter(c => c.isActive)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  // Count published artworks per category
  const countPerCategory = (catId: string) => {
    return artworks.filter(a => a.categoryId === catId && a.isPublished).length;
  };

  const totalPublished = artworks.filter(a => a.isPublished).length;

  return (
    <section id="categories-section" className="py-5 sm:py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-4 sm:mb-6 gap-1.5 sm:gap-2">
        <div>
          <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-purple-600">
            Explore Themes
          </span>
          <h2 className="text-xl sm:text-3xl font-bold text-slate-800 font-['Fredoka']">
            Color by Category
          </h2>
        </div>
        <p className="text-xs sm:text-sm text-slate-500 font-medium">
          Choose a theme to find the pictures you love
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 sm:gap-4">
        {/* "All" button card */}
        <button
          onClick={() => onSelectCategory(null)}
          className={`p-3 sm:p-4 rounded-2xl text-left border transition-all duration-200 cursor-pointer flex flex-col justify-between group ${
            selectedCategoryId === null
              ? 'bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-200 scale-[1.01]'
              : 'bg-white text-slate-700 border-purple-100 hover:border-purple-300 hover:shadow-xs hover:scale-[1.01]'
          }`}
          aria-pressed={selectedCategoryId === null}
        >
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <div
              className={`w-9 h-9 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center ${
                selectedCategoryId === null
                  ? 'bg-white/20 text-white'
                  : 'bg-purple-100 text-purple-600 group-hover:scale-110 transition-transform'
              }`}
            >
              <Layers className="w-4 h-4 sm:w-6 sm:h-6" />
            </div>
            <span
              className={`text-[10px] sm:text-xs font-bold px-1.5 sm:px-2 py-0.5 rounded-full ${
                selectedCategoryId === null ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {totalPublished}
            </span>
          </div>
          <div>
            <h3 className="font-bold text-sm sm:text-base leading-tight">All Themes</h3>
            <p
              className={`text-[11px] sm:text-xs mt-0.5 ${
                selectedCategoryId === null ? 'text-purple-100' : 'text-slate-400'
              }`}
            >
              Everything to color
            </p>
          </div>
        </button>

        {/* Dynamic Category Cards */}
        {activeCategories.map((category) => {
          const count = countPerCategory(category.id);
          const isSelected = selectedCategoryId === category.id;

          return (
            <button
              key={category.id}
              onClick={() => onSelectCategory(isSelected ? null : category.id)}
              className={`p-3 sm:p-4 rounded-2xl text-left border transition-all duration-200 cursor-pointer flex flex-col justify-between group ${
                isSelected
                  ? 'bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-200 scale-[1.01]'
                  : 'bg-white text-slate-700 border-purple-100 hover:border-purple-300 hover:shadow-xs hover:scale-[1.01]'
              }`}
              aria-pressed={isSelected}
            >
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <div
                  className={`w-9 h-9 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center text-xl sm:text-2xl ${
                    isSelected
                      ? 'bg-white/20 text-white'
                      : 'bg-purple-50 group-hover:scale-110 transition-transform'
                  }`}
                >
                  {category.icon || '🎨'}
                </div>
                <span
                  className={`text-[10px] sm:text-xs font-bold px-1.5 sm:px-2 py-0.5 rounded-full ${
                    isSelected ? 'bg-white/25 text-white' : 'bg-purple-50 text-purple-700'
                  }`}
                >
                  {count} {count === 1 ? 'pic' : 'pics'}
                </span>
              </div>
              <div>
                <h3 className="font-bold text-sm sm:text-base leading-tight">{category.name}</h3>
                <p
                  className={`text-[11px] sm:text-xs mt-0.5 truncate ${
                    isSelected ? 'text-purple-100' : 'text-slate-400'
                  }`}
                  title={category.description}
                >
                  {category.description || `${count} coloring pages`}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
};
