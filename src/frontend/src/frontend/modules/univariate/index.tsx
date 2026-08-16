import React, { useState, useMemo } from 'react';
import { useAppState } from '../../state/AppContext';
import { calculateWoEAndIV, interpretIV } from '../../utils/dataset';
import { 
  AlertCircle, 
  HelpCircle, 
  Info, 
  TrendingUp, 
  CheckCircle2, 
  BookOpen, 
  Award, 
  Calculator, 
  ArrowRight,
  ChevronRight,
  Sparkles
} from 'lucide-react';

export const MODULE = {
  name: "Univariate Analysis",
  icon: "BarChart3",
  description: "Explore individual credit risk variables, missing counts, and bin weight-of-evidence (WoE).",
  route: "/univariate"
};

type FeatureKey = 'fico' | 'dti' | 'income' | 'employmentLength';

// Presets for the formula desk Math Sandbox
const SANDBOX_PRESETS = [
  {
    label: "Annual Income Sample (k ZAR)",
    values: "85, 120, 45, 340, 95, 60, 50, 110, 500, 75",
    description: "Highly right-skewed revenue distribution (representing power-law shape)."
  },
  {
    label: "Credit Bureau standing (FICO)",
    values: "710, 680, 590, 640, 780, 690, 720, 650, 670, 700",
    description: "Symmetric and balanced credit rating scores (low skewness / near normal)."
  },
  {
    label: "Borrower Employment Tenure (Yrs)",
    values: "2, 5, 1, 8, 12, 3, 4, 15, 6, 2",
    description: "Established tenure ratios (heavy-tailed leptokurtic behavior)."
  }
];

