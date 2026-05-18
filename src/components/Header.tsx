import React from 'react';
import { Sparkles, Moon, Sun, Settings as SettingsIcon, Image, FileCode, Layers, Grid } from 'lucide-react';
import type { ActiveTab, AppSettings } from '../types';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  settings: AppSettings;
  onToggleTheme: () => void;
  onOpenSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  settings,
  onToggleTheme,
  onOpenSettings,
}) => {
  const navItems: { 
    id: ActiveTab; 
    label: string; 
    icon: React.ReactNode; 
    activeClass: string; 
    inactiveClass: string; 
  }[] = [
    { 
      id: 'compressor', 
      label: 'WebP Compressor', 
      icon: <Image className={`w-4 h-4 ${activeTab === 'compressor' ? 'text-white' : 'text-emerald-500 dark:text-emerald-400'}`} />, 
      activeClass: 'bg-emerald-500 dark:bg-emerald-600 text-white shadow-lg shadow-emerald-500/25 border-emerald-600 dark:border-emerald-500', 
      inactiveClass: 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-[#27272a] hover:text-slate-900 dark:hover:text-white' 
    },
    { 
      id: 'base64', 
      label: 'Base64 Converter', 
      icon: <FileCode className={`w-4 h-4 ${activeTab === 'base64' ? 'text-white' : 'text-blue-500 dark:text-blue-400'}`} />, 
      activeClass: 'bg-blue-500 dark:bg-blue-600 text-white shadow-lg shadow-blue-500/25 border-blue-600 dark:border-blue-500', 
      inactiveClass: 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-[#27272a] hover:text-slate-900 dark:hover:text-white' 
    },
    { 
      id: 'combined', 
      label: 'Combined Pipeline', 
      icon: <Layers className={`w-4 h-4 ${activeTab === 'combined' ? 'text-white' : 'text-amber-500 dark:text-amber-400'}`} />, 
      activeClass: 'bg-amber-500 dark:bg-amber-600 text-white shadow-lg shadow-amber-500/25 border-amber-600 dark:border-amber-500', 
      inactiveClass: 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-[#27272a] hover:text-slate-900 dark:hover:text-white' 
    },
    { 
      id: 'spritesheet', 
      label: 'GIF Spritesheet', 
      icon: <Grid className={`w-4 h-4 ${activeTab === 'spritesheet' ? 'text-white' : 'text-purple-500 dark:text-purple-400'}`} />, 
      activeClass: 'bg-purple-500 dark:bg-purple-600 text-white shadow-lg shadow-purple-500/25 border-purple-600 dark:border-purple-500', 
      inactiveClass: 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-[#27272a] hover:text-slate-900 dark:hover:text-white' 
    },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-white/80 dark:bg-[#121214]/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800/80 px-4 md:px-6 py-3.5 flex flex-col xl:flex-row items-center justify-between gap-4">
      {/* Top Bar: Brand Logo & Actions (Mobile/Tablet view) */}
      <div className="flex items-center justify-between w-full xl:w-auto">
        {/* Brand Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-brand-400 flex items-center justify-center text-white shadow-lg shadow-brand-500/25 flex-shrink-0">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              Pixentia
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">Advanced Asset Optimization Studio</p>
          </div>
        </div>

        {/* Actions (Visible on small screens in top bar) */}
        <div className="flex xl:hidden items-center gap-2">
          <button
            onClick={onToggleTheme}
            className="p-2.5 rounded-xl bg-slate-100 dark:bg-[#18181b] hover:bg-slate-200 dark:hover:bg-[#27272a] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors border border-slate-200 dark:border-slate-800/80 shadow-sm"
            title={`Switch to ${settings.theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          >
            {settings.theme === 'dark' ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-700" />}
          </button>

          <button
            onClick={onOpenSettings}
            className="p-2.5 rounded-xl bg-slate-100 dark:bg-[#18181b] hover:bg-slate-200 dark:hover:bg-[#27272a] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors border border-slate-200 dark:border-slate-800/80 shadow-sm"
            title="Settings"
          >
            <SettingsIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <nav className="flex flex-wrap items-center justify-center gap-1.5 bg-slate-100 dark:bg-[#18181b] p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800/80 w-full xl:w-auto shadow-inner">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 border ${
                isActive
                  ? item.activeClass
                  : `border-transparent ${item.inactiveClass}`
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Actions (Desktop right side) */}
      <div className="hidden xl:flex items-center gap-2">
        <button
          onClick={onToggleTheme}
          className="p-2.5 rounded-xl bg-slate-100 dark:bg-[#18181b] hover:bg-slate-200 dark:hover:bg-[#27272a] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors border border-slate-200 dark:border-slate-800/80 shadow-sm"
          title={`Switch to ${settings.theme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          {settings.theme === 'dark' ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-700" />}
        </button>

        <button
          onClick={onOpenSettings}
          className="p-2.5 rounded-xl bg-slate-100 dark:bg-[#18181b] hover:bg-slate-200 dark:hover:bg-[#27272a] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors border border-slate-200 dark:border-slate-800/80 shadow-sm"
          title="Settings"
        >
          <SettingsIcon className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
};
