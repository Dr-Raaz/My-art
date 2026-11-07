/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { PALETTE_COLORS, type PaletteColor } from '../utils/colorPalette';
import { Check } from 'lucide-react';

interface ColorPaletteProps {
  selectedColor: string;
  onSelectColor: (colorHex: string) => void;
}

export const ColorPalette: React.FC<ColorPaletteProps> = ({
  selectedColor,
  onSelectColor,
}) => {
  const [filterGroup, setFilterGroup] = useState<string>('all');

  const groups = [
    { id: 'all', label: 'All 36' },
    { id: 'rainbow', label: 'Rainbow' },
    { id: 'pastel', label: 'Pastels' },
    { id: 'nature', label: 'Nature' },
    { id: 'skin', label: 'Skin Tones' },
    { id: 'neutral', label: 'Neutrals' },
  ];

  const filteredColors = filterGroup === 'all'
    ? PALETTE_COLORS
    : PALETTE_COLORS.filter(c => c.group === filterGroup);

  // Find selected color details
  const activeColorObj = PALETTE_COLORS.find(
    c => c.hex.toLowerCase() === selectedColor.toLowerCase()
  );

  return (
    <div className="bg-white/95 backdrop-blur-md rounded-3xl border border-purple-100 shadow-lg p-4 flex flex-col gap-3">
      {/* Group Tabs & Current Color Label */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-full shadow-inner border border-slate-200"
            style={{ backgroundColor: selectedColor }}
          />
          <div>
            <p className="text-xs font-bold text-slate-800 leading-tight">
              {activeColorObj?.name || selectedColor}
            </p>
            <p className="text-[10px] text-slate-400 font-medium">Selected Color</p>
          </div>
        </div>

        {/* Group Filter Chips */}
        <div className="flex items-center gap-1 overflow-x-auto py-0.5 no-scrollbar">
          {groups.map((grp) => (
            <button
              key={grp.id}
              onClick={() => setFilterGroup(grp.id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                filterGroup === grp.id
                  ? 'bg-purple-100 text-purple-700'
                  : 'text-slate-500 hover:bg-slate-100'
              }`}
            >
              {grp.label}
            </button>
          ))}
        </div>
      </div>

      {/* 36 Circular Swatches */}
      <div className="grid grid-cols-6 sm:grid-cols-9 md:grid-cols-12 gap-2 sm:gap-2.5 justify-items-center">
        {filteredColors.map((color) => {
          const isSelected = color.hex.toLowerCase() === selectedColor.toLowerCase();
          const isLight = ['#ffffff', '#fbcfe8', '#fed7aa', '#fef08a', '#a7f3d0', '#bae6fd', '#ddd6fe', '#e9d5ff', '#ffedd5', '#e2e8f0'].includes(color.hex.toLowerCase());

          return (
            <button
              key={color.hex}
              onClick={() => onSelectColor(color.hex)}
              className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full transition-all duration-150 relative cursor-pointer flex items-center justify-center shadow-xs hover:scale-110 active:scale-95 ${
                isSelected
                  ? 'ring-4 ring-purple-500 ring-offset-2 scale-105 z-10'
                  : 'hover:shadow-md'
              } ${color.hex === '#FFFFFF' ? 'border-2 border-slate-200' : 'border border-black/10'}`}
              style={{ backgroundColor: color.hex }}
              title={color.name}
              aria-label={`Select color ${color.name} (${color.hex})`}
              aria-pressed={isSelected}
            >
              {isSelected && (
                <Check
                  className={`w-5 h-5 ${isLight ? 'text-slate-800' : 'text-white'} stroke-[3] drop-shadow-xs`}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