export default function UnivariateModule({ context }: { context: any }) {
  const { activeAccounts, imputeAnomalies } = useAppState();
  const [activeTab, setActiveTab] = useState<'analyzer' | 'formulas' | 'fnb_notes'>('analyzer');
  const [selectedFeature, setSelectedFeature] = useState<FeatureKey>('fico');

  // Sandbox inputs
  const [sandboxInput, setSandboxInput] = useState<string>(SANDBOX_PRESETS[0].values);

  const featureOptions: { label: string; key: FeatureKey; unit: string; description: string }[] = [
    { label: "FICO Score", key: "fico", unit: "points", description: "Customer Bureau standing. Reflects default historical risk profiles." },
    { label: "Debt-To-Income (DTI)", key: "dti", unit: "%", description: "Ratio of customer monthly debt payments to total revenue." },
    { label: "Annual Income", key: "income", unit: "k ZAR", description: "Customer self-reported or bank-verified yearly revenue capacity." },
    { label: "Employment Length", key: "employmentLength", unit: "years", description: "Stability measurement of borrower employment tenure." }
  ];

  // Define Bins for each variable of the univariate model
  const binsConfig = useMemo(() => {
    return {
      fico: [
        { label: "Poor (< 580)", min: 0, max: 580 },
        { label: "Fair (580 - 640)", min: 580, max: 640 },
        { label: "Good (640 - 700)", min: 640, max: 700 },
        { label: "Very Good (700 - 760)", min: 700, max: 760 },
        { label: "Excellent (>= 760)", min: 760, max: 999 }
      ],
      dti: [
        { label: "Low (< 20%)", min: 0, max: 20 },
        { label: "Moderate (20% - 35%)", min: 20, max: 35 },
        { label: "Considered (35% - 50%)", min: 35, max: 50 },
        { label: "Elevated (50% - 65%)", min: 50, max: 65 },
        { label: "Extreme (>= 65%)", min: 65, max: 150 }
      ],
      income: [
        { label: "Low (< 50k)", min: 0, max: 50 },
        { label: "Moderate (50k - 80k)", min: 50, max: 80 },
        { label: "Upper Middle (80k - 120k)", min: 80, max: 120 },
        { label: "High (>= 120k)", min: 120, max: 9999 }
      ],
      employmentLength: [
        { label: "New (< 2 yrs)", min: 0, max: 2 },
        { label: "Standard (2 - 5 yrs)", min: 2, max: 5 },
        { label: "Established (5 - 10 yrs)", min: 5, max: 10 },
        { label: "Senior tenure (>= 10 yrs)", min: 10, max: 99 }
      ]
    };
  }, []);

  // Compute stats
  const woeResults = useMemo(() => {
    const bins = binsConfig[selectedFeature];
    return calculateWoEAndIV(activeAccounts, selectedFeature, bins);
  }, [activeAccounts, selectedFeature, binsConfig]);

  // Handle anomalies stats and report
  const anomalyStats = useMemo(() => {
    const anomaliesCount = activeAccounts.filter((x) => x[selectedFeature] === -99).length;
    const totalCount = activeAccounts.length;
    const anomalyPercent = totalCount > 0 ? (anomaliesCount / totalCount) * 100 : 0;
    return { count: anomaliesCount, percentage: anomalyPercent };
  }, [activeAccounts, selectedFeature]);

  const ivInterpretation = useMemo(() => {
    return interpretIV(woeResults.totalIV);
  }, [woeResults.totalIV]);

  const maxBinCount = useMemo(() => {
    if (woeResults.bins.length === 0) return 1;
    return Math.max(...woeResults.bins.map(b => b.count), 1);
  }, [woeResults.bins]);

  // Sandboxed mathematical statistics calculations
  const parsedSandboxNumbers = useMemo(() => {
    return sandboxInput
      .split(',')
      .map(v => parseFloat(v.trim()))
      .filter(v => !isNaN(v));
  }, [sandboxInput]);

  const sandboxStats = useMemo(() => {
    const nums = parsedSandboxNumbers;
    const n = nums.length;
    if (n === 0) {
      return { n: 0, sum: 0, mean: 0, variance: 0, stdDev: 0, skewness: 0, kurtosis: 0, isValid: false, sorted: [] };
    }
    const sum = nums.reduce((a, b) => a + b, 0);
    const mean = sum / n;
    
    if (n < 2) {
      return { n, sum, mean, variance: 0, stdDev: 0, skewness: 0, kurtosis: 0, isValid: true, sorted: [...nums].sort((a,b)=>a-b) };
    }

    const devSqSum = nums.reduce((s, v) => s + Math.pow(v - mean, 2), 0);
    const variance = devSqSum / (n - 1);
    const stdDev = Math.sqrt(variance);

    let skewness = 0;
    let kurtosis = 0;

    if (stdDev > 0) {
      const m3 = nums.reduce((s, v) => s + Math.pow((v - mean) / stdDev, 3), 0);
      const m4 = nums.reduce((s, v) => s + Math.pow((v - mean) / stdDev, 4), 0);

      // Fisher's moment coefficient of skewness
      if (n > 2) {
        skewness = (n / ((n - 1) * (n - 2))) * m3;
      } else {
        skewness = m3 / n;
      }

      // Excess Kurtosis (g2)
      if (n > 3) {
        const coeff = (n * (n + 1)) / ((n - 1) * (n - 2) * (n - 3));
        const biasCorrection = (3 * Math.pow(n - 1, 2)) / ((n - 2) * (n - 3));
        kurtosis = coeff * m4 - biasCorrection;
      } else {
        kurtosis = (m4 / n) - 3;
      }
    }

    return {
      n,
      sum,
      mean,
      variance,
      stdDev,
      skewness,
      kurtosis,
      isValid: true,
      sorted: [...nums].sort((a,b) => a-b)
    };
  }, [parsedSandboxNumbers]);

  return (
    <div className="space-y-6">

      {/* BRAINED HEADER WITH TABS CONTROLS */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1 px-2.5 bg-[#0B1F3A] text-[#D4AF37] font-sans font-black rounded text-[10px] tracking-wider uppercase">
                Univariate Lab
              </span>
              <h2 className="text-xl font-bold text-[#0B1F3A] tracking-tight">
                Univariate Metrics & Distribution Profiling
              </h2>
            </div>
            <p className="text-xs text-gray-500 max-w-2xl leading-relaxed">
              Analyze statistical parameters on solitary risk variables. Assess normality skewness, outlier deviation fences, and calibrate Weight of Evidence (WoE) parameters.
            </p>
          </div>

          <div className="flex flex-wrap gap-1 bg-gray-50 border p-1 rounded-lg shrink-0">
            <button
              onClick={() => setActiveTab('analyzer')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition cursor-pointer ${activeTab === 'analyzer' ? 'bg-[#0B1F3A] text-white shadow-sm' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100/50'}`}
            >
              Frequency Analyzer
            </button>
            <button
              onClick={() => setActiveTab('formulas')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition cursor-pointer ${activeTab === 'formulas' ? 'bg-[#0B1F3A] text-white shadow-sm' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100/50'}`}
            >
              Interactive Formula Desk
            </button>
            <button
              onClick={() => setActiveTab('fnb_notes')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition cursor-pointer ${activeTab === 'fnb_notes' ? 'bg-[#0B1F3A] text-white shadow-sm' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100/50'}`}
            >
              FNB Research Notes
            </button>
          </div>
        </div>
      </div>

      {/* --- TAB 1: INTERACTIVE DISTRIBUTION & WoE CALIBRATION --- */}
      {activeTab === 'analyzer' && (
        <div className="space-y-6">
          
          {/* Quick Stats Panel */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#0B1F3A]">
                Primary Target Attribute Selector
              </h3>
              <p className="text-[10px] text-gray-400 mt-0.5">Toggle variables to recompute binned separations and Information Values</p>
            </div>

            {/* Feature quick tabs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
              {featureOptions.map((feat) => (
                <button
                  key={feat.key}
                  onClick={() => setSelectedFeature(feat.key)}
                  className={`text-left p-3.5 rounded-xl border transition-all duration-200 cursor-pointer ${
                    selectedFeature === feat.key
                      ? 'bg-[#0B1F3A] border-[#0B1F3A] text-white shadow-md'
                      : 'bg-gray-50 border-gray-200 hover:border-gray-300 text-gray-700'
                  }`}
                >
                  <div className="text-xs font-bold uppercase tracking-wide opacity-90 flex items-center justify-between">
                    <span>{feat.label}</span>
                    {selectedFeature === feat.key && <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />}
                  </div>
                  <div className="text-[10px] mt-1 opacity-75 truncate leading-tight">
                    {feat.description}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Histogram Bars Box */}
            <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <h3 className="text-xs font-bold uppercase text-[#0B1F3A] tracking-wider">
                  Distribution Density: Good vs Bad Accounts
                </h3>
                <span className="text-[10px] text-gray-400 font-mono font-medium">
                  Unit: <span className="font-bold text-gray-750">{featureOptions.find(f => f.key === selectedFeature)?.unit}</span>
                </span>
              </div>

              {/* Statistical Bars */}
              <div className="space-y-6 pt-2">
                {woeResults.bins.map((bin, index) => {
                  const pctOfMax = (bin.count / maxBinCount) * 100;
                  const defaultPrc = bin.count > 0 ? (bin.badCount / bin.count) * 100 : 0;
                  
                  const goodPct = bin.count > 0 ? (bin.goodCount / bin.count) * 100 : 0;
                  const badPct = bin.count > 0 ? (bin.badCount / bin.count) * 100 : 0;
                  
                  return (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-800 font-bold">{bin.binLabel}</span>
                        <span className="text-[10px] text-gray-400 font-mono leading-none">
                          <span className="text-gray-700 font-extrabold">{bin.count}</span> accounts ({Math.round(bin.count / (activeAccounts.length || 1) * 100)}% density)
                        </span>
                      </div>
                      
                      {/* Segment Bar */}
                      <div className="flex items-center gap-4">
                        <div className="flex-1 bg-gray-100/80 h-7 rounded-lg overflow-hidden flex relative border shadow-inner">
                          {/* Good Portion (Navy Blueish) */}
                          {bin.goodCount > 0 && (
                            <div 
                              style={{ width: `${goodPct * (pctOfMax / 100)}%` }} 
                              className="bg-[#0B1F3A] h-full transition-all duration-500 relative group"
                              title={`Solvent (y=0): ${bin.goodCount}`}
                            />
                          )}
                          {/* Bad Portion (Reddish Accent) */}
                          {bin.badCount > 0 && (
                            <div 
                              style={{ width: `${badPct * (pctOfMax / 100)}%` }} 
                              className="bg-red-500 h-full transition-all duration-500"
                              title={`Defaulted (y=1): ${bin.badCount}`}
                            />
                          )}
                        </div>
                        {/* Default Rate badge */}
                        <div className="w-20 text-right shrink-0">
                          <span className={`inline-block py-1 px-2.5 rounded font-mono text-[10px] font-black text-center min-w-[65px] border ${
                            defaultPrc > 30 
                              ? 'bg-red-50 text-red-650 border-red-200' 
                              : defaultPrc > 15 
                              ? 'bg-amber-50 text-amber-600 border-amber-200' 
                              : 'bg-green-50 text-green-750 border-green-200'
                          }`}>
                            {defaultPrc.toFixed(1)}% def
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Legend Block */}
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center pt-4 border-t border-gray-100 text-xs">
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 bg-[#0B1F3A] rounded border" />
                    <span className="text-gray-500 font-medium">Solvent / Goods (y=0)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 bg-red-500 rounded border" />
                    <span className="text-gray-500 font-medium font-paragraph">Defaulted / Bads (y=1)</span>
                  </div>
                </div>
                <div className="text-[10px] text-gray-450 flex items-center gap-1 sm:ml-auto">
                  <Info className="w-3.5 h-3.5 shrink-0" /> Horizontal bar lengths reflect segment-relative population density
                </div>
              </div>
            </div>

            {/* Diagnostic Metrics */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm flex flex-col justify-between space-y-6">
              <div className="space-y-6">
                <div>
                  <h3 className="text-xs font-bold uppercase text-[#0B1F3A] tracking-wider">
                    Scorecard Predictive Power
                  </h3>
                  <p className="text-[10px] text-gray-400 mt-0.5">Siddiqi Information Value (IV) rating guidelines</p>
                </div>

                <div className="p-4 bg-gray-50/50 rounded-xl border border-gray-200/60 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-gray-500 font-medium uppercase font-mono">Binned Information Value</span>
                    <HelpCircle className="w-4 h-4 text-gray-400 cursor-help" title="FICO scorecard screening criteria" />
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-[#0B1F3A] tracking-tight">{woeResults.totalIV.toFixed(4)}</span>
                    <span className="text-[10px] uppercase font-bold text-gray-400 font-mono">IV</span>
                  </div>
                  <div className="text-[11px] font-extrabold pt-2 border-t border-gray-200/50 flex items-center gap-1.5 font-mono">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#D4AF37] inline-block" />
                    <span className={ivInterpretation.color}>
                      {ivInterpretation.text}
                    </span>
                  </div>
                </div>

                {/* Anomaly Reports */}
                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-500">Anomaly Check (Raw -99 values):</span>
                    <span className="font-mono font-bold text-gray-700 bg-gray-150 px-1.5 py-0.5 rounded">
                      {anomalyStats.count} accounts ({anomalyStats.percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="flex items-start justify-between py-2">
                    <span className="text-gray-500">Preprocessing Mitigation:</span>
                    <span className="font-semibold text-right leading-tight">
                      {imputeAnomalies ? (
                        <span className="text-green-700 font-bold flex items-center gap-1 justify-end font-mono text-[11px]">
                          <CheckCircle2 className="w-4 h-4 text-green-600" /> IMPUTED (MEDIAN)
                        </span>
                      ) : (
                        <span className="text-amber-600 font-bold flex items-center gap-1 justify-end font-mono text-[11px]">
                          <AlertCircle className="w-4 h-4 text-amber-500" /> RETAINED (RAW -99)
                        </span>
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* Advisory Board note */}
              <div className="p-4 bg-amber-50/20 rounded-xl border border-[#D4AF37]/20 flex gap-3">
                <TrendingUp className="w-5 h-5 text-[#D4AF37] shrink-0 mt-0.5" />
                <div className="text-xs text-gray-600 leading-relaxed">
                  <strong className="text-[#0B1F3A] block font-bold mb-0.5">Analyst Credit Rule</strong>
                  Perfect monotonic behavior of continuous WoE promotes simpler SARB / Basel regulatory rating approvals due to transparent linear risks.
                </div>
              </div>
            </div>

          </div>

          {/* Calibrated Association Grid Table */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-4">
            <h3 className="text-xs font-bold uppercase text-[#0B1F3A] tracking-wider">
              Weight of Evidence (WoE) & Credit Attribute Calibration Table
            </h3>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[700px]">
                <thead className="bg-[#0B1F3A]/5 text-[#0B1F3A] uppercase text-[10px] tracking-wider font-extrabold">
                  <tr className="border-b border-[#0B1F3A]/10">
                    <th className="py-3.5 px-4 rounded-l-lg">Attribute Bins Range</th>
                    <th className="py-3.5 px-3 text-center">Observed Counts</th>
                    <th className="py-3.5 px-3 text-center">Solvents (y=0)</th>
                    <th className="py-3.5 px-3 text-center">Defaults (y=1)</th>
                    <th className="py-3.5 px-3 text-center">Good Dist. (%)</th>
                    <th className="py-3.5 px-3 text-center">Bad Dist. (%)</th>
                    <th className="py-3.5 px-4 text-center rounded-r-lg font-extrabold">WoE Factor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-150 font-mono">
                  {woeResults.bins.map((bin, i) => (
                    <tr key={i} className="hover:bg-gray-100/40 transition">
                      <td className="py-3 px-4 font-sans font-extrabold text-[#0B1F3A]">{bin.binLabel}</td>
                      <td className="py-3 px-3 text-center text-gray-700 font-bold">{bin.count}</td>
                      <td className="py-3 px-3 text-center text-green-700 font-bold">{bin.goodCount}</td>
                      <td className="py-3 px-3 text-center text-red-600 font-bold">{bin.badCount}</td>
                      <td className="py-3 px-3 text-center text-gray-500">{bin.goodDist}%</td>
                      <td className="py-3 px-3 text-center text-gray-500">{bin.badDist}%</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-block px-2.5 py-1 rounded text-[11px] font-black border ${
                          bin.woe > 0 
                            ? 'bg-green-50/75 text-green-800 border-green-200' 
                            : 'bg-red-50/75 text-red-800 border-red-200'
                        }`}>
                          {bin.woe > 0 ? `+${bin.woe.toFixed(3)}` : bin.woe.toFixed(3)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="p-3 bg-gray-50 rounded-lg text-[10px] text-gray-400 flex items-center gap-1.5 font-mono">
              <Info className="w-3.5 h-3.5 shrink-0" /> Laplace correction formulas ($+0.5$ frequency adjustments) are automatically applied upon encountering zero count bounds to prevent infinite log odds factors.
            </div>
          </div>

        </div>
      )}

      {/* --- TAB 2: INTERACTIVE FORMULA DESK & SOLVED MATH SANDBOX --- */}
      {activeTab === 'formulas' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            
            {/* Rigorous Math Formulas */}
            <div className="xl:col-span-1 bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-6">
              <div>
                <h3 className="text-xs font-bold uppercase text-[#0B1F3A] tracking-wider">
                  Univariate Statistical Formulator
                </h3>
                <p className="text-[10px] text-gray-400 mt-0.5">Rigorous mathematical formulas calculated live in risk analysis</p>
              </div>

              {/* Sample Mean Formula */}
              <div className="space-y-2.5 pb-4 border-b border-gray-150">
                <span className="text-[10px] font-bold font-mono text-gray-400 uppercase tracking-widest block leading-none">1. Sample Mean (μ)</span>
                <p className="text-[11px] text-gray-500 leading-normal">
                  Measures center location of observations. Distorted heavily by right tails in credit variables.
                </p>
                <div className="bg-gray-50 border p-3.5 rounded-lg flex justify-center items-center text-center font-mono text-xs">
                  <div className="flex items-center gap-1">
                    <span className="italic font-bold">μ</span>
                    <span>=</span>
                    <div className="flex flex-col items-center justify-center inline-flex px-1.5 text-[11px]">
                      <span className="border-b border-gray-600 pb-0.5">1</span>
                      <span className="pt-0.5">n</span>
                    </div>
                    <span className="font-sans text-xs">Σ</span>
                    <span>x<sub>i</sub></span>
                  </div>
                </div>
              </div>

              {/* Sample Variance Formula */}
              <div className="space-y-2.5 pb-4 border-b border-gray-150">
                <span className="text-[10px] font-bold font-mono text-gray-400 uppercase tracking-widest block leading-none">2. Sample Variance (σ²)</span>
                <p className="text-[11px] text-gray-500 leading-normal">
                  Quantifies dispersion. Implements Bessel correction ($n-1$) in denominator to ensure unbiased estimators.
                </p>
                <div className="bg-gray-50 border p-3.5 rounded-lg flex justify-center items-center text-center font-mono text-xs">
                  <div className="flex items-center gap-1">
                    <span>σ²</span>
                    <span>=</span>
                    <div className="flex flex-col items-center justify-center inline-flex px-1.5 text-[11px]">
                      <span className="border-b border-gray-600 pb-0.5">1</span>
                      <span className="pt-0.5">n - 1</span>
                    </div>
                    <span className="font-sans text-xs">Σ</span>
                    <span>(x<sub>i</sub> - μ)²</span>
                  </div>
                </div>
              </div>

              {/* Skewness Formula */}
              <div className="space-y-2.5 pb-4 border-b border-gray-150">
                <span className="text-[10px] font-bold font-mono text-gray-400 uppercase tracking-widest block leading-none">3. Skewness (γ₁)</span>
                <p className="text-[11px] text-gray-500 leading-normal">
                  Fisher's moment asymmetry. Positive values indicate extreme high-worth outlier right tails (common in income).
                </p>
                <div className="bg-gray-50 border p-3.5 rounded-lg flex justify-center items-center text-center font-mono text-xs">
                  <div className="flex flex-col items-center">
                    <div className="flex items-center gap-1">
                      <span>γ<sub>1</sub></span>
                      <span>=</span>
                      <div className="flex flex-col items-center justify-center inline-flex px-1.5 text-[10px]">
                        <span className="border-b border-gray-600 pb-0.5">n</span>
                        <span className="pt-0.5">(n-1)(n-2)</span>
                      </div>
                      <span className="font-sans text-xs">Σ</span>
                      <div className="flex flex-col items-center justify-center inline-flex px-1 text-[11px]">
                        <span className="border-b border-gray-600 pb-0.5">x<sub>i</sub> - μ</span>
                        <span className="pt-0.5">σ</span>
                      </div>
                      <span className="text-[8px] align-super">³</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Excess Kurtosis Formula */}
              <div className="space-y-2.5">
                <span className="text-[10px] font-bold font-mono text-gray-400 uppercase tracking-widest block leading-none">4. Excess Kurtosis (γ₂)</span>
                <p className="text-[11px] text-gray-500 leading-normal">
                  Measures tail heaviness (outlier probability). Normal curves carry $\gamma_2=0$. Heavy fat tails have positive kurtosis.
                </p>
                <div className="bg-gray-50 border p-3 text-center font-mono text-[10px] space-y-1">
                  <div className="flex items-center justify-center gap-0.5">
                    <span>γ₂</span>
                    <span>=</span>
                    <div className="flex flex-col items-center justify-center inline-flex px-1 leading-none text-[9px]">
                      <span className="border-b border-gray-600 pb-0.5">n(n+1)</span>
                      <span className="pt-0.5">(n-1)(n-2)(n-3)</span>
                    </div>
                    <span className="font-sans">Σ</span>
                    <div className="flex flex-col items-center justify-center inline-flex px-0.5 leading-none text-[9px]">
                      <span className="border-b border-gray-600 pb-0.5">x<sub>i</sub> - μ</span>
                      <span className="pt-0.5">σ</span>
                    </div>
                    <span className="text-[7px] align-super">⁴</span>
                    <span className="ml-1 text-gray-700">-</span>
                    <div className="flex flex-col items-center justify-center inline-flex px-1 leading-none text-[9px]">
                      <span className="border-b border-gray-600 pb-0.5">3(n-1)²</span>
                      <span className="pt-0.5">(n-2)(n-3)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Interactive Worked Math Sandbox */}
            <div className="xl:col-span-2 bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div>
                  <h3 className="text-xs font-bold uppercase text-[#0B1F3A] tracking-wider flex items-center gap-1">
                    <Calculator className="w-4.5 h-4.5 text-[#D4AF37]" /> Interactive Math Playground
                  </h3>
                  <p className="text-[10px] text-gray-400 mt-0.5">Paste comma-separated scores and observe live statistical step-by-step calculus</p>
                </div>
                <span className="p-1 px-2.5 bg-green-50 text-green-700 text-[9px] font-black tracking-wider uppercase font-mono rounded-full border border-green-200 animate-pulse">
                  Reactive Engine Live
                </span>
              </div>

              {/* Standard presets selector */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block font-mono">Select Preset Risk Profiles:</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {SANDBOX_PRESETS.map((p, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSandboxInput(p.values)}
                      className={`text-left p-2.5 rounded-lg border text-xs transition duration-150 cursor-pointer ${
                        sandboxInput === p.values 
                          ? 'bg-[#0B1F3A]/5 border-[#0B1F3A] font-bold text-[#0B1F3A]' 
                          : 'bg-white border-gray-150 hover:bg-gray-50/50'
                      }`}
                    >
                      <div className="font-extrabold truncate text-[11px] text-[#0B1F3A]">{p.label}</div>
                      <div className="text-[9px] text-gray-400 mt-0.5 line-clamp-2 leading-tight">{p.description}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Comma separated numeric text box */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block font-mono">Raw data observations vector (X):</label>
                <textarea
                  value={sandboxInput}
                  onChange={(e) => setSandboxInput(e.target.value)}
                  className="w-full h-18 p-3 font-mono text-xs border rounded-lg focus:ring-1 focus:ring-[#0B1F3A] focus:border-[#0B1F3A] outline-none"
                  placeholder="Insert custom comma separated numbers... e.g. 520, 680, 710"
                />
              </div>

              {/* Live Step math calculus report */}
              {sandboxStats.isValid ? (
                <div className="space-y-4 pt-1">
                  
                  {/* Stats Grid outcomes */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-gray-50 p-3 rounded-lg border text-center">
                      <span className="text-[9px] text-gray-400 font-bold uppercase block">Count (n)</span>
                      <span className="text-sm font-mono font-black text-[#0B1F3A] mt-1 block">{sandboxStats.n}</span>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg border text-center">
                      <span className="text-[9px] text-gray-400 font-bold uppercase block">Sample Mean (μ)</span>
                      <span className="text-sm font-mono font-black text-[#0B1F3A] mt-1 block">{sandboxStats.mean.toFixed(2)}</span>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg border text-center">
                      <span className="text-[9px] text-gray-400 font-bold uppercase block">Unbiased Variance (σ²)</span>
                      <span className="text-sm font-mono font-black text-[#0B1F3A] mt-1 block">{sandboxStats.variance.toFixed(2)}</span>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg border text-center">
                      <span className="text-[9px] text-gray-400 font-bold uppercase block">Std Dev (σ)</span>
                      <span className="text-sm font-mono font-black text-[#0B1F3A] mt-1 block">{sandboxStats.stdDev.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Skew & Kurtosis Grid outcomes */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    {/* Skewness Panel */}
                    <div className={`p-4 rounded-xl border ${
                      sandboxStats.skewness > 1.0 
                        ? 'bg-amber-50/25 border-amber-100 text-amber-900' 
                        : sandboxStats.skewness < -1.0 
                        ? 'bg-blue-50/25 border-blue-100 text-blue-900' 
                        : 'bg-green-50/25 border-green-100 text-green-900'
                    }`}>
                      <div className="flex justify-between items-center pb-2 border-b border-black/5">
                        <span className="text-[10px] font-bold uppercase tracking-wider font-mono">Skewness Shape</span>
                        <span className="font-mono font-black text-xs">γ₁ = {sandboxStats.skewness.toFixed(3)}</span>
                      </div>
                      <p className="text-[11px] leading-relaxed mt-2 text-gray-650">
                        {sandboxStats.skewness > 1.0 ? (
                          <span>
                            <strong>Strong Positive Skew:</strong> The sample exhibits a highly extended right tail. Typical for income metrics where outlier high earners shift the mean far above the median.
                          </span>
                        ) : sandboxStats.skewness < -1.0 ? (
                          <span>
                            <strong>Strong Negative Skew:</strong> Extended left tail. Indicates heavy density concentrations at high values with thin outliers in low spectrums.
                          </span>
                        ) : (
                          <span>
                            <strong>Symmetric distribution:</strong> Low variance asymmetry. Fits Gaussian linear assumptions perfectly.
                          </span>
                        )}
                      </p>
                    </div>

                    {/* Excess Kurtosis Panel */}
                    <div className={`p-4 rounded-xl border ${
                      sandboxStats.kurtosis > 0.5 
                        ? 'bg-purple-50/25 border-purple-100 text-purple-900' 
                        : sandboxStats.kurtosis < -0.5 
                        ? 'bg-orange-50/25 border-orange-100 text-orange-900' 
                        : 'bg-teal-50/25 border-teal-100 text-teal-900'
                    }`}>
                      <div className="flex justify-between items-center pb-2 border-b border-black/5">
                        <span className="text-[10px] font-bold uppercase tracking-wider font-mono">Excess Kurtosis tails</span>
                        <span className="font-mono font-black text-xs">γ₂ = {sandboxStats.kurtosis.toFixed(3)}</span>
                      </div>
                      <p className="text-[11px] leading-relaxed mt-2 text-gray-650">
                        {sandboxStats.kurtosis > 0.5 ? (
                          <span>
                            <strong>Leptokurtic (Fat Tails):</strong> Extreme values have higher probability than standard normal distributions. Suggesting severe tail risk potentials in Basel scorecards!
                          </span>
                        ) : sandboxStats.kurtosis < -0.5 ? (
                          <span>
                            <strong>Platykurtic (Thin Tails):</strong> Low extreme value probabilities. Safe and highly clustered center profiles.
                          </span>
                        ) : (
                          <span>
                            <strong>Mesokurtic:</strong> Tail distribution closely matches a standard normal bell curve.
                          </span>
                        )}
                      </p>
                    </div>

                  </div>

                  {/* Sorted Vector display */}
                  <div className="bg-[#0B1F3A]/5 border border-[#0B1F3A]/10 rounded-lg p-3 text-xs leading-normal space-y-1.5 font-mono">
                    <span className="font-extrabold text-[#0B1F3A] block text-[10px] uppercase tracking-wide font-sans">Sorted Rank vector:</span>
                    <div className="text-[11px] text-gray-600 truncate break-all">
                      [ {sandboxStats.sorted.map((v, i) => (
                        <span key={i}>
                          <span className="font-bold text-[#0B1F3A]">{v}</span>
                          {i < sandboxStats.sorted.length - 1 ? ", " : ""}
                        </span>
                      ))} ]
                    </div>
                  </div>

                </div>
              ) : (
                <div className="p-8 text-center text-gray-400 text-xs italic">
                  Provide comma separated variables vector inside input box to execute calculus.
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {/* --- TAB 3: FNB RESEARCH NOTES & COMPREHENSIVE DOCUMENTATION --- */}
      {activeTab === 'fnb_notes' && (
        <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm space-y-8 select-none">
          
          {/* Header metadata matches Bivariate style */}
          <div className="pb-5 border-b border-gray-200">
            <span className="text-[10px] uppercase font-bold text-[#D4AF37] tracking-widest block font-mono">FNB DataQuest Series 2026 • Senior Division Journal</span>
            <h3 className="text-2xl font-black text-[#0B1F3A] tracking-tight mt-1.5 font-sans leading-none">
              Univariate Analysis in Credit Risk Modelling
            </h3>
            <p className="text-[10px] text-gray-400 mt-2 font-mono flex items-center gap-1.5">
              <span>Author: Senior Credit Risk Analysis Officer</span>
              <span>•</span>
              <span>Regulatory Division Validation Paper</span>
            </p>
          </div>

          <div className="space-y-6 text-xs text-gray-600 leading-relaxed font-paragraph">
            
            {/* Section A */}
            <div className="space-y-2 pb-6 border-b border-gray-100">
              <h4 className="text-sm font-extrabold text-[#0B1F3A] uppercase tracking-wide flex items-center gap-1">
                <ChevronRight className="w-4 h-4 text-[#D4AF37] shrink-0" /> A. What Is It?
              </h4>
              <p className="pl-5 text-gray-650 text-justify">
                Univariate analysis is the examination of a single variable in isolation. It is the foundational layer of Exploratory Data Analysis (EDA): before modelling relationships or building predictive systems, the analyst must understand the individual distribution, range, shape, and quality of every variable in the dataset. The term "univariate" simply means "one variable at a time".
              </p>
              <p className="pl-5 text-gray-650 text-justify">
                It exists because raw data is rarely clean or well-behaved. Credit datasets in particular are plagued by skewed distributions (income follows a power law), outliers (a single ultra-high-net-worth individual), impossible values (negative ages), and missing data patterns that are informative in themselves. Univariate analysis is the systematic process of cataloguing these properties before any transformation or modelling begins.
              </p>
              <div className="ml-5 p-3.5 bg-[#0B1F3A]/5 border-l-4 border-[#0B1F3A] rounded-r-lg mt-3 text-gray-750">
                <strong className="block text-[#0B1F3A] mb-0.5 uppercase tracking-wide text-[10px]">Problem it solves:</strong>
                A credit risk model trained on unexamined raw features will silently absorb data quality flaws — outliers inflate variance, skewed variables violate distributional assumptions, and near-constant features waste model complexity without contributing signal. Univariate analysis surfaces these issues early, when they are cheapest to fix, and directly informs every downstream decision: how to bin a variable, whether to log-transform it, whether to cap it, or whether to drop it entirely.
              </div>
            </div>

            {/* Section B */}
            <div className="space-y-3 pb-6 border-b border-gray-100">
              <h4 className="text-sm font-extrabold text-[#0B1F3A] uppercase tracking-wide flex items-center gap-1">
                <ChevronRight className="w-4 h-4 text-[#D4AF37] shrink-0" /> B. How Does It Work?
              </h4>
              <p className="pl-5 text-gray-650 text-justify">
                Univariate analysis is applied sequentially to each variable. The process differs slightly depending on whether the variable is continuous (numerical) or categorical.
              </p>
              
              <div className="pl-5 grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                
                {/* Continuous Variables Breakdown */}
                <div className="space-y-2.5 bg-gray-50/50 p-4 border rounded-xl leading-normal">
                  <span className="text-[10px] font-bold text-[#0B1F3A] uppercase tracking-wider block font-mono">I. Continuous Variables Checklist:</span>
                  <ul className="space-y-1.5 text-gray-600 list-decimal list-inside pl-0.5">
                    <li><strong className="text-gray-800">Frequency distribution:</strong> Plot histogram or kernel density estimates (KDE) to visually discover modes or clusters.</li>
                    <li><strong className="text-gray-800">Central tendency:</strong> Compute the mean (μ), median (M), and mode. In skewed credit data, the median is safer than mean.</li>
                    <li><strong className="text-gray-800">Dispersion:</strong> Compute variance (σ²), standard deviation (σ), and Interquartile Fences (IQR = Q3 - Q1).</li>
                    <li><strong className="text-gray-800">Shape asymmetry:</strong> Compute skewness (γ₁) and excess kurtosis (γ₂) to assess tailed anomalies.</li>
                    <li><strong className="text-gray-800">Outlier detection:</strong> Apply the IQR fence rule: flag values below Q1 - 1.5×IQR or above Q3 + 1.5×IQR.</li>
                    <li><strong className="text-gray-800">Normality testing:</strong> Assess with Shapiro-Wilk (n &lt; 5000) or Kolmogorov-Smirnov benchmarks.</li>
                  </ul>
                </div>

                {/* Categorical Variables Breakdown */}
                <div className="space-y-2.5 bg-gray-50/50 p-4 border rounded-xl leading-normal">
                  <span className="text-[10px] font-bold text-[#0B1F3A] uppercase tracking-wider block font-mono">II. Categorical Variables Checklist:</span>
                  <ul className="space-y-2 text-gray-600 list-disc list-inside">
                    <li>
                      <strong className="text-gray-800">Frequency table:</strong>
                      <span className="block pl-4 mt-0.5 text-gray-500">Count unique instances per category and compute relative proportions. Identify sparse bands (&lt; 5%).</span>
                    </li>
                    <li>
                      <strong className="text-gray-800">Bar visualization:</strong>
                      <span className="block pl-4 mt-0.5 text-gray-500">Expose extreme category concentrations. If 95% of accounts lie in one category, discriminant value is negligible.</span>
                    </li>
                    <li>
                      <strong className="text-gray-800">Missing Rate evaluations:</strong>
                      <span className="block pl-4 mt-0.5 text-gray-500">Calculate nullity proportions. Rates exceeding 20% warrant model exclusion audits.</span>
                    </li>
                  </ul>
                </div>

              </div>
            </div>

            {/* Section C */}
            <div className="space-y-3 pb-6 border-b border-gray-100">
              <h4 className="text-sm font-extrabold text-[#0B1F3A] uppercase tracking-wide flex items-center gap-1">
                <ChevronRight className="w-4 h-4 text-[#D4AF37] shrink-0" /> C. Example in Credit Risk
              </h4>
              <p className="pl-5 text-gray-650 text-justify">
                Consider the loan_book dataset used in this project. Univariate analysis would be applied to every input feature before any modelling. Below are three worked examples:
              </p>

              <div className="pl-5 space-y-4 pt-2">
                <div className="bg-[#0B1F3A]/5 border-l-2 border-[#D4AF37] p-4 rounded-r-lg space-y-1">
                  <strong className="text-xs text-[#0B1F3A] block">Example 1. Annual Income:</strong>
                  <p className="text-gray-700 italic">
                    Histogram reveals a strongly right-skewed distribution (γ₁ ≈ 3.2). The mean income is R340 000 but the median is R210 000, indicating that a small number of high earners are pulling the mean up. The IQR fence flags incomes above R820 000 as potential outliers (approximately 2.1% of records). <strong className="font-bold">Decision:</strong> apply log transformation (log(income)) to reduce skewness before WoE binning, and cap at the 99th percentile to prevent outlier-driven splits.
                  </p>
                </div>

                <div className="bg-[#0B1F3A]/5 border-l-2 border-[#D4AF37] p-4 rounded-r-lg space-y-1">
                  <strong className="text-xs text-[#0B1F3A] block">Example 2. Credit Bureau Score:</strong>
                  <p className="text-gray-700 italic">
                    The score ranges from 300 to 850. The distribution is approximately normal (γ₁ ≈ −0.3, γ₂ ≈ 0.1, Shapiro-Wilk p = 0.08). No extreme outliers. Missing rate = 4.7%, which is acceptable and likely missing-at-random (new borrowers with thin credit files). <strong className="font-bold">Decision:</strong> no transformation needed; bin into 5 monotonic bands aligned with industry standard score tiers (300–499, 500–579, 580–669, 670–739, 740–850).
                  </p>
                </div>

                <div className="bg-[#0B1F3A]/5 border-l-2 border-[#D4AF37] p-4 rounded-r-lg space-y-1">
                  <strong className="text-xs text-[#0B1F3A] block">Example 3. Number of Open Accounts (categorical-style):</strong>
                  <p className="text-gray-700 italic">
                    Frequency table shows 78% of borrowers have between 2 and 8 open accounts. Values of 0 (11%) represent borrowers with no active credit lines — a meaningful sub-segment. Values above 15 are extremely rare (&lt; 0.4%) and likely data entry errors or fraud indicators. <strong className="font-bold">Decision:</strong> group 0 into its own bin, group 1–3, 4–8, 9–14, and cap 15+ into a single high-count bin before WoE transformation.
                  </p>
                </div>
              </div>
            </div>

            {/* Section D */}
            <div className="space-y-3 pb-6 border-b border-gray-100">
              <h4 className="text-sm font-extrabold text-[#0B1F3A] uppercase tracking-wide flex items-center gap-1">
                <ChevronRight className="w-4 h-4 text-[#D4AF37] shrink-0" /> D. Strengths and Weaknesses
              </h4>
              
              <div className="pl-5 grid grid-cols-1 md:grid-cols-2 gap-6 pt-1">
                <div className="bg-green-50/25 border border-green-200 p-4 rounded-xl space-y-2">
                  <span className="text-[10px] font-bold text-green-800 uppercase tracking-wider block font-mono">Key strengths:</span>
                  <ul className="list-disc list-inside space-y-1.5 text-gray-600 pl-0.5">
                    <li><strong className="text-gray-800">Simplicity and speed:</strong> Requires no iterative training or models. Executable in seconds.</li>
                    <li><strong className="text-gray-800">High Interpretability:</strong> Statistics (Mean, IQR, skewness) are universally understood by commercial stakeholders.</li>
                    <li><strong className="text-gray-800">Data Quality:</strong> Safely isolates impossible values, empty fractions, and near-constant noise factors.</li>
                    <li><strong className="text-gray-800">Guides transformation rules:</strong> Informs log rules, Box-Cox requirements, and bin boundary allocations.</li>
                  </ul>
                </div>

                <div className="bg-red-50/25 border border-red-200 p-4 rounded-xl space-y-2">
                  <span className="text-[10px] font-bold text-red-800 uppercase tracking-wider block font-mono">Inherent weaknesses:</span>
                  <ul className="list-disc list-inside space-y-1.5 text-gray-600 pl-0.5">
                    <li><strong className="text-gray-800">No relation awareness:</strong> Unable to capture correlation properties against target classes or secondary attributes.</li>
                    <li><strong className="text-gray-800">Multimodal gaps:</strong> Traditional means act uselessly on binary peak bimodal spreads.</li>
                    <li><strong className="text-gray-800">Insufficient feature selection:</strong> A highly predictive joint parameter might possess zero univariate signals.</li>
                    <li><strong className="text-gray-800">Instability on thin data:</strong> Estimators (like Kurtosis) drift heavily at small sample sizes (n &lt; 300).</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Section E - Side by side comparison table */}
            <div className="space-y-3 pb-6 border-b border-gray-100">
              <h4 className="text-sm font-extrabold text-[#0B1F3A] uppercase tracking-wide flex items-center gap-1">
                <ChevronRight className="w-4 h-4 text-[#D4AF37] shrink-0" /> E. Comparison to Logistic Regression
              </h4>
              <p className="pl-5 text-gray-650 text-justify">
                Univariate analysis is not a predictive model and therefore does not directly compete with logistic regression. Instead, it is a prerequisite diagnostic step that determines how features are prepared before they enter the logistic regression pipeline. The comparison below frames each tool's role in the broader modelling workflow.
              </p>

              <div className="pl-5 overflow-x-auto pt-2">
                <table className="w-full text-left font-sans text-xs border border-gray-200 rounded-lg">
                  <thead>
                    <tr className="bg-gray-50 text-gray-700 border-b font-extrabold text-[10px] uppercase">
                      <th className="p-3">Analytical Dimension</th>
                      <th className="p-3">Univariate Analysis</th>
                      <th className="p-3">Logistic Regression</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-150 leading-relaxed">
                    <tr>
                      <td className="p-3 font-bold text-gray-800">Primary Purpose</td>
                      <td className="p-3 text-gray-600">Describes each single variable in isolation. Establishes data clean-up baselines.</td>
                      <td className="p-3 text-gray-600 font-medium text-[#0B1F3A]">Estimates joint probability of defaults $P(Default | X)$. Generates predictive scoring.</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-bold text-gray-800">Interpretability</td>
                      <td className="p-3 text-gray-600">Accessible immediately without mathematical modeling prerequisites.</td>
                      <td className="p-3 text-gray-600">Coefficients require log-odds interpretation, holding secondary variables constant.</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-bold text-gray-800">Feature Interactions</td>
                      <td className="p-3 text-gray-600">Completely blind to relationships or multi-collinearity.</td>
                      <td className="p-3 text-gray-600 font-medium text-[#0B1F3A]">Accounts for variable overlaps. Supports explicit cross-multiplications.</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-bold text-gray-800">Sample Sensitivity</td>
                      <td className="p-3 text-gray-600">Basic values function reliably even in single digits. Kurtosis demands n &gt; 300.</td>
                      <td className="p-3 text-gray-600">Demands standard minimum observations (e.g. 10 defaults per included predictor).</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-bold text-gray-800">Modeling Workflow</td>
                      <td className="p-3 text-gray-600 font-bold text-[#D4AF37]">Must happen first - establishes maps.</td>
                      <td className="p-3 text-gray-600 font-bold text-[#0B1F3A]">Final production model for capital-adequacy regulatory approval.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Section F */}
            <div className="space-y-2">
              <h4 className="text-sm font-extrabold text-[#0B1F3A] uppercase tracking-wide flex items-center gap-1">
                <ChevronRight className="w-4 h-4 text-[#D4AF37] shrink-0" /> F. How It Influenced Our Project
              </h4>
              <p className="pl-5 text-gray-650 text-justify">
                Univariate analysis was the first analytical step applied to the <span className="font-mono bg-gray-100 px-1 py-0.5 rounded">loan_book</span> dataset and directly shaped all subsequent feature engineering and modelling decisions:
              </p>
              
              <div className="pl-5 grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                
                <div className="p-3.5 border border-gray-150 rounded-xl space-y-1.5 bg-gray-50/20">
                  <span className="font-extrabold text-xs text-[#0B1F3A] block">1. Annual Income Log Transformation</span>
                  <p className="text-gray-600 leading-normal text-[11px]">
                    Univariate histograms revealed extreme right skew ($\gamma_1 \approx 3.2$) in income metrics. Resolving this via a $log(income + 1)$ preprocessor shifted the skewness to a manageable $\gamma_1 \approx 0.4$, which promoted balanced and monotonic WoE risk distributions in subsequent pipeline stages.
                  </p>
                </div>

                <div className="p-3.5 border border-gray-150 rounded-xl space-y-1.5 bg-gray-50/20">
                  <span className="font-extrabold text-xs text-[#0B1F3A] block">2. Outlier Capping thresholds</span>
                  <p className="text-gray-600 leading-normal text-[11px]">
                    IQR fence analysis detected extreme loan amounts as valid business entries but severe mathematical anomalies. Rather than risk-distorting database cleanups, we implemented 99th percentile capping rules to preserve observation volume while stabilizing continuous bin boundaries.
                  </p>
                </div>

                <div className="p-3.5 border border-gray-150 rounded-xl space-y-1.5 bg-gray-50/20">
                  <span className="font-extrabold text-xs text-[#0B1F3A] block">3. Dropped Constant Predictors</span>
                  <p className="text-gray-600 leading-normal text-[11px]">
                    Univariate frequency reports isolated three variables with extreme concentrations (&gt;97% identical boundaries): "loan currency", "product type flag", and "credit bureau query code". Dropping them outright reduced computational noise at early feature engineering.
                  </p>
                </div>

                <div className="p-3.5 border border-gray-150 rounded-xl space-y-1.5 bg-gray-50/20">
                  <span className="font-extrabold text-xs text-[#0B1F3A] block">4. Exploding 'Missing' Bin Configurations</span>
                  <p className="text-gray-600 leading-normal text-[11px]">
                    Analyzing missing rate counts pinpointed thin scorebooks (4.7% nulls) and self-employed tenure gaps (11.2%). Rather than misleading mean imputations, we preserved them in an explicit "Missing (-99)" category, transforming missingness into a valuable behavioral risk signal.
                  </p>
                </div>

              </div>
            </div>

          </div>

          {/* Institutional Signature Footer */}
          <div className="pt-6 border-t border-gray-200 flex justify-between items-center text-[10px] text-gray-400 font-mono">
            <span>FNB DATAQUEST SECURE SCORECARD DIVISION • CONFIDENTIAL</span>
            <span>PUBLISHED MAY 2026</span>
          </div>

        </div>
      )}

    </div>
  );
}
