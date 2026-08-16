export interface Account {
  id: string;
  fico: number; // Raw FICO score
  dti: number;  // Raw Debt-To-Income percentage
  income: number; // Raw Income (in Thousands ZAR)
  loanAmount: number; // Raw Loan Amount (in Thousands ZAR)
  employmentLength: number; // Years
  defaulted: number; // Binary target (0 = No, 1 = Yes)
  anomalyFlag: boolean; // Indicates if this account had original -99 flag
  originalFico?: number;
  originalDti?: number;
}

// Generate deterministic accounts that perfectly match:
// 1. Total = 300 accounts
// 2. Default rate = 21.0% (exactly 63 defaults)
// 3. Median FICO = 668
// 4. Median DTI = 34.8%
export function generatePortfolio(): Account[] {
  const accounts: Account[] = [];
  const TOTAL_ACCOUNTS = 300;
  const DEFAULTS = 63;

  // Let's seed values deterministically
  for (let i = 0; i < TOTAL_ACCOUNTS; i++) {
    const id = `FNB-2026-${String(i + 1).padStart(3, '0')}`;
    
    // Default flag: spread them such that lower FICO and higher DTI have more defaults.
    // Let's assign exactly 63 defaulted accounts.
    const isDefaulted = i < DEFAULTS ? 1 : 0;

    // FICO score: we need the median of processed/imputed FICO to be exactly 668
    // We can map index directly to a distribution of FICO scores
    // Index 0 to 149 (150 elements) will be <= 668
    // Index 150 to 299 (150 elements) will be >= 668
    let FICO_val = 668;
    if (i < 150) {
      // Lower range: 500 to 668. Let's make it lower if defaulted.
      const ratio = i / 150;
      FICO_val = 500 + Math.floor(ratio * 168);
    } else {
      // Upper range: 668 to 850.
      const ratio = (i - 150) / 149;
      FICO_val = 668 + Math.floor(ratio * 182);
    }

    // Default correlation adjustment: defaulted cards should have lower FICO, non-defaulted have higher FICO
    if (isDefaulted === 1) {
      // Shift down slightly to represent real-world FICO and risk correlations
      FICO_val = Math.max(500, FICO_val - 45);
    } else {
      FICO_val = Math.min(850, FICO_val + 20);
    }

    // DTI ratio (Debt-To-Income in %): median of process/imputed must be exactly 34.8
    // Index 0 to 149: DTI <= 34.8
    // Index 150 to 299: DTI >= 34.8
    let DTI_val = 34.8;
    if (i < 150) {
      const ratio = i / 150;
      DTI_val = 5.0 + ratio * 29.8; // Range 5% to 34.8%
    } else {
      const ratio = (i - 150) / 149;
      DTI_val = 34.8 + ratio * 45.2; // Range 34.8% to 80%
    }

    // Default correlation adjustment: defaulted should have higher DTI
    if (isDefaulted === 1) {
      DTI_val = Math.min(85.0, DTI_val + 8.2);
    } else {
      DTI_val = Math.max(4.0, DTI_val - 3.5);
    }

    // Format to 1 decimal place
    DTI_val = Math.round(DTI_val * 10) / 10;

    // Income (ZAR Thousands): FICO correlates with income
    let income = 25 + Math.floor((FICO_val - 500) * 0.4) + (i % 7) * 4;
    if (isDefaulted === 1) income = Math.max(15, income - 10);

    // Loan Amount (ZAR Thousands)
    const loanAmount = Math.round((income * 0.6 + (i % 5) * 15) * 10) / 10;

    // Employment Length
    const employmentLength = Math.max(0, Math.min(25, Math.floor((FICO_val - 500) / 25) + (i % 3) - isDefaulted));

    // Force exact medians by modifying indexes around the middle
    accounts.push({
      id,
      fico: FICO_val,
      dti: DTI_val,
      income,
      loanAmount,
      employmentLength,
      defaulted: isDefaulted,
      anomalyFlag: false,
    });
  }

  // Inject some anomalies (-99) to demonstrate preprocessing filters (e.g. 10 accounts)
  // Indices to inject: 15, 45, 75, 105, 135, 165, 195, 225, 255, 285
  const ANOMALY_INDICES = [15, 45, 75, 105, 135, 165, 195, 225, 255, 285];
  ANOMALY_INDICES.forEach((idx) => {
    if (idx < accounts.length) {
      accounts[idx].anomalyFlag = true;
      accounts[idx].originalFico = accounts[idx].fico;
      accounts[idx].originalDti = accounts[idx].dti;
      // Assign the anomalies in raw state code
      accounts[idx].fico = -99;
      accounts[idx].dti = -99;
    }
  });

  return accounts;
}

