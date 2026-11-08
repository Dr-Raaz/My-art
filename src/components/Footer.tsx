/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Palette, Heart, Shield, Lock } from 'lucide-react';

interface FooterProps {
  onOpenAbout: () => void;
  onNavigateAdmin: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenAbout, onNavigateAdmin }) => {
  return (
    <footer className="mt-20 border-t border-purple-100 bg-white/70 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-500 to-pink-500 text-white flex items-center justify-center">
            <Palette className="w-5 h-5" />
          </div>
          <div>
            <p className="font-bold text-slate-800 font-['Fredoka']">My Art Studio</p>
            <p className="text-xs text-slate-400">
              Creative coloring for young artists everywhere.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-6 text-xs font-semibold text-slate-500">
          <button
            onClick={onOpenAbout}
            className="hover:text-purple-600 transition-colors cursor-pointer"
          >
            Privacy & Safety
          </button>
          <span>•</span>
          <button
            onClick={onOpenAbout}
            className="hover:text-purple-600 transition-colors cursor-pointer"
          >
            About
          </button>
          <span>•</span>
          <button
            onClick={onNavigateAdmin}
            className="hover:text-purple-700 transition-colors cursor-pointer flex items-center gap-1 text-slate-400"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Administrator Access</span>
          </button>
        </div>

        <p className="text-xs text-slate-400">
          © {new Date().getFullYear()} My Art Studio. 100% Free & Kid Safe.
        </p>
      </div>
    </footer>
  );
};
