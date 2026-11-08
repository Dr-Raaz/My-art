/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Palette, Sparkles, Compass, Info, ShieldCheck, Menu, X } from 'lucide-react';

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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleMobileSelect = (action: () => void) => {
    setIsMobileMenuOpen(false);
    action();
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-purple-100 shadow-xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
        {/* Brand Logo & Title */}
        <button
          onClick={() => {
            setIsMobileMenuOpen(false);
            onNavigate('home');
          }}
          className="flex items-center gap-2.5 sm:gap-3 group text-left cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 rounded-2xl p-1 shrink-0"
          aria-label="My Art Studio Home"
        >
          <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-purple-500 via-pink-400 to-yellow-300 flex items-center justify-center text-white shadow-md shadow-purple-200 group-hover:scale-105 transition-transform duration-200 shrink-0">
            <Palette className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <div className="flex items-center gap-1 sm:gap-1.5">
              <span className="font-bold text-lg sm:text-2xl tracking-tight text-slate-800 font-['Fredoka']">
                My Art
              </span>
              <span className="px-1.5 py-0.2 sm:px-2 sm:py-0.5 text-[10px] sm:text-xs font-semibold rounded-full bg-purple-100 text-purple-700">
                Studio
              </span>
            </div>
            <p className="text-[11px] font-medium text-slate-500 hidden sm:block">
              Free, Fun & Safe Online Coloring
            </p>
          </div>
        </button>

        {/* Desktop Navigation Items (hidden on mobile, visible on md+) */}
        <nav className="hidden md:flex items-center gap-2 lg:gap-4">
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
            <span>Admin</span>
          </button>
        </nav>

        {/* Mobile Hamburger / Close Button (visible only on mobile < md) */}
        <div className="flex items-center gap-1 md:hidden">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2.5 rounded-2xl bg-purple-50 hover:bg-purple-100 text-purple-700 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-400"
            aria-label={isMobileMenuOpen ? 'Close Navigation Menu' : 'Open Navigation Menu'}
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? (
              <X className="w-5 h-5 text-purple-700" />
            ) : (
              <Menu className="w-5 h-5 text-purple-700" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Dropdown Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white/98 border-b border-purple-100 shadow-xl px-4 py-3 space-y-1.5 animate-in slide-in-from-top-2 duration-150">
          <button
            onClick={() =>
              handleMobileSelect(() => {
                onNavigate('home');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              })
            }
            className={`w-full text-left px-4 py-3 rounded-2xl text-sm font-bold flex items-center gap-3 transition-colors ${
              currentView === 'home'
                ? 'bg-purple-100 text-purple-800'
                : 'text-slate-700 hover:bg-purple-50'
            }`}
          >
            <Palette className="w-4 h-4 text-purple-600" />
            <span>Home</span>
          </button>

          <button
            onClick={() => handleMobileSelect(onScrollToCategories)}
            className="w-full text-left px-4 py-3 rounded-2xl text-sm font-bold text-slate-700 hover:bg-purple-50 flex items-center gap-3 transition-colors"
          >
            <Compass className="w-4 h-4 text-pink-500" />
            <span>Categories</span>
          </button>

          <button
            onClick={() => handleMobileSelect(onScrollToGallery)}
            className="w-full text-left px-4 py-3 rounded-2xl text-sm font-bold text-slate-700 hover:bg-purple-50 flex items-center gap-3 transition-colors"
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Coloring Pages</span>
          </button>

          <button
            onClick={() => handleMobileSelect(onOpenAbout)}
            className="w-full text-left px-4 py-3 rounded-2xl text-sm font-bold text-slate-700 hover:bg-purple-50 flex items-center gap-3 transition-colors"
          >
            <Info className="w-4 h-4 text-blue-500" />
            <span>About</span>
          </button>

          <div className="pt-2 border-t border-purple-100/60">
            <button
              onClick={() => handleMobileSelect(() => onNavigate('admin'))}
              className="w-full text-left px-4 py-2.5 rounded-2xl text-xs font-bold text-slate-600 hover:text-purple-700 hover:bg-purple-50 flex items-center gap-2.5 transition-colors"
            >
              <ShieldCheck className="w-4 h-4 text-slate-400" />
              <span>Admin Portal</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