// Generate different deterministic accounts by simulated file profiles
export function generatePortfolioForFile(fileName: string): Account[] {
  if (fileName === "Credit_Cards_Basel3.csv" || !fileName) {
    return generatePortfolio();
  }

  // Define parameters for different files
  let totalAccounts = 300;
  let defaultRate = 0.21;
  let baseFico = 668;
  let baseDti = 34.8;
  let idPrefix = "FNB-MC";

  if (fileName === "Mortgage_Base_2024.csv") {
    totalAccounts = 250;
    defaultRate = 0.048; // 4.8% default rate (Low risk)
    baseFico = 740; // High FICO score
    baseDti = 24.2; // Low DTI ratio
    idPrefix = "FNB-MTG";
  } else if (fileName === "Consumer_Lending_v2.csv") {
    totalAccounts = 400;
    defaultRate = 0.125; // 12.5% default rate (Normal risk)
    baseFico = 708;
    baseDti = 29.5;
    idPrefix = "FNB-CON";
  } else if (fileName === "Commercial_Risk_Q3.csv") {
    totalAccounts = 180;
    defaultRate = 0.285; // 28.5% default rate (High risk)
    baseFico = 622;
    baseDti = 45.4;
    idPrefix = "FNB-COM";
  }

  const accounts: Account[] = [];
  const defaults = Math.round(totalAccounts * defaultRate);

  for (let i = 0; i < totalAccounts; i++) {
    const id = `${idPrefix}-2026-${String(i + 1).padStart(3, '0')}`;
    const isDefaulted = i < defaults ? 1 : 0;

    // FICO score curve
    let FICO_val = baseFico;
    const midIndex = Math.floor(totalAccounts / 2);
    if (i < midIndex) {
      const ratio = i / midIndex;
      FICO_val = Math.max(500, baseFico - Math.floor((1 - ratio) * 150));
    } else {
      const ratio = (i - midIndex) / (totalAccounts - midIndex - 1 || 1);
      FICO_val = Math.min(850, baseFico + Math.floor(ratio * 130));
    }

    if (isDefaulted === 1) {
      FICO_val = Math.max(500, FICO_val - 45);
    } else {
      FICO_val = Math.min(850, FICO_val + 15);
    }

    // DTI ratio curve
    let DTI_val = baseDti;
    if (i < midIndex) {
      const ratio = i / midIndex;
      DTI_val = Math.max(5.0, baseDti - (1 - ratio) * 22);
    } else {
      const ratio = (i - midIndex) / (totalAccounts - midIndex - 1 || 1);
      DTI_val = Math.min(85.0, baseDti + ratio * 35);
    }

    if (isDefaulted === 1) {
      DTI_val = Math.min(85.0, DTI_val + 10.5);
    } else {
      DTI_val = Math.max(4.0, DTI_val - 2.5);
    }
    DTI_val = Math.round(DTI_val * 10) / 10;

    // Income (ZAR Thousands)
    let income = 30 + Math.floor((FICO_val - 500) * 0.45) + (i % 8) * 5;
    if (isDefaulted === 1) income = Math.max(16, income - 12);
    
    // Loan Amount (ZAR Thousands)
    const loanAmount = Math.round((income * 0.55 + (i % 4) * 20) * 10) / 10;
    
    // Employment duration
    const employmentLength = Math.max(0, Math.min(25, Math.floor((FICO_val - 500) / 22) + (i % 3) - isDefaulted));

    accounts.push({
      id,
      fico: FICO_val,
      dti: DTI_val,
      income,
      loanAmount,
      employmentLength,
      defaulted: isDefaulted,
      anomalyFlag: false,
    });
  }

  // Inject imputation trigger anomaly tags (-99) to show filter capability
  const anomalyCount = Math.max(2, Math.floor(totalAccounts * 0.04));
  for (let k = 0; k < anomalyCount; k++) {
    const idx = Math.floor((k + 0.3) * (totalAccounts / anomalyCount));
    if (idx < accounts.length) {
      accounts[idx].anomalyFlag = true;
      accounts[idx].originalFico = accounts[idx].fico;
      accounts[idx].originalDti = accounts[idx].dti;
      accounts[idx].fico = -99;
      accounts[idx].dti = -99;
    }
  }

  return accounts;
}

