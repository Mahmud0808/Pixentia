import React, { useEffect } from 'react';
import { DropZone } from './DropZone';
import { SpritesheetCard } from './SpritesheetCard';
import type { QueuedFile, AppSettings } from '../types';
import { Sparkles } from 'lucide-react';

interface SpritesheetViewProps {
  files: QueuedFile[];
  setFiles: React.Dispatch<React.SetStateAction<QueuedFile[]>>;
  onFilesSelected: (filePaths: string[]) => void;
  onClearQueue: () => void;
  onRemoveFile: (id: string) => void;
  onShowToast: (message: string, type?: 'success' | 'error') => void;
  settings: AppSettings;
}

export const SpritesheetView: React.FC<SpritesheetViewProps> = ({
  files,
  setFiles,
  onFilesSelected,
  onClearQueue,
  onRemoveFile,
  onShowToast,
  settings,
}) => {

  // Auto-fetch GIF info for new files
  useEffect(() => {
    files.forEach(async (file) => {
      if (file.filePath && file.status === 'idle' && !file.frameCount) {
        try {
          const res = await (window as any).electronAPI.getGifInfo({ filePath: file.filePath });
          if (res.success) {
            setFiles((prev) =>
              prev.map((f) =>
                f.id === file.id
                  ? {
                      ...f,
                      frameCount: res.frameCount,
                      frameWidth: res.frameWidth,
                      frameHeight: res.frameHeight,
                      fps: res.fps,
                      durationMs: res.durationMs,
                      status: 'done', // metadata loaded successfully
                    }
                  : f
              )
            );
          } else {
            setFiles((prev) => prev.map((f) => (f.id === file.id ? { ...f, status: 'error', error: res.error } : f)));
          }
        } catch (err: any) {
          setFiles((prev) => prev.map((f) => (f.id === file.id ? { ...f, status: 'error', error: err.message } : f)));
        }
      }
    });
  }, [files, setFiles]);

  return (
    <div className="flex flex-col gap-8 animate-fade-in">
      {/* Top Banner */}
      <div className="card-container flex flex-col md:flex-row items-center justify-between gap-6 bg-gradient-to-r from-purple-600/10 via-transparent to-transparent border-purple-500/20 shadow-sm">
        <div className="flex flex-col gap-1 text-center md:text-left">
          <div className="flex items-center gap-2 justify-center md:justify-start">
            <Sparkles className="w-5 h-5 text-purple-500" />
            <h2 className="text-lg font-bold text-slate-800 dark:text-white">GIF to Spritesheet Converter</h2>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
            Transform animated GIFs into high-performance, game-ready WebP spritesheets. Fully customize grid layout, synchronize overall sheet dimensions with automatic frame scaling, and preview your results instantly.
          </p>
        </div>
      </div>

      {/* Drop Zone */}
      <DropZone
        onFilesSelected={onFilesSelected}
        onClearQueue={onClearQueue}
        hasFiles={files.length > 0}
        acceptedTypesLabel="GIF (Animated Images)"
      />

      {/* Spritesheet Cards List */}
      {files.length > 0 && (
        <div className="grid grid-cols-1 gap-6 animate-fade-in">
          {files.map((file) => (
            <SpritesheetCard
              key={file.id}
              file={file}
              onRemove={onRemoveFile}
              onShowToast={onShowToast}
              settings={settings}
            />
          ))}
        </div>
      )}
    </div>
  );
};
