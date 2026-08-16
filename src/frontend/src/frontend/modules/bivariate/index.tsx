import React, { useState, useMemo } from 'react';
import { useAppState } from '../../state/AppContext';
import {
  HelpCircle,
  Info,
  Shuffle,
  BarChart,
  Sliders,
  AlertTriangle,
  BookOpen,
  ArrowRight,
  Database,
  RefreshCw,
  BarChart2,
  CheckCircle,
  Award,
  Grid,
  TrendingDown,
  Percent,
  FileSpreadsheet
} from 'lucide-react';

export const MODULE = {
  name: "Bivariate Analysis",
  icon: "GitFork",
  description: "Identify pairwise correlation indicators, calculate Information Value (IV), and evaluate default monotonicity.",
  route: "/bivariate"
};

// Features of interest
const MATRIX_FEATURES = [
  { key: 'fico', label: 'FICO Score' },
  { key: 'dti', label: 'DTI Ratio (%)' },
  { key: 'income', label: 'Income (k ZAR)' },
  { key: 'loanAmount', label: 'Loan Amt (k ZAR)' },
  { key: 'employmentLength', label: 'Tenure (Yrs)' },
  { key: 'defaulted', label: 'Default Status' }
];

// --- Ranks Generator for Spearman ---
function getRanks(values: number[]): number[] {
  const indexed = values.map((val, idx) => ({ val, idx }));
  indexed.sort((a, b) => a.val - b.val);
  
  const ranks = new Array(values.length);
  let i = 0;
  while (i < indexed.length) {
    let j = i;
    while (j < indexed.length && indexed[j].val === indexed[i].val) {
      j++;
    }
    const averageRank = (i + 1 + j) / 2;
    for (let k = i; k < j; k++) {
      ranks[indexed[k].idx] = averageRank;
    }
    i = j;
  }
  return ranks;
}

// --- Pearson correlation coefficient formula helper ---
function calculatePearson(xValues: number[], yValues: number[]): number {
  const n = xValues.length;
  if (n === 0) return 0;
  const sumX = xValues.reduce((a, b) => a + b, 0);
  const sumY = yValues.reduce((a, b) => a + b, 0);
  const sumX2 = xValues.reduce((a, b) => a + b * b, 0);
  const sumY2 = yValues.reduce((a, b) => a + b * b, 0);
  const sumXY = xValues.reduce((sum, x, idx) => sum + x * yValues[idx], 0);

  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
  return denominator === 0 ? 0 : numerator / denominator;
}

// --- Point Biserial Correlation Coefficient helper ---
function calculatePointBiserial(data: any[], key: string): {
  m0: number;
  m1: number;
  s: number;
  n0: number;
  n1: number;
  n: number;
  rpb: number;
} {
  const valid = data.filter(d => d[key] !== -99 && !isNaN(d[key]));
  const n = valid.length;
  if (n < 2) return { m0: 0, m1: 0, s: 1, n0: 0, n1: 0, n: 0, rpb: 0 };
  
  const defaults = valid.filter(d => d.defaulted === 1);
  const goods = valid.filter(d => d.defaulted === 0);
  
  const n1 = defaults.length;
  const n0 = goods.length;
  
  if (n1 === 0 || n0 === 0) {
    return { m0: 0, m1: 0, s: 1, n0, n1, n, rpb: 0 };
  }
  
  const m1 = defaults.reduce((s, d) => s + d[key], 0) / n1;
  const m0 = goods.reduce((s, d) => s + d[key], 0) / n0;
  
  const xValues = valid.map(d => d[key]);
  const overallMean = xValues.reduce((s, v) => s + v, 0) / n;
  
  const devSqSum = xValues.reduce((s, v) => s + Math.pow(v - overallMean, 2), 0);
  const s = Math.sqrt(devSqSum / n); // standard deviation (population)
  
  if (s === 0) return { m0, m1, s, n0, n1, n, rpb: 0 };
  
  const rpb = ((m1 - m0) / s) * Math.sqrt((n1 * n0) / (n * n));
  return { m0, m1, s, n0, n1, n, rpb };
}

// --- WoE/IV Bin interfaces ---
export interface BinRecord {
  label: string;
  count: number;
  goods: number;
  bads: number;
  goodDist: number;
  badDist: number;
  woe: number;
  ivContribution: number;
  eventRate: number;
}

