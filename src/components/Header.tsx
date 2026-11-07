/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Palette, Sparkles, Compass, Info, ShieldCheck } from 'lucide-react';

interface HeaderProps {
  currentView: string;
  onNavigate: (view: string) => void;
  onOpenAbout: () => void;
  onScrollToCategories: () => void;
  onScrollToGallery: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onNavigate,
  onOpenAbout,
  onScrollToCategories,
  onScrollToGallery,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-purple-100 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Brand Logo */}
        <button
          onClick={() => onNavigate('home')}
          className="flex items-center gap-3 group text-left cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 rounded-2xl p-1"
          aria-label="Kids Coloring Studio Home"
        >
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-500 via-pink-400 to-yellow-300 flex items-center justify-center text-white shadow-md shadow-purple-200 group-hover:scale-105 transition-transform duration-200">
            <Palette className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-2xl tracking-tight text-slate-800 font-['Fredoka']">
                Kids Coloring
              </span>
              <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-purple-100 text-purple-700">
                Studio
              </span>
            </div>
            <p className="text-xs font-medium text-slate-500 hidden sm:block">
              Free, Fun & Safe Online Coloring
            </p>
          </div>
        </button>

        {/* Navigation Items (No child login or registration button as specified) */}
        <nav className="flex items-center gap-2 sm:gap-4">
          <button
            onClick={() => {
              onNavigate('home');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition-colors cursor-pointer ${
              currentView === 'home'
                ? 'bg-purple-100 text-purple-700'
                : 'text-slate-600 hover:text-purple-600 hover:bg-purple-50'
            }`}
          >
            Home
          </button>

          <button
            onClick={onScrollToCategories}
            className="px-3.5 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:text-purple-600 hover:bg-purple-50 transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Compass className="w-4 h-4 text-pink-500" />
            <span>Categories</span>
          </button>

          <button
            onClick={onScrollToGallery}
            className="px-3.5 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:text-purple-600 hover:bg-purple-50 transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Coloring Pages</span>
          </button>

          <button
            onClick={onOpenAbout}
            className="px-3.5 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:text-purple-600 hover:bg-purple-50 transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Info className="w-4 h-4 text-blue-500" />
            <span>About</span>
          </button>

          {/* Admin shortcut button */}
          <button
            onClick={() => onNavigate('admin')}
            className="ml-2 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-500 hover:text-purple-700 hover:border-purple-300 hover:bg-purple-50/50 transition-colors cursor-pointer flex items-center gap-1"
            title="Administrator Portal"
            aria-label="Admin Portal"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden md:inline">Admin</span>
          </button>
        </nav>
      </div>
    </header>
  );
};
