/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { Category, Artwork } from './data/defaultArtworks';
import {
  getCategories,
  getArtworks,
  saveCategory,
  deleteCategory,
  saveArtwork,
  deleteArtwork,
} from './services/dataService';
import {
  initAuthListener,
  subscribeToAuth,
  signOutUser,
  type AuthState,
} from './services/authService';
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

/**
 * Direction-aware transition phases for smooth mobile/desktop navigation:
 * - 'idle': Studio closed, Homepage fully active
 * - 'entering-start': Studio mounted at translateX(100%), Gallery at translateX(0)
 * - 'entering': Studio transitioning to translateX(0), Gallery transitioning to translateX(-15%)
 * - 'active': Studio fully in view at translateX(0), Gallery parked invisibly to preserve scroll
 * - 'exiting': Studio transitioning to translateX(100%), Gallery returning from translateX(-15%) to translateX(0)
 */
type StudioTransitionPhase = 'idle' | 'entering-start' | 'entering' | 'active' | 'exiting';

const TRANSITION_DURATION_MS = 260;
const TRANSITION_EASING = 'cubic-bezier(0.16, 1, 0.3, 1)';

function checkPrefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export default function App() {
  const [currentView, setCurrentView] = useState<ViewMode>('home');
  const [categories, setCategories] = useState<Category[]>([]);
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const artworksRef = useRef<Artwork[]>([]);
  const [selectedArtwork, setSelectedArtwork] = useState<Artwork | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [galleryRefreshKey, setGalleryRefreshKey] = useState(0);

  // Gallery scroll position memory
  const savedGalleryScrollRef = useRef<number>(0);

  // Transition state management
  const [transitionPhase, setTransitionPhase] = useState<StudioTransitionPhase>('idle');
  const exitTimerRef = useRef<number | null>(null);

  // Admin auth state (Google Firebase Auth + legacy scrypt token for migration)
  const [googleAuth, setGoogleAuth] = useState<AuthState>({
    user: null,
    isAdmin: false,
    isLoading: true,
    error: null,
  });
  const [adminToken, setAdminToken] = useState<string | null>(null);
  const [adminUsername, setAdminUsername] = useState<string>('my_art');
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Combined administrator check
  const isAdministrator = Boolean(googleAuth.isAdmin || adminToken);
  const effectiveAdminUsername = googleAuth.isAdmin
    ? googleAuth.user?.displayName || googleAuth.user?.email || 'raazprasai1996@gmail.com'
    : adminUsername;

  // Reliable scroll restoration helper
  const restoreScrollPosition = useCallback((targetScroll: number) => {
    window.scrollTo({ top: targetScroll, behavior: 'instant' });
    requestAnimationFrame(() => {
      window.scrollTo({ top: targetScroll, behavior: 'instant' });
      setTimeout(() => {
        window.scrollTo({ top: targetScroll, behavior: 'instant' });
      }, 40);
    });
  }, []);

  // Execute smooth exit transition from studio back to gallery
  const startExitTransition = useCallback(
    (targetScroll: number) => {
      if (exitTimerRef.current) {
        window.clearTimeout(exitTimerRef.current);
        exitTimerRef.current = null;
      }

      // If user prefers reduced motion, switch instantly without animation
      if (checkPrefersReducedMotion()) {
        setCurrentView('home');
        setSelectedArtwork(null);
        setTransitionPhase('idle');
        setGalleryRefreshKey((k) => k + 1);
        restoreScrollPosition(targetScroll);
        return;
      }

      // 1. Begin exit animation: Studio slides right (0% -> 100%), Gallery slides from left (-15% -> 0%)
      setTransitionPhase('exiting');
      restoreScrollPosition(targetScroll);

      // 2. Complete transition after animation duration
      exitTimerRef.current = window.setTimeout(() => {
        setCurrentView('home');
        setSelectedArtwork(null);
        setTransitionPhase('idle');
        setGalleryRefreshKey((k) => k + 1);
        restoreScrollPosition(targetScroll);
        exitTimerRef.current = null;
      }, TRANSITION_DURATION_MS);
    },
    [restoreScrollPosition]
  );

  // Load categories and artworks
  const loadData = useCallback(async () => {
    try {
      setIsLoadingData(true);
      const [cats, arts] = await Promise.all([
        getCategories(),
        getArtworks(true),
      ]);
      setCategories(cats);
      setArtworks(arts);
      artworksRef.current = arts;

      // Handle direct link with artwork hash e.g. #color-art-rocket
      const hash = window.location.hash;
      if (hash.startsWith('#color-')) {
        const artId = hash.replace('#color-', '');
        const directArt = arts.find((a) => a.id === artId);
        if (directArt) {
          setSelectedArtwork(directArt);
          setCurrentView('studio');
          setTransitionPhase('active');
        }
      }
    } catch (err) {
      console.error('Failed to load initial data:', err);
    } finally {
      setIsLoadingData(false);
    }
  }, []);

  // Initialize Firebase Auth listener and check existing sessions
  useEffect(() => {
    initAuthListener();
    const unsubscribe = subscribeToAuth((state) => {
      setGoogleAuth(state);
      // If user just authenticated as administrator and currently at login screen, transition to dashboard
      if (state.isAdmin && window.location.pathname.includes('/admin/login')) {
        setCurrentView('admin-dashboard');
      }
    });
    return unsubscribe;
  }, []);

  // Check URL pathname and verify existing admin session on mount
  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }

    loadData();

    // Check stored legacy admin session token
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
          setAdminToken(token);
          setAdminUsername(storedUser);
        });
    }

    // Handle initial route
    const path = window.location.pathname;
    if (path.includes('/admin/dashboard')) {
      setCurrentView('admin-dashboard');
    } else if (path.includes('/admin/login') || path === '/admin') {
      setCurrentView('admin-login');
    }

    // Listen to browser popstate (Supports Android system back button, swipe-back gesture, and browser back)
    const handlePopState = (event: PopStateEvent) => {
      const p = window.location.pathname;
      const hash = window.location.hash;
      const state = event.state as { view?: ViewMode; artworkId?: string; scrollY?: number } | null;

      if (p.includes('/admin/dashboard')) {
        setCurrentView('admin-dashboard');
        setSelectedArtwork(null);
        setTransitionPhase('idle');
      } else if (p.includes('/admin/login')) {
        setCurrentView('admin-login');
        setSelectedArtwork(null);
        setTransitionPhase('idle');
      } else if (hash.startsWith('#color-') || state?.view === 'studio') {
        // Forward navigation to studio
        const artId = state?.artworkId || hash.replace('#color-', '');
        const found = artworksRef.current.find((a) => a.id === artId);
        if (found) {
          setSelectedArtwork(found);
          setCurrentView('studio');
          setTransitionPhase('active');
        }
      } else {
        // Popped back to Homepage (from Android back button, swipe-back, or in-app back)
        const targetScroll = state?.scrollY ?? savedGalleryScrollRef.current;
        startExitTransition(targetScroll);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [loadData, startExitTransition]);

  // Handle entering transition steps: entering-start -> entering -> active
  useEffect(() => {
    if (transitionPhase === 'entering-start') {
      const raf = requestAnimationFrame(() => {
        setTransitionPhase('entering');
      });
      return () => cancelAnimationFrame(raf);
    }
    if (transitionPhase === 'entering') {
      const timer = window.setTimeout(() => {
        setTransitionPhase('active');
      }, TRANSITION_DURATION_MS);
      return () => window.clearTimeout(timer);
    }
  }, [transitionPhase]);

  // Keep artworksRef updated
  useEffect(() => {
    artworksRef.current = artworks;
  }, [artworks]);

  // Prevent background body scroll when studio view is active
  useEffect(() => {
    if (currentView === 'studio' && transitionPhase === 'active') {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [currentView, transitionPhase]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (exitTimerRef.current) {
        window.clearTimeout(exitTimerRef.current);
      }
    };
  }, []);

  // Navigate helper with URL update
  const navigate = (view: ViewMode, path = '/') => {
    setCurrentView(view);
    if (view === 'home') {
      window.history.pushState({ view: 'home' }, '', path);
    } else if (view === 'admin-login') {
      window.history.pushState({ view: 'admin-login' }, '', '/admin/login');
    } else if (view === 'admin-dashboard') {
      window.history.pushState({ view: 'admin-dashboard' }, '', '/admin/dashboard');
    }
  };

  // Open coloring studio for artwork with smooth entering animation
  const handleSelectArtwork = (artwork: Artwork) => {
    if (exitTimerRef.current) {
      window.clearTimeout(exitTimerRef.current);
      exitTimerRef.current = null;
    }

    // 1. Capture exact current scroll position before navigating into studio
    const currentScroll = window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0;
    savedGalleryScrollRef.current = currentScroll;

    // 2. Push history state so Android back button, swipe-back, and browser back return to gallery
    window.history.pushState(
      { view: 'studio', artworkId: artwork.id, scrollY: currentScroll },
      '',
      `#color-${artwork.id}`
    );

    // 3. Update view and trigger smooth transition
    setSelectedArtwork(artwork);
    setCurrentView('studio');

    if (checkPrefersReducedMotion()) {
      setTransitionPhase('active');
    } else {
      setTransitionPhase('entering-start');
    }
  };

  // Internal Back button handler inside ColoringStudio
  const handleStudioBack = useCallback(() => {
    if (window.location.hash.startsWith('#color-') || window.history.state?.view === 'studio') {
      window.history.back();
    } else {
      startExitTransition(savedGalleryScrollRef.current);
    }
  }, [startExitTransition]);

  // Smooth scroll helpers
  const scrollToCategories = () => {
    if (currentView !== 'home') {
      navigate('home');
      setTimeout(() => {
        document.getElementById('categories-section')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      document.getElementById('categories-section')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const scrollToGallery = () => {
    if (currentView !== 'home') {
      navigate('home');
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
    try {
      await signOutUser();
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

  // Dynamic transition styling for Studio Overlay (enters from right, exits to right)
  const getStudioOverlayStyle = (): React.CSSProperties => {
    if (checkPrefersReducedMotion() || transitionPhase === 'active') {
      return {
        transform: 'translateX(0)',
        opacity: 1,
        pointerEvents: 'auto',
      };
    }
    if (transitionPhase === 'entering-start') {
      return {
        transform: 'translateX(100%)',
        opacity: 0.9,
        pointerEvents: 'auto',
      };
    }
    if (transitionPhase === 'entering') {
      return {
        transform: 'translateX(0)',
        opacity: 1,
        transition: `transform ${TRANSITION_DURATION_MS}ms ${TRANSITION_EASING}, opacity ${TRANSITION_DURATION_MS}ms ${TRANSITION_EASING}`,
        pointerEvents: 'auto',
      };
    }
    if (transitionPhase === 'exiting') {
      return {
        transform: 'translateX(100%)',
        opacity: 0.95,
        transition: `transform ${TRANSITION_DURATION_MS}ms ${TRANSITION_EASING}, opacity ${TRANSITION_DURATION_MS}ms ${TRANSITION_EASING}`,
        pointerEvents: 'none',
      };
    }
    return {
      transform: 'translateX(0)',
      opacity: 1,
      pointerEvents: 'auto',
    };
  };

  // Dynamic transition styling for Gallery View (moves left on enter, returns from left on exit)
  const getGalleryContainerStyle = (): React.CSSProperties => {
    if (checkPrefersReducedMotion()) {
      return {
        visibility: currentView === 'studio' ? 'hidden' : 'visible',
        pointerEvents: currentView === 'studio' ? 'none' : 'auto',
      };
    }
    if (transitionPhase === 'active') {
      return {
        visibility: 'hidden',
        pointerEvents: 'none',
        transform: 'translateX(-15%)',
        opacity: 0.85,
      };
    }
    if (transitionPhase === 'entering-start') {
      return {
        visibility: 'visible',
        pointerEvents: 'none',
        transform: 'translateX(0)',
        opacity: 1,
      };
    }
    if (transitionPhase === 'entering') {
      return {
        visibility: 'visible',
        pointerEvents: 'none',
        transform: 'translateX(-15%)',
        opacity: 0.85,
        transition: `transform ${TRANSITION_DURATION_MS}ms ${TRANSITION_EASING}, opacity ${TRANSITION_DURATION_MS}ms ${TRANSITION_EASING}`,
      };
    }
    if (transitionPhase === 'exiting') {
      return {
        visibility: 'visible',
        pointerEvents: 'none',
        transform: 'translateX(0)',
        opacity: 1,
        transition: `transform ${TRANSITION_DURATION_MS}ms ${TRANSITION_EASING}, opacity ${TRANSITION_DURATION_MS}ms ${TRANSITION_EASING}`,
      };
    }
    // Idle (home)
    return {
      visibility: 'visible',
      pointerEvents: 'auto',
      transform: 'none',
      opacity: 1,
    };
  };

  const isStudioMounted = selectedArtwork !== null && (currentView === 'studio' || transitionPhase === 'exiting');

  return (
    <div className="min-h-screen flex flex-col bg-[#faf8ff] overflow-x-hidden relative">
      {/* Smooth Direction-Aware Full-Screen My Art Studio Overlay */}
      {isStudioMounted && (
        <div
          className="fixed inset-0 z-50 bg-slate-50 overflow-hidden will-change-transform"
          style={getStudioOverlayStyle()}
        >
          <ColoringStudio
            artwork={selectedArtwork}
            onBack={handleStudioBack}
          />
        </div>
      )}

      {/* Admin Login View */}
      {currentView === 'admin-login' ? (
        <AdminLogin
          onLoginSuccess={handleAdminLoginSuccess}
          onBackToSite={() => navigate('home')}
        />
      ) : currentView === 'admin-dashboard' ? (
        /* Admin Dashboard View (Protected) */
        !isAdministrator ? (
          <AdminLogin
            onLoginSuccess={handleAdminLoginSuccess}
            onBackToSite={() => navigate('home')}
          />
        ) : (
          <AdminDashboard
            username={effectiveAdminUsername}
            categories={categories}
            artworks={artworks}
            onSaveCategory={handleSaveCategory}
            onDeleteCategory={handleDeleteCategory}
            onSaveArtwork={handleSaveArtwork}
            onDeleteArtwork={handleDeleteArtwork}
            onLogout={handleAdminLogout}
            onViewPublicSite={() => navigate('home')}
          />
        )
      ) : (
        /* Public Homepage View with Direction-Aware Transition Styling */
        <div
          className="flex-1 flex flex-col will-change-transform"
          style={getGalleryContainerStyle()}
          aria-hidden={currentView === 'studio' && transitionPhase === 'active'}
        >
          <Header
            currentView={currentView}
            onNavigate={(view) => {
              if (view === 'admin') {
                navigate(isAdministrator ? 'admin-dashboard' : 'admin-login');
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
              totalArtworks={artworks.filter((a) => a.isPublished).length}
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
              refreshKey={galleryRefreshKey}
              searchQuery={searchQuery}
              onSearchQueryChange={setSearchQuery}
              selectedDifficulty={selectedDifficulty}
              onSelectedDifficultyChange={setSelectedDifficulty}
            />
          </main>

          <Footer
            onOpenAbout={() => setIsAboutOpen(true)}
            onNavigateAdmin={() => navigate(isAdministrator ? 'admin-dashboard' : 'admin-login')}
          />
        </div>
      )}

      {isAboutOpen && <AboutModal onClose={() => setIsAboutOpen(false)} />}
    </div>
  );
}
