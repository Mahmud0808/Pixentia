import React, { useState, useEffect } from 'react';
import { 
  Grid, Film, Play, Download, Trash2, Check, Loader2, Activity 
} from 'lucide-react';
import type { QueuedFile, AppSettings } from '../types';

interface SpritesheetCardProps {
  file: QueuedFile;
  onRemove: (id: string) => void;
  onShowToast: (message: string, type?: 'success' | 'error') => void;
  settings: AppSettings;
}

export const SpritesheetCard: React.FC<SpritesheetCardProps> = ({
  file,
  onRemove,
  onShowToast,
  settings,
}) => {
  const [columns, setColumns] = useState(file.columns || 4);
  const [newFrameWidth, setNewFrameWidth] = useState(file.frameWidth || 100);
  const [newFrameHeight, setNewFrameHeight] = useState(file.frameHeight || 100);
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<{
    outputPath?: string;
    compressedSize?: number;
    spritesheetWidth?: number;
    spritesheetHeight?: number;
  } | null>(null);

  // Initialize layout when GIF info is available
  useEffect(() => {
    if (file.frameCount && file.frameWidth && file.frameHeight) {
      const initialCols = Math.min(file.frameCount, Math.ceil(Math.sqrt(file.frameCount)));
      setColumns(initialCols);
      setNewFrameWidth(file.frameWidth);
      setNewFrameHeight(file.frameHeight);
    }
  }, [file.frameCount, file.frameWidth, file.frameHeight]);

  const rows = file.frameCount ? Math.ceil(file.frameCount / columns) : 1;
  const currentSheetWidth = columns * newFrameWidth;
  const currentSheetHeight = rows * newFrameHeight;
  const origAspectRatio = (file.frameWidth && file.frameHeight) ? (file.frameWidth / file.frameHeight) : 1;

  // Synced input handlers
  const handleSheetWidthChange = (val: number) => {
    const w = Math.max(1, val);
    const fw = Math.max(1, Math.round(w / columns));
    const fh = Math.max(1, Math.round(fw / origAspectRatio));
    setNewFrameWidth(fw);
    setNewFrameHeight(fh);
  };

  const handleSheetHeightChange = (val: number) => {
    const h = Math.max(1, val);
    const fh = Math.max(1, Math.round(h / rows));
    const fw = Math.max(1, Math.round(fh * origAspectRatio));
    setNewFrameWidth(fw);
    setNewFrameHeight(fh);
  };

  const handleFrameWidthChange = (val: number) => {
    const fw = Math.max(1, val);
    const fh = Math.max(1, Math.round(fw / origAspectRatio));
    setNewFrameWidth(fw);
    setNewFrameHeight(fh);
  };

  const handleFrameHeightChange = (val: number) => {
    const fh = Math.max(1, val);
    const fw = Math.max(1, Math.round(fh * origAspectRatio));
    setNewFrameWidth(fw);
    setNewFrameHeight(fh);
  };

  const handleGenerate = async () => {
    if (!file.filePath) return;
    setIsGenerating(true);
    try {
      const res = await (window as any).electronAPI.generateSpritesheet({
        filePath: file.filePath,
        columns,
        newFrameWidth,
        newFrameHeight,
        quality: 100, // PNG is lossless
        outputDir: settings.outputDirectory,
      });

      if (res.success) {
        setResult({
          outputPath: res.outputPath,
          compressedSize: res.compressedSize,
          spritesheetWidth: res.spritesheetWidth,
          spritesheetHeight: res.spritesheetHeight,
        });
        onShowToast('Spritesheet generated successfully!', 'success');
      } else {
        onShowToast(`Failed to generate: ${res.error}`, 'error');
      }
    } catch (err: any) {
      onShowToast(`Error: ${err.message}`, 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async () => {
    if (!result?.outputPath) return;
    try {
      const res = await (window as any).electronAPI.saveDownloadFile({
        tempPath: result.outputPath,
        outputDir: settings.outputDirectory,
        fileName: file.name.replace(/\.[^/.]+$/, "") + '.png',
      });
      if (res.success) {
        onShowToast(`Successfully saved ${file.name.replace(/\.[^/.]+$/, "")}.png`, 'success');
      } else {
        onShowToast(`Failed to save: ${res.error}`, 'error');
      }
    } catch (err: any) {
      onShowToast(`Error saving file: ${err.message}`, 'error');
    }
  };

  const formatSize = (bytes?: number): string => {
    if (!bytes || bytes === 0) return '0 KB';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="card-container flex flex-col gap-6 bg-white dark:bg-[#18181b] border-slate-200 dark:border-slate-800/80 animate-fade-in shadow-xl">
      {/* Top Bar: GIF Preview & Metadata */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-slate-100 dark:border-slate-800/80">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-[#27272a] border border-slate-200 dark:border-slate-800 overflow-hidden flex items-center justify-center flex-shrink-0 shadow-inner">
            {file.filePath ? (
              <img src={`file://${file.filePath}`} alt={file.name} className="w-full h-full object-cover" />
            ) : (
              <Film className="w-6 h-6 text-slate-400" />
            )}
          </div>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-800 dark:text-white text-base truncate max-w-xs">{file.name}</h3>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-500/30">
                GIF Source
              </span>
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">{formatSize(file.size)}</span>
          </div>
        </div>

        {/* GIF Metadata Badges */}
        {file.frameCount ? (
          <div className="flex flex-wrap items-center gap-3 bg-slate-50 dark:bg-[#121214] p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 w-full md:w-auto justify-around md:justify-end">
            <div className="flex items-center gap-2 px-3 py-1 bg-white dark:bg-[#18181b] rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <Film className="w-4 h-4 text-brand-500" />
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Frames</span>
                <span className="text-xs font-bold text-slate-800 dark:text-white font-mono">{file.frameCount}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 px-3 py-1 bg-white dark:bg-[#18181b] rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <Activity className="w-4 h-4 text-purple-500" />
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Frame Rate</span>
                <span className="text-xs font-bold text-slate-800 dark:text-white font-mono">{file.fps} FPS</span>
              </div>
            </div>

            <div className="flex items-center gap-2 px-3 py-1 bg-white dark:bg-[#18181b] rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <Grid className="w-4 h-4 text-blue-500" />
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Orig Size</span>
                <span className="text-xs font-bold text-slate-800 dark:text-white font-mono">{file.frameWidth}x{file.frameHeight}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs text-slate-400 animate-pulse">
            <Loader2 className="w-4 h-4 animate-spin" />
            Analyzing GIF metadata...
          </div>
        )}
      </div>

      {/* Main Configuration Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Layout & Dimensions Panel */}
        <div className="lg:col-span-2 flex flex-col gap-6 bg-slate-50/50 dark:bg-[#121214]/50 p-6 rounded-3xl border border-slate-100 dark:border-slate-800/60">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <Grid className="w-4 h-4 text-brand-500" />
              Spritesheet Grid & Dimensions (Aspect Locked)
            </h4>
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-200/50 dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
              {columns} Columns × {rows} Rows
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Total Sheet Dimensions */}
            <div className="flex flex-col gap-4 p-4 bg-white dark:bg-[#18181b] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 border-b border-slate-100 dark:border-slate-800 pb-2 flex items-center justify-between">
                <span>Total Spritesheet Size</span>
                <span className="text-[10px] text-brand-500 font-semibold bg-brand-50 dark:bg-brand-500/10 px-2 py-0.5 rounded border border-brand-200 dark:border-brand-500/20">Synced</span>
              </span>
              <div className="flex items-center gap-3">
                <div className="flex flex-col gap-1 flex-1">
                  <label className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">Width (px)</label>
                  <div className="flex items-center bg-slate-50 dark:bg-[#121214] border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden focus-within:border-brand-500 shadow-inner">
                    <button 
                      type="button" 
                      onClick={() => handleSheetWidthChange(currentSheetWidth - 1)}
                      className="px-2.5 py-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors font-bold select-none"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min="1"
                      value={currentSheetWidth}
                      onChange={(e) => handleSheetWidthChange(Number(e.target.value))}
                      className="w-full bg-transparent px-1 py-1.5 text-xs font-mono font-bold text-slate-800 dark:text-white focus:outline-none text-center [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                    />
                    <button 
                      type="button" 
                      onClick={() => handleSheetWidthChange(currentSheetWidth + 1)}
                      className="px-2.5 py-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors font-bold select-none"
                    >
                      +
                    </button>
                  </div>
                </div>
                <span className="text-slate-400 font-bold pt-5">×</span>
                <div className="flex flex-col gap-1 flex-1">
                  <label className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">Height (px)</label>
                  <div className="flex items-center bg-slate-50 dark:bg-[#121214] border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden focus-within:border-brand-500 shadow-inner">
                    <button 
                      type="button" 
                      onClick={() => handleSheetHeightChange(currentSheetHeight - 1)}
                      className="px-2.5 py-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors font-bold select-none"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min="1"
                      value={currentSheetHeight}
                      onChange={(e) => handleSheetHeightChange(Number(e.target.value))}
                      className="w-full bg-transparent px-1 py-1.5 text-xs font-mono font-bold text-slate-800 dark:text-white focus:outline-none text-center [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                    />
                    <button 
                      type="button" 
                      onClick={() => handleSheetHeightChange(currentSheetHeight + 1)}
                      className="px-2.5 py-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors font-bold select-none"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Individual Frame Dimensions */}
            <div className="flex flex-col gap-4 p-4 bg-white dark:bg-[#18181b] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 border-b border-slate-100 dark:border-slate-800 pb-2 flex items-center justify-between">
                <span>Individual Frame Size</span>
                <span className="text-[10px] text-purple-500 font-semibold bg-purple-50 dark:bg-purple-500/10 px-2 py-0.5 rounded border border-purple-200 dark:border-purple-500/20">Auto-Scaled</span>
              </span>
              <div className="flex items-center gap-3">
                <div className="flex flex-col gap-1 flex-1">
                  <label className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">Frame Width</label>
                  <div className="flex items-center bg-slate-50 dark:bg-[#121214] border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden focus-within:border-purple-500 shadow-inner">
                    <button 
                      type="button" 
                      onClick={() => handleFrameWidthChange(newFrameWidth - 1)}
                      className="px-2.5 py-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors font-bold select-none"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min="1"
                      value={newFrameWidth}
                      onChange={(e) => handleFrameWidthChange(Number(e.target.value))}
                      className="w-full bg-transparent px-1 py-1.5 text-xs font-mono font-bold text-purple-600 dark:text-purple-400 focus:outline-none text-center [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                    />
                    <button 
                      type="button" 
                      onClick={() => handleFrameWidthChange(newFrameWidth + 1)}
                      className="px-2.5 py-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors font-bold select-none"
                    >
                      +
                    </button>
                  </div>
                </div>
                <span className="text-slate-400 font-bold pt-5">×</span>
                <div className="flex flex-col gap-1 flex-1">
                  <label className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">Frame Height</label>
                  <div className="flex items-center bg-slate-50 dark:bg-[#121214] border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden focus-within:border-purple-500 shadow-inner">
                    <button 
                      type="button" 
                      onClick={() => handleFrameHeightChange(newFrameHeight - 1)}
                      className="px-2.5 py-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors font-bold select-none"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min="1"
                      value={newFrameHeight}
                      onChange={(e) => handleFrameHeightChange(Number(e.target.value))}
                      className="w-full bg-transparent px-1 py-1.5 text-xs font-mono font-bold text-purple-600 dark:text-purple-400 focus:outline-none text-center [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                    />
                    <button 
                      type="button" 
                      onClick={() => handleFrameHeightChange(newFrameHeight + 1)}
                      className="px-2.5 py-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors font-bold select-none"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Grid Columns Adjustment */}
          <div className="flex items-center justify-between p-4 bg-white dark:bg-[#18181b] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex flex-col gap-0.5">
              <span className="text-xs font-bold text-slate-800 dark:text-white">Grid Columns Count</span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">Adjust how many frames appear per horizontal row</span>
            </div>
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-[#121214] border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden focus-within:border-brand-500 shadow-inner">
              <button 
                type="button" 
                onClick={() => setColumns(Math.max(1, columns - 1))}
                className="px-3 py-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors font-bold select-none"
              >
                -
              </button>
              <input
                type="number"
                min="1"
                max={file.frameCount || 100}
                value={columns}
                onChange={(e) => setColumns(Math.max(1, Number(e.target.value)))}
                className="w-12 bg-transparent px-1 py-1.5 text-xs font-mono font-bold text-slate-800 dark:text-white focus:outline-none text-center [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              />
              <button 
                type="button" 
                onClick={() => setColumns(Math.min(file.frameCount || 100, columns + 1))}
                className="px-3 py-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors font-bold select-none"
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* Output Settings & Generation Panel */}
        <div className="flex flex-col justify-center gap-4 bg-gradient-to-tr from-purple-50/50 via-transparent to-transparent dark:from-purple-500/5 p-6 rounded-3xl border border-purple-500/20 shadow-sm">
          <div className="flex flex-col gap-1 mb-2 text-center md:text-left">
            <h4 className="text-sm font-bold text-purple-600 dark:text-purple-400 flex items-center gap-2 justify-center md:justify-start">
              <Film className="w-4 h-4" />
              Lossless PNG Export
            </h4>
            <span className="text-xs text-slate-500 dark:text-slate-400">Generates a pristine, uncompressed PNG spritesheet preserving 100% original quality.</span>
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !file.frameCount}
              className="btn-primary py-3.5 text-sm font-bold bg-purple-600 hover:bg-purple-500 active:bg-purple-700 shadow-purple-500/25 justify-center w-full"
            >
              {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
              {isGenerating ? 'Generating Spritesheet...' : 'Generate Spritesheet'}
            </button>

            {result?.outputPath && (
              <button
                onClick={handleDownload}
                className="btn-secondary py-3.5 text-sm font-bold flex items-center justify-center gap-2 bg-emerald-50 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-300 dark:border-emerald-500/30 hover:bg-emerald-100 dark:hover:bg-emerald-500/30 w-full animate-scale-in shadow-sm"
              >
                <Download className="w-4 h-4" />
                Download PNG ({formatSize(result.compressedSize)})
              </button>
            )}

            <button
              onClick={() => onRemove(file.id)}
              className="py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 bg-slate-100 dark:bg-[#27272a] hover:bg-rose-50 dark:hover:bg-rose-500/20 transition-colors flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-800"
            >
              <Trash2 className="w-4 h-4" />
              Remove from Queue
            </button>
          </div>
        </div>
      </div>

      {/* Generated Spritesheet Preview Bar */}
      {result?.outputPath && (
        <div className="flex flex-col gap-3 pt-6 border-t border-slate-100 dark:border-slate-800/80 animate-fade-in">
          <div className="flex items-center justify-between">
            <h5 className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-500" />
              Generated PNG Spritesheet Preview ({result.spritesheetWidth}x{result.spritesheetHeight})
            </h5>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-500/30 font-mono">
              Ready to Download
            </span>
          </div>
          <div className="w-full max-h-64 overflow-auto rounded-2xl bg-slate-100 dark:bg-[#27272a] border border-slate-200 dark:border-slate-800 p-4 flex items-center justify-center shadow-inner">
            <img src={`file://${result.outputPath}`} alt="Spritesheet Preview" className="max-w-full h-auto object-contain rounded-lg shadow" />
          </div>
        </div>
      )}
    </div>
  );
};
