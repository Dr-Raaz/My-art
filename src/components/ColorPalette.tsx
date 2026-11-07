/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { PALETTE_COLORS, type PaletteColor } from '../utils/colorPalette';
import { Check, ChevronUp, ChevronDown, Grid, Sparkles } from 'lucide-react';

interface ColorPaletteProps {
  selectedColor: string;
  onSelectColor: (colorHex: string) => void;
  isMobileFixed?: boolean;
}

export const ColorPalette: React.FC<ColorPaletteProps> = ({
  selectedColor,
  onSelectColor,
  isMobileFixed = false,
}) => {
  const [filterGroup, setFilterGroup] = useState<string>('all');
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  const groups = [
    { id: 'all', label: 'All 36' },
    { id: 'rainbow', label: 'Rainbow' },
    { id: 'pastel', label: 'Pastels' },
    { id: 'nature', label: 'Nature' },
    { id: 'skin', label: 'Skin' },
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
    <div
      className={`bg-white/95 backdrop-blur-md border border-purple-100 shadow-xl transition-all duration-200 ${
        isMobileFixed
          ? 'rounded-t-3xl border-b-0 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]'
          : 'rounded-3xl p-3.5 sm:p-4'
      }`}
    >
      {/* Top Header: Active Color & Group Filter Chips */}
      <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-100">
        {/* Selected Color Pill */}
        <div className="flex items-center gap-2 shrink-0">
          <div
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full shadow-inner border border-slate-300 shrink-0"
            style={{ backgroundColor: selectedColor }}
          />
          <div className="min-w-0 max-w-[100px] sm:max-w-none">
            <p className="text-xs font-bold text-slate-800 leading-tight truncate">
              {activeColorObj?.name || selectedColor}
            </p>
            <p className="text-[10px] text-slate-400 font-medium hidden sm:block">Selected Color</p>
          </div>
        </div>

        {/* Group Filter Chips (Scrollable) */}
        <div className="flex items-center gap-1 overflow-x-auto py-0.5 no-scrollbar flex-1 max-w-full justify-start sm:justify-center">
          {groups.map((grp) => (
            <button
              key={grp.id}
              onClick={() => setFilterGroup(grp.id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer shrink-0 ${
                filterGroup === grp.id
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-purple-50 text-slate-600 hover:bg-purple-100'
              }`}
            >
              {grp.label}
            </button>
          ))}
        </div>

        {/* Expand / Collapse toggle for mobile */}
        {isMobileFixed && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 transition-colors cursor-pointer shrink-0 flex items-center gap-1 text-[11px] font-bold"
            aria-label={isExpanded ? 'Collapse palette' : 'Expand full color grid'}
            title={isExpanded ? 'Show single row' : 'Show all swatches'}
          >
            {isExpanded ? (
              <>
                <ChevronDown className="w-4 h-4" />
                <span className="hidden xs:inline">Less</span>
              </>
            ) : (
              <>
                <Grid className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">Grid</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Swatches Container */}
      {/* On desktop or when expanded on mobile: Responsive Grid */}
      {(!isMobileFixed || isExpanded) ? (
        <div className="grid grid-cols-6 sm:grid-cols-9 md:grid-cols-12 gap-2 sm:gap-2.5 pt-2.5 justify-items-center max-h-48 sm:max-h-none overflow-y-auto no-scrollbar">
          {filteredColors.map((color) => {
            const isSelected = color.hex.toLowerCase() === selectedColor.toLowerCase();
            const isLight = [
              '#ffffff', '#fbcfe8', '#fed7aa', '#fef08a', '#a7f3d0',
              '#bae6fd', '#ddd6fe', '#e9d5ff', '#ffedd5', '#e2e8f0',
            ].includes(color.hex.toLowerCase());

            return (
              <button
                key={color.hex}
                onClick={() => onSelectColor(color.hex)}
                className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full transition-all duration-150 relative cursor-pointer flex items-center justify-center shadow-xs hover:scale-110 active:scale-95 ${
                  isSelected
                    ? 'ring-4 ring-purple-500 ring-offset-2 scale-105 z-10'
                    : 'hover:shadow-md'
                } ${color.hex === '#FFFFFF' ? 'border-2 border-slate-300' : 'border border-black/10'}`}
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
      ) : (
        /* Mobile Compact Single-Row Strip: Horizontally scrollable swatches without covering the artwork */
        <div className="flex items-center gap-2.5 pt-2.5 overflow-x-auto no-scrollbar py-1 px-0.5">
          {filteredColors.map((color) => {
            const isSelected = color.hex.toLowerCase() === selectedColor.toLowerCase();
            const isLight = [
              '#ffffff', '#fbcfe8', '#fed7aa', '#fef08a', '#a7f3d0',
              '#bae6fd', '#ddd6fe', '#e9d5ff', '#ffedd5', '#e2e8f0',
            ].includes(color.hex.toLowerCase());

            return (
              <button
                key={color.hex}
                onClick={() => onSelectColor(color.hex)}
                className={`w-10 h-10 rounded-full transition-all duration-150 relative cursor-pointer shrink-0 flex items-center justify-center shadow-xs hover:scale-110 active:scale-95 ${
                  isSelected
                    ? 'ring-4 ring-purple-500 ring-offset-2 scale-105 z-10'
                    : 'hover:shadow-md'
                } ${color.hex === '#FFFFFF' ? 'border-2 border-slate-300' : 'border border-black/10'}`}
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
      )}
    </div>
  );
};
