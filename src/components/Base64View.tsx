import React, { useState } from 'react';
import { DropZone } from './DropZone';
import { FileCard } from './FileCard';
import type { QueuedFile } from '../types';
import { Play, Loader2 } from 'lucide-react';

interface Base64ViewProps {
  files: QueuedFile[];
  setFiles: React.Dispatch<React.SetStateAction<QueuedFile[]>>;
  onFilesSelected: (filePaths: string[]) => void;
  onClearQueue: () => void;
  onRemoveFile: (id: string) => void;
  onShowToast: (message: string, type?: 'success' | 'error') => void;
}

export const Base64View: React.FC<Base64ViewProps> = ({
  files,
  setFiles,
  onFilesSelected,
  onClearQueue,
  onRemoveFile,
  onShowToast: _onShowToast,
}) => {
  const [isProcessingAll, setIsProcessingAll] = useState(false);

  const convertSingleFile = async (file: QueuedFile) => {
    if (!file.filePath) return;

    setFiles((prev) => prev.map((f) => (f.id === file.id ? { ...f, status: 'processing' } : f)));

    try {
      const result = await (window as any).electronAPI.convertBase64({ filePath: file.filePath });

      if (result.success) {
        setFiles((prev) =>
          prev.map((f) =>
            f.id === file.id
              ? {
                  ...f,
                  status: 'done',
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

  const handleConvertAll = async () => {
    const idleFiles = files.filter((f) => f.status === 'idle');
    if (idleFiles.length === 0) return;

    setIsProcessingAll(true);
    for (const file of idleFiles) {
      await convertSingleFile(file);
    }
    setIsProcessingAll(false);
  };

  const idleCount = files.filter((f) => f.status === 'idle').length;

  return (
    <div className="flex flex-col gap-8 animate-fade-in">
      {/* Top Banner & Batch Action */}
      <div className="card-container flex flex-col md:flex-row items-center justify-between gap-6 bg-gradient-to-r from-brand-600/10 via-transparent to-transparent border-brand-500/20">
        <div className="flex flex-col gap-1 text-center md:text-left">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white">Universal Base64 Encoder</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xl">
            Convert any file (Images, Videos, PDFs, Documents, Fonts) into a fully qualified Data URI Base64 string instantly.
          </p>
        </div>

        <button
          onClick={handleConvertAll}
          disabled={idleCount === 0 || isProcessingAll}
          className="btn-primary py-3 px-6 text-sm font-bold flex-shrink-0 w-full md:w-auto"
        >
          {isProcessingAll ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
          {isProcessingAll ? 'Encoding Files...' : `Encode ${idleCount > 0 ? idleCount : ''} Files to Base64`}
        </button>
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
              showBase64Results={true}
            />
          ))}
        </div>
      )}
    </div>
  );
};
