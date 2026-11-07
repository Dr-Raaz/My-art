/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import type { Category, Artwork } from './data/defaultArtworks';
import {
  getCategories,
  getArtworks,
  saveCategory,
  deleteCategory,
  saveArtwork,
  deleteArtwork,
} from './services/dataService';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { CategoryList } from './components/CategoryList';
import { ArtworkGallery } from './components/ArtworkGallery';
import { ColoringStudio } from './components/ColoringStudio';
import { AdminLogin } from './components/AdminLogin';
import { AdminDashboard } from './components/AdminDashboard';
import { AboutModal } from './components/AboutModal';
import { Footer } from './components/Footer';

type ViewMode = 'home' | 'studio' | 'admin-login' | 'admin-dashboard';

export default function App() {
  const [currentView, setCurrentView] = useState<ViewMode>('home');
  const [categories, setCategories] = useState<Category[]>([]);
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [selectedArtwork, setSelectedArtwork] = useState<Artwork | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [isAboutOpen, setIsAboutOpen] = useState(false);

  // Admin auth state
  const [adminToken, setAdminToken] = useState<string | null>(null);
  const [adminUsername, setAdminUsername] = useState<string>('my_art');
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Load categories and artworks
  const loadData = useCallback(async () => {
    try {
      setIsLoadingData(true);
      const [cats, arts] = await Promise.all([
        getCategories(),
        getArtworks(true), // Load all so admin sees drafts, public gallery filters by isPublished
      ]);
      setCategories(cats);
      setArtworks(arts);
    } catch (err) {
      console.error('Failed to load initial data:', err);
    } finally {
      setIsLoadingData(false);
    }
  }, []);

  // Check URL pathname and verify existing admin session on mount
  useEffect(() => {
    loadData();

    // Check stored admin session token
    const token = localStorage.getItem('kcs_admin_token');
    const storedUser = localStorage.getItem('kcs_admin_user') || 'my_art';

    if (token) {
      fetch('/api/admin/session', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.valid) {
            setAdminToken(token);
            setAdminUsername(data.username || storedUser);
          } else {
            localStorage.removeItem('kcs_admin_token');
            localStorage.removeItem('kcs_admin_user');
          }
        })
        .catch(() => {
          // If server session check fails, retain local token in standalone mode
          setAdminToken(token);
          setAdminUsername(storedUser);
        });
    }

    // Handle initial route
    const path = window.location.pathname;
    if (path.includes('/admin/dashboard') || (path.includes('/admin') && token)) {
      setCurrentView('admin-dashboard');
    } else if (path.includes('/admin/login') || path === '/admin') {
      setCurrentView('admin-login');
    }

    // Listen to browser popstate (back/forward)
    const handlePopState = () => {
      const p = window.location.pathname;
      if (p.includes('/admin/dashboard')) {
        setCurrentView('admin-dashboard');
      } else if (p.includes('/admin/login')) {
        setCurrentView('admin-login');
      } else {
        setCurrentView('home');
        setSelectedArtwork(null);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [loadData]);

  // Navigate helper with URL update
  const navigate = (view: ViewMode, path = '/') => {
    setCurrentView(view);
    if (view === 'home') {
      window.history.pushState({}, '', path);
    } else if (view === 'admin-login') {
      window.history.pushState({}, '', '/admin/login');
    } else if (view === 'admin-dashboard') {
      window.history.pushState({}, '', '/admin/dashboard');
    }
  };

  // Open coloring studio for artwork
  const handleSelectArtwork = (artwork: Artwork) => {
    setSelectedArtwork(artwork);
    setCurrentView('studio');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Smooth scroll helpers
  const scrollToCategories = () => {
    if (currentView !== 'home') {
      setCurrentView('home');
      setTimeout(() => {
        document.getElementById('categories-section')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      document.getElementById('categories-section')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const scrollToGallery = () => {
    if (currentView !== 'home') {
      setCurrentView('home');
      setTimeout(() => {
        document.getElementById('gallery-section')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      document.getElementById('gallery-section')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Admin handlers
  const handleAdminLoginSuccess = (token: string, username: string) => {
    setAdminToken(token);
    setAdminUsername(username);
    navigate('admin-dashboard');
  };

  const handleAdminLogout = async () => {
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
    } catch {}
    localStorage.removeItem('kcs_admin_token');
    localStorage.removeItem('kcs_admin_user');
    setAdminToken(null);
    navigate('home');
  };

  const handleSaveCategory = async (category: Category) => {
    await saveCategory(category);
    await loadData();
  };

  const handleDeleteCategory = async (categoryId: string) => {
    const res = await deleteCategory(categoryId);
    if (res.success) {
      await loadData();
    }
    return res;
  };

  const handleSaveArtwork = async (artwork: Artwork) => {
    await saveArtwork(artwork);
    await loadData();
  };

  const handleDeleteArtwork = async (artworkId: string) => {
    await deleteArtwork(artworkId);
    await loadData();
  };

  // 1. Coloring Studio View
  if (currentView === 'studio' && selectedArtwork) {
    return (
      <ColoringStudio
        artwork={selectedArtwork}
        onBack={() => {
          setCurrentView('home');
          setSelectedArtwork(null);
        }}
      />
    );
  }

  // 2. Admin Login View
  if (currentView === 'admin-login') {
    return (
      <AdminLogin
        onLoginSuccess={handleAdminLoginSuccess}
        onBackToSite={() => navigate('home')}
      />
    );
  }

  // 3. Admin Dashboard View (Protected)
  if (currentView === 'admin-dashboard') {
    if (!adminToken) {
      return (
        <AdminLogin
          onLoginSuccess={handleAdminLoginSuccess}
          onBackToSite={() => navigate('home')}
        />
      );
    }

    return (
      <AdminDashboard
        username={adminUsername}
        categories={categories}
        artworks={artworks}
        onSaveCategory={handleSaveCategory}
        onDeleteCategory={handleDeleteCategory}
        onSaveArtwork={handleSaveArtwork}
        onDeleteArtwork={handleDeleteArtwork}
        onLogout={handleAdminLogout}
        onViewPublicSite={() => navigate('home')}
      />
    );
  }

  // 4. Public Homepage View (Children & Families)
  return (
    <div className="min-h-screen flex flex-col bg-[#faf8ff]">
      <Header
        currentView={currentView}
        onNavigate={(view) => {
          if (view === 'admin') {
            navigate(adminToken ? 'admin-dashboard' : 'admin-login');
          } else {
            navigate('home');
          }
        }}
        onOpenAbout={() => setIsAboutOpen(true)}
        onScrollToCategories={scrollToCategories}
        onScrollToGallery={scrollToGallery}
      />

      <main className="flex-1">
        <Hero
          onStartColoring={scrollToGallery}
          totalArtworks={artworks.filter(a => a.isPublished).length}
        />

        <CategoryList
          categories={categories}
          artworks={artworks}
          selectedCategoryId={selectedCategoryId}
          onSelectCategory={(catId) => {
            setSelectedCategoryId(catId);
            scrollToGallery();
          }}
        />

        <ArtworkGallery
          artworks={artworks}
          categories={categories}
          selectedCategoryId={selectedCategoryId}
          onSelectCategory={setSelectedCategoryId}
          onSelectArtwork={handleSelectArtwork}
        />
      </main>

      <Footer
        onOpenAbout={() => setIsAboutOpen(true)}
        onNavigateAdmin={() => navigate(adminToken ? 'admin-dashboard' : 'admin-login')}
      />

      {isAboutOpen && <AboutModal onClose={() => setIsAboutOpen(false)} />}
    </div>
  );
}
