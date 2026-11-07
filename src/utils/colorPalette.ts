/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface PaletteColor {
  name: string;
  hex: string;
  group: 'rainbow' | 'pastel' | 'nature' | 'skin' | 'neutral';
}

// 36 Curated Child-Friendly Colors
export const PALETTE_COLORS: PaletteColor[] = [
  // Primary & Vibrant Rainbow (12)
  { name: 'Cherry Red', hex: '#EF4444', group: 'rainbow' },
  { name: 'Sunset Orange', hex: '#F97316', group: 'rainbow' },
  { name: 'Warm Amber', hex: '#F59E0B', group: 'rainbow' },
  { name: 'Sunny Yellow', hex: '#EAB308', group: 'rainbow' },
  { name: 'Lemon Lime', hex: '#84CC16', group: 'rainbow' },
  { name: 'Fresh Green', hex: '#22C55E', group: 'rainbow' },
  { name: 'Emerald', hex: '#10B981', group: 'rainbow' },
  { name: 'Cyan Blue', hex: '#06B6D4', group: 'rainbow' },
  { name: 'Sky Blue', hex: '#0EA5E9', group: 'rainbow' },
  { name: 'Royal Blue', hex: '#3B82F6', group: 'rainbow' },
  { name: 'Magic Purple', hex: '#8B5CF6', group: 'rainbow' },
  { name: 'Berry Violet', hex: '#A855F7', group: 'rainbow' },

  // Soft Pastels & Delicates (8)
  { name: 'Pastel Pink', hex: '#FBCFE8', group: 'pastel' },
  { name: 'Cotton Candy', hex: '#F472B6', group: 'pastel' },
  { name: 'Pastel Peach', hex: '#FED7AA', group: 'pastel' },
  { name: 'Butter Yellow', hex: '#FEF08A', group: 'pastel' },
  { name: 'Mint Green', hex: '#A7F3D0', group: 'pastel' },
  { name: 'Baby Blue', hex: '#BAE6FD', group: 'pastel' },
  { name: 'Lavender Mist', hex: '#DDD6FE', group: 'pastel' },
  { name: 'Sweet Lilac', hex: '#E9D5FF', group: 'pastel' },

  // Nature & Earth Tones (6)
  { name: 'Forest Pine', hex: '#15803D', group: 'nature' },
  { name: 'Deep Teal', hex: '#0F766E', group: 'nature' },
  { name: 'Ocean Navy', hex: '#1E3A8A', group: 'nature' },
  { name: 'Caramel Brown', hex: '#B45309', group: 'nature' },
  { name: 'Warm Chestnut', hex: '#854D0E', group: 'nature' },
  { name: 'Rich Chocolate', hex: '#713F12', group: 'nature' },

  // Skin & Warm Tones (5)
  { name: 'Porcelain Fair', hex: '#FFEDD5', group: 'skin' },
  { name: 'Warm Almond', hex: '#FDBA74', group: 'skin' },
  { name: 'Golden Honey', hex: '#D97706', group: 'skin' },
  { name: 'Warm Amber Brown', hex: '#92400E', group: 'skin' },
  { name: 'Deep Espresso', hex: '#451A03', group: 'skin' },

  // Neutrals (5)
  { name: 'Snow White', hex: '#FFFFFF', group: 'neutral' },
  { name: 'Light Silver', hex: '#E2E8F0', group: 'neutral' },
  { name: 'Slate Grey', hex: '#94A3B8', group: 'neutral' },
  { name: 'Charcoal Grey', hex: '#475569', group: 'neutral' },
  { name: 'Ink Black', hex: '#0F172A', group: 'neutral' },
];
