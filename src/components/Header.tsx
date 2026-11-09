/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Palette,
  Sparkles,
  Compass,
  Info,
  ShieldCheck,
  Menu,
  X,
  LogOut,
  User as UserIcon,
  Loader2,
} from 'lucide-react';
import {
  subscribeToAuth,
  signInWithGoogle,
  signOutUser,
  type AuthState,
} from '../services/authService';

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
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAdmin: false,
    isLoading: true,
    error: null,
  });
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [signInError, setSignInError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToAuth((state) => {
      setAuthState(state);
      if (state.error) {
        setSignInError(state.error);
      }
    });
    return unsubscribe;
  }, []);

  const handleMobileSelect = (action: () => void) => {
    setIsMobileMenuOpen(false);
    action();
  };

  const handleGoogleSignIn = async () => {
    setSignInError(null);
    setIsSigningIn(true);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      if (err?.code !== 'auth/popup-closed-by-user' && err?.code !== 'auth/cancelled-popup-request') {
        setSignInError(err?.message || 'Google sign-in could not be completed.');
      }
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOutUser();
      if (currentView === 'admin-dashboard' || currentView === 'admin-login') {
        onNavigate('home');
      }
    } catch (err) {
      console.error('Sign-out error:', err);
    }
  };

  // Google "G" logo SVG for standard Google Sign-In button
  const GoogleGIcon = () => (
    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  );

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

        {/* Desktop Navigation Items */}
        <nav className="hidden md:flex items-center gap-2 lg:gap-3">
          <button
            onClick={() => {
              onNavigate('home');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className={`px-3 py-2 rounded-xl text-sm font-semibold transition-colors cursor-pointer ${
              currentView === 'home'
                ? 'bg-purple-100 text-purple-700'
                : 'text-slate-600 hover:text-purple-600 hover:bg-purple-50'
            }`}
          >
            Home
          </button>

          <button
            onClick={onScrollToCategories}
            className="px-3 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:text-purple-600 hover:bg-purple-50 transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Compass className="w-4 h-4 text-pink-500" />
            <span>Categories</span>
          </button>

          <button
            onClick={onScrollToGallery}
            className="px-3 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:text-purple-600 hover:bg-purple-50 transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Coloring Pages</span>
          </button>

          <button
            onClick={onOpenAbout}
            className="px-3 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:text-purple-600 hover:bg-purple-50 transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Info className="w-4 h-4 text-blue-500" />
            <span>About</span>
          </button>

          {/* Authentication Section (Desktop) */}
          <div className="ml-2 pl-2 border-l border-slate-200 flex items-center gap-2">
            {authState.isLoading ? (
              <div className="px-3 py-2 text-xs text-slate-400 flex items-center gap-1.5">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              </div>
            ) : !authState.user ? (
              /* Public / Logged-out Visitor: Show Sign in with Google */
              <button
                onClick={handleGoogleSignIn}
                disabled={isSigningIn}
                className="px-3.5 py-2 rounded-xl border border-slate-200 hover:border-purple-300 bg-white hover:bg-purple-50/50 text-slate-700 hover:text-purple-800 text-xs font-bold transition-all shadow-2xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
                title="Sign in with Google"
                aria-label="Sign in with Google"
              >
                {isSigningIn ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <GoogleGIcon />
                    <span>Sign in with Google</span>
                  </>
                )}
              </button>
            ) : (
              /* Authenticated User */
              <div className="flex items-center gap-2">
                {/* Admin Portal Shortcut — ONLY rendered if authenticated user is verified admin */}
                {authState.isAdmin && (
                  <button
                    onClick={() => onNavigate('admin')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs ${
                      currentView === 'admin-dashboard'
                        ? 'bg-purple-700 text-white shadow-purple-200'
                        : 'bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100'
                    }`}
                    title="Administrator Portal"
                    aria-label="Administrator Portal"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Admin Portal</span>
                  </button>
                )}

                {/* User Profile Pill */}
                <div
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700"
                  title={authState.user.email || 'Logged-in user'}
                >
                  {authState.user.photoURL ? (
                    <img
                      src={authState.user.photoURL}
                      alt={authState.user.displayName || 'User'}
                      className="w-5 h-5 rounded-full object-cover border border-purple-200"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-purple-200 text-purple-800 flex items-center justify-center text-[10px] font-bold">
                      {(authState.user.displayName || authState.user.email || 'U')[0].toUpperCase()}
                    </div>
                  )}
                  <span className="max-w-[120px] truncate text-slate-700 font-semibold">
                    {authState.user.displayName?.split(' ')[0] || authState.user.email?.split('@')[0]}
                  </span>
                </div>

                {/* Sign Out Button */}
                <button
                  onClick={handleSignOut}
                  className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                  title="Sign out"
                  aria-label="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </nav>

        {/* Mobile Hamburger / Close Button */}
        <div className="flex items-center gap-2 md:hidden">
          {!authState.user ? (
            <button
              onClick={handleGoogleSignIn}
              disabled={isSigningIn}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-bold flex items-center gap-1.5 shadow-2xs"
              aria-label="Sign in with Google"
            >
              <GoogleGIcon />
              <span>Login</span>
            </button>
          ) : authState.isAdmin ? (
            <button
              onClick={() => onNavigate('admin')}
              className="px-2.5 py-1.5 rounded-xl bg-purple-700 text-white text-xs font-bold flex items-center gap-1"
              aria-label="Admin Portal"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Admin</span>
            </button>
          ) : null}

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

          {/* User Account / Admin in Mobile Menu */}
          <div className="pt-2 border-t border-purple-100 space-y-2">
            {!authState.user ? (
              <button
                onClick={() => handleMobileSelect(handleGoogleSignIn)}
                className="w-full text-left px-4 py-3 rounded-2xl text-sm font-bold bg-purple-50 hover:bg-purple-100 text-purple-800 flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <GoogleGIcon />
                <span>Sign in with Google</span>
              </button>
            ) : (
              <div className="space-y-1.5">
                <div className="px-4 py-2 flex items-center gap-2.5 bg-slate-50 rounded-xl">
                  {authState.user.photoURL ? (
                    <img
                      src={authState.user.photoURL}
                      alt="User"
                      className="w-7 h-7 rounded-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <UserIcon className="w-5 h-5 text-purple-600" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-800 truncate">
                      {authState.user.displayName || 'User'}
                    </p>
                    <p className="text-[10px] text-slate-400 truncate">{authState.user.email}</p>
                  </div>
                </div>

                {/* Only shown if user is verified administrator */}
                {authState.isAdmin && (
                  <button
                    onClick={() => handleMobileSelect(() => onNavigate('admin'))}
                    className="w-full text-left px-4 py-2.5 rounded-2xl text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 flex items-center gap-2.5 transition-colors cursor-pointer"
                  >
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    <span>Admin Portal</span>
                  </button>
                )}

                <button
                  onClick={() => handleMobileSelect(handleSignOut)}
                  className="w-full text-left px-4 py-2.5 rounded-2xl text-xs font-bold text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Subtle notification banner if sign-in had an error */}
      {signInError && (
        <div className="bg-rose-50 text-rose-700 text-xs px-4 py-2 flex items-center justify-between border-t border-rose-100">
          <span>{signInError}</span>
          <button
            onClick={() => setSignInError(null)}
            className="text-rose-500 hover:text-rose-800 font-bold ml-2 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}
    </header>
  );
};
