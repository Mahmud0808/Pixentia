import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { CompressorView } from './components/CompressorView';
import { Base64View } from './components/Base64View';
import { CombinedView } from './components/CombinedView';
import { SpritesheetView } from './components/SpritesheetView';
import { SettingsModal } from './components/SettingsModal';
import { Check, AlertCircle } from 'lucide-react';
import type { ActiveTab, AppSettings, QueuedFile } from './types';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('compressor');
  const [settings, setSettings] = useState<AppSettings>({
    compressionQuality: 80,
    outputDirectory: '',
    theme: 'dark',
    zipAutoDownload: false,
    base64RemoveQualifier: false,
    base64CustomFormat: '$base64',
    base64CopyAll: false,
  });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 3000);
  }, []);

  // Independent queues for each tool
  const [compressorFiles, setCompressorFiles] = useState<QueuedFile[]>([]);
  const [base64Files, setBase64Files] = useState<QueuedFile[]>([]);
  const [combinedFiles, setCombinedFiles] = useState<QueuedFile[]>([]);
  const [spritesheetFiles, setSpritesheetFiles] = useState<QueuedFile[]>([]);

  // Load initial settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const data = await (window as any).electronAPI.getSettings();
        if (data) {
          setSettings(data);
          if (data.theme === 'dark') {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
        }
      } catch (err) {
        console.error('Failed to load settings:', err);
      }
    };
    loadSettings();
  }, []);

  // Update settings helper
  const handleUpdateSettings = async (newSettings: Partial<AppSettings>) => {
    try {
      const result = await (window as any).electronAPI.saveSettings(newSettings);
      if (result.success && result.settings) {
        setSettings(result.settings);
        if (result.settings.theme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
    } catch (err) {
      console.error('Failed to save settings:', err);
    }
  };

  const handleToggleTheme = async () => {
    const newTheme = settings.theme === 'dark' ? 'light' : 'dark';
    await handleUpdateSettings({ theme: newTheme });
  };

  // Helper to add files to active tab queue without duplicates
  const handleFilesSelected = useCallback(
    async (filePaths: string[]) => {
      try {
        const newMeta: QueuedFile[] = await (window as any).electronAPI.getFileMetadata(filePaths);

        const filterDuplicates = (existing: QueuedFile[], incoming: QueuedFile[]) => {
          const existingPaths = new Set(existing.map((f) => f.filePath));
          return incoming.filter((f) => !existingPaths.has(f.filePath));
        };

        if (activeTab === 'compressor') {
          setCompressorFiles((prev) => [...prev, ...filterDuplicates(prev, newMeta)]);
        } else if (activeTab === 'base64') {
          setBase64Files((prev) => [...prev, ...filterDuplicates(prev, newMeta)]);
        } else if (activeTab === 'combined') {
          setCombinedFiles((prev) => [...prev, ...filterDuplicates(prev, newMeta)]);
        } else if (activeTab === 'spritesheet') {
          setSpritesheetFiles((prev) => [...prev, ...filterDuplicates(prev, newMeta)]);
        }
      } catch (err) {
        console.error('Error fetching file metadata:', err);
      }
    },
    [activeTab]
  );

  // Global drag and drop support across the entire window
  useEffect(() => {
    const handleWindowDragOver = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };

    const handleWindowDrop = async (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (e.dataTransfer?.files) {
        const files = Array.from(e.dataTransfer.files);
        const filePaths: string[] = [];
        for (const file of files) {
          const filePath = (window as any).electronAPI.getPathForFile(file) || (file as any).path;
          if (filePath) {
            filePaths.push(filePath);
          }
        }
        if (filePaths.length > 0) {
          handleFilesSelected(filePaths);
        }
      }
    };

    window.addEventListener('dragenter', handleWindowDragOver);
    window.addEventListener('dragover', handleWindowDragOver);
    window.addEventListener('drop', handleWindowDrop);

    return () => {
      window.removeEventListener('dragenter', handleWindowDragOver);
      window.removeEventListener('dragover', handleWindowDragOver);
      window.removeEventListener('drop', handleWindowDrop);
    };
  }, [handleFilesSelected]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#121214] text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {/* Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        settings={settings}
        onToggleTheme={handleToggleTheme}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-6 py-8 flex flex-col">
        {activeTab === 'compressor' && (
          <CompressorView
            files={compressorFiles}
            setFiles={setCompressorFiles}
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
            onFilesSelected={handleFilesSelected}
            onClearQueue={() => setCompressorFiles([])}
            onRemoveFile={(id) => setCompressorFiles((prev) => prev.filter((f) => f.id !== id))}
            onShowToast={showToast}
          />
        )}

        {activeTab === 'base64' && (
          <Base64View
            files={base64Files}
            setFiles={setBase64Files}
            onFilesSelected={handleFilesSelected}
            onClearQueue={() => setBase64Files([])}
            onRemoveFile={(id) => setBase64Files((prev) => prev.filter((f) => f.id !== id))}
            onShowToast={showToast}
            settings={settings}
          />
        )}

        {activeTab === 'combined' && (
          <CombinedView
            files={combinedFiles}
            setFiles={setCombinedFiles}
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
            onFilesSelected={handleFilesSelected}
            onClearQueue={() => setCombinedFiles([])}
            onRemoveFile={(id) => setCombinedFiles((prev) => prev.filter((f) => f.id !== id))}
            onShowToast={showToast}
          />
        )}

        {activeTab === 'spritesheet' && (
          <SpritesheetView
            files={spritesheetFiles}
            setFiles={setSpritesheetFiles}
            onFilesSelected={handleFilesSelected}
            onClearQueue={() => setSpritesheetFiles([])}
            onRemoveFile={(id) => setSpritesheetFiles((prev) => prev.filter((f) => f.id !== id))}
            onShowToast={showToast}
            settings={settings}
          />
        )}
      </main>

      {/* Settings Modal */}
      {isSettingsOpen && (
        <SettingsModal
          settings={settings}
          onClose={() => setIsSettingsOpen(false)}
          onSave={handleUpdateSettings}
        />
      )}

      {/* Modern Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-2xl backdrop-blur-lg border border-white/10 dark:border-slate-900/10 animate-slide-up transition-all duration-300 group">
          {toast.type === 'success' ? (
            <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 dark:bg-emerald-500/20 dark:text-emerald-600 flex items-center justify-center flex-shrink-0">
              <Check className="w-4 h-4" />
            </div>
          ) : (
            <div className="w-6 h-6 rounded-full bg-rose-500/20 text-rose-400 dark:bg-rose-500/20 dark:text-rose-600 flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-4 h-4" />
            </div>
          )}
          <span className="text-xs font-semibold tracking-wide pr-2">{toast.message}</span>
          <button 
            onClick={() => setToast(null)}
            className="text-[10px] text-slate-400 dark:text-slate-500 hover:text-white dark:hover:text-slate-900 transition-colors ml-1"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
};

export default App;
