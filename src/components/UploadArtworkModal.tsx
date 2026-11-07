/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import type { Category, Artwork } from '../data/defaultArtworks';
import { uploadArtworkImage } from '../services/dataService';
import {
  X,
  UploadCloud,
  FileImage,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Sparkles,
} from 'lucide-react';

interface UploadArtworkModalProps {
  categories: Category[];
  onClose: () => void;
  onArtworkSaved: (artwork: Artwork) => Promise<void>;
}

export const UploadArtworkModal: React.FC<UploadArtworkModalProps> = ({
  categories,
  onClose,
  onArtworkSaved,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageMeta, setImageMeta] = useState<{ width: number; height: number } | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState(categories[0]?.id || '');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy');
  const [isPublished, setIsPublished] = useState(true);

  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type
    const valid = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!valid.includes(file.type)) {
      setErrorMessage('Please select a PNG, JPG, or WebP image file.');
      return;
    }

    // Validate size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage('Image size exceeds 10 MB limit.');
      return;
    }

    setErrorMessage(null);
    setSelectedFile(file);

    // Read preview
    const reader = new FileReader();
    reader.onload = (event) => {
      const src = event.target?.result as string;
      setPreviewUrl(src);

      const img = new Image();
      img.onload = () => {
        setImageMeta({ width: img.naturalWidth, height: img.naturalHeight });
        if (!title) {
          // Pre-fill title from clean filename
          const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
          setTitle(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
        }
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedFile) {
      setErrorMessage('Please select an artwork image to upload.');
      return;
    }

    if (!title.trim()) {
      setErrorMessage('Artwork title is required.');
      return;
    }

    if (!categoryId) {
      setErrorMessage('Please select a category for this artwork.');
      return;
    }

    setIsUploading(true);
    setErrorMessage(null);
    setUploadProgress(10);

    const artworkId = `art-${Date.now()}`;

    try {
      // 1. Upload to storage (or get data URL)
      const uploadResult = await uploadArtworkImage(artworkId, selectedFile, (p) => {
        setUploadProgress(p);
      });

      // 2. Build metadata record
      const newArtwork: Artwork = {
        id: artworkId,
        title: title.trim(),
        description: description.trim(),
        categoryId,
        imageUrl: uploadResult.imageUrl,
        storagePath: uploadResult.storagePath,
        difficulty,
        isPublished,
        imageWidth: uploadResult.width,
        imageHeight: uploadResult.height,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // 3. Save to database
      await onArtworkSaved(newArtwork);
      onClose();
    } catch (err) {
      console.error('Artwork upload failed:', err);
      setErrorMessage(err instanceof Error ? err.message : 'Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 my-8 animate-in fade-in duration-200">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-800 font-['Fredoka']">
              Upload New Coloring Page
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Add black-and-white line art for children to color.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMessage && (
          <div className="mb-5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* File Drop / Select Area */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Illustration Image File (PNG, JPG, WebP) *
            </label>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={handleFileChange}
              className="hidden"
            />

            {!previewUrl ? (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full border-2 border-dashed border-purple-200 rounded-3xl p-8 text-center hover:border-purple-400 hover:bg-purple-50/40 transition-colors cursor-pointer flex flex-col items-center justify-center gap-3"
              >
                <div className="w-14 h-14 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center">
                  <UploadCloud className="w-8 h-8" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-700">
                    Click to select illustration from your device
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    White background, clean black outlines, max 10MB
                  </p>
                </div>
              </button>
            ) : (
              <div className="relative rounded-2xl border border-slate-200 p-3 bg-slate-50 flex items-center gap-4">
                <div className="w-24 h-24 rounded-xl bg-white border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center p-1">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-800 truncate">
                    {selectedFile?.name}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {((selectedFile?.size || 0) / 1024).toFixed(1)} KB • {imageMeta?.width} × {imageMeta?.height} px
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFile(null);
                      setPreviewUrl(null);
                      setImageMeta(null);
                    }}
                    className="mt-2 text-xs font-bold text-rose-600 hover:text-rose-700 cursor-pointer"
                  >
                    Change Image
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Artwork Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Friendly Dolphin, Magic Castle"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none font-medium"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Description
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Child-friendly description of this picture..."
              className="w-full px-4 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none font-medium"
            />
          </div>

          {/* Category & Difficulty Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Category *
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none font-medium bg-white"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.icon || '🎨'} {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Difficulty Level
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none font-medium bg-white"
              >
                <option value="easy">Easy (Thick outlines, large areas)</option>
                <option value="medium">Medium (Moderate details)</option>
                <option value="hard">Hard (Intricate coloring patterns)</option>
              </select>
            </div>
          </div>

          {/* Publish Toggle */}
          <div className="p-3.5 rounded-2xl bg-purple-50/60 border border-purple-100 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-800">Publish to Gallery</p>
              <p className="text-[11px] text-slate-500">
                Immediately visible for children to color
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isPublished}
                onChange={(e) => setIsPublished(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
            </label>
          </div>

          {/* Upload Progress Indicator */}
          {isUploading && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold text-purple-700">
                <span>Uploading & saving metadata...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full h-2.5 bg-purple-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-purple-600 transition-all duration-200"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isUploading}
              className="px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isUploading}
              className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md shadow-purple-200 cursor-pointer flex items-center gap-2 disabled:opacity-50"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Uploading Artwork...</span>
                </>
              ) : (
                <>
                  <UploadCloud className="w-4 h-4" />
                  <span>{isPublished ? 'Upload & Publish' : 'Save as Draft'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
