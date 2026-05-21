import React, { useState, useMemo } from 'react';

// --- TYPE DEFINITIONS & MOCK DATA GENERATION ---
interface Applicant {
  id: number;
  fico: number;     // Raw FICO score, contains -99 anomalies and outliers
  dti: number;      // Debt-to-Income ratio (%), contains -99 anomalies
  income: number;   // Monthly income in USD
  defaulted: number; // 1 = Default, 0 = Fully Paid
}

// Generates 250 simulated credit book records with realistic risk relationships and anomalies
const generateMockData = (): Applicant[] => {
  const data: Applicant[] = [];
  for (let i = 1; i <= 250; i++) {
    const isAnomaly = i % 15 === 0;
    const isOutlier = i % 22 === 0;
    
    // Default relationships: Higher FICO = lower risk; Higher DTI = higher risk
    let fico = Math.floor(500 + Math.random() * 300);
    let dti = Math.floor(10 + Math.random() * 55);
    let income = Math.floor(3000 + Math.random() * 9000);
    
    if (isAnomaly) {
      fico = -99; // Missing data placeholder
      dti = -99;  // Missing data placeholder
    } else if (isOutlier) {
      fico = 950; // Extreme invalid outlier
      dti = 140;  // Extreme outlier
    }

    // Determine baseline probability of default
    let trueFico = fico === -99 ? 620 : fico;
    let trueDti = dti === -99 ? 40 : dti;
    let linearPredictor = 4.5 - (0.01 * trueFico) + (0.04 * trueDti) - (0.0001 * income);
    let prob = 1 / (1 + Math.exp(-linearPredictor));
    let defaulted = Math.random() < prob ? 1 : 0;

    data.push({ id: i, fico, dti, income, defaulted });
  }
  return data;
};

const RAW_DATASET = generateMockData();