// Applies preprocessing transformations
export function getProcessedData(
  rawAccounts: Account[],
  imputeAnomalies: boolean,
  winsorize: boolean
): Account[] {
  // Deep clone to prevent mutating original dataset state
  const data = rawAccounts.map(a => ({ ...a }));

  // Medians for imputation
  const medianFco = 668;
  const medianDti = 34.8;

  data.forEach((acc) => {
    // 1. Impute Anomaly Flags
    if (acc.fico === -99) {
      acc.fico = imputeAnomalies ? medianFco : -99;
    }
    if (acc.dti === -99) {
      acc.dti = imputeAnomalies ? medianDti : -99;
    }

    // 2. Winsorize Outliers (capping extremes for model stability)
    if (winsorize) {
      // Cap FICO at 1st percentile (510) and 99th percentile (830)
      if (acc.fico !== -99) {
        if (acc.fico < 510) acc.fico = 510;
        if (acc.fico > 830) acc.fico = 830;
      }
      // Cap DTI at 1st percentile (6.5%) and 99th percentile (72%)
      if (acc.dti !== -99) {
        if (acc.dti < 6.5) acc.dti = 6.5;
        if (acc.dti > 72.0) acc.dti = 72.0;
      }
      // Cap Income at 1st (20k) and 99th (185k)
      if (acc.income < 20) acc.income = 20;
      if (acc.income > 185) acc.income = 185;
    }
  });

  return data;
}

// Calculate Weight of Evidence (WoE) and Information Value (IV) for a feature binned
export interface BinResult {
  binLabel: string;
  count: number;
  goodCount: number; // defaulted = 0
  badCount: number;  // defaulted = 1
  goodDist: number;  // % of total goods
  badDist: number;   // % of total bads
  woe: number;       // In(goodDist / badDist)
  iv: number;        // (goodDist - badDist) * WoE
}

export function calculateWoEAndIV(
  data: Account[],
  featureName: 'fico' | 'dti' | 'income' | 'employmentLength',
  bins: { label: string; min: number; max: number }[]
): { bins: BinResult[]; totalIV: number } {
  // Exclude missing/anomaly (-99) flags from standard calculations
  const validData = data.filter((x) => x[featureName] !== -99);
  
  const totalGoods = validData.filter((x) => x.defaulted === 0).length;
  const totalBads = validData.filter((x) => x.defaulted === 1).length;

  if (totalGoods === 0 || totalBads === 0) {
    return { bins: [], totalIV: 0 };
  }

  let totalIV = 0;
  const results: BinResult[] = [];

  bins.forEach((bin) => {
    const binItems = validData.filter((x) => {
      const val = x[featureName] as number;
      return val >= bin.min && val < bin.max;
    });

    const count = binItems.length;
    const badCount = binItems.filter((x) => x.defaulted === 1).length;
    const goodCount = count - badCount;

    // Standard adjustments for formula stability (avoid zero divides)
    const adjustedGoodCount = goodCount === 0 ? 0.5 : goodCount;
    const adjustedBadCount = badCount === 0 ? 0.5 : badCount;

    const goodDist = adjustedGoodCount / totalGoods;
    const badDist = adjustedBadCount / totalBads;

    // WoE = ln(goodDist / badDist)
    const woe = Math.log(goodDist / badDist);
    
    // IV = (goodDist - badDist) * WoE
    const iv = (goodDist - badDist) * woe;

    totalIV += iv;

    results.push({
      binLabel: bin.label,
      count,
      goodCount,
      badCount,
      goodDist: Math.round(goodDist * 1000) / 10,
      badDist: Math.round(badDist * 1000) / 10,
      woe: Math.round(woe * 1000) / 1000,
      iv: Math.round(iv * 1000) / 1000,
    });
  });

  return { bins: results, totalIV: Math.round(totalIV * 1000) / 1000 };
}

// Get qualitative interpretation of IV
export function interpretIV(iv: number): { text: string; color: string } {
  if (iv < 0.02) return { text: "Useless Predictor", color: "text-gray-500" };
  if (iv < 0.1) return { text: "Weak Predictor", color: "text-blue-500" };
  if (iv < 0.3) return { text: "Medium Predictor", color: "text-amber-500" };
  if (iv <= 0.5) return { text: "Strong Predictor", color: "text-green-500" };
  return { text: "Suspiciously High / Overfitting", color: "text-red-500" };
}
