/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Shield, Lock, User, AlertCircle, ArrowLeft, Loader2, Sparkles } from 'lucide-react';

interface AdminLoginProps {
  onLoginSuccess: (token: string, username: string) => void;
  onBackToSite: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({
  onLoginSuccess,
  onBackToSite,
}) => {
  const [username, setUsername] = useState('my_art');
  const [password, setPassword] = useState('myart67');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lockoutSec, setLockoutSec] = useState<number | null>(null);

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl overflow-hidden border border-purple-100">
        {/* Top Header */}
        <div className="bg-gradient-to-r from-purple-700 via-indigo-700 to-purple-800 p-8 text-white text-center relative">
          <button
            onClick={onBackToSite}
            className="absolute top-4 left-4 p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors text-white cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
            aria-label="Back to Kids Coloring Studio"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Public Site</span>
          </button>

          <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md mx-auto flex items-center justify-center mb-3 shadow-inner">
            <Shield className="w-9 h-9 text-yellow-300" />
          </div>
          <h2 className="text-2xl font-bold font-['Fredoka']">Administrator Portal</h2>
          <p className="text-xs text-purple-200 mt-1">
            Kids Coloring Studio Content & Artwork Management
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

          <form onSubmit={handleSubmit} className="space-y-5">
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
                  <span>Log In to Dashboard</span>
                </>
              )}
            </button>
          </form>

          {/* Initial credentials reminder */}
          <div className="mt-8 p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-600 text-[11px] leading-relaxed">
            <div className="flex items-center gap-1.5 font-bold text-slate-700 mb-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Initial Administrator Credentials</span>
            </div>
            <p>
              Username: <code className="font-mono font-bold text-purple-700">my_art</code>
            </p>
            <p>
              Password: <code className="font-mono font-bold text-purple-700">myart67</code>
            </p>
            <p className="mt-1 text-slate-400">
              Verified server-side via scrypt cryptographic hash & rate limited.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
