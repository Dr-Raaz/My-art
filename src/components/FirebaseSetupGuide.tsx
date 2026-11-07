/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  Terminal,
  Database,
  Lock,
  Cloud,
  FileCode,
} from 'lucide-react';
import { getFirebaseStatus } from '../services/firebase';

export const FirebaseSetupGuide: React.FC = () => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const status = getFirebaseStatus();

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const sampleEnv = `# Firebase Client Configuration (in .env.local or Cloud environment):
VITE_FIREBASE_API_KEY="AIzaSy..."
VITE_FIREBASE_PROJECT_ID="your-project-id"
VITE_FIREBASE_AUTH_DOMAIN="your-project-id.firebaseapp.com"
VITE_FIREBASE_STORAGE_BUCKET="your-project-id.appspot.com"
VITE_FIREBASE_MESSAGING_SENDER_ID="123456789"
VITE_FIREBASE_APP_ID="1:123456789:web:abcdef"
VITE_FIREBASE_DATABASE_ID="(default)"

# Administrator Security (optional custom override):
ADMIN_USERNAME="my_art"
# Generated via: npx tsx scripts/setup-admin.ts my_art myart67
ADMIN_PASSWORD_HASH="scrypt$N=16384,r=8,p=1$c81f7e9a2b4d6e0f$6f700..."
`;

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-xs">
        <div className="flex items-start gap-4">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
              status.isConfigured
                ? 'bg-emerald-100 text-emerald-600'
                : 'bg-amber-100 text-amber-600'
            }`}
          >
            {status.isConfigured ? (
              <CheckCircle2 className="w-7 h-7" />
            ) : (
              <AlertTriangle className="w-7 h-7" />
            )}
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800 font-['Fredoka']">
              Firebase & Cloud Infrastructure Status
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
              {status.isConfigured
                ? `Connected to Firebase project: ${status.projectId}`
                : 'Running in Local Storage preview mode. Connect your Firebase project to persist categories and artwork cloud-wide.'}
            </p>
          </div>
        </div>

        {/* Feature Matrix Breakdown */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Implemented & Tested */}
          <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200">
            <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs uppercase tracking-wider mb-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Implemented & Tested</span>
            </div>
            <ul className="text-xs text-slate-700 space-y-1.5 font-medium">
              <li>✓ Layered canvas & outline preservation</li>
              <li>✓ Real barrier-mask flood fill (no leaks)</li>
              <li>✓ Freehand brush & non-destructive eraser</li>
              <li>✓ 36 child-friendly color palette</li>
              <li>✓ Undo & redo history system</li>
              <li>✓ PNG export with composite layers</li>
              <li>✓ IndexedDB local progress persistence</li>
              <li>✓ Scrypt password verification & rate limit</li>
            </ul>
          </div>

          {/* Requires Firebase Configuration */}
          <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200">
            <div className="flex items-center gap-2 text-amber-800 font-bold text-xs uppercase tracking-wider mb-2">
              <Cloud className="w-4 h-4 text-amber-600" />
              <span>Requires Firebase Config</span>
            </div>
            <ul className="text-xs text-slate-700 space-y-1.5 font-medium">
              <li>• Firestore live category syncing</li>
              <li>• Firestore live artwork metadata</li>
              <li>• Firebase Storage image uploads</li>
              <li>• Firebase Auth custom token minting</li>
              <li>• Multi-device public synchronization</li>
            </ul>
          </div>

          {/* Version 2 Scope */}
          <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-200">
            <div className="flex items-center gap-2 text-purple-800 font-bold text-xs uppercase tracking-wider mb-2">
              <Database className="w-4 h-4 text-purple-600" />
              <span>Version 2 Scope (Future)</span>
            </div>
            <ul className="text-xs text-slate-700 space-y-1.5 font-medium">
              <li>• Optional user sign-up & cloud galleries</li>
              <li>• Custom AI line-art generator tool</li>
              <li>• Premium coloring brushes & glitter</li>
              <li>• Printable coloring book PDF export</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Configuration Instructions */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-xs space-y-6">
        <div>
          <h3 className="text-lg font-bold text-slate-800 font-['Fredoka']">
            How to Connect Your Firebase Project
          </h3>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Follow these 3 quick steps to enable Cloud Firestore and Firebase Storage:
          </p>
        </div>

        {/* Step 1 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-700">
              Step 1: Set environment variables in your deployment
            </p>
            <button
              onClick={() => copyToClipboard(sampleEnv, 'env')}
              className="text-xs font-bold text-purple-600 hover:text-purple-700 flex items-center gap-1 cursor-pointer"
            >
              {copiedKey === 'env' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedKey === 'env' ? 'Copied' : 'Copy Template'}</span>
            </button>
          </div>
          <pre className="p-4 rounded-2xl bg-slate-900 text-slate-200 text-[11px] font-mono overflow-x-auto">
            {sampleEnv}
          </pre>
        </div>

        {/* Step 2: Deploy Firestore Security Rules */}
        <div className="space-y-2">
          <p className="text-xs font-bold text-slate-700">
            Step 2: Deploy Security Rules to your Firebase Console
          </p>
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-2">
            <p className="font-semibold text-slate-800">
              Hardened rules files are ready in your repository:
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="px-2.5 py-1 rounded-lg bg-white border border-slate-300 font-mono text-[11px]">
                /firestore.rules
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-white border border-slate-300 font-mono text-[11px]">
                /storage.rules
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-white border border-slate-300 font-mono text-[11px]">
                /firebase-blueprint.json
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Run <code className="bg-slate-200 px-1.5 py-0.5 rounded font-mono">firebase deploy --only firestore:rules,storage</code> from your local Firebase CLI.
            </p>
          </div>
        </div>

        {/* Step 3: Admin Credential Provisioning */}
        <div className="space-y-2">
          <p className="text-xs font-bold text-slate-700">
            Step 3: Administrator Hash Provisioning Script
          </p>
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
            <p className="mb-2">
              To generate custom administrator password hashes, run the included setup script:
            </p>
            <code className="block p-2.5 rounded-xl bg-slate-900 text-slate-200 font-mono text-[11px]">
              npx tsx scripts/setup-admin.ts my_art myart67
            </code>
          </div>
        </div>
      </div>
    </div>
  );
};
