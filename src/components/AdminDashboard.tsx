/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import type { Category, Artwork } from '../data/defaultArtworks';
import { CategoryManager } from './CategoryManager';
import { ArtworkManager } from './ArtworkManager';
import { UploadArtworkModal } from './UploadArtworkModal';
import { FirebaseSetupGuide } from './FirebaseSetupGuide';
import {
  LayoutDashboard,
  Layers,
  Image as ImageIcon,
  UploadCloud,
  Settings,
  LogOut,
  Palette,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  FileCheck,
  Sparkles,
  Menu,
  X,
} from 'lucide-react';
import { getFirebaseStatus } from '../services/firebase';

interface AdminDashboardProps {
  username: string;
  categories: Category[];
  artworks: Artwork[];
  onSaveCategory: (category: Category) => Promise<void>;
  onDeleteCategory: (categoryId: string) => Promise<{ success: boolean; error?: string }>;
  onSaveArtwork: (artwork: Artwork) => Promise<void>;
  onDeleteArtwork: (artworkId: string) => Promise<void>;
  onLogout: () => void;
  onViewPublicSite: () => void;
}

type TabType = 'overview' | 'categories' | 'artworks' | 'upload' | 'settings';

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  username,
  categories,
  artworks,
  onSaveCategory,
  onDeleteCategory,
  onSaveArtwork,
  onDeleteArtwork,
  onLogout,
  onViewPublicSite,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const firebaseStatus = getFirebaseStatus();

  // Metrics
  const totalCategories = categories.length;
  const totalArtworks = artworks.length;
  const publishedArtworks = artworks.filter(a => a.isPublished).length;
  const draftArtworks = artworks.filter(a => !a.isPublished).length;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Mobile Header Bar */}
      <div className="md:hidden bg-slate-900 text-white px-4 py-3 flex items-center justify-between sticky top-0 z-40 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Palette className="w-5 h-5 text-yellow-400" />
          <span className="font-bold text-base font-['Fredoka']">My Art Studio Admin</span>
        </div>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-1.5 rounded-lg text-slate-300 hover:text-white"
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-slate-300 flex flex-col justify-between transition-transform duration-200 md:static md:translate-x-0 ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>
          {/* Brand Logo & User Info */}
          <div className="p-6 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center text-white shadow-md">
                <Palette className="w-5 h-5 text-yellow-300" />
              </div>
              <div>
                <h1 className="font-bold text-white text-base font-['Fredoka']">
                  My Art Studio
                </h1>
                <p className="text-[11px] text-purple-300 font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Admin: {username}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1">
            <button
              onClick={() => {
                setActiveTab('overview');
                setIsMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                activeTab === 'overview'
                  ? 'bg-purple-600 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard Overview</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('categories');
                setIsMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                activeTab === 'categories'
                  ? 'bg-purple-600 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Categories ({totalCategories})</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('artworks');
                setIsMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                activeTab === 'artworks'
                  ? 'bg-purple-600 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <ImageIcon className="w-4 h-4" />
              <span>Artwork Library ({totalArtworks})</span>
            </button>

            <button
              onClick={() => {
                setIsUploadModalOpen(true);
                setIsMobileMenuOpen(false);
              }}
              className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <UploadCloud className="w-4 h-4 text-purple-400" />
              <span>Upload Artwork</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('settings');
                setIsMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                activeTab === 'settings'
                  ? 'bg-purple-600 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Firebase & Settings</span>
            </button>
          </nav>
        </div>

        {/* Footer Actions (Public Site & Logout) */}
        <div className="p-4 border-t border-slate-800 space-y-1">
          <button
            onClick={onViewPublicSite}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <ExternalLink className="w-4 h-4 text-emerald-400" />
              <span>View Public Site</span>
            </span>
          </button>

          <button
            onClick={onLogout}
            className="w-full flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-8 max-w-7xl mx-auto w-full">
        {/* Top greeting bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 font-['Fredoka']">
              {activeTab === 'overview' && 'Dashboard Overview'}
              {activeTab === 'categories' && 'Categories'}
              {activeTab === 'artworks' && 'Artwork Library'}
              {activeTab === 'settings' && 'Firebase & Infrastructure'}
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              My Art Studio Content & Artwork Administration
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center gap-2"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Upload New Artwork</span>
            </button>

            <button
              onClick={onViewPublicSite}
              className="px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <ExternalLink className="w-4 h-4" />
              <span className="hidden sm:inline">View Public Website</span>
            </button>
          </div>
        </div>

        {/* Tab 1: Overview */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* 4 Metric Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-500">Categories</span>
                  <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
                    <Layers className="w-5 h-5" />
                  </div>
                </div>
                <p className="text-3xl font-extrabold text-slate-800 font-['Fredoka']">
                  {totalCategories}
                </p>
                <p className="text-[11px] text-slate-400 mt-1">Active themes</p>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-500">Total Artworks</span>
                  <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                    <ImageIcon className="w-5 h-5" />
                  </div>
                </div>
                <p className="text-3xl font-extrabold text-slate-800 font-['Fredoka']">
                  {totalArtworks}
                </p>
                <p className="text-[11px] text-slate-400 mt-1">Line art illustrations</p>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-500">Published</span>
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                </div>
                <p className="text-3xl font-extrabold text-slate-800 font-['Fredoka']">
                  {publishedArtworks}
                </p>
                <p className="text-[11px] text-slate-400 mt-1">Visible to children</p>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-500">Drafts</span>
                  <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
                    <FileCheck className="w-5 h-5" />
                  </div>
                </div>
                <p className="text-3xl font-extrabold text-slate-800 font-['Fredoka']">
                  {draftArtworks}
                </p>
                <p className="text-[11px] text-slate-400 mt-1">Unpublished items</p>
              </div>
            </div>

            {/* Quick Actions & Recent Artwork preview */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Recent Artworks */}
              <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-100 p-6 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-slate-800 font-['Fredoka']">
                    Coloring Illustrations
                  </h3>
                  <button
                    onClick={() => setActiveTab('artworks')}
                    className="text-xs font-bold text-purple-600 hover:text-purple-700 cursor-pointer"
                  >
                    View All Library →
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {artworks.slice(0, 4).map((art) => (
                    <div
                      key={art.id}
                      className="border border-slate-100 rounded-2xl p-2.5 bg-slate-50/50 flex flex-col justify-between"
                    >
                      <div className="aspect-square bg-white rounded-xl border border-slate-200 overflow-hidden flex items-center justify-center p-2 mb-2">
                        <img
                          src={art.imageUrl}
                          alt={art.title}
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <p className="font-bold text-xs text-slate-800 truncate">{art.title}</p>
                      <p className="text-[10px] text-slate-400 capitalize">{art.difficulty}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Status Box */}
              <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-xs flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-800 font-['Fredoka'] mb-2">
                    System Status
                  </h3>
                  <div className="p-3.5 rounded-2xl bg-purple-50/60 border border-purple-100 mb-4 text-xs">
                    <p className="font-bold text-purple-900">
                      {firebaseStatus.isConfigured ? 'Connected to Firebase' : 'Standalone Mode Active'}
                    </p>
                    <p className="text-[11px] text-purple-700 mt-0.5">
                      {firebaseStatus.isConfigured
                        ? `Project: ${firebaseStatus.projectId}`
                        : 'Local data persistence enabled.'}
                    </p>
                  </div>
                  <ul className="text-xs space-y-2 text-slate-600">
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span>Scrypt authentication active</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span>Flood-fill barrier engine active</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span>IndexedDB local progress ready</span>
                    </li>
                  </ul>
                </div>

                <button
                  onClick={() => setActiveTab('settings')}
                  className="mt-6 w-full py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Configure Firebase →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Categories */}
        {activeTab === 'categories' && (
          <CategoryManager
            categories={categories}
            artworks={artworks}
            onSaveCategory={onSaveCategory}
            onDeleteCategory={onDeleteCategory}
          />
        )}

        {/* Tab 3: Artworks */}
        {activeTab === 'artworks' && (
          <ArtworkManager
            artworks={artworks}
            categories={categories}
            onOpenUpload={() => setIsUploadModalOpen(true)}
            onSaveArtwork={onSaveArtwork}
            onDeleteArtwork={onDeleteArtwork}
          />
        )}

        {/* Tab 4: Settings & Firebase */}
        {activeTab === 'settings' && <FirebaseSetupGuide />}
      </main>

      {/* Upload Artwork Modal */}
      {isUploadModalOpen && (
        <UploadArtworkModal
          categories={categories}
          onClose={() => setIsUploadModalOpen(false)}
          onArtworkSaved={async (newArt) => {
            await onSaveArtwork(newArt);
            setIsUploadModalOpen(false);
          }}
        />
      )}
    </div>
  );
};
