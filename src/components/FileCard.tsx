import React, { useState, useEffect } from 'react';
import { 
  FileText, Image as ImageIcon, Film, FileAudio, FileCode, Package, 
  Download, Copy, Check, Trash2, ChevronDown, ChevronUp, AlertCircle, Loader2 
} from 'lucide-react';
import type { QueuedFile, AppSettings } from '../types';

interface FileCardProps {
  file: QueuedFile;
  onRemove: (id: string) => void;
  onDownload?: (file: QueuedFile) => void;
  showCompressorResults?: boolean;
  showBase64Results?: boolean;
  settings?: AppSettings;
}

export const FileCard: React.FC<FileCardProps> = ({
  file,
  onRemove,
  onDownload,
  showCompressorResults = false,
  showBase64Results = false,
  settings,
}) => {
  const [copied, setCopied] = useState(false);
  const [base64Open, setBase64Open] = useState(false);
  const [imgSrc, setImgSrc] = useState<string | null>(null);

  // Load preview thumbnail for images
  useEffect(() => {
    if (file.isImage && file.filePath) {
      // In Electron renderer, we can load local file paths via file:// protocol
      setImgSrc(`file://${file.filePath}`);
    }
  }, [file]);

  const getFormattedBase64 = (base64Str?: string) => {
    if (!base64Str) return '';
    let resultStr = base64Str;
    if (settings?.base64RemoveQualifier) {
      resultStr = base64Str.replace(/^data:[^;]+;base64,/, '');
    }
    const template = settings?.base64CustomFormat || '$base64';
    const extClean = file.extension ? file.extension.replace(/^\./, '') : '';
    const nameClean = file.name ? file.name.replace(/\.[^/.]+$/, '') : '';
    return template
      .replace(/\$base64/g, resultStr)
      .replace(/\$filename/g, file.name || '')
      .replace(/\$name/g, nameClean)
      .replace(/\$ext/g, extClean);
  };

  const handleCopyBase64 = async () => {
    if (!file.base64) return;
    try {
      const formatted = getFormattedBase64(file.base64);
      await navigator.clipboard.writeText(formatted);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy base64:', err);
    }
  };

  const formatSize = (bytes?: number): string => {
    if (!bytes || bytes === 0) return '0 KB';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = () => {
    const ext = file.extension.toLowerCase();
    if (file.isImage) return <ImageIcon className="w-6 h-6 text-brand-500" />;
    if (['.mp4', '.webm', '.mkv', '.avi'].includes(ext)) return <Film className="w-6 h-6 text-purple-500" />;
    if (['.mp3', '.wav', '.ogg'].includes(ext)) return <FileAudio className="w-6 h-6 text-amber-500" />;
    if (['.zip', '.rar', '.7z', '.tar'].includes(ext)) return <Package className="w-6 h-6 text-blue-500" />;
    if (['.json', '.html', '.css', '.js', '.ts'].includes(ext)) return <FileCode className="w-6 h-6 text-emerald-500" />;
    return <FileText className="w-6 h-6 text-slate-500" />;
  };

  const isReduced = file.percentageChange && file.percentageChange < 0;
  const isIncreased = file.percentageChange && file.percentageChange > 0;

  return (
    <div className="bg-white dark:bg-[#18181b] border border-slate-200 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col gap-4 group">
      {/* Top Header Row */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {/* Thumbnail or Icon */}
          <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-[#27272a] flex items-center justify-center overflow-hidden border border-slate-200 dark:border-slate-700/50 flex-shrink-0 shadow-inner">
            {file.isImage && imgSrc ? (
              <img src={imgSrc} alt={file.name} className="w-full h-full object-cover" />
            ) : (
              getFileIcon()
            )}
          </div>

          {/* File Info */}
          <div className="min-w-0 flex-1 flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-800 dark:text-white truncate text-sm" title={file.name}>
                {file.name}
              </span>
              {file.width && file.height && (
                <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-800 px-1.5 py-0.5 rounded-md">
                  {file.width}x{file.height}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              <span>Original: {formatSize(file.size)}</span>
              {showCompressorResults && file.compressedSize && (
                <>
                  <span>•</span>
                  <span className={isReduced ? 'text-emerald-600 dark:text-emerald-400 font-bold' : isIncreased ? 'text-rose-600 dark:text-rose-400 font-bold' : ''}>
                    Compressed: {formatSize(file.compressedSize)}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Status / Actions Row */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Status Indicator */}
          {file.status === 'processing' && (
            <span className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl text-xs font-medium border border-amber-200 dark:border-amber-500/30 animate-pulse">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Processing
            </span>
          )}

          {file.status === 'error' && (
            <span className="flex items-center gap-1.5 px-3 py-1 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-xl text-xs font-medium border border-rose-200 dark:border-rose-500/30" title={file.error}>
              <AlertCircle className="w-3.5 h-3.5" />
              Error
            </span>
          )}

          {/* Percentage Badge */}
          {showCompressorResults && file.status === 'done' && file.percentageChange !== undefined && (
            <span
              className={`px-3 py-1 rounded-xl text-xs font-bold tracking-wide border ${
                isReduced
                  ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30'
                  : isIncreased
                  ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-500/30'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
              }`}
            >
              {isReduced ? `${file.percentageChange}%` : isIncreased ? `+${file.percentageChange}%` : '0%'}
            </span>
          )}

          {/* Download Button */}
          {showCompressorResults && file.status === 'done' && file.outputPath && onDownload && (
            <button
              onClick={() => onDownload(file)}
              className="p-2 bg-brand-50 dark:bg-brand-500/20 hover:bg-brand-100 dark:hover:bg-brand-500/30 text-brand-600 dark:text-brand-300 rounded-xl transition-colors border border-brand-200 dark:border-brand-500/30"
              title="Download WebP"
            >
              <Download className="w-4 h-4" />
            </button>
          )}

          {/* Remove Button */}
          <button
            onClick={() => onRemove(file.id)}
            className="p-2 bg-slate-100 dark:bg-[#27272a] hover:bg-rose-50 dark:hover:bg-rose-500/20 text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-xl transition-colors border border-slate-200 dark:border-slate-800/80"
            title="Remove File"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Base64 Section */}
      {showBase64Results && file.status === 'done' && file.base64 && (
        <div className="flex flex-col gap-3 pt-3 border-t border-slate-100 dark:border-slate-800/60 animate-fade-in">
          <div className="flex items-center justify-between gap-4">
            <button
              onClick={() => setBase64Open(!base64Open)}
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
            >
              {base64Open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              {base64Open ? 'Hide Base64 String' : 'Preview Base64 String'}
            </button>

            {/* LARGE Copy Base64 Button */}
            <button
              onClick={handleCopyBase64}
              className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition-all border shadow-sm ${
                copied
                  ? 'bg-emerald-500 text-white border-emerald-600 shadow-emerald-500/25'
                  : 'bg-brand-600 hover:bg-brand-500 text-white border-brand-500 shadow-brand-500/25'
              }`}
            >
              {copied ? <Check className="w-4 h-4 animate-scale-in" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied to Clipboard!' : 'Copy Base64'}
            </button>
          </div>

          {/* Collapsible Textarea */}
          {base64Open && (
            <div className="relative animate-slide-up">
              <textarea
                readOnly
                value={getFormattedBase64(file.base64)}
                rows={4}
                className="w-full bg-slate-50 dark:bg-[#121214] border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-xs font-mono text-slate-600 dark:text-slate-400 focus:outline-none focus:border-brand-500 dark:focus:border-brand-500/50 resize-none selection:bg-brand-500/20 selection:text-brand-400"
                onClick={(e) => (e.target as HTMLTextAreaElement).select()}
              />
              <span className="absolute bottom-3 right-3 text-[10px] text-slate-400 dark:text-slate-500 bg-white dark:bg-[#18181b] px-2 py-1 rounded-md border border-slate-200 dark:border-slate-800 pointer-events-none shadow-sm">
                Click textarea to select all
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
