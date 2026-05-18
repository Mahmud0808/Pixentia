import React, { useState, useEffect } from 'react';
import { DropZone } from './DropZone';
import { FileCard } from './FileCard';
import type { QueuedFile, AppSettings } from '../types';
import { Sliders, Play, Layers, Loader2, Copy, Check } from 'lucide-react';

interface CombinedViewProps {
  files: QueuedFile[];
  setFiles: React.Dispatch<React.SetStateAction<QueuedFile[]>>;
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => Promise<void>;
  onFilesSelected: (filePaths: string[]) => void;
  onClearQueue: () => void;
  onRemoveFile: (id: string) => void;
  onShowToast: (message: string, type?: 'success' | 'error') => void;
}

export const CombinedView: React.FC<CombinedViewProps> = ({
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
  const [copiedAll, setCopiedAll] = useState(false);

  useEffect(() => {
    setQuality(settings.compressionQuality);
  }, [settings.compressionQuality]);

  const handleQualityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuality(Number(e.target.value));
  };

  const handleQualityCommit = async () => {
    await onUpdateSettings({ compressionQuality: quality });
  };

  const getFormattedBase64 = (base64Str?: string) => {
    if (!base64Str) return '';
    let resultStr = base64Str;
    if (settings.base64RemoveQualifier) {
      resultStr = base64Str.replace(/^data:[^;]+;base64,/, '');
    }
    const template = settings.base64CustomFormat || '$base64';
    return template.replace('$base64', resultStr);
  };

  const runSinglePipeline = async (file: QueuedFile) => {
    if (!file.filePath) return;

    setFiles((prev) => prev.map((f) => (f.id === file.id ? { ...f, status: 'processing' } : f)));

    try {
      const result = await (window as any).electronAPI.runCombinedPipeline({
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
                  base64: result.base64,
                  mimeType: result.mimeType,
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

  const handleRunAllPipeline = async () => {
    const idleFiles = files.filter((f) => f.status === 'idle');
    if (idleFiles.length === 0) return;

    setIsProcessingAll(true);
    for (const file of idleFiles) {
      await runSinglePipeline(file);
    }
    setIsProcessingAll(false);
  };

  const handleCopyAll = async () => {
    const completedFiles = files.filter((f) => f.status === 'done' && f.base64);
    if (completedFiles.length === 0) return;
    try {
      const allStrings = completedFiles.map((f) => getFormattedBase64(f.base64)).join('\n');
      await navigator.clipboard.writeText(allStrings);
      setCopiedAll(true);
      onShowToast('Copied all Base64 strings to clipboard', 'success');
      setTimeout(() => setCopiedAll(false), 2000);
    } catch (err) {
      console.error('Failed to copy all base64:', err);
      onShowToast('Failed to copy Base64 strings', 'error');
    }
  };

  const idleCount = files.filter((f) => f.status === 'idle').length;
  const completedCount = files.filter((f) => f.status === 'done' && f.base64).length;

  return (
    <div className="flex flex-col gap-8 animate-fade-in">
      {/* Top Banner & Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quality Slider Card */}
        <div className="card-container lg:col-span-2 flex flex-col justify-between gap-4 bg-gradient-to-tr from-brand-50/50 via-transparent to-transparent dark:from-brand-500/5 border-brand-500/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sliders className="w-5 h-5 text-brand-500" />
              <div className="flex flex-col">
                <h3 className="font-bold text-slate-800 dark:text-white text-sm">WebP Compression Quality (Step 1)</h3>
                <span className="text-xs text-slate-500 dark:text-slate-400">Applies only to image files before Base64 encoding</span>
              </div>
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
              <span>Lowest Quality</span>
              <span>Balanced</span>
              <span>Lossless (100%)</span>
            </div>
          </div>
        </div>

        {/* Action Panel Card */}
        <div className="card-container flex flex-col justify-center gap-3 bg-gradient-to-tr from-purple-50/50 via-transparent to-transparent dark:from-purple-500/5 border-purple-500/20">
          <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 mb-1">
            <Layers className="w-5 h-5" />
            <h3 className="font-bold text-sm">Sequential Pipeline</h3>
          </div>
          <div className="flex flex-col gap-2">
            {settings.base64CopyAll && completedCount > 0 && (
              <button
                onClick={handleCopyAll}
                className={`btn-secondary w-full py-2.5 text-xs font-bold flex items-center justify-center gap-2 ${
                  copiedAll ? 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-300 dark:border-emerald-500/30' : ''
                }`}
              >
                {copiedAll ? <Check className="w-4 h-4 animate-scale-in" /> : <Copy className="w-4 h-4" />}
                {copiedAll ? 'Copied All Base64!' : `Copy All Base64 (${completedCount})`}
              </button>
            )}

            <button
              onClick={handleRunAllPipeline}
              disabled={idleCount === 0 || isProcessingAll}
              className="btn-primary w-full py-3 text-sm font-bold bg-purple-600 hover:bg-purple-500 active:bg-purple-700 shadow-purple-500/25 justify-center"
            >
              {isProcessingAll ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
              {isProcessingAll ? 'Running Pipeline...' : `Start Pipeline (${idleCount})`}
            </button>
          </div>
        </div>
      </div>

      {/* Drop Zone */}
      <DropZone
        onFilesSelected={onFilesSelected}
        onClearQueue={onClearQueue}
        hasFiles={files.length > 0}
        acceptedTypesLabel="JPG, PNG, GIF, WEBP, SVG, BMP, ICO, TIFF, AVIF, PDF, MP4, DOCX, ZIP"
      />

      {/* File Cards List */}
      {files.length > 0 && (
        <div className="grid grid-cols-1 gap-4 animate-fade-in">
          {files.map((file) => (
            <FileCard
              key={file.id}
              file={file}
              onRemove={onRemoveFile}
              showCompressorResults={file.isImage}
              showBase64Results={true}
              settings={settings}
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
