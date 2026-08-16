import React, { useMemo, useState } from 'react';
import { useAppState } from './state/AppContext';
import { ModuleRegistry } from './core/registry';
import * as Icons from 'lucide-react';

// Dynamic icon viewer matching Lucide icons named in JSON parameters
export const DynamicIcon = ({ name, className }: { name: string; className?: string }) => {
  const IconComponent = (Icons as any)[name] || Icons.Layers;
  return <IconComponent className={className || "w-4 h-4"} />;
};

export default function CoreApp() {
  const {
    imputeAnomalies,
    setImputeAnomalies,
    winsorize,
    setWinsorize,
    selectedModuleRoute,
    setSelectedModuleRoute,
    theme,
    setTheme,
    ficoFilterRange,
    setFicoFilterRange,
    dtiFilterRange,
    setDtiFilterRange,
    activeAccounts,
    summaryStats,
    currentFileName,
    setCurrentFileName,
    activeFileNames,
    importError,
    setImportError,
    importSuccess,
    setImportSuccess,
    importCustomCSV,
    deleteCustomFile,
  } = useAppState();

  const [isLeftCollapsed, setIsLeftCollapsed] = useState(false);
  const [isRightCollapsed, setIsRightCollapsed] = useState(false);

  // Dynamically scan and obtain registered modules from the Registry
  const registeredModules = useMemo(() => {
    return ModuleRegistry.getModules();
  }, []);

  // Find currently active module
  const activeModule = useMemo(() => {
    return registeredModules.find(m => m.route === selectedModuleRoute) || registeredModules[0];
  }, [registeredModules, selectedModuleRoute]);

  const ActiveComponent = activeModule ? activeModule.component : null;

  return (
    <div style={{ backgroundColor: 'var(--fnb-soft-bg)', color: 'var(--fnb-text-dark)' }} className="h-screen w-full flex flex-col font-sans overflow-hidden antialiased">
      
      {/* PROFESSIONAL POLISH TOP HEADER */}
      <header className="h-16 bg-[#0B1F3A] border-b-2 border-[#D4AF37] flex items-center justify-between px-6 shrink-0 shadow-md">
        <div className="flex items-center gap-4">
          {/* Lighter modern expander button with arrow */}
          <button
            type="button"
            onClick={() => setIsLeftCollapsed(!isLeftCollapsed)}
            className="p-1.5 hover:bg-white/10 rounded border border-white/25 text-[#D4AF37] transition cursor-pointer flex items-center justify-center"
            title={isLeftCollapsed ? "Expand Left Sidebar (Modules)" : "Collapse Left Sidebar"}
          >
            {isLeftCollapsed ? <Icons.ChevronRight className="w-4 h-4" /> : <Icons.ChevronLeft className="w-4 h-4" />}
          </button>

          <div className="w-10 h-10 bg-gradient-to-br from-[#D4AF37] to-[#B8962E] rounded-lg flex items-center justify-center font-bold text-white text-xl">F</div>
          <div className="flex flex-col">
            <span className="text-white font-bold tracking-tight text-[15px] md:text-lg">
              FNB DATAQUEST <span className="text-[#D4AF37]">2026</span>
            </span>
            <span className="text-[#4A90E2] text-[10px] uppercase tracking-widest font-semibold">
              Credit Risk System
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-3 md:gap-5">
          {/* THEME SELECTOR PILL */}
          <div className="flex bg-black/30 p-0.5 rounded-full border border-white/10 ring-1 ring-black/5 shrink-0">
            <button
              type="button"
              onClick={() => setTheme('light')}
              className={`px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider transition duration-150 cursor-pointer ${
                theme === 'light'
                  ? 'bg-[#D4AF37] text-white shadow-sm'
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              Light
            </button>
            <button
              type="button"
              onClick={() => setTheme('green')}
              className={`px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider transition duration-150 cursor-pointer ${
                theme === 'green'
                  ? 'bg-[#008B94] text-white shadow-sm'
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              Green
            </button>
            <button
              type="button"
              onClick={() => setTheme('dark')}
              className={`px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider transition duration-150 cursor-pointer ${
                theme === 'dark'
                  ? 'bg-[#D4AF37] text-slate-900 shadow-sm'
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              Dark
            </button>
          </div>

          {/* Right toggle expander button with arrow */}
          <button
            type="button"
            onClick={() => setIsRightCollapsed(!isRightCollapsed)}
            className="p-1.5 hover:bg-white/10 rounded border border-white/25 text-[#D4AF37] transition cursor-pointer flex items-center justify-center"
            title={isRightCollapsed ? "Expand Right Control Panel" : "Collapse Right Control Panel"}
          >
            {isRightCollapsed ? <Icons.ChevronLeft className="w-4 h-4" /> : <Icons.ChevronRight className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* THREE-COLUMN LAYOUT AND CORE CONTROLLER CANVAS */}
      <div className="flex flex-1 overflow-hidden flex-col lg:flex-row">
        
        {/* LEFT COLUMN: Auto-scanned left-side vertical tab navigation panel */}
        <aside 
          style={{ backgroundColor: 'var(--fnb-card-bg)' }} 
          className={`w-full ${isLeftCollapsed ? 'lg:w-0 lg:p-0 lg:border-r-0 lg:overflow-hidden lg:opacity-0' : 'lg:w-[250px] p-5 lg:border-r border-gray-200'} border-b lg:border-b-0 shrink-0 flex flex-col overflow-y-auto shadow-xs transition-all duration-300`}
        >
          <div className="pb-4 border-b border-gray-150">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#0B1F3A]">
              Plugin Modules
            </h3>
            <p className="text-[10px] text-gray-450 mt-0.5">
              Select predictive model module
            </p>
          </div>

          {/* Module navigation list */}
          <nav className="mt-5 space-y-2 flex-1">
            {registeredModules.map((item) => {
              const isSel = selectedModuleRoute === item.route;
              return (
                <button
                  key={item.route}
                  type="button"
                  onClick={() => setSelectedModuleRoute(item.route)}
                  style={{ backgroundColor: isSel ? undefined : 'var(--fnb-soft-bg)' }}
                  className={`w-full flex items-center gap-3.5 p-3 rounded-xl border text-left transition duration-155 cursor-pointer hover:scale-[1.01] transform-gpu ${
                    isSel
                      ? 'bg-[#0B1F3A] border-[#0B1F3A] text-white shadow-md font-semibold'
                      : 'border-gray-200 hover:border-gray-300 text-gray-750 hover:bg-gray-100/60'
                  }`}
                >
                  <span className={`text-base shrink-0 p-2 rounded-lg ${isSel ? 'bg-[#D4AF37] text-white' : 'bg-white text-[#0B1F3A] border border-gray-200 shadow-xs'}`}>
                    <DynamicIcon name={item.metadata.icon} className="w-4.5 h-4.5" />
                  </span>
                  <div className="truncate flex-1">
                    <div className="text-xs font-bold tracking-tight truncate">
                      {item.metadata.name}
                    </div>
                    <div className={`text-[9px] truncate mt-0.5 leading-tight ${isSel ? 'text-[#4A90E2] font-semibold' : 'text-gray-400'}`}>
                      {item.metadata.description}
                    </div>
                  </div>
                </button>
              );
            })}
          </nav>

          {/* Footnote metadata stats block */}
          <div className="mt-6 pt-4 border-t border-gray-150 text-[10px] text-gray-500 space-y-1.5 font-medium">
            <div className="flex items-center justify-between">
              <span>Discovered:</span>
              <span className="font-mono bg-[#0B1F3A]/5 text-[#0B1F3A] px-2 py-0.5 rounded font-bold">
                {registeredModules.length} Modules
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Compliance:</span>
              <span className="text-green-600 font-bold uppercase tracking-tight">SARB Validated</span>
            </div>
          </div>
        </aside>

        {/* CENTER COLUMN: Central visualization canvas area rendering selected modules */}
        <main style={{ backgroundColor: 'var(--fnb-soft-bg)' }} className="flex-1 p-6 md:p-8 flex flex-col gap-6 overflow-y-auto">
          
          {/* Active section title & stats */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-gray-200">
            <div>
              <h2 className="text-2xl font-black text-[#0B1F3A] tracking-tight">
                {activeModule?.metadata.name || "Analytics Console"}
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                {activeModule?.metadata.description || "Active interactive risk assessment session."}
              </p>
            </div>
          </div>

          {/* Dynamic Portfolio Change/Import Alerts */}
          {importSuccess && (
            <div className="bg-green-50 border border-green-200 text-green-800 rounded-xl p-3.5 text-xs flex items-start gap-2.5 shadow-sm animate-fade-in">
              <Icons.CheckCircle className="w-4 h-4 shrink-0 text-green-600 mt-0.5" />
              <div className="flex-1">
                <span className="font-bold block">Portfolio Context Updated Successfully</span>
                <span>{importSuccess}</span>
              </div>
              <button
                type="button"
                onClick={() => setImportSuccess(null)}
                className="text-green-500 hover:text-green-800 font-bold p-0.5 cursor-pointer"
              >
                <Icons.X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {importError && (
            <div className="bg-red-50 border border-red-200 text-red-800 rounded-xl p-3.5 text-xs flex items-start gap-2.5 shadow-sm animate-fade-in">
              <Icons.AlertCircle className="w-4 h-4 shrink-0 text-red-650 mt-0.5" />
              <div className="flex-1">
                <span className="font-bold block">Portfolio Load Aborted</span>
                <span>{importError}</span>
              </div>
              <button
                type="button"
                onClick={() => setImportError(null)}
                className="text-red-500 hover:text-red-850 font-bold p-0.5 cursor-pointer"
              >
                <Icons.X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Selected Component Render Canvas */}
          <div className="flex-1 flex flex-col min-h-0">
            {ActiveComponent ? (
              <ActiveComponent context={summaryStats} />
            ) : (
              <div className="bg-white border rounded-xl p-8 text-center text-gray-400 shadow-sm border-gray-200">
                Select an analytic plugin module to start evaluating risk.
              </div>
            )}
          </div>
        </main>

        {/* RIGHT COLUMN: Controls & Global Preprocessors */}
        <aside 
          style={{ backgroundColor: 'var(--fnb-card-bg)' }} 
          className={`w-full ${isRightCollapsed ? 'lg:w-0 lg:p-0 lg:border-l-0 lg:overflow-hidden lg:opacity-0' : 'lg:w-[260px] p-5 lg:border-l border-gray-200'} border-t lg:border-t-0 flex flex-col gap-6 shrink-0 overflow-y-auto shadow-xs transition-all duration-300`}
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                Active Context File
              </label>
              {!["Credit_Cards_Basel3.csv", "Mortgage_Base_2024.csv", "Consumer_Lending_v2.csv", "Commercial_Risk_Q3.csv"].includes(currentFileName) && (
                <button
                  type="button"
                  onClick={() => deleteCustomFile(currentFileName)}
                  className="text-[9px] text-red-650 hover:text-red-800 font-bold tracking-tight uppercase flex items-center gap-1 cursor-pointer animate-fade-in"
                  title="Remove this uploaded sheet"
                >
                  <Icons.Trash className="w-3 h-3" />
                  Remove
                </button>
              )}
            </div>
            
            <div className="relative">
              <select
                value={currentFileName}
                onChange={(e) => {
                  setCurrentFileName(e.target.value);
                  setImportSuccess(null);
                  setImportError(null);
                }}
                style={{ backgroundColor: 'var(--fnb-soft-bg)', color: 'var(--fnb-text-dark)' }}
                className="w-full border border-gray-200 rounded-md px-3 py-2 text-xs font-semibold outline-none cursor-pointer focus:ring-1 focus:ring-[#D4AF37] transition duration-150"
              >
                {activeFileNames.map(f => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>

            {/* Custom file import button zone */}
            <div className="mt-3">
              <div style={{ backgroundColor: 'var(--fnb-soft-bg)' }} className="relative border border-dashed border-gray-200 hover:border-[#D4AF37]/50 rounded-lg p-3 text-center transition duration-150 cursor-pointer group">
                <input
                  type="file"
                  accept=".csv,.txt"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        const text = event.target?.result as string;
                        importCustomCSV(text, file.name);
                      };
                      reader.readAsText(file);
                    }
                  }}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="flex flex-col items-center justify-center gap-1">
                  <span className="text-xs font-bold text-[#0B1F3A] group-hover:text-[#D4AF37] transition duration-150 flex items-center gap-1.5 justify-center">
                    <Icons.UploadCloud className="w-3.5 h-3.5 text-gray-400 group-hover:text-[#D4AF37]" />
                    Import Risk CSV
                  </span>
                  <span className="text-[9px] text-gray-400 block tracking-tight">
                    Drop CSV here or browse
                  </span>
                </div>
              </div>
              <p className="text-[9px] text-gray-400 mt-1.5 leading-tight">
                Parses headers matching <code className="bg-gray-100 px-1 rounded text-gray-600 font-mono">fico</code>, <code className="bg-gray-100 px-1 rounded text-gray-600 font-mono">dti</code>, <code className="bg-gray-100 px-1 rounded text-gray-600 font-mono">defaulted</code>.
              </p>
            </div>
          </div>

          {/* Section 1: Preprocessing Filters */}
          <div className="space-y-4">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
              Preprocessing Filters
            </label>
            
            <div className="space-y-3 pt-1">
              {/* Impute Anomaly */}
              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={imputeAnomalies}
                  onChange={(e) => setImputeAnomalies(e.target.checked)}
                  className="mt-0.5 w-4.5 h-4.5 text-[#0B1F3A] border-gray-300 rounded focus:ring-0 focus:outline-none cursor-pointer accent-[#D4AF37]"
                />
                <div className="text-xs">
                  <span className="font-semibold text-gray-700 group-hover:text-[#D4AF37] transition duration-155 block">
                    Impute Anomaly Flags (-99)
                  </span>
                  <span className="text-[10px] text-gray-400 block mt-0.5 leading-tight">
                    Replaces corrupt/missing markers with the median (FICO=668, DTI=34.8)
                  </span>
                </div>
              </label>

              {/* Winsorize outliers */}
              <label className="flex items-start gap-3 cursor-pointer group mt-4">
                <input
                  type="checkbox"
                  checked={winsorize}
                  onChange={(e) => setWinsorize(e.target.checked)}
                  className="mt-0.5 w-4.5 h-4.5 text-[#0B1F3A] border-gray-300 rounded focus:ring-0 focus:outline-none cursor-pointer accent-[#D4AF37]"
                />
                <div className="text-xs">
                  <span className="font-semibold text-gray-700 group-hover:text-[#D4AF37] transition duration-155 block">
                    Winsorize Extraneous Outliers
                  </span>
                  <span className="text-[10px] text-gray-400 block mt-0.5 leading-tight">
                    Caps extreme attribute tails at 1st-99th percentile distributions
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* Section 2: Global Dynamic Sliders */}
          <div className="space-y-4 border-t border-gray-100 pt-5">
            <label className="text-[10px] font-bold text-[#a0aec0] uppercase tracking-wider block">
              Segmentation Sliders
            </label>

            {/* FICO Range slider */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold text-gray-700">
                <span>FICO score Filter:</span>
                <span className="font-mono text-[#D4AF37] font-bold">{ficoFilterRange[0]}+</span>
              </div>
              <input
                type="range"
                min="500"
                max="800"
                step="10"
                value={ficoFilterRange[0]}
                onChange={(e) => setFicoFilterRange([Number(e.target.value), ficoFilterRange[1]])}
                className="w-full accent-[#D4AF37] bg-gray-200 h-1.5 rounded-lg cursor-pointer"
              />
              <span className="text-[9px] text-gray-400 block uppercase font-bold text-right tracking-tight">
                Min customer FICO limit
              </span>
            </div>

            {/* DTI Max slider */}
            <div className="space-y-2 mt-4">
              <div className="flex justify-between text-xs font-semibold text-gray-700">
                <span>Max DTI Filter (%):</span>
                <span className="font-mono text-[#D4AF37] font-bold">{dtiFilterRange[1]}%</span>
              </div>
              <input
                type="range"
                min="30"
                max="100"
                step="1"
                value={dtiFilterRange[1]}
                onChange={(e) => setDtiFilterRange([dtiFilterRange[0], Number(e.target.value)])}
                className="w-full accent-[#D4AF37] bg-gray-200 h-1.5 rounded-lg cursor-pointer"
              />
              <span className="text-[9px] text-gray-400 block uppercase font-bold text-right tracking-tight">
                Max leverage cap limit
              </span>
            </div>
          </div>

          {/* Basel III quote */}
          <div className="mt-auto pt-4 shadow-sm">
            <div className="bg-[#0B1F3A]/5 p-3 rounded-lg border border-[#0B1F3A]/10">
              <p className="text-[11px] text-gray-600 italic leading-relaxed font-sans">
                "Interpretability standard: Ensure all visualizations comply with SARB Basel III reporting guidelines."
              </p>
            </div>
          </div>
        </aside>

      </div>

      {/* FOOTER BAR */}
      <footer style={{ backgroundColor: 'var(--fnb-card-bg)' }} className="h-8 border-t border-gray-200 px-6 flex items-center justify-between shrink-0 text-[10px] text-gray-400 font-sans font-medium">
        <div className="flex items-center gap-4">
          <span>First National Bank (FNB) • Underwriter Workstation</span>
        </div>
        <div>
          <span>SARB Basel III Regulated Access</span>
        </div>
      </footer>
    </div>
  );
}
