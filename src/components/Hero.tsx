/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Sparkles, Paintbrush, Heart, Palette, CheckCircle } from 'lucide-react';

interface HeroProps {
  onStartColoring: () => void;
  totalArtworks: number;
}

export const Hero: React.FC<HeroProps> = ({ onStartColoring, totalArtworks }) => {
  return (
    <section className="relative overflow-hidden py-6 sm:py-12 md:py-20 bg-gradient-to-b from-purple-50/70 via-pink-50/40 to-transparent">
      {/* Decorative background shapes */}
      <div className="absolute top-6 left-10 w-24 h-24 rounded-full bg-yellow-200/40 blur-xl pointer-events-none" />
      <div className="absolute bottom-8 right-12 w-36 h-36 rounded-full bg-purple-200/50 blur-2xl pointer-events-none" />
      <div className="absolute top-1/2 right-1/4 w-28 h-28 rounded-full bg-pink-200/40 blur-xl pointer-events-none" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        {/* Child Safety Badge */}
        <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 py-1 sm:px-4 sm:py-1.5 rounded-full bg-white/90 border border-purple-200 shadow-xs mb-3 sm:mb-6 text-xs sm:text-sm font-semibold text-purple-700">
          <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500 fill-amber-400" />
          <span>100% Free • No Sign-up Needed • Kid Safe</span>
        </div>

        {/* Main Heading */}
        <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold text-slate-800 tracking-tight font-['Fredoka'] leading-tight mb-2 sm:mb-5">
          Let's Start <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-pink-500 to-amber-500">Coloring!</span>
        </h1>

        {/* Subtitle */}
        <p className="text-sm sm:text-xl md:text-2xl text-slate-600 max-w-2xl mx-auto font-medium leading-normal sm:leading-relaxed mb-5 sm:mb-8">
          Choose your favorite picture, pick your colors, and bring your imagination to life!
        </p>

        {/* Prominent Action Button */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={onStartColoring}
            className="w-full sm:w-auto px-6 py-3.5 sm:px-8 sm:py-4 rounded-2xl bg-gradient-to-r from-purple-500 via-pink-500 to-amber-500 text-white font-bold text-base sm:text-xl shadow-lg shadow-purple-300/60 hover:shadow-xl hover:shadow-purple-400/70 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 cursor-pointer flex items-center justify-center gap-2.5 sm:gap-3"
            aria-label="Start Coloring Now"
          >
            <Paintbrush className="w-5 h-5 sm:w-6 sm:h-6" />
            <span>Start Coloring</span>
          </button>
        </div>

        {/* Feature Highlights */}
        <div className="mt-6 sm:mt-12 grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4 max-w-3xl mx-auto text-left">
          <div className="bg-white/80 backdrop-blur-sm p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl border border-purple-100 shadow-xs flex items-center gap-2.5 sm:gap-3">
            <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-pink-100 text-pink-600 flex items-center justify-center shrink-0">
              <Palette className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <p className="text-[11px] sm:text-xs font-bold text-slate-700">Magic Fill</p>
              <p className="text-[10px] sm:text-[11px] text-slate-500 leading-tight">Tap to color regions</p>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl border border-purple-100 shadow-xs flex items-center gap-2.5 sm:gap-3">
            <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <p className="text-[11px] sm:text-xs font-bold text-slate-700">36 Colors</p>
              <p className="text-[10px] sm:text-[11px] text-slate-500 leading-tight">Bright & friendly tones</p>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl border border-purple-100 shadow-xs flex items-center gap-2.5 sm:gap-3">
            <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
              <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <p className="text-[11px] sm:text-xs font-bold text-slate-700">Auto Saved</p>
              <p className="text-[10px] sm:text-[11px] text-slate-500 leading-tight">Keeps your art safe</p>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl border border-purple-100 shadow-xs flex items-center gap-2.5 sm:gap-3">
            <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
              <Heart className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-[11px] sm:text-xs font-bold text-slate-700">Free Download</p>
              <p className="text-[10px] sm:text-[11px] text-slate-500 leading-tight">Export clean PNG</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
