import React, { useState, useEffect } from 'react';
import { DropZone } from './DropZone';
import { FileCard } from './FileCard';
import type { QueuedFile, AppSettings } from '../types';
import { Sliders, Play, Archive, Check, Loader2 } from 'lucide-react';

interface CompressorViewProps {
  files: QueuedFile[];
  setFiles: React.Dispatch<React.SetStateAction<QueuedFile[]>>;
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => Promise<void>;
  onFilesSelected: (filePaths: string[]) => void;
  onClearQueue: () => void;
  onRemoveFile: (id: string) => void;
  onShowToast: (message: string, type?: 'success' | 'error') => void;
}

export const CompressorView: React.FC<CompressorViewProps> = ({
  files,
  setFiles,
  settings,
  onUpdateSettings,
  onFilesSelected,
  onClearQueue,
  onRemoveFile,
  onShowToast,
}) => {
  const [quality, setQuality] = useState(settings.compressionQuality);
  const [isProcessingAll, setIsProcessingAll] = useState(false);
  const [isZipping, setIsZipping] = useState(false);
  const [zipSuccess, setZipSuccess] = useState(false);

  // Sync state if settings prop changes
  useEffect(() => {
    setQuality(settings.compressionQuality);
  }, [settings.compressionQuality]);

  // Handle slider change with debounce/persist
  const handleQualityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setQuality(val);
  };

  const handleQualityCommit = async () => {
    await onUpdateSettings({ compressionQuality: quality });
  };

  // Compress a single file
  const compressSingleFile = async (file: QueuedFile) => {
    if (!file.filePath || !file.isImage) return;

    setFiles((prev) => prev.map((f) => (f.id === file.id ? { ...f, status: 'processing' } : f)));

    try {
      const result = await (window as any).electronAPI.compressImage({
        filePath: file.filePath,
        quality,
        outputDir: settings.outputDirectory,
      });

      if (result.success) {
        setFiles((prev) =>
          prev.map((f) =>
            f.id === file.id
              ? {
                  ...f,
                  status: 'done',
                  originalSize: result.originalSize,
                  compressedSize: result.compressedSize,
                  percentageChange: result.percentageChange,
                  outputPath: result.outputPath,
                  width: result.width,
                  height: result.height,
                }
              : f
          )
        );
      } else {
        setFiles((prev) => prev.map((f) => (f.id === file.id ? { ...f, status: 'error', error: result.error } : f)));
      }
    } catch (err: any) {
      setFiles((prev) => prev.map((f) => (f.id === file.id ? { ...f, status: 'error', error: err.message } : f)));
    }
  };

  // Batch compress all idle files
  const handleCompressAll = async () => {
    const idleFiles = files.filter((f) => f.status === 'idle' && f.isImage);
    if (idleFiles.length === 0) return;

    setIsProcessingAll(true);
    for (const file of idleFiles) {
      await compressSingleFile(file);
    }
    setIsProcessingAll(false);

    // Check auto-zip setting
    if (settings.zipAutoDownload) {
      await handleDownloadZip();
    }
  };

  // Download all completed as ZIP
  const handleDownloadZip = async () => {
    const completedFiles = files.filter((f) => f.status === 'done' && f.outputPath);
    if (completedFiles.length === 0) return;

    setIsZipping(true);
    try {
      const zipFiles = completedFiles.map((f) => ({ name: f.name, outputPath: f.outputPath! }));
      const result = await (window as any).electronAPI.createZip({
        files: zipFiles,
        outputDir: settings.outputDirectory,
      });

      if (result.success) {
        setZipSuccess(true);
        onShowToast('Successfully saved ZIP archive to output directory', 'success');
        setTimeout(() => setZipSuccess(false), 3000);
      } else {
        console.error('ZIP creation failed:', result.error);
        onShowToast(`ZIP creation failed: ${result.error}`, 'error');
      }
    } catch (err: any) {
      console.error('ZIP creation error:', err);
      onShowToast(`ZIP creation error: ${err.message}`, 'error');
    }
    setIsZipping(false);
  };

  const imageFiles = files.filter((f) => f.isImage);
  const idleCount = imageFiles.filter((f) => f.status === 'idle').length;
  const doneCount = imageFiles.filter((f) => f.status === 'done').length;

  return (
    <div className="flex flex-col gap-8 animate-fade-in">
      {/* Top Controls Row: Slider & Action Buttons */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quality Slider Card */}
        <div className="card-container lg:col-span-2 flex flex-col justify-between gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sliders className="w-5 h-5 text-brand-500" />
              <h3 className="font-bold text-slate-800 dark:text-white text-sm">Compression Quality</h3>
            </div>
            <span className="font-mono text-sm font-bold px-3 py-1 bg-brand-50 dark:bg-brand-500/20 text-brand-600 dark:text-brand-400 rounded-xl border border-brand-200 dark:border-brand-500/30">
              {quality}%
            </span>
          </div>

          <div className="flex flex-col gap-2">
            <input
              type="range"
              min="1"
              max="100"
              value={quality}
              onChange={handleQualityChange}
              onMouseUp={handleQualityCommit}
              onTouchEnd={handleQualityCommit}
              style={{ background: `linear-gradient(to right, #16a34a ${quality}%, ${settings.theme === 'dark' ? '#27272a' : '#e2e8f0'} ${quality}%)` }}
              className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-brand-500"
            />
            <div className="flex justify-between text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-0.5">
              <span>Lowest Quality (Smallest Size)</span>
              <span>Balanced</span>
              <span>Lossless (100%)</span>
            </div>
          </div>
        </div>

        {/* Action Panel Card */}
        <div className="card-container flex flex-col justify-center gap-3">
          <button
            onClick={handleCompressAll}
            disabled={idleCount === 0 || isProcessingAll}
            className="btn-primary w-full py-3 text-sm font-bold"
          >
            {isProcessingAll ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
            {isProcessingAll ? 'Compressing Batch...' : `Compress ${idleCount > 0 ? idleCount : ''} Images`}
          </button>

          <button
            onClick={handleDownloadZip}
            disabled={doneCount === 0 || isZipping}
            className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all border shadow-sm ${
              zipSuccess
                ? 'bg-emerald-500 text-white border-emerald-600 shadow-emerald-500/25'
                : 'bg-slate-200 hover:bg-slate-300 dark:bg-[#27272a] dark:hover:bg-[#3f3f46] text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700'
            }`}
          >
            {zipSuccess ? <Check className="w-4 h-4 animate-scale-in" /> : isZipping ? <Loader2 className="w-4 h-4 animate-spin" /> : <Archive className="w-4 h-4" />}
            {zipSuccess ? 'ZIP Saved to Output!' : isZipping ? 'Bundling ZIP...' : `Download All (${doneCount}) as ZIP`}
          </button>
        </div>
      </div>

      {/* Drop Zone */}
      <DropZone
        onFilesSelected={onFilesSelected}
        onClearQueue={onClearQueue}
        hasFiles={files.length > 0}
        acceptedTypesLabel="JPG, PNG, WEBP, GIF, BMP, TIFF, AVIF, SVG, ICO"
        allowedExtensions={['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp', '.tiff', '.avif', '.svg', '.ico']}
      />

      {/* File Cards List */}
      {imageFiles.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
          {imageFiles.map((file) => (
            <FileCard
              key={file.id}
              file={file}
              onRemove={onRemoveFile}
              showCompressorResults={true}
              onDownload={async (f) => {
                if (!f.outputPath) return;
                try {
                  const result = await (window as any).electronAPI.saveDownloadFile({
                    tempPath: f.outputPath,
                    outputDir: settings.outputDirectory,
                    fileName: f.name.replace(/\.[^/.]+$/, "") + '.webp',
                  });
                  if (result.success) {
                    onShowToast(`Successfully saved ${f.name.replace(/\.[^/.]+$/, "")}.webp`, 'success');
                  } else {
                    onShowToast(`Failed to save: ${result.error}`, 'error');
                  }
                } catch (err: any) {
                  onShowToast(`Error saving file: ${err.message}`, 'error');
                }
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};
