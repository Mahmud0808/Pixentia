import React, { useState } from 'react';
import { X, Folder, Moon, Sun, Save, Check, ShieldCheck } from 'lucide-react';
import type { AppSettings } from '../types';

interface SettingsModalProps {
  settings: AppSettings;
  onClose: () => void;
  onSave: (newSettings: Partial<AppSettings>) => Promise<void>;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ settings, onClose, onSave }) => {
  const [outputDir, setOutputDir] = useState(settings.outputDirectory);
  const [theme, setTheme] = useState(settings.theme);
  const [zipAuto, setZipAuto] = useState(settings.zipAutoDownload);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSelectFolder = async () => {
    try {
      const folder = await (window as any).electronAPI.selectFolder();
      if (folder) {
        setOutputDir(folder);
      }
    } catch (err) {
      console.error('Error selecting folder:', err);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    await onSave({
      outputDirectory: outputDir,
      theme,
      zipAutoDownload: zipAuto,
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white dark:bg-[#18181b] border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-slide-up flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-[#18181b]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-50 dark:bg-brand-500/20 flex items-center justify-center text-brand-600 dark:text-brand-400 border border-brand-200 dark:border-brand-500/30">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-white">Preferences & Storage</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#27272a] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 flex flex-col gap-6 overflow-y-auto max-h-[70vh]">
          {/* Output Directory Setting */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <Folder className="w-4 h-4 text-brand-500" />
              Default Output Directory
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={outputDir}
                className="flex-1 bg-slate-50 dark:bg-[#121214] border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-600 dark:text-slate-400 focus:outline-none truncate"
              />
              <button
                onClick={handleSelectFolder}
                className="btn-secondary flex-shrink-0"
              >
                Change Folder
              </button>
            </div>
            <p className="text-[11px] text-slate-400 dark:text-slate-500">
              All processed WebP files and ZIP archives will be saved here by default.
            </p>
          </div>

          {/* Theme Selection */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
              {theme === 'dark' ? <Moon className="w-4 h-4 text-brand-500" /> : <Sun className="w-4 h-4 text-brand-500" />}
              Appearance Theme
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setTheme('light')}
                className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-sm font-medium transition-all ${
                  theme === 'light'
                    ? 'bg-brand-50 border-brand-500 text-brand-700 shadow-sm shadow-brand-500/10'
                    : 'bg-slate-50 dark:bg-[#121214] border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <Sun className="w-4 h-4 text-amber-500" />
                Light Mode
              </button>

              <button
                onClick={() => setTheme('dark')}
                className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-sm font-medium transition-all ${
                  theme === 'dark'
                    ? 'bg-brand-500/20 border-brand-500 text-brand-300 shadow-sm shadow-brand-500/10'
                    : 'bg-slate-50 dark:bg-[#121214] border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <Moon className="w-4 h-4 text-slate-400" />
                Dark Mode
              </button>
            </div>
          </div>

          {/* ZIP Auto Download Toggle */}
          <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-[#121214] border border-slate-200 dark:border-slate-800 rounded-2xl">
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-semibold text-slate-800 dark:text-white">Auto-ZIP Batch Downloads</span>
              <span className="text-xs text-slate-500 dark:text-slate-400">Automatically bundle multiple compressed images into a single ZIP</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={zipAuto}
                onChange={(e) => setZipAuto(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-brand-600"></div>
            </label>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-[#18181b]">
          <button onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || saved}
            className={`btn-primary ${saved ? 'bg-emerald-600 hover:bg-emerald-600' : ''}`}
          >
            {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {saved ? 'Saved!' : saving ? 'Saving...' : 'Save Preferences'}
          </button>
        </div>
      </div>
    </div>
  );
};
