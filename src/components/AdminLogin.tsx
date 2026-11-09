/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Shield, Lock, User, AlertCircle, ArrowLeft, Loader2, Sparkles } from 'lucide-react';
import { signInWithGoogle, ADMIN_EMAIL } from '../services/authService';

interface AdminLoginProps {
  onLoginSuccess: (token: string, username: string) => void;
  onBackToSite: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({
  onLoginSuccess,
  onBackToSite,
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSigningIn, setIsGoogleSigningIn] = useState(false);
  const [lockoutSec, setLockoutSec] = useState<number | null>(null);

  React.useEffect(() => {
    fetch('/api/config-status')
      .then((res) => res.json())
      .then((data) => {
        if (data.adminUsername) {
          setUsername(data.adminUsername);
        }
      })
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 429) {
          setLockoutSec(data.retryAfterSec || 900);
          setError(data.error || 'Too many attempts. Account locked.');
        } else {
          setError(data.error || 'Invalid administrator credentials.');
        }
        setIsSubmitting(false);
        return;
      }

      if (data.success && data.sessionToken) {
        // Save token to localStorage for session restoration
        localStorage.setItem('kcs_admin_token', data.sessionToken);
        localStorage.setItem('kcs_admin_user', data.username || username);
        onLoginSuccess(data.sessionToken, data.username || username);
      } else {
        setError('Login verification failed.');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Network error connecting to authentication server.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleAdminLogin = async () => {
    setError(null);
    setIsGoogleSigningIn(true);
    try {
      const user = await signInWithGoogle();
      if (user) {
        if (user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
          // Administrator logged in; App component auth listener will transition to dashboard
        } else {
          setError(
            `Account ${user.email} is not authorized for administrator access. Only ${ADMIN_EMAIL} is permitted.`
          );
        }
      }
    } catch (err: any) {
      if (err?.code !== 'auth/popup-closed-by-user' && err?.code !== 'auth/cancelled-popup-request') {
        setError(err?.message || 'Google sign-in could not be completed.');
      }
    } finally {
      setIsGoogleSigningIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl overflow-hidden border border-purple-100">
        {/* Top Header */}
        <div className="bg-gradient-to-r from-purple-700 via-indigo-700 to-purple-800 p-8 text-white text-center relative">
          <button
            onClick={onBackToSite}
            className="absolute top-4 left-4 p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors text-white cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
            aria-label="Back to My Art Studio"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Public Site</span>
          </button>

          <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md mx-auto flex items-center justify-center mb-3 shadow-inner">
            <Shield className="w-9 h-9 text-yellow-300" />
          </div>
          <h2 className="text-2xl font-bold font-['Fredoka']">Administrator Portal</h2>
          <p className="text-xs text-purple-200 mt-1">
            My Art Studio Content & Artwork Management
          </p>
        </div>

        {/* Login Form */}
        <div className="p-8">
          {error && (
            <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-rose-700 text-xs">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">{error}</p>
                {lockoutSec && (
                  <p className="text-[11px] text-rose-600 mt-1">
                    Rate limiting active: Please wait {lockoutSec} seconds before trying again.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Primary Option: Google Administrator Sign-In */}
          <button
            type="button"
            onClick={handleGoogleAdminLogin}
            disabled={isGoogleSigningIn || isSubmitting}
            className="w-full py-3.5 px-4 mb-5 rounded-xl border border-slate-300 hover:border-purple-400 bg-white hover:bg-purple-50/50 text-slate-800 font-bold text-sm shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2.5 disabled:opacity-50"
          >
            {isGoogleSigningIn ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
                <span>Signing in with Google...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                <span>Sign in with Google ({ADMIN_EMAIL})</span>
              </>
            )}
          </button>

          <div className="relative flex items-center justify-center my-5">
            <div className="border-t border-slate-200 w-full" />
            <span className="bg-white px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Or with scrypt credentials
            </span>
            <div className="border-t border-slate-200 w-full" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Administrator Username
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter administrator username"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent font-medium text-slate-800"
                  autoComplete="username"
                  disabled={isSubmitting || Boolean(lockoutSec)}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent font-medium text-slate-800"
                  autoComplete="current-password"
                  disabled={isSubmitting || Boolean(lockoutSec)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || Boolean(lockoutSec)}
              className="w-full py-3.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-sm shadow-md shadow-purple-300 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying Scrypt Credentials...</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Log In with Password</span>
                </>
              )}
            </button>
          </form>

          {/* Initial credentials reminder */}
          <div className="mt-6 p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-600 text-[11px] leading-relaxed">
            <div className="flex items-center gap-1.5 font-bold text-slate-700 mb-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Migration Credentials & Google Sign-In</span>
            </div>
            <p>
              Google Admin: <code className="font-mono font-bold text-purple-700">{ADMIN_EMAIL}</code>
            </p>
            <p>
              Scrypt Admin: <code className="font-mono font-bold text-purple-700">{username || 'my_art'}</code>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
