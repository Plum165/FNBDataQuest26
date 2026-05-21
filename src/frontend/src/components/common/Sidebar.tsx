import React from 'react';
import { BarChart3, LineChart, ShieldAlert, Moon, Sun, Menu, X } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  darkMode: boolean;
  toggleDarkMode: () => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  darkMode,
  toggleDarkMode,
  mobileOpen,
  setMobileOpen
}) => {
  const navItems = [
    { id: 'eda-univariate', name: 'Univariate Explorer', icon: BarChart3 },
    { id: 'eda-bivariate', name: 'Bivariate & Quality', icon: ShieldAlert },
    { id: 'dashboard', name: 'Business Strategy', icon: LineChart },
  ];

  const handleNavClick = (id: string) => {
    setActiveTab(id);
    setMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-4 z-50">
        <div className="flex items-center gap-2">
          <ShieldAlert className="h-6 w-6 text-brand-500" />
          <span className="font-bold text-lg tracking-tight">DataQuest 2026</span>
        </div>
        <button 
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 text-slate-600 dark:text-slate-300"
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar Container */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 
        transform transition-transform duration-300 ease-in-out flex flex-col justify-between
        lg:translate-x-0 lg:static lg:h-screen
        ${mobileOpen ? 'translate-x-0 pt-16 lg:pt-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="px-6 py-6 hidden lg:flex items-center gap-2.5 border-b border-slate-100 dark:border-slate-700/50">
          <ShieldAlert className="h-7 w-7 text-brand-500" />
          <div>
            <h1 className="font-bold text-lg leading-tight">DataQuest 2026</h1>
            <p className="text-xs text-slate-400">Credit Risk Engine</p>
          </div>
        </div>

        {/* Navigation links */}
        <nav className="flex-1 px-4 py-6 space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                  isActive 
                    ? 'bg-brand-500 text-white shadow-md shadow-brand-500/10' 
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                <Icon size={18} />
                {item.name}
              </button>
            );
          })}
        </nav>

        {/* System Settings & Utilities Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-700/50 space-y-2">
          <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-2.5 text-[11px] text-slate-400 space-y-1">
            <p>🎯 Baseline GLM AUC: <span className="font-mono text-slate-600 dark:text-slate-200">0.68</span></p>
            <p>🛑 Ceiling LightGBM AUC: <span className="font-mono text-slate-600 dark:text-slate-200">0.82</span></p>
          </div>
          <button
            onClick={toggleDarkMode}
            className="w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-all"
          >
            <span className="flex items-center gap-2">
              {darkMode ? <Sun size={14} /> : <Moon size={14} />}
              {darkMode ? 'Light Framework' : 'Dark Framework'}
            </span>
            <span className="text-[10px] uppercase tracking-wider bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded text-slate-500 dark:text-slate-300">
              Ctrl + D
            </span>
          </button>
        </div>
      </aside>

      {/* Overlay background for mobile layout */}
      {mobileOpen && (
        <div 
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-30 lg:hidden"
        />
      )}
    </>
  );
};