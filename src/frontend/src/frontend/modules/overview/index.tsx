import React from 'react';
import { useAppState } from '../../state/AppContext';
import { ShieldCheck, Users, Percent, Award, Info, AlertTriangle, BookOpen, Layers } from 'lucide-react';

export const MODULE = {
  name: "Overview",
  icon: "Layers",
  description: "Executive landing console showing portfolio baseline, project milestones and why credit-risk explainability is crucial.",
  route: "/overview"
};

export default function OverviewModule() {
  const { activeAccounts, summaryStats, currentFileName } = useAppState();

  // Dynamic calculations based on active dataset
  const totalBorrowers = activeAccounts.length;
  const defaultedCount = activeAccounts.filter(a => a.defaulted === 1).length;
  const defaultRateVal = totalBorrowers > 0 ? (defaultedCount / totalBorrowers) * 100 : 0;
  
  // Averages
  const validFicos = activeAccounts.filter(a => a.fico !== -99);
  const avgFico = validFicos.length > 0 
    ? Math.round(validFicos.reduce((s, a) => s + a.fico, 0) / validFicos.length) 
    : 668;

  const avgIncome = activeAccounts.length > 0 
    ? Math.round(activeAccounts.reduce((s, a) => s + a.income, 0) / activeAccounts.length) 
    : 85;

  return (
    <div className="space-y-6 animate-fade-in text-[var(--fnb-text-gray)]">
      {/* HEADER BANNER */}
      <div className="bg-gradient-to-r from-[var(--primary)] to-[#0f345c] text-white p-6 md:p-8 rounded-2xl border border-[var(--fnb-border)] shadow-md relative overflow-hidden">
        {/* Background accent block simulating Acacia logo */}
        <div className="absolute right-4 bottom-4 opacity-5 pointer-events-none">
          <Award className="w-64 h-64" />
        </div>
        
        <div className="max-w-3xl relative z-10">
          <div className="flex items-center gap-2 text-[var(--accent)] font-bold text-xs uppercase tracking-wider mb-2">
            <ShieldCheck className="w-4 h-4" />
            First National Bank Credit Modelling Lab
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
            FNB DataQuest 2026 Analytics Platform
          </h1>
          <p className="mt-2 text-xs md:text-sm text-gray-200 leading-relaxed">
            Welcome to the sovereign credit risk assessment workstation. This system automates compliance auditing, 
            interpretable scoring, and portfolio risk simulation according to South African Reserve Bank (SARB) 
            regulatory benchmarks under Basel III.
          </p>
        </div>
      </div>

      {/* CORE SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Borrowers */}
        <div className="bg-white border border-[var(--fnb-border)] p-5 rounded-xl shadow-xs hover:shadow-sm transition flex gap-4 items-center">
          <div className="p-3 rounded-lg bg-[var(--primary)]/10 text-[var(--primary)] shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-semibold text-gray-400 block tracking-wider">Active Borrowers</span>
            <span className="text-xl font-bold text-[var(--fnb-text-dark)]">{totalBorrowers.toLocaleString()}</span>
            <span className="text-[9px] text-gray-400 block mt-0.5">Scanned from dataset</span>
          </div>
        </div>

        {/* Default Rate */}
        <div className="bg-white border border-[var(--fnb-border)] p-5 rounded-xl shadow-xs hover:shadow-sm transition flex gap-4 items-center">
          <div className="p-3 rounded-lg bg-red-100 text-red-650 shrink-0">
            <Percent className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-semibold text-gray-400 block tracking-wider">Default Rate (Bad)</span>
            <span className="text-xl font-bold text-red-600">{defaultRateVal.toFixed(2)}%</span>
            <span className="text-[9px] text-gray-400 block mt-0.5">{defaultedCount} Defaulted Accounts</span>
          </div>
        </div>

        {/* Avg FICO */}
        <div className="bg-white border border-[var(--fnb-border)] p-5 rounded-xl shadow-xs hover:shadow-sm transition flex gap-4 items-center">
          <div className="p-3 rounded-lg bg-[var(--accent)]/10 text-[var(--accent)] shrink-0">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-semibold text-gray-400 block tracking-wider">Avg FICO Score</span>
            <span className="text-xl font-bold text-[var(--fnb-text-dark)]">{avgFico}</span>
            <span className="text-[9px] text-gray-400 block mt-0.5">Rating range: 500 - 850</span>
          </div>
        </div>

        {/* Avg Income */}
        <div className="bg-white border border-[var(--fnb-border)] p-5 rounded-xl shadow-xs hover:shadow-sm transition flex gap-4 items-center">
          <div className="p-3 rounded-lg bg-green-100 text-green-700 shrink-0">
            <span className="font-bold text-sm">ZAR</span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-semibold text-gray-400 block tracking-wider">Avg Annual Income</span>
            <span className="text-xl font-bold text-[var(--fnb-text-dark)]">R{avgIncome},000</span>
            <span className="text-[9px] text-gray-400 block mt-0.5">Financial capacity median</span>
          </div>
        </div>
      </div>

      {/* TWO-COLUMN DETAIL GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* PROJECT NARRATIVE FLOW */}
        <div className="bg-white border border-[var(--fnb-border)] p-6 rounded-xl shadow-xs space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--primary)] flex items-center gap-2 border-b pb-3 border-gray-100">
            <BookOpen className="w-4 h-4 text-[var(--accent)]" />
            Professional Modelling Journey
          </h2>
          <p className="text-xs text-gray-500 leading-normal">
            This workspace implements an end-to-end audit track that demonstrates professional discipline and transparent feature transformations:
          </p>
          
          <div className="space-y-3.5 pt-1">
            <div className="flex gap-3">
              <span className="w-5 h-5 bg-[var(--primary)]/5 text-[var(--primary)] text-[10px] font-extrabold flex items-center justify-center rounded-full shrink-0 mt-0.5">1</span>
              <div>
                <strong className="text-xs text-[var(--fnb-text-dark)] block">Exploratory Data & Quality (Tabs 3, 4, 5)</strong>
                <span className="text-[11px] text-gray-400">Scan for missing information levels, duplicates, and check univariate/bivariate correlations.</span>
              </div>
            </div>
            
            <div className="flex gap-3">
              <span className="w-5 h-5 bg-[var(--primary)]/5 text-[var(--primary)] text-[10px] font-extrabold flex items-center justify-center rounded-full shrink-0 mt-0.5">2</span>
              <div>
                <strong className="text-xs text-[var(--fnb-text-dark)] block">Feature Transformation & WoE (Tabs 6, 7)</strong>
                <span className="text-[11px] text-gray-400">Perform monotonic binning on non-linear predictors, assess Information Value (IV), and cap outliers.</span>
              </div>
            </div>

            <div className="flex gap-3">
              <span className="w-5 h-5 bg-[var(--primary)]/5 text-[var(--primary)] text-[10px] font-extrabold flex items-center justify-center rounded-full shrink-0 mt-0.5">3</span>
              <div>
                <strong className="text-xs text-[var(--fnb-text-dark)] block">Interpretive Model Alignment (Tabs 8, 9, 10)</strong>
                <span className="text-[11px] text-gray-400">Validate transparent LogOdds regressions, contrast with non-linear Trees, and slide evaluation thresholds.</span>
              </div>
            </div>

            <div className="flex gap-3">
              <span className="w-5 h-5 bg-[var(--primary)]/5 text-[var(--primary)] text-[10px] font-extrabold flex items-center justify-center rounded-full shrink-0 mt-0.5">4</span>
              <div>
                <strong className="text-xs text-[var(--fnb-text-dark)] block">Business Implementation & Simulator (Tabs 11, 12, 13)</strong>
                <span className="text-[11px] text-gray-400">Map models directly to scorecard points, run real-time stress testing, and reflect on AI co-pilot collaborations.</span>
              </div>
            </div>
          </div>
        </div>

        {/* WHY INTERPRETABILITY MATTERS */}
        <div className="bg-white border border-[var(--fnb-border)] p-6 rounded-xl shadow-xs space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--primary)] flex items-center gap-2 border-b pb-3 border-gray-100">
              <Info className="w-4 h-4 text-[var(--accent)]" />
              Regulatory Governance & Basel Accord
            </h2>
            <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-lg text-xs space-y-1.5 leading-relaxed">
              <div className="flex items-center gap-1.5 font-bold">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                The Transparency Mandate
              </div>
              <p className="text-[11px] text-amber-800">
                Lending institutions suffer stringent audit obligations under <strong>Basel compliance</strong>. 
                Deep-learning "blackbox" models (e.g. XGBoost, Multi-layered Neural Networks) are generally prohibited for 
                sovereign retail credit decisions because they cannot generate a direct, legally explainable "Right to Refusal" 
                statement to consumers or risk regulators.
              </p>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">
              Because of this, <strong>Logistic Regression</strong> remains the global banking-grade standard. 
              By mapping log-odds linear equations to an additive scorecard system, every final score can be traced down to 
              exact feature bins (FICO tier, capped DTI leverage, employment longevity). This ensures decisions are 
              <strong> explainable, reproducible, and highly auditable.</strong>
            </p>
          </div>

          <div className="pt-4 border-t border-gray-100 text-[10px] text-gray-450 flex items-center gap-2 font-mono">
            <span>CURRENT FILE:</span>
            <span className="font-bold text-[var(--primary)] bg-[var(--primary)]/5 px-2 py-0.5 rounded">
              {currentFileName}
            </span>
          </div>
        </div>

      </div>

      {/* QUICK FOOTER BUSINESS INSIGHT */}
      <div className="p-4 rounded-xl border border-dashed border-[var(--fnb-border)] bg-[var(--primary)]/5 text-[11px] text-gray-500 flex items-center gap-2.5">
        <span className="inline-block bg-[var(--primary)] text-white font-mono font-bold px-2 py-0.5 rounded text-[9px]">SARB-M</span>
        <span>
          <strong>Basel Model Governance compliance:</strong> System parameters are locked for active portfolio evaluation. Switch files or parameters on the left pane to instantly recalibrate all tabs.
        </span>
      </div>
    </div>
  );
}
