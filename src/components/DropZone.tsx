import React, { useCallback, useState } from 'react';
import { UploadCloud, FilePlus, Trash2 } from 'lucide-react';

interface DropZoneProps {
  onFilesSelected: (files: string[]) => void;
  onClearQueue?: () => void;
  hasFiles: boolean;
  acceptedTypesLabel?: string;
  allowedExtensions?: string[];
}

export const DropZone: React.FC<DropZoneProps> = ({
  onFilesSelected,
  onClearQueue,
  hasFiles,
  acceptedTypesLabel = 'JPG, PNG, GIF, WEBP, SVG, BMP, ICO, TIFF, AVIF, PDF, MP4, DOCX',
  allowedExtensions,
}) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const files = Array.from(e.dataTransfer.files);
      const filePaths: string[] = [];

      for (const file of files) {
        // In Electron, File objects have a 'path' property containing the absolute path, or getPathForFile in context isolation
        const filePath = (window as any).electronAPI.getPathForFile(file) || (file as any).path;
        if (filePath) {
          if (allowedExtensions && allowedExtensions.length > 0) {
            const ext = filePath.substring(filePath.lastIndexOf('.')).toLowerCase();
            if (allowedExtensions.includes(ext) || allowedExtensions.includes('*')) {
              filePaths.push(filePath);
            }
          } else {
            filePaths.push(filePath);
          }
        }
      }

      if (filePaths.length > 0) {
        onFilesSelected(filePaths);
      }
    },
    [onFilesSelected, allowedExtensions]
  );

  const handleBrowseClick = useCallback(async () => {
    try {
      const filters = allowedExtensions
        ? [{ name: 'Supported Files', extensions: allowedExtensions.map((e) => e.replace('.', '')) }]
        : [{ name: 'All Files', extensions: ['*'] }];

      const selectedFiles = await (window as any).electronAPI.selectInputFiles(filters);
      if (selectedFiles && selectedFiles.length > 0) {
        onFilesSelected(selectedFiles.map((f: any) => f.filePath));
      }
    } catch (err) {
      console.error('Error selecting files via dialog:', err);
    }
  }, [onFilesSelected, allowedExtensions]);

  // Format badges for visual polish
  const badges = acceptedTypesLabel.split(', ').map((tag) => {
    let bg = 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700';
    if (['JPG', 'PNG', 'JPEG'].includes(tag)) bg = 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-500/30';
    if (['WEBP', 'AVIF'].includes(tag)) bg = 'bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400 border-brand-200 dark:border-brand-500/30';
    if (['GIF', 'SVG'].includes(tag)) bg = 'bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-500/30';
    if (['PDF', 'DOCX'].includes(tag)) bg = 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-500/30';
    return (
      <span key={tag} className={`px-2.5 py-1 rounded-lg text-xs font-semibold tracking-wider border ${bg}`}>
        {tag}
      </span>
    );
  });

  return (
    <div className="w-full flex flex-col gap-4">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleBrowseClick}
        className={`w-full border-2 border-dashed rounded-3xl p-8 flex flex-col items-center justify-center gap-6 cursor-pointer transition-all duration-200 group ${
          isDragging
            ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-500/10 scale-[1.01]'
            : 'border-slate-300 dark:border-slate-800/80 bg-white/50 dark:bg-[#18181b]/50 hover:border-brand-500/50 hover:bg-white dark:hover:bg-[#18181b]'
        }`}
      >
        <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-[#27272a] group-hover:bg-brand-50 dark:group-hover:bg-brand-500/20 flex items-center justify-center text-slate-600 dark:text-slate-400 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors shadow-inner">
          <UploadCloud className={`w-8 h-8 transition-transform duration-200 ${isDragging ? 'scale-125' : 'group-hover:scale-110'}`} />
        </div>

        <div className="text-center flex flex-col gap-1">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white">
            {isDragging ? 'Drop your files right here!' : 'Drop files here or click to browse'}
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Supports multi-file selection and instant queue management
          </p>
        </div>

        {/* Format Badges */}
        <div className="flex flex-wrap items-center justify-center gap-2 max-w-xl">
          {badges}
        </div>
      </div>

      {/* Queue Action Bar */}
      {hasFiles && (
        <div className="flex items-center justify-between px-2 py-1 animate-fade-in">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <FilePlus className="w-4 h-4 text-brand-500" />
            Active File Queue
          </span>

          {onClearQueue && (
            <button
              onClick={onClearQueue}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors border border-transparent hover:border-rose-200 dark:hover:border-rose-500/30"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear Queue
            </button>
          )}
        </div>
      )}
    </div>
  );
};
