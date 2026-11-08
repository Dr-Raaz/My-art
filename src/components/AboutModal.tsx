/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { X, ShieldCheck, Heart, Sparkles, Paintbrush, Ban, Database } from 'lucide-react';

interface AboutModalProps {
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-purple-100 my-8 animate-in fade-in duration-200">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-amber-500 fill-amber-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800 font-['Fredoka']">
                About My Art Studio
              </h2>
              <p className="text-xs text-purple-600 font-medium">
                Safe, Free & Private Creative Fun
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
          <p>
            <strong>My Art Studio</strong> is a free digital coloring platform designed specifically for children, parents, and teachers. Children can browse hand-curated black-and-white illustrations and color them with a smart flood-fill bucket, smooth brushes, an eraser, and 36 vibrant colors.
          </p>

          <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-100 space-y-2">
            <h3 className="font-bold text-purple-900 text-xs sm:text-sm flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Children's Privacy & Safety Invariants</span>
            </h3>
            <ul className="space-y-1.5 text-xs text-slate-700">
              <li className="flex items-center gap-2">
                <span className="text-emerald-600 font-bold">✓</span>
                <span><strong>No Account Needed:</strong> Children can pick any picture and color instantly without sign-up.</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-600 font-bold">✓</span>
                <span><strong>Zero Personal Data Collection:</strong> We never ask for names, emails, ages, or locations.</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-600 font-bold">✓</span>
                <span><strong>100% Ad-Free:</strong> No commercial ads, no popups, and no sponsor trackers.</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-600 font-bold">✓</span>
                <span><strong>Local Device Saving:</strong> Artwork progress is saved strictly inside the browser's local IndexedDB and never uploaded to public databases.</span>
              </li>
            </ul>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
              <p className="font-bold text-slate-800 text-xs">Flood-Fill Engine</p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Barrier-mask pixel algorithm that respects dark outlines without color leakage.
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
              <p className="font-bold text-slate-800 text-xs">Layered Canvas</p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Artwork outlines always stay sharp on top while paint is applied underneath.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md shadow-purple-200 cursor-pointer"
          >
            Got it, Let's Color!
          </button>
        </div>
      </div>
    </div>
  );
};