export default function App() {
  // Navigation State
  const [activeTab, setActiveTab] = useState<'eda' | 'cleaning' | 'model' | 'scorecard'>('eda');

  // Preprocessing Module States
  const [imputeMissing, setImputeMissing] = useState<boolean>(true);
  const [winsorizeOutliers, setWinsorizeOutliers] = useState<boolean>(true);

  // Model Parameter Sliders (Logistic Regression Coefficients)
  const [beta0, setBeta0] = useState<number>(4.5);
  const [betaFico, setBetaFico] = useState<number>(-0.010);
  const [betaDti, setBetaDti] = useState<number>(0.045);
  const [betaIncome, setBetaIncome] = useState<number>(-0.00015);
  const [riskThreshold, setRiskThreshold] = useState<number>(25); // Risk threshold in %

  // Applicant Simulator State
  const [simFico, setSimFico] = useState<number>(710);
  const [simDti, setSimDti] = useState<number>(35);
  const [simIncome, setSimIncome] = useState<number>(6500);

  // EDA View Filters
  const [ficoFilter, setFicoFilter] = useState<number>(550);
  const [dtiFilter, setDtiFilter] = useState<number>(60);

  // --- ENGINE 1: DATA CLEANING TRANSFORMATION PIPELINE ---
  const processedData = useMemo(() => {
    return RAW_DATASET.map(app => {
      let cleanFico = app.fico;
      let cleanDti = app.dti;

      // Handle Missing Value Anomalies (-99)
      if (imputeMissing) {
        if (app.fico === -99) cleanFico = 675; // Impute Median FICO
        if (app.dti === -99) cleanDti = 36;    // Impute Median DTI
      }

      // Handle Outliers using Winsorization
      if (winsorizeOutliers) {
        if (cleanFico > 850) cleanFico = 850;
        if (cleanFico < 300 && cleanFico !== -99) cleanFico = 300;
        if (cleanDti > 65) cleanDti = 65;
      }

      return { ...app, fico: cleanFico, dti: cleanDti };
    });
  }, [imputeMissing, winsorizeOutliers]);

  // --- ENGINE 2: LIVE METRICS AND FILTERS ---
  const filteredData = useMemo(() => {
    return processedData.filter(app => {
      if (app.fico !== -99 && app.fico < ficoFilter) return false;
      if (app.dti !== -99 && app.dti > dtiFilter) return false;
      return true;
    });
  }, [processedData, ficoFilter, dtiFilter]);

  const stats = useMemo(() => {
    const total = filteredData.length;
    if (total === 0) return { total: 0, defaultRate: 0, avgFico: 0, avgDti: 0 };
    const defaults = filteredData.filter(a => a.defaulted === 1).length;
    const validFico = filteredData.filter(a => a.fico !== -99);
    const validDti = filteredData.filter(a => a.dti !== -99);
    
    return {
      total,
      defaultRate: ((defaults / total) * 100).toFixed(1),
      avgFico: validFico.length ? Math.round(validFico.reduce((sum, a) => sum + a.fico, 0) / validFico.length) : 0,
      avgDti: validDti.length ? Math.round(validDti.reduce((sum, a) => sum + a.dti, 0) / validDti.length) : 0
    };
  }, [filteredData]);

  // --- ENGINE 3: INTERPRETABLE SCORING CALCULATIONS ---
  const simulatorResults = useMemo(() => {
    // Linear Predictor (eta) calculation
    const eta = beta0 + (betaFico * simFico) + (betaDti * simDti) + (betaIncome * simIncome);
    // Sigmoid function mapping to default probability
    const pDefault = 1 / (1 + Math.exp(-eta));
    const pDefaultPct = pDefault * 100;
    const approved = pDefaultPct < riskThreshold;

    // Credit Scorecard points conversion math
    // Score = Factor * (eta) + Offset
    const factor = 28.85; // Double odds every 20 points
    const offset = 600;
    
    const basePoints = Math.round(offset + factor * beta0);
    const ficoPoints = Math.round(factor * betaFico * simFico);
    const dtiPoints = Math.round(factor * betaDti * simDti);
    const incomePoints = Math.round(factor * betaIncome * simIncome);
    const totalCreditScore = Math.max(300, Math.min(850, basePoints + ficoPoints + dtiPoints + incomePoints));

    return {
      eta: eta.toFixed(4),
      prob: pDefaultPct.toFixed(1),
      approved,
      totalCreditScore,
      breakdown: { basePoints, ficoPoints, dtiPoints, incomePoints }
    };
  }, [simFico, simDti, simIncome, beta0, betaFico, betaDti, betaIncome, riskThreshold]);

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'system-ui, sans-serif', backgroundColor: '#f3f4f6', margin: 0 }}>
      
      {/* SIDEBAR NAVIGATION PANEL */}
      <div style={{ width: '280px', backgroundColor: '#1e293b', color: '#f8fafc', padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', margin: '0 0 8px 0', color: '#38bdf8' }}>DataQuest 2026</h2>
          <p style={{ fontSize: '12px', color: '#94a3b8', margin: '0 0 24px 0' }}>Credit Risk Analytics Framework</p>
          
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button 
              onClick={() => setActiveTab('eda')}
              style={{ padding: '12px', textAlign: 'left', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: '6px', fontSize: '14px', backgroundColor: activeTab === 'eda' ? '#3b82f6' : 'transparent', color: '#fff', transition: '0.2s' }}>
              📊 Interactive EDA Tool
            </button>
            <button 
              onClick={() => setActiveTab('cleaning')}
              style={{ padding: '12px', textAlign: 'left', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: '6px', fontSize: '14px', backgroundColor: activeTab === 'cleaning' ? '#3b82f6' : 'transparent', color: '#fff', transition: '0.2s' }}>
              ⚙️ Data Preprocessing Pipeline
            </button>
            <button 
              onClick={() => setActiveTab('model')}
              style={{ padding: '12px', textAlign: 'left', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: '6px', fontSize: '14px', backgroundColor: activeTab === 'model' ? '#3b82f6' : 'transparent', color: '#fff', transition: '0.2s' }}>
              📈 Logistic Prediction Engine
            </button>
            <button 
              onClick={() => setActiveTab('scorecard')}
              style={{ padding: '12px', textAlign: 'left', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: '6px', fontSize: '14px', backgroundColor: activeTab === 'scorecard' ? '#3b82f6' : 'transparent', color: '#fff', transition: '0.2s' }}>
              🎯 FICO Credit Scorecard
            </button>
          </nav>
        </div>

        {/* PERSISTENT GLOBAL PIPELINE CONTROLS */}
        <div style={{ backgroundColor: '#334155', padding: '16px', borderRadius: '8px', fontSize: '13px' }}>
          <h4 style={{ margin: '0 0 12px 0', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Data Layer Controls</h4>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', cursor: 'pointer' }}>
            <input type="checkbox" checked={imputeMissing} onChange={(e) => setImputeMissing(e.target.checked)} />
            Impute Missing Flags (-99)
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input type="checkbox" checked={winsorizeOutliers} onChange={(e) => setWinsorizeOutliers(e.target.checked)} />
            Winsorize Outliers
          </label>
        </div>
      </div>

      {/* MAIN VIEWPORT COMPONENT */}
      <div style={{ flex: 1, padding: '32px', overflowY: 'auto', boxSizing: 'border-box' }}>
        
        {/* TOP LIVE KPI DISPLAY STRIP */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
          <div style={{ backgroundColor: '#fff', padding: '16px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <div style={{ color: '#6b7280', fontSize: '12px', fontWeight: '6px' }}>PORTFOLIO EXPOSURE</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#111827' }}>{stats.total} Applicants</div>
          </div>
          <div style={{ backgroundColor: '#fff', padding: '16px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <div style={{ color: '#6b7280', fontSize: '12px', fontWeight: '6px' }}>OBSERVED DEFAULT RATE</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ef4444' }}>{stats.defaultRate}%</div>
          </div>
          <div style={{ backgroundColor: '#fff', padding: '16px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <div style={{ color: '#6b7280', fontSize: '12px', fontWeight: '6px' }}>PORTFOLIO AVG FICO</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#10b981' }}>{stats.avgFico}</div>
          </div>
          <div style={{ backgroundColor: '#fff', padding: '16px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <div style={{ color: '#6b7280', fontSize: '12px', fontWeight: '6px' }}>PORTFOLIO AVG DTI</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#3b82f6' }}>{stats.avgDti}%</div>
          </div>
        </div>

        {/* SCREEN 1: INTERACTIVE EXPLORATORY DATA ANALYSIS (EDA) */}
        {activeTab === 'eda' && (
          <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '18px' }}>Risk Factor Isolation Grid</h3>
            <p style={{ color: '#6b7280', fontSize: '14px', margin: '0 0 20px 0' }}>Explore the dual-axis credit risk distributions. Green elements represents reliable accounts; Red elements isolates defaulted loans.</p>
            
            <div style={{ display: 'flex', gap: '24px', marginBottom: '24px', backgroundColor: '#f8fafc', padding: '16px', borderRadius: '8px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '4px' }}>Minimum FICO Constraint: {ficoFilter}</label>
                <input type="range" min="300" max="800" step="10" value={ficoFilter} onChange={(e) => setFicoFilter(Number(e.target.value))} style={{ width: '100%' }} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '4px' }}>Maximum DTI Constraint: {dtiFilter}%</label>
                <input type="range" min="20" max="100" step="5" value={dtiFilter} onChange={(e) => setDtiFilter(Number(e.target.value))} style={{ width: '100%' }} />
              </div>
            </div>

            {/* SVG INTERACTIVE GRAPHICS ENGINE */}
            <div style={{ position: 'relative', width: '100%', height: '360px', border: '1px solid #e5e7eb', borderRadius: '8px', backgroundColor: '#fafafa' }}>
              <svg width="100%" height="100%" style={{ overflow: 'visible' }}>
                {/* Graph Axis labels */}
                <text x="50%" y="350" textAnchor="middle" style={{ fontSize: '12px', fill: '#6b7280' }}>Credit Bureau Score (FICO)</text>
                <text x="25" y="50%" textAnchor="middle" transform="rotate(-90 25 180)" style={{ fontSize: '12px', fill: '#6b7280' }}>Debt-to-Income Ratio (DTI %)</text>
                
                {/* Chart Grid Render */}
                {filteredData.map((app, idx) => {
                  // Coordinate translation equations
                  // FICO range mapping: 300-850 to SVG width margins
                  let xPos = 80 + ((app.fico - 300) / (850 - 300)) * (600);
                  // DTI range mapping: 0-100 to SVG height margins
                  let yPos = 300 - (app.dti / 100) * 260;

                  if (app.fico === -99 || app.dti === -99) {
                    // Place raw anomalies in a separate warning bucket indicator on left axis
                    xPos = 40;
                    yPos = 300 - (idx * 1.2);
                  }

                  return (
                    <circle 
                      key={app.id}
                      cx={xPos}
                      cy={yPos}
                      r={app.fico === -99 ? "4" : "6"}
                      fill={app.fico === -99 ? "#6b7280" : app.defaulted === 1 ? "#ef4444" : "#10b981"}
                      opacity={app.fico === -99 ? "0.4" : "0.75"}
                      stroke="#fff"
                      strokeWidth="1"
                    />
                  );
                })}
              </svg>
              <div style={{ position: 'absolute', bottom: '16px', right: '16px', backgroundColor: '#fff', padding: '8px', borderRadius: '4px', border: '1px solid #e5e7eb', fontSize: '11px', display: 'flex', gap: '12px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ display: 'inline-block', width: '10px', height: '10px', backgroundColor: '#10b981', borderRadius: '50%' }}></span> Non-Default</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ display: 'inline-block', width: '10px', height: '10px', backgroundColor: '#ef4444', borderRadius: '50%' }}></span> Defaulted</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ display: 'inline-block', width: '10px', height: '10px', backgroundColor: '#6b7280', borderRadius: '50%' }}></span> Uncleaned Anomaly (-99)</span>
              </div>
            </div>
          </div>
        )}

        {/* SCREEN 2: DATA PREPROCESSING PIPELINE INSPECTOR */}
        {activeTab === 'cleaning' && (
          <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '18px' }}>Data Cleaning Matrix & Quality Framework</h3>
            <p style={{ color: '#6b7280', fontSize: '14px', margin: '0 0 24px 0' }}>Toggle the structural data layers in the sidebar to observe how dirty historical inputs affect data consistency.</p>
            
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                  <th style={{ padding: '12px' }}>Applicant ID</th>
                  <th style={{ padding: '12px' }}>FICO Input State</th>
                  <th style={{ padding: '12px' }}>DTI Input State</th>
                  <th style={{ padding: '12px' }}>Monthly Income</th>
                  <th style={{ padding: '12px' }}>Risk Target</th>
                </tr>
              </thead>
              <tbody>
                {RAW_DATASET.slice(0, 10).map((rawApp) => {
                  const procApp = processedData.find(p => p.id === rawApp.id)!;
                  const isFicoModified = rawApp.fico !== procApp.fico;
                  const isDtiModified = rawApp.dti !== procApp.dti;

                  return (
                    <tr key={rawApp.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '12px', fontWeight: 'bold' }}>#{rawApp.id}</td>
                      <td style={{ padding: '12px' }}>
                        {isFicoModified ? (
                          <span><span style={{ textDecoration: 'line-through', color: '#ef4444', marginRight: '8px' }}>{rawApp.fico}</span> 👉 <span style={{ color: '#10b981', fontWeight: 'bold' }}>{procApp.fico}</span></span>
                        ) : (
                          <span style={{ color: rawApp.fico === -99 ? '#ef4444' : '#111827' }}>{rawApp.fico}</span>
                        )}
                      </td>
                      <td style={{ padding: '12px' }}>
                        {isDtiModified ? (
                          <span><span style={{ textDecoration: 'line-through', color: '#ef4444', marginRight: '8px' }}>{rawApp.dti}%</span> 👉 <span style={{ color: '#10b981', fontWeight: 'bold' }}>{procApp.dti}%</span></span>
                        ) : (
                          <span style={{ color: rawApp.dti === -99 ? '#ef4444' : '#111827' }}>{rawApp.dti}%</span>
                        )}
                      </td>
                      <td style={{ padding: '12px' }}>${rawApp.income.toLocaleString()}</td>
                      <td style={{ padding: '12px' }}>
                        <span style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold', backgroundColor: rawApp.defaulted === 1 ? '#fee2e2' : '#d1fae5', color: rawApp.defaulted === 1 ? '#991b1b' : '#065f46' }}>
                          {rawApp.defaulted === 1 ? 'DEFAULT' : 'PAID'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* SCREEN 3: LOGISTIC PREDICTION ENGINE */}
        {activeTab === 'model' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            
            {/* Equation Slider Configurations */}
            <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '17px' }}>Mathematical Model Calibration</h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '4px' }}>Intercept (β₀): {beta0}</label>
                  <input type="range" min="-2" max="8" step="0.1" value={beta0} onChange={(e) => setBeta0(Number(e.target.value))} style={{ width: '100%' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '4px' }}>FICO Coeff (β₁): {betaFico}</label>
                  <input type="range" min="-0.05" max="0.01" step="0.001" value={betaFico} onChange={(e) => setBetaFico(Number(e.target.value))} style={{ width: '100%' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '4px' }}>DTI Coeff (β₂): {betaDti}</label>
                  <input type="range" min="-0.01" max="0.15" step="0.005" value={betaDti} onChange={(e) => setBetaDti(Number(e.target.value))} style={{ width: '100%' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '4px' }}>Income Coeff (β₃): {betaIncome}</label>
                  <input type="range" min="-0.0005" max="0.0001" step="0.00001" value={betaIncome} onChange={(e) => setBetaIncome(Number(e.target.value))} style={{ width: '100%' }} />
                </div>
                <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', margin: '8px 0' }} />
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '4px', color: '#2563eb' }}>Corporate Approval Cutoff Threshold: {riskThreshold}%</label>
                  <input type="range" min="5" max="50" step="1" value={riskThreshold} onChange={(e) => setRiskThreshold(Number(e.target.value))} style={{ width: '100%' }} />
                </div>
              </div>
            </div>

            {/* Simulated Live Underwriting Desk */}
            <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ margin: '0 0 16px 0', fontSize: '17px' }}>Live Applicant Underwriting Simulator</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', backgroundColor: '#f8fafc', padding: '16px', borderRadius: '8px', marginBottom: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', marginBottom: '2px' }}>Applicant FICO Score</label>
                    <input type="number" value={simFico} onChange={(e) => setSimFico(Number(e.target.value))} style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', marginBottom: '2px' }}>Applicant Debt-to-Income Ratio (DTI %)</label>
                    <input type="number" value={simDti} onChange={(e) => setSimDti(Number(e.target.value))} style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', marginBottom: '2px' }}>Applicant Gross Monthly Income ($)</label>
                    <input type="number" value={simIncome} onChange={(e) => setSimIncome(Number(e.target.value))} style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                  </div>
                </div>
              </div>

              <div style={{ borderTop: '2px dashed #e2e8f0', paddingTop: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '14px' }}>
                  <span>Linear Logit Equation Predictor (η):</span>
                  <span style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{simulatorResults.eta}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', fontSize: '14px' }}>
                  <span>Calculated Default Probability P(Default):</span>
                  <span style={{ fontWeight: 'bold', color: Number(simulatorResults.prob) > riskThreshold ? '#ef4444' : '#10b981' }}>{simulatorResults.prob}%</span>
                </div>

                <div style={{ textAlign: 'center', padding: '16px', borderRadius: '8px', fontSize: '18px', fontWeight: 'bold', backgroundColor: simulatorResults.approved ? '#d1fae5' : '#fee2e2', color: simulatorResults.approved ? '#065f46' : '#991b1b' }}>
                  {simulatorResults.approved ? '✅ APPLICATION APPROVED' : '❌ APPLICATION DECLINED (High Risk)'}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* SCREEN 4: BONUS SYSTEM - EXPLAINABLE FICO CREDIT SCORECARD */}
        {activeTab === 'scorecard' && (
          <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h3 style={{ margin: '0' }}>Point-Based Credit Scorecard Framework</h3>
                <p style={{ color: '#6b7280', fontSize: '14px', margin: '4px 0 0 0' }}>Linear mapping transforms model log-odds coefficients straight into a clean regulatory-compliant point scorecard system.</p>
              </div>
              <div style={{ textAlign: 'right', padding: '12px 24px', backgroundColor: '#f1f5f9', borderRadius: '8px' }}>
                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 'bold' }}>DERIVED CREDIT SCORE</div>
                <div style={{ fontSize: '32px', fontWeight: 'bold', color: simulatorResults.totalCreditScore > 660 ? '#10b981' : '#f59e0b' }}>{simulatorResults.totalCreditScore}</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginTop: '24px' }}>
              <div>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#475569' }}>Credit Attribute Point Allocation</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', backgroundColor: '#f8fafc', borderRadius: '4px' }}>
                    <span>Baseline Scorecard Intercept Constant</span>
                    <span style={{ fontWeight: 'bold', fontFamily: 'monospace' }}>{simulatorResults.breakdown.basePoints} pts</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', backgroundColor: '#f8fafc', borderRadius: '4px' }}>
                    <span>Bureau Profile Contribution (FICO Variable)</span>
                    <span style={{ fontWeight: 'bold', fontFamily: 'monospace', color: simulatorResults.breakdown.ficoPoints >= 0 ? '#10b981' : '#ef4444' }}>
                      {simulatorResults.breakdown.ficoPoints >= 0 ? '+' : ''}{simulatorResults.breakdown.ficoPoints} pts
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', backgroundColor: '#f8fafc', borderRadius: '4px' }}>
                    <span>Leverage Obligation Matrix (DTI Variable)</span>
                    <span style={{ fontWeight: 'bold', fontFamily: 'monospace', color: simulatorResults.breakdown.dtiPoints >= 0 ? '#10b981' : '#ef4444' }}>
                      {simulatorResults.breakdown.dtiPoints >= 0 ? '+' : ''}{simulatorResults.breakdown.dtiPoints} pts
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', backgroundColor: '#f8fafc', borderRadius: '4px' }}>
                    <span>Capacity Optimization Metric (Income Variable)</span>
                    <span style={{ fontWeight: 'bold', fontFamily: 'monospace', color: simulatorResults.breakdown.incomePoints >= 0 ? '#10b981' : '#ef4444' }}>
                      {simulatorResults.breakdown.incomePoints >= 0 ? '+' : ''}{simulatorResults.breakdown.incomePoints} pts
                    </span>
                  </div>
                </div>
              </div>

              <div style={{ backgroundColor: '#f8fafc', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '14px' }}>Underwriting Adverse Action Explanation</h4>
                <p style={{ fontSize: '13px', color: '#475569', lineHeight: '1.6' }}>
                  This scorecard breaks down decisions directly from logistic regression parameters. 
                  {simulatorResults.totalCreditScore < 620 ? (
                    <span style={{ display: 'block', marginTop: '8px', color: '#b91c1c', fontWeight: 'bold' }}>
                      Adverse Reason Code 1: High leverage obligations (DTI) or restricted historical repayment behavior (FICO) dragged the credit index below the regulatory risk floor.
                    </span>
                  ) : (
                    <span style={{ display: 'block', marginTop: '8px', color: '#047857', fontWeight: 'bold' }}>
                      Approval Framework Met: High scoring asset profile exhibits strong capability characteristics with linear default distribution parameters sitting securely within baseline thresholds.
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}