// --- WoE & IV Calculator helper ---
export function calculateWoeIv(data: any[], key: string): {
  bins: BinRecord[];
  totalIv: number;
  interpret: string;
  isMonotonic: boolean;
} {
  const anomalies = data.filter(d => d[key] === -99 || isNaN(d[key]));
  const normal = data.filter(d => d[key] !== -99 && !isNaN(d[key]));
  
  const totalBads = data.filter(d => d.defaulted === 1).length;
  const totalGoods = data.filter(d => d.defaulted === 0).length;
  
  if (totalBads === 0 || totalGoods === 0) {
    return { bins: [], totalIv: 0, interpret: "Inadequate comparison data", isMonotonic: false };
  }
  
  const vals = normal.map(d => d[key] as number).sort((a, b) => a - b);
  let boundaries: number[] = [];
  
  if (vals.length > 0) {
    // Determine predefined smart intervals
    if (key === 'fico') {
      boundaries = [580, 630, 680, 740];
    } else if (key === 'dti') {
      boundaries = [20, 35, 50, 65];
    } else if (key === 'income') {
      boundaries = [45, 80, 125, 175];
    } else if (key === 'loanAmount') {
      boundaries = [40, 75, 110, 150];
    } else if (key === 'employmentLength') {
      boundaries = [2, 5, 9, 15];
    } else {
      const minVal = vals[0];
      const maxVal = vals[vals.length - 1];
      const step = (maxVal - minVal) / 5;
      boundaries = [
        minVal + step,
        minVal + step * 2,
        minVal + step * 3,
        minVal + step * 4
      ];
    }
  }

  const binsList: Array<{ min: number; max: number; label: string; filterFn: (acc: any) => boolean }> = [];
  
  if (boundaries.length > 0) {
    binsList.push({
      min: -Infinity,
      max: boundaries[0],
      label: `< ${boundaries[0]}`,
      filterFn: (acc) => acc[key] !== -99 && acc[key] < boundaries[0]
    });
    for (let i = 0; i < boundaries.length - 1; i++) {
      const low = boundaries[i];
      const high = boundaries[i + 1];
      binsList.push({
        min: low,
        max: high,
        label: `${low} to < ${high}`,
        filterFn: (acc) => acc[key] !== -99 && acc[key] >= low && acc[key] < high
      });
    }
    binsList.push({
      min: boundaries[boundaries.length - 1],
      max: Infinity,
      label: `≥ ${boundaries[boundaries.length - 1]}`,
      filterFn: (acc) => acc[key] !== -99 && acc[key] >= boundaries[boundaries.length - 1]
    });
  }
  
  binsList.push({
    min: -99,
    max: -99,
    label: "Anomaly / Imputed (-99)",
    filterFn: (acc) => acc[key] === -99 || isNaN(acc[key])
  });

  const computedBins: BinRecord[] = binsList.map(binDef => {
    const subset = data.filter(binDef.filterFn);
    const cbads = subset.filter(d => d.defaulted === 1).length;
    const cgoods = subset.length - cbads;
    
    // Standard Laplace adjustment mechanism to prevent divisions by zero or infinite log
    const adjGoods = cgoods === 0 ? 0.5 : cgoods;
    const adjBads = cbads === 0 ? 0.5 : cbads;
    
    const goodDist = adjGoods / totalGoods;
    const badDist = adjBads / totalBads;
    
    // Traditional scorecard credit WoE = ln(Distribution of Non-Events / Distribution of Events)
    // (Wait, FNB notes state: WoE = ln(Distribution of Events_i / Distribution of Non-Events_i) 
    // where Events = default (1). Let's use this exact definition from the user notes: 
    // WoE = ln(badDist / goodDist).)
    const woe = Math.log(badDist / goodDist);
    const ivContribution = (badDist - goodDist) * woe;
    
    return {
      label: binDef.label,
      count: subset.length,
      goods: cgoods,
      bads: cbads,
      goodDist: cgoods / totalGoods,
      badDist: cbads / totalBads,
      woe,
      ivContribution,
      eventRate: subset.length > 0 ? (cbads / subset.length) * 100 : 0
    };
  }).filter(b => b.count > 0 || b.label.includes("-99")); // Keep any initialized values

  // Cumulative Sum Of IV
  const totalIv = computedBins.reduce((val, b) => val + b.ivContribution, 0);
  
  // Siddiqi interpretation thresholds
  let interpret = "";
  if (totalIv < 0.02) {
    interpret = "Useless predictor (exclude)";
  } else if (totalIv < 0.10) {
    interpret = "Weak predictor";
  } else if (totalIv < 0.30) {
    interpret = "Medium predictor";
  } else if (totalIv < 0.50) {
    interpret = "Strong predictor";
  } else {
    interpret = "Suspicious predictor (possible data leakage - audit needed)";
  }

  // Check monotonicity on non-anomaly bins
  const normalBins = computedBins.filter(b => !b.label.includes("-99"));
  let isMonotonic = true;
  if (normalBins.length > 1) {
    let initialTrend: 'up' | 'down' | 'flat' = 'flat';
    
    for (let i = 0; i < normalBins.length - 1; i++) {
      const diff = normalBins[i + 1].woe - normalBins[i].woe;
      const currentTrend = diff > 0 ? 'up' : diff < 0 ? 'down' : 'flat';
      
      if (initialTrend === 'flat') {
        if (currentTrend !== 'flat') initialTrend = currentTrend;
      } else if (currentTrend !== 'flat' && currentTrend !== initialTrend) {
        isMonotonic = false;
        break;
      }
    }
  } else {
    isMonotonic = false;
  }

  return {
    bins: computedBins,
    totalIv,
    interpret,
    isMonotonic
  };
}

export default function BivariateModule({ context }: { context: any }) {
  const { activeAccounts } = useAppState();

  // --- SUB-TABS STATE ---
  const [activeTab, setActiveTab] = useState<'correlation_matrix' | 'woe_iv' | 'chisquare_cramers' | 'fnb_notes'>('correlation_matrix');
  
  // Correlation State
  const [correlationType, setCorrelationType] = useState<'pearson' | 'spearman'>('pearson');
  const [selectedCorrPair, setSelectedCorrPair] = useState<{ x: string; y: string; val: number } | null>({
    x: 'FICO Score',
    y: 'Default Status',
    val: -0.48
  });

  // WoE / IV State
  const [selectedIvFeature, setSelectedIvFeature] = useState<'fico' | 'dti' | 'income' | 'loanAmount' | 'employmentLength'>('fico');

  // Manual Sandbox States
  const [sandboxBads, setSandboxBads] = useState<number>(30);
  const [sandboxGoods, setSandboxGoods] = useState<number>(120);
  const [sandboxGlobalBads, setSandboxGlobalBads] = useState<number>(100);
  const [sandboxGlobalGoods, setSandboxGlobalGoods] = useState<number>(405);

  const calculatedSandboxWoeIv = useMemo(() => {
    const distB = sandboxBads / sandboxGlobalBads;
    const distG = sandboxGoods / sandboxGlobalGoods;
    const divisionVal = distB / distG;
    
    let woe = 0;
    if (distG > 0 && distB > 0) {
      woe = Math.log(divisionVal);
    }
    const iv = (distB - distG) * woe;
    return { distB, distG, woe, iv };
  }, [sandboxBads, sandboxGoods, sandboxGlobalBads, sandboxGlobalGoods]);

  // --- COMPUTE MATRIX DATA NATIVELY ---
  const correlationMatrix = useMemo(() => {
    const keys = MATRIX_FEATURES.map(f => f.key);
    const validData = activeAccounts.filter(acc => acc.fico !== -99 && acc.dti !== -99);
    
    const matrix: Record<string, Record<string, number>> = {};

    keys.forEach(xKey => {
      matrix[xKey] = {};
    });

    if (validData.length === 0) {
      keys.forEach(x => keys.forEach(y => { matrix[x][y] = 0; }));
      return matrix;
    }

    if (correlationType === 'pearson') {
      // Direct product moment Pearson r
      keys.forEach(xKey => {
        keys.forEach(yKey => {
          const xVals = validData.map(d => d[xKey as keyof typeof d] as number);
          const yVals = validData.map(d => d[yKey as keyof typeof d] as number);
          const r = calculatePearson(xVals, yVals);
          matrix[xKey][yKey] = Math.round(r * 1000) / 1000;
        });
      });
    } else {
      // Spearman Rank Correlation
      keys.forEach(xKey => {
        keys.forEach(yKey => {
          const xRaw = validData.map(d => d[xKey as keyof typeof d] as number);
          const yRaw = validData.map(d => d[yKey as keyof typeof d] as number);
          
          const xRanks = getRanks(xRaw);
          const yRanks = getRanks(yRaw);
          
          const r = calculatePearson(xRanks, yRanks);
          matrix[xKey][yKey] = Math.round(r * 1000) / 1000;
        });
      });
    }

    return matrix;
  }, [activeAccounts, correlationType]);

  // --- RENDER DUAL FICO X DTI JOINT GRID ---
  const jointRiskMatrix = useMemo(() => {
    const ficoBrackets = [
      { label: "Subprime (<580)", min: 0, max: 580 },
      { label: "Near-prime (580 to <660)", min: 580, max: 660 },
      { label: "Prime (≥660)", min: 660, max: 999 }
    ];
    
    const dtiBrackets = [
      { label: "Conservative (<25%)", min: 0, max: 25 },
      { label: "Moderate (25 to <45%)", min: 25, max: 45 },
      { label: "Highly Leveraged (≥45%)", min: 45, max: 150 }
    ];

    const validData = activeAccounts.filter(acc => acc.fico !== -99 && acc.dti !== -99);

    const matrixGrid = ficoBrackets.map(fBracket => {
      return {
        ficoLabel: fBracket.label,
        columns: dtiBrackets.map(dBracket => {
          const cellAccounts = validData.filter(acc => 
            acc.fico >= fBracket.min && acc.fico < fBracket.max &&
            acc.dti >= dBracket.min && acc.dti < dBracket.max
          );
          
          const count = cellAccounts.length;
          const bads = cellAccounts.filter(acc => acc.defaulted === 1).length;
          const rate = count > 0 ? (bads / count) * 100 : 0;

          return {
            dtiLabel: dBracket.label,
            count,
            bads,
            rate: Math.round(rate * 10) / 10
          };
        })
      };
    });

    return { grid: matrixGrid, dtiLabels: dtiBrackets.map(db => db.label) };
  }, [activeAccounts]);

  // Color gradient helper for correlation heat numbers [-1, +1]
  const getCorrelationColor = (val: number) => {
    if (val === 1) return 'bg-[#0B1F3A] text-[#D4AF37] font-black border border-white';
    if (val > 0.45) return 'bg-[#0B1F3A]/85 text-white';
    if (val > 0.15) return 'bg-[#0B1F3A]/45 text-[#0B1F3A]';
    if (val > -0.15) return 'bg-gray-50 text-gray-500 border border-gray-100';
    if (val > -0.45) return 'bg-red-550/15 text-red-700';
    return 'bg-red-650/30 text-red-950 font-bold';
  };

  // --- COMPUTE WOE & IV ANALYSIS REPORT ---
  const activeWoeIvData = useMemo(() => {
    return calculateWoeIv(activeAccounts, selectedIvFeature);
  }, [activeAccounts, selectedIvFeature]);

  // Point biseral data computed step by step
  const activeBiserialStats = useMemo(() => {
    return calculatePointBiserial(activeAccounts, selectedIvFeature);
  }, [activeAccounts, selectedIvFeature]);


  // --- COMPUTE EMPIRICAL CHI-SQUARE (TENURE CATEGORY VS TARGET) ---
  const chiSquareStatsInput = useMemo(() => {
    // Map Tenure (employmentLength) to 3 business categories defined in Siddiqi
    // 1. Unstable/Entry: tenure < 3 Yrs
    // 2. Mid-term: tenure 3 to < 8 Yrs
    // 3. Senior/Permanent: tenure >= 8 Yrs
    const totalCount = activeAccounts.length;
    const overallBads = activeAccounts.filter(d => d.defaulted === 1).length;
    const overallGoods = totalCount - overallBads;

    const cat1 = activeAccounts.filter(d => d.employmentLength < 3);
    const cat2 = activeAccounts.filter(d => d.employmentLength >= 3 && d.employmentLength < 8);
    const cat3 = activeAccounts.filter(d => d.employmentLength >= 8);

    const categories = [
      { name: "Entry Level / Unstable (<3 Yrs)", actual: cat1 },
      { name: "Mid-Term Experience (3 to <8 Yrs)", actual: cat2 },
      { name: "Senior / Permanent Tenure (≥8 Yrs)", actual: cat3 }
    ];

    let chi2Sum = 0;
    const tableRows = categories.map(cat => {
      const nTotal = cat.actual.length;
      const oBads = cat.actual.filter(a => a.defaulted === 1).length;
      const oGoods = nTotal - oBads;

      // Expected Values: E = (Row Total * Col Total) / Grand Total
      const expectedBads = totalCount > 0 ? (nTotal * overallBads) / totalCount : 0;
      const expectedGoods = totalCount > 0 ? (nTotal * overallGoods) / totalCount : 0;

      // Chi-Square components
      const diffBad = oBads - expectedBads;
      const diffGood = oGoods - expectedGoods;

      const badChiSqPart = expectedBads > 0 ? (diffBad * diffBad) / expectedBads : 0;
      const goodChiSqPart = expectedGoods > 0 ? (diffGood * diffGood) / expectedGoods : 0;

      chi2Sum += (badChiSqPart + goodChiSqPart);

      return {
        name: cat.name,
        total: nTotal,
        observedBads: oBads,
        observedGoods: oGoods,
        expectedBads: Math.round(expectedBads * 10) / 10,
        expectedGoods: Math.round(expectedGoods * 10) / 10,
        badChiSqPart: Math.round(badChiSqPart * 1000) / 1000,
        goodChiSqPart: Math.round(goodChiSqPart * 1000) / 1000,
        totalChiSqPart: Math.round((badChiSqPart + goodChiSqPart) * 1000) / 1000
      };
    });

    const cramersV = totalCount > 0 ? Math.sqrt(chi2Sum / totalCount) : 0;

    return {
      rows: tableRows,
      chiSquare: Math.round(chi2Sum * 100) / 100,
      cramersV: Math.round(cramersV * 1000) / 1000,
      totalCount,
      overallBads,
      overallGoods
    };
  }, [activeAccounts]);

  return (
    <div className="space-y-6">

      {/* BRAND MODULE HEADER */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1 px-2.5 bg-[#0B1F3A] text-[#D4AF37] font-sans font-black rounded text-[10px] tracking-wider uppercase">
                Bivariate Lab
              </span>
              <h2 className="text-xl font-bold text-[#0B1F3A] tracking-tight">
                Bivariate Analysis & WoE Scorers
              </h2>
            </div>
            <p className="text-xs text-gray-500 max-w-2xl leading-relaxed">
              Analyze statistical associations against credit default targets. Contrast Pearson vs. Spearman, compute Information Value (IV) weights, and audit multicollinearity risk matrices.
            </p>
          </div>

          <div className="flex gap-1 bg-gray-50 border p-1 rounded-lg shrink-0">
            <button
              onClick={() => setActiveTab('correlation_matrix')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${activeTab === 'correlation_matrix' ? 'bg-[#0B1F3A] text-white shadow-sm' : 'text-gray-500 hover:text-gray-905 hover:bg-gray-100/50'}`}
            >
              Correlation Hub
            </button>
            <button
              onClick={() => setActiveTab('woe_iv')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${activeTab === 'woe_iv' ? 'bg-[#0B1F3A] text-white shadow-sm' : 'text-gray-500 hover:text-gray-905 hover:bg-gray-100/50'}`}
            >
              WoE & IV Analyzer
            </button>
            <button
              onClick={() => setActiveTab('chisquare_cramers')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${activeTab === 'chisquare_cramers' ? 'bg-[#0B1F3A] text-white shadow-sm' : 'text-gray-500 hover:text-gray-905 hover:bg-gray-100/50'}`}
            >
              Chi-Square Tests
            </button>
            <button
              onClick={() => setActiveTab('fnb_notes')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${activeTab === 'fnb_notes' ? 'bg-[#0B1F3A] text-white shadow-sm' : 'text-gray-500 hover:text-gray-905 hover:bg-gray-100/50'}`}
            >
              FNB Study Notes
            </button>
          </div>
        </div>
      </div>

      {/* --- TAB 1: CORRELATION MATRIX NETWORK HUB --- */}
      {activeTab === 'correlation_matrix' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">

            {/* Left Detailed Audit & Explanation Panel (Swapped) */}
            <div className="xl:col-span-2 space-y-6">
              
              {/* Selected Cell Audit Details */}
              <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block font-mono">
                    Variable Pair Inspector
                  </span>
                  <span className="bg-[#D4AF37]/10 text-[#a48624] font-mono text-[9px] font-bold uppercase tracking-wide px-2 py-0.5 rounded">
                    Active Audit
                  </span>
                </div>

                {selectedCorrPair ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3 pb-3 border-b">
                      <div>
                        <span className="text-[10px] text-gray-400 block uppercase">Continuous Feature X</span>
                        <span className="font-bold text-xs text-[#0B1F3A]">{selectedCorrPair.x}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-gray-400 block uppercase">Comparison Feature Y</span>
                        <span className="font-bold text-xs text-[#0B1F3A]">{selectedCorrPair.y}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="bg-[#0B1F3A] text-[#D4AF37] p-5 rounded-xl text-center shadow-sm w-32 shrink-0">
                        <span className="text-[9px] uppercase tracking-wider text-white opacity-60 block leading-tight font-mono">
                          {correlationType === 'pearson' ? "Pearson R" : "Spearman ρ"}
                        </span>
                        <span className="text-xl font-mono font-black block mt-1">{selectedCorrPair.val.toFixed(3)}</span>
                      </div>
                      <div className="space-y-1.5">
                        <h4 className="text-xs font-bold text-gray-700">Audit Diagnosis:</h4>
                        <p className="text-[11px] text-gray-500 leading-normal">
                          {Math.abs(selectedCorrPair.val) > 0.70 ? (
                            <span className="text-red-750 font-semibold block">
                              ⚠️ PROBLEM MULTICOLLINEARITY PREDICTED: This relationship exceeds the high |R| &gt; 0.7 threshold. To maintain stable scorecard coefficients, regulators demand you keep only the one with the higher univariate Information Value.
                            </span>
                          ) : Math.abs(selectedCorrPair.val) > 0.30 ? (
                            <span className="text-amber-700 font-semibold block">
                              ⚠️ MODERATE COVARIATION: Statistically stable relationship is active. No immediate action required, but monitor variance inflation factor (VIF) during regression logs.
                            </span>
                          ) : (
                            <span className="text-green-700 font-semibold block">
                              ✓ STABLE INDEPENDENCE: Minimal covariance detected. Ideal for linear score modeling without correlation bias.
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-xs text-gray-400 italic py-6">
                    Click any cell on the left correlator map grid to unpack exact statistics.
                  </div>
                )}
              </div>

              {/* FICO x DTI Joint Compound matrix */}
              <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#0B1F3A] flex items-center gap-1.5">
                    <Grid className="w-4 h-4 text-[#D4AF37]" />
                    FICO x DTI Compound Default Grids
                  </h3>
                  <p className="text-[10px] text-gray-450 leading-relaxed mt-1">
                    Bivariate cross-count default rates highlight compounding risk factor deterioration.
                  </p>
                </div>

                <div className="overflow-x-auto pointer-events-none">
                  <table className="w-full text-left text-[10px] text-gray-600 border border-gray-150 rounded-lg overflow-hidden">
                    <thead className="bg-[#0B1F3A] text-white">
                      <tr>
                        <th className="py-2 px-2.5 font-sans font-bold">FICO Range (Row)</th>
                        {jointRiskMatrix.dtiLabels.map((lab, i) => (
                          <th key={i} className="py-2 px-2 text-center text-[9px] font-mono leading-tight">{lab}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 font-mono text-[11px]">
                      {jointRiskMatrix.grid.map((row, rIdx) => (
                        <tr key={rIdx} className="hover:bg-gray-55/40">
                          <td className="py-2.5 px-2.5 font-sans font-extrabold text-gray-800 bg-gray-50">{row.ficoLabel}</td>
                          {row.columns.map((col, cIdx) => {
                            const rate = col.rate;
                            const colColor = rate > 40
                              ? 'bg-red-50 text-red-850 font-extrabold border border-red-200/50'
                              : rate > 20
                                ? 'bg-amber-50 text-amber-800 font-semibold border border-amber-105/50'
                                : 'bg-green-50 text-green-800 border border-green-200/50';

                            return (
                              <td key={cIdx} className="py-2 px-2">
                                <div className={`p-1.5 rounded text-center ${colColor}`}>
                                  <div>{rate.toFixed(1)}%</div>
                                  <div className="text-[8px] text-gray-400 font-sans mt-0.5 leading-none">
                                    {col.bads}/{col.count} loans
                                  </div>
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

              </div>

            </div>

            {/* Right Heatmap Board (Swapped) */}
            <div className="xl:col-span-3 bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#0B1F3A]">
                    Pairwise Association Grid
                  </h3>
                  <p className="text-[10px] text-gray-400 mt-0.5">Toggle Pearson (linear) or Spearman (monotonic rank) formulas</p>
                </div>

                <div className="flex bg-gray-100 p-0.5 rounded-lg border">
                  <button
                    onClick={() => setCorrelationType('pearson')}
                    className={`px-3 py-1 text-[11px] font-bold rounded-md transition ${correlationType === 'pearson' ? 'bg-[#0B1F3A] text-white' : 'text-gray-500 hover:text-gray-800'}`}
                  >
                    Pearson (R)
                  </button>
                  <button
                    onClick={() => setCorrelationType('spearman')}
                    className={`px-3 py-1 text-[11px] font-bold rounded-md transition ${correlationType === 'spearman' ? 'bg-[#0B1F3A] text-white' : 'text-gray-500 hover:text-gray-800'}`}
                  >
                    Spearman (ρ)
                  </button>
                </div>
              </div>

              {/* Graphical Board representation */}
              <div className="overflow-x-auto py-2">
                <div className="min-w-[420px] space-y-1.5">
                  <div className="grid grid-cols-7 gap-1.5 text-center font-bold text-[9px] text-gray-400 uppercase tracking-widest pb-1 border-b">
                    <div />
                    {MATRIX_FEATURES.map((f, idx) => (
                      <div key={idx} className="truncate px-0.5" title={f.label}>
                        {f.key === 'employmentLength' ? 'Tenure' : f.key === 'loanAmount' ? 'LoanAmt' : f.key === 'defaulted' ? 'Default' : f.label}
                      </div>
                    ))}
                  </div>

                  {MATRIX_FEATURES.map((rowFeat, rowIndex) => (
                    <div key={rowIndex} className="grid grid-cols-7 gap-1.5 items-center">
                      <div className="text-[11px] font-bold text-[#0B1F3A] text-left truncate leading-tight pr-1.5">
                        {rowFeat.label}
                      </div>
                      
                      {MATRIX_FEATURES.map((colFeat, colIndex) => {
                        const corrValue = correlationMatrix[rowFeat.key]?.[colFeat.key] ?? 0;
                        const isMainDiagonal = rowFeat.key === colFeat.key;
                        const isSelected = selectedCorrPair?.x === rowFeat.label && selectedCorrPair?.y === colFeat.label;

                        return (
                          <button
                            key={colIndex}
                            onClick={() => setSelectedCorrPair({ x: rowFeat.label, y: colFeat.label, val: corrValue })}
                            className={`h-11 flex flex-col items-center justify-center text-xs rounded-lg transition duration-200 border relative hover:scale-[1.04] cursor-pointer ${
                              isSelected ? 'ring-2 ring-[#D4AF37] border-white z-10' : ''
                            } ${getCorrelationColor(corrValue)}`}
                          >
                            <span className="font-mono font-bold leading-tight">
                              {corrValue.toFixed(3)}
                            </span>
                            {isMainDiagonal && (
                              <span className="text-[7px] uppercase font-bold opacity-30 mt-0.5 tracking-tighter">diag</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>

              {/* Color legend panel */}
              <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-400">
                <div className="flex gap-4">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 bg-[#0B1F3A] rounded border" />
                    <span>Positive (+R)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 bg-[#F8FAFC] rounded border" />
                    <span>No Correlation</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 bg-red-100 rounded border" />
                    <span>Negative (-R)</span>
                  </div>
                </div>
                <span className="font-mono text-[10px] text-gray-400">Sample size: <span className="font-bold text-gray-700">{activeAccounts.filter(a => a.fico !== -99).length}</span> accounts</span>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* --- TAB 2: CREDIT SPECIFIC WEIGHT OF EVIDENCE (WOE) & INFORMATION VALUE --- */}
      {activeTab === 'woe_iv' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">

            {/* Left main panel: WoE Table & calculations (Swapped) */}
            <div className="xl:col-span-3 bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-6">
              
              {/* Variable interpretation score display */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-[#0B1F3A] text-white rounded-xl shadow-xs">
                <div>
                  <span className="text-[9px] uppercase tracking-wider text-[#D4AF37] font-black font-mono">Siddiqi Predictor Strength Screen</span>
                  <h3 className="text-base font-bold text-white mt-0.5">
                    {selectedIvFeature === 'fico' ? 'FICO Score' : selectedIvFeature === 'dti' ? 'DTI Ratio (%)' : selectedIvFeature === 'income' ? 'Annual Income (k ZAR)' : selectedIvFeature === 'loanAmount' ? 'Loan Amt (k ZAR)' : 'Employment Tenure'}
                  </h3>
                </div>

                <div className="flex gap-4 border-l border-white/10 pl-4 items-center">
                  <div className="text-center">
                    <span className="text-[9px] text-gray-400 block uppercase font-mono">Total Cumulative IV</span>
                    <span className="text-xl font-black font-mono text-[#D4AF37]">
                      {activeWoeIvData.totalIv.toFixed(4)}
                    </span>
                  </div>
                  <div className="bg-white/10 px-3 py-1.5 rounded text-center">
                    <span className="text-[9px] text-gray-300 block uppercase font-mono">IV rating</span>
                    <span className="text-[11px] font-bold block text-[#D4AF37]">{activeWoeIvData.interpret}</span>
                  </div>
                </div>
              </div>

              {/* Table with worked data */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">Weight of Evidence (WoE) Calculation Table</h4>
                  <span className="text-[10px] text-blue-600 font-bold font-mono">WoE = ln(BadDist / GoodDist)</span>
                </div>

                <div className="overflow-x-auto border border-gray-200 rounded-xl">
                  <table className="w-full text-xs text-left text-gray-600 border-collapse">
                    <thead className="bg-gray-50 text-gray-700 font-bold border-b border-gray-200 text-[10px] uppercase">
                      <tr>
                        <th className="p-3">Attribute Bin (Range)</th>
                        <th className="p-3 text-center">Observed (Count)</th>
                        <th className="p-3">Solvent / Goods (0)</th>
                        <th className="p-3">Defaulted / Bads (1)</th>
                        <th className="p-3 text-center">Dist (Good / Bad)</th>
                        <th className="p-3 text-right">WoE Value</th>
                        <th className="p-3 font-mono text-center text-gray-800">Partial IV</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {activeWoeIvData.bins.map((bin, i) => (
                        <tr key={i} className="hover:bg-gray-55/50 font-medium">
                          <td className="p-3 font-bold text-gray-900 font-sans">
                            {bin.label}
                          </td>
                          <td className="p-3 text-center font-mono">
                            {bin.count}
                          </td>
                          <td className="p-3 font-mono text-green-700">
                            {bin.goods} <span className="text-[9px] text-gray-400">({(bin.goodDist * 100).toFixed(1)}%)</span>
                          </td>
                          <td className="p-3 font-mono text-red-650">
                            {bin.bads} <span className="text-[9px] text-gray-400">({(bin.badDist * 100).toFixed(1)}%)</span>
                          </td>
                          <td className="p-3 text-center font-mono text-[10px] text-gray-500">
                            {bin.goodDist.toFixed(3)} / {bin.badDist.toFixed(3)}
                          </td>
                          <td className="p-3 text-right font-mono font-black text-gray-800 bg-gray-50">
                            {bin.woe.toFixed(4)}
                          </td>
                          <td className="p-3 text-center font-mono font-bold text-[#0B1F3A] bg-amber-50/20">
                            {bin.ivContribution.toFixed(5)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mathematical worked formula description */}
                <div className="bg-[#D4AF37]/5 rounded-xl border border-[#D4AF37]/20 p-4 space-y-2">
                  <span className="text-[10px] uppercase font-bold text-[#a48624] tracking-wide block">
                    HOW THE IV FORMULA INFLUENCES THE SCORECARD
                  </span>
                  <p className="text-xs text-gray-650 leading-relaxed">
                    Under Siddiqi's guidelines, Information Value measures the discriminatory power of a characteristic. Weight of Evidence (WoE) converts continuous features into a linear relative log-odds scale suitable for stable logistic regression scorecards.
                  </p>
                  <div className="font-mono text-[10px] bg-white p-3 rounded border text-gray-700 leading-normal">
                    <span className="font-black text-[#0B1F3A]">Worked Equation example:</span>
                    <br />
                    At Bin 1: Bad Distribution = Dist_Bad = {activeWoeIvData.bins[0]?.badDist.toFixed(4)} | Good Distribution = Dist_Good = {activeWoeIvData.bins[0]?.goodDist.toFixed(4)}
                    <br />
                    WoE = ln(Dist_Bad / Dist_Good) = ln({activeWoeIvData.bins[0]?.badDist.toFixed(4)} / {activeWoeIvData.bins[0]?.goodDist.toFixed(4)}) = <span className="font-bold text-red-700">{activeWoeIvData.bins[0]?.woe.toFixed(4)}</span>
                    <br />
                    Partial IV = (Dist_Bad - Dist_Good) * WoE = ({activeWoeIvData.bins[0]?.badDist.toFixed(4)} - {activeWoeIvData.bins[0]?.goodDist.toFixed(4)}) * {activeWoeIvData.bins[0]?.woe.toFixed(4)} = <span className="font-bold text-green-700">{activeWoeIvData.bins[0]?.ivContribution.toFixed(5)}</span>
                  </div>
                </div>

              </div>

            </div>

            {/* Right sidebar controls for IV Selection (Swapped) */}
            <div className="xl:col-span-1 bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-5">
              <div className="pb-3 border-b border-gray-100">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block font-mono">Bivariate IV Screen</span>
                <h3 className="text-xs font-bold uppercase text-[#0B1F3A] mt-0.5">Tested Attribute Selector</h3>
              </div>

              {/* Selector radio list */}
              <div className="space-y-1.5">
                {[
                  { key: 'fico', label: 'FICO Score' },
                  { key: 'dti', label: 'DTI Ratio (%)' },
                  { key: 'income', label: 'Annual Income (k ZAR)' },
                  { key: 'loanAmount', label: 'Loan Amt (k ZAR)' },
                  { key: 'employmentLength', label: 'Employment Tenure (Yrs)' }
                ].map((item) => (
                  <button
                    key={item.key}
                    onClick={() => setSelectedIvFeature(item.key as any)}
                    className={`w-full text-left p-3 rounded-lg border flex items-center justify-between text-xs transition duration-150 cursor-pointer hover:border-[#D4AF37] ${
                      selectedIvFeature === item.key
                        ? 'border-[#0B1F3A] bg-[#0B1F3A]/5 text-[#0B1F3A] font-bold'
                        : 'border-gray-200 bg-white text-gray-600'
                    }`}
                  >
                    <span>{item.label}</span>
                    <ArrowRight className={`w-3 h-3 ${selectedIvFeature === item.key ? 'text-[#D4AF37]' : 'text-gray-300'}`} />
                  </button>
                ))}
              </div>

              {/* Point Biserial summary box */}
              <div className="bg-[#0B1F3A]/5 rounded-xl p-4 border border-[#0B1F3A]/10 space-y-2 text-xs">
                <span className="text-[10px] font-bold uppercase text-gray-400 tracking-wider block font-mono">Point-Biserial target Stat</span>
                <div className="flex justify-between">
                  <span className="text-gray-500">Correlation $r_{`pb`}$:</span>
                  <span className="font-mono font-black text-[#0B1F3A]">{activeBiserialStats.rpb.toFixed(3)}</span>
                </div>
                <div className="text-[10px] text-gray-400 mt-1 leading-normal italic">
                  Measures continuous feature separation vs. binary defaulted categories. 
                </div>
              </div>

              {/* Monotonicity check box */}
              <div className="bg-gray-50 rounded-xl p-3.5 border border-gray-150 text-xs flex items-start gap-2">
                {activeWoeIvData.isMonotonic ? (
                  <>
                    <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-green-800 block">Monotonic Trend Validated</span>
                      <span className="text-[10px] text-gray-550 leading-tight block mt-0.5">
                        WoE changes strictly in one direction. Ideal for linear scorecard modeling!
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-5 h-5 text-amber-650 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-amber-800 block">Non-Monotonic Curve</span>
                      <span className="text-[10px] text-gray-550 leading-tight block mt-0.5">
                        WoE values have a local reversal. Refinement in bin thresholds is suggested during final regulatory sign-off.
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* --- TAB 3: CHI-SQUARE AND CRAMER'S V ASSOCIATIONS --- */}
      {activeTab === 'chisquare_cramers' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">

            {/* Left Chi-Square Test & Cramers V metric details (Swapped) */}
            <div className="xl:col-span-2 space-y-6">
              
              <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase text-gray-400 tracking-wider block font-mono">Statistical outcome</span>
                  <Award className="w-4 h-4 text-[#D4AF37]" />
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3 divide-x divide-gray-100">
                    <div className="text-center p-2 bg-gray-50 rounded-lg">
                      <span className="text-[9px] text-gray-400 font-bold uppercase block leading-none">Chi-Square Sum (χ²)</span>
                      <span className="text-xl font-mono font-black text-[#0B1F3A] mt-1.5 block">
                        {chiSquareStatsInput.chiSquare.toFixed(2)}
                      </span>
                      <span className="text-[8px] text-gray-400 font-mono mt-1 block">Degrees of Freedom: 2</span>
                    </div>

                    <div className="text-center p-2 bg-amber-50/25 rounded-lg border border-amber-100">
                      <span className="text-[9px] text-[#a48624] font-bold uppercase block leading-none">Cramér's V (Effect)</span>
                      <span className="text-xl font-mono font-black text-[#D4AF37] mt-1.5 block">
                        {chiSquareStatsInput.cramersV.toFixed(3)}
                      </span>
                      <span className="text-[8px] text-gray-400 font-sans mt-1 block">Binary Targets</span>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 border-t text-xs">
                    <h4 className="font-bold text-gray-700 uppercase tracking-wide text-[10px]">Cramér's V Rating Scale:</h4>
                    <ul className="space-y-1 text-[11px] text-gray-500">
                      <li className="flex justify-between">
                        <span>V &lt; 0.1:</span> <span className="opacity-60 font-semibold">Trivial / No Association</span>
                      </li>
                      <li className="flex justify-between font-medium text-amber-700">
                        <span>0.1 ≤ V &lt; 0.3:</span> <span>Moderate Association</span>
                      </li>
                      <li className="flex justify-between font-bold text-green-750">
                        <span>V ≥ 0.3:</span> <span>Strong Association (Highly predictive)</span>
                      </li>
                    </ul>
                  </div>

                  <div className="p-3 bg-blue-50 text-blue-900 border border-blue-200 rounded-lg text-xs leading-normal">
                    <span className="font-bold block mb-0.5">Statistical Inference:</span>
                    Since the calculated Chi-Square value <span className="font-mono font-bold">{chiSquareStatsInput.chiSquare}</span> exceeds the critical threshold of 5.99 (at 2 degrees of freedom, p = 0.05), we strictly reject $H_0$. Employment tenure exhibits a statistically non-random, robust predictive relationship with repayment risks.
                  </div>
                </div>

              </div>

              {/* Point Biserial Continuous separation helper */}
              <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-3">
                <span className="text-[10px] font-bold uppercase text-gray-400 tracking-wider block font-mono">Point-Biserial Detailed Work Log</span>
                
                <div className="space-y-2 text-xs font-mono text-gray-700">
                  <div className="flex justify-between border-b pb-1 text-[11px]">
                    <span className="font-sans text-gray-500">Continuous Target Key:</span>
                    <span className="font-bold text-[#0B1F3A] uppercase font-sans pr-1">{selectedIvFeature}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Mean of Event class (m1 - Bads/Defaults):</span>
                    <span className="font-extrabold text-red-650">{activeBiserialStats.m1.toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Mean of Non-Event (m0 - Goods/Solvents):</span>
                    <span className="font-extrabold text-green-750">{activeBiserialStats.m0.toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pooled Sample Deviation (s_x):</span>
                    <span className="text-[#0B1F3A]">{activeBiserialStats.s.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t-2">
                    <span>PB Correlation Coefficient $r_{`pb`}$:</span>
                    <span className="font-black text-[#D4AF37] text-sm bg-[#0B1F3A] px-2 py-0.5 rounded-lg border">{activeBiserialStats.rpb.toFixed(4)}</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Right table of Observed vs Expected counts (Swapped) */}
            <div className="xl:col-span-3 bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#0B1F3A]">
                  Observed vs Expected Cross-Tabulation Grid
                </h3>
                <p className="text-[10px] text-gray-400 mt-1">
                  Categorized variable mapped from **Employment Tenure** to test statistical association against Default Status.
                </p>
              </div>

              {/* Grid content */}
              <div className="overflow-x-auto border border-gray-150 rounded-xl">
                <table className="w-full text-xs text-left text-gray-600 border-collapse">
                  <thead className="bg-[#0B1F3A]/5 text-[#0B1F3A] uppercase font-bold border-b border-gray-230 text-[10px]">
                    <tr>
                      <th className="p-3">Employment Tenure Bracket</th>
                      <th className="p-3 text-center">Solvent observed (Expected)</th>
                      <th className="p-3 text-center">Default observed (Expected)</th>
                      <th className="p-3 text-center">Row sum</th>
                      <th className="p-3 text-right">Chi-Square Part</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-[11px] font-mono">
                    {chiSquareStatsInput.rows.map((row, i) => (
                      <tr key={i} className="hover:bg-gray-55/50 font-medium">
                        <td className="p-3 font-sans font-bold text-gray-800">
                          {row.name}
                        </td>
                        <td className="p-3 text-center text-green-750">
                          {row.observedGoods} <span className="text-gray-400 text-[9px]">({row.expectedGoods})</span>
                        </td>
                        <td className="p-3 text-center text-red-750">
                          {row.observedBads} <span className="text-gray-400 text-[9px]">({row.expectedBads})</span>
                        </td>
                        <td className="p-3 text-center font-sans text-gray-500">
                          {row.total}
                        </td>
                        <td className="p-3 text-right text-indigo-700 font-bold">
                          {row.totalChiSqPart.toFixed(3)}
                        </td>
                      </tr>
                    ))}
                    {/* Totals row */}
                    <tr className="bg-gray-50/55 font-bold border-t-2 border-gray-200 text-gray-800">
                      <td className="p-3 font-sans">Grand Totals</td>
                      <td className="p-3 text-center">{chiSquareStatsInput.overallGoods}</td>
                      <td className="p-3 text-center">{chiSquareStatsInput.overallBads}</td>
                      <td className="p-3 text-center">{chiSquareStatsInput.totalCount}</td>
                      <td className="p-3 text-right text-indigo-800 font-black">
                        {chiSquareStatsInput.chiSquare.toFixed(2)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Math logs worked example */}
              <div className="bg-[#0B1F3A]/5 border border-[#0B1F3A]/10 rounded-xl p-4 text-xs space-y-2.5">
                <span className="font-bold text-[#0B1F3A] uppercase tracking-wide block text-[10px]">What This Chi-Square Tells Us</span>
                <p className="text-gray-650 leading-relaxed">
                  The Pearson Chi-Square ($\chi^2$) test of independence answers whether default occurrence distributions differ significantly across employment segments. Under the null hypothesis $H_0$, default probability is constant across all divisions:
                </p>
                <code className="block bg-white border rounded p-2 text-[11px] text-gray-700 font-mono">
                  Expected_Events = (Category_Total * Total_Events) / Grand_Total
                  <br />
                  ChiSquare_ContributionFraction = (Observed - Expected)^2 / Expected
                </code>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* --- TAB 4: EDUCATIONAL STUDY NOTES MATCHING FNB SPECIFICATION --- */}
      {activeTab === 'fnb_notes' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

            {/* Step-by-Step Interactive worked math Sandbox (Swapped) */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-6">
              <div className="pb-3 border-b">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#0B1F3A] flex items-center gap-1">
                  <Database className="w-4 h-4 text-[#D4AF37]" />
                  Interactive Worked Math sandbox calculator
                </h3>
                <p className="text-[10px] text-gray-400 mt-1">
                  Input custom counts to observe Weight of Evidence ($WoE$) and Information Value ($IV$) equation solutions in real-time.
                </p>
              </div>

              <div className="space-y-4">
                {/* Global constants */}
                <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl border">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold text-gray-500 uppercase block leading-none">Global Defaulted/Bads</label>
                    <input
                      type="number"
                      value={sandboxGlobalBads}
                      onChange={(e) => setSandboxGlobalBads(Math.max(1, Number(e.target.value)))}
                      className="w-full bg-white border rounded p-1.5 text-xs font-mono font-bold outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold text-gray-500 uppercase block leading-none">Global Solvents/Goods</label>
                    <input
                      type="number"
                      value={sandboxGlobalGoods}
                      onChange={(e) => setSandboxGlobalGoods(Math.max(1, Number(e.target.value)))}
                      className="w-full bg-white border rounded p-1.5 text-xs font-mono font-bold outline-none"
                    />
                  </div>
                </div>

                {/* Specific bin controls */}
                <div className="grid grid-cols-2 gap-4 p-4 border border-dashed border-gray-205 rounded-xl">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold text-gray-500 uppercase block leading-none">Bin defaults (bads)</label>
                    <input
                      type="number"
                      value={sandboxBads}
                      onChange={(e) => setSandboxBads(Math.min(sandboxGlobalBads, Math.max(0, Number(e.target.value))))}
                      className="w-full bg-white border rounded p-1.5 text-xs font-mono font-bold outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-bold text-gray-500 uppercase block leading-none">Bin solvents (goods)</label>
                    <input
                      type="number"
                      value={sandboxGoods}
                      onChange={(e) => setSandboxGoods(Math.min(sandboxGlobalGoods, Math.max(0, Number(e.target.value))))}
                      className="w-full bg-white border rounded p-1.5 text-xs font-mono font-bold outline-none"
                    />
                  </div>
                </div>

                {/* Live worked formulas outputs */}
                <div className="bg-[#D4AF37]/5 border border-[#D4AF37]/25 rounded-xl p-4 space-y-4">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#a48624] block">Calculated outputs & formulas:</span>
                  
                  <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                    <div className="bg-white p-2.5 rounded border shadow-xs">
                      <span className="text-[8px] text-gray-400 block uppercase">1. Bad cohort Dist</span>
                      {sandboxBads} / {sandboxGlobalBads} = <span className="font-extrabold text-red-650">{calculatedSandboxWoeIv.distB.toFixed(4)}</span>
                    </div>
                    <div className="bg-white p-2.5 rounded border shadow-xs">
                      <span className="text-[8px] text-gray-400 block uppercase">2. Good cohort Dist</span>
                      {sandboxGoods} / {sandboxGlobalGoods} = <span className="font-extrabold text-green-750">{calculatedSandboxWoeIv.distG.toFixed(4)}</span>
                    </div>
                  </div>

                  <div className="bg-white p-3 rounded-lg border font-mono text-xs text-gray-700 leading-normal">
                    <div className="border-b pb-1.5 mb-1.5">
                      <span className="text-[8px] text-[#a48624] font-bold uppercase block leading-none mb-1">Calculated Weight of Evidence (WoE)</span>
                      WoE = ln(BadDist / GoodDist) = ln({calculatedSandboxWoeIv.distB.toFixed(4)} / {calculatedSandboxWoeIv.distG.toFixed(4)}) = <span className="font-black text-indigo-800">{calculatedSandboxWoeIv.woe.toFixed(5)}</span>
                    </div>
                    <div>
                      <span className="text-[8px] text-green-750 font-bold uppercase block leading-none mb-1">Calculated Partial Information Value (IV)</span>
                      Bin_IV = (BadDist - GoodDist) * WoE = ({calculatedSandboxWoeIv.distB.toFixed(4)} - {calculatedSandboxWoeIv.distG.toFixed(4)}) * {calculatedSandboxWoeIv.woe.toFixed(5)} = <span className="font-black text-green-700">{calculatedSandboxWoeIv.iv.toFixed(5)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Textbook contents replica (Swapped) */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-6">
              <div className="pb-4 border-b">
                <span className="text-[10px] uppercase font-bold text-[#D4AF37] tracking-wider block font-mono">Senior Division Journal • Review Paper</span>
                <h3 className="text-base font-bold text-[#0B1F3A] mt-0.5 select-none text-paragraph">
                  Bivariate Analysis in Credit Risk scorecards
                </h3>
                <span className="text-[9px] text-[#0B1F3A] font-mono leading-none">FNB DataQuest Team 2026</span>
              </div>

              <div className="space-y-4 text-xs text-gray-600 leading-relaxed">
                <div>
                  <h4 className="font-extrabold text-[#0B1F3A] uppercase text-[10px] mb-1.5 tracking-wide">1. Core Objectives</h4>
                  <p>
                    Bivariate analysis is the simultaneous exploration of exactly two features. In credit risk, it establishes the empirical justification for feature selection. It answers whether a variable like *DTI Ratio* possesses genuine explanatory power regarding defaulting, and unspans the Weight of Evidence (WoE) mapping for logistic regressions.
                  </p>
                </div>

                <div>
                  <h4 className="font-extrabold text-[#0B1F3A] uppercase text-[10px] mb-1.5 tracking-wide">2. Weight of Evidence (WoE) & Information Value (IV)</h4>
                  <p>
                    Originated by Fair Isaac (FICO), WoE converts a binned predictor range to a relative log-odds metric:
                  </p>
                  <code className="block bg-gray-50 border p-2 rounded text-gray-700 font-mono mt-1 mb-2 leading-tight">
                    WoE_i = ln( (B_i / Total_Bads) / (G_i / Total_Goods) )
                  </code>
                  <p>
                    By summing over all bins, we calculate the Information Value (IV):
                  </p>
                  <code className="block bg-gray-50 border p-2 rounded text-gray-700 font-mono mt-1 mb-2 leading-tight">
                    IV = Sum( (BadDist_i - GoodDist_i) * WoE_i )
                  </code>
                  <p className="font-bold text-gray-800 mt-2">Siddiqi Thresholds:</p>
                  <ul className="list-disc list-inside space-y-1 pl-1 mt-1 text-[11px]">
                    <li>IV &lt; 0.02: Useless Predictor</li>
                    <li>0.02 to 0.10: Weak Predictor</li>
                    <li>0.10 to 0.30: Medium Predictor</li>
                    <li>0.30 to 0.50: Strong Predictor</li>
                    <li>IV &gt; 0.50: Suspicious (possible look-ahead data leakage!)</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-extrabold text-[#0B1F3A] uppercase text-[10px] mb-1.5 tracking-wide">3. Continuous Multicollinearity Checking</h4>
                  <p>
                    While Pearson correlation gauges *linear* associations, Spearman rank correlation ($\rho$) assesses *monotonic* relationships by working on ranks. If two candidate variables carry a correlation absolute value exceeding 0.70, drop the weaker one to satisfy model stability requirements.
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
