import React, { useState, useMemo } from 'react';
import { useAppState } from '../../state/AppContext';
import { ShieldAlert, CheckCircle2, ChevronRight, HelpCircle, FileText, Sparkles } from 'lucide-react';

export const MODULE = {
  name: "Scorecard Points View",
  icon: "Target",
  description: "Examine point-based allocation tables and test borrower scores using an interactive credit simulator.",
  route: "/scorecard_points"
};

export default function ScorecardPointsModule({ context }: { context: any }) {
  const { summaryStats } = useAppState();

  // State controls for simulation attributes (matching exact weights shown in FNB documentation)
  const [ficoBracket, setFicoBracket] = useState<string>('subprime');
  const [dtiBracket, setDtiBracket] = useState<string>('moderate');
  const [incomeBracket, setIncomeBracket] = useState<string>('moderate');

  // Interactive brackets configurations
  const ficoOptions = [
    { key: 'subprime', label: 'Poor Credit Standing (< 580)', points: -249 },
    { key: 'fair', label: 'Fair Credit Standing (580 - 640)', points: -115 },
    { key: 'good', label: 'Good standing (640 - 700)', points: 35 },
    { key: 'very_good', label: 'Very Good standing (700 - 760)', points: 110 },
    { key: 'excellent', label: 'Excellent standing (>= 760)', points: 195 }
  ];

  const dtiOptions = [
    { key: 'extreme', label: 'Extreme Debt Level (>= 65%)', points: -95 },
    { key: 'elevated', label: 'Elevated Leverage (50% - 65%)', points: -20 },
    { key: 'conservative', label: 'Considered Leverage (35% - 50%)', points: 15 },
    { key: 'moderate', label: 'Moderate Leverage (20% - 35%)', points: 46 },
    { key: 'low', label: 'Low Debt Leverage (< 20%)', points: 85 }
  ];

  const incomeOptions = [
    { key: 'low', label: 'Low Income Segment (< 50k ZAR)', points: -55 },
    { key: 'moderate', label: 'Moderate Income Segment (50k - 80k ZAR)', points: -27 },
    { key: 'upper_mid', label: 'Upper-Middle Income (80k - 120k ZAR)', points: 30 },
    { key: 'high', label: 'High Wealth Segment (>= 120k ZAR)', points: 80 }
  ];

  const interceptBaseline = 750; // Baseline calibration points score

  // Calculate current point sums in real-time
  const calculatedScore = useMemo(() => {
    const ficoPoints = ficoOptions.find(o => o.key === ficoBracket)?.points || 0;
    const dtiPoints = dtiOptions.find(o => o.key === dtiBracket)?.points || 0;
    const incomePoints = incomeOptions.find(o => o.key === incomeBracket)?.points || 0;

    return {
      fico: ficoPoints,
      dti: dtiPoints,
      income: incomePoints,
      total: interceptBaseline + ficoPoints + dtiPoints + incomePoints
    };
  }, [ficoBracket, dtiBracket, incomeBracket]);

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* 1. Header Box matching exact text: Credit Evaluation Dashboard Framework */}
      <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm">
        <h1 className="text-2xl md:text-3.5xl font-extrabold text-fnb-navy tracking-tight leading-none">
          Credit Evaluation Dashboard Framework
        </h1>
        
        {/* Statistics KPIs layout */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-8 pt-6 border-t border-gray-100">
          <div>
            <div className="text-xs font-semibold text-gray-400 capitalize tracking-wide">Historical Bookings</div>
            <div className="text-2xl md:text-3xl font-bold text-fnb-navy mt-1">
              {summaryStats.totalCount} Accounts
            </div>
          </div>
          <div>
            <div className="text-xs font-semibold text-gray-400 capitalize tracking-wide">Observed Default Rate</div>
            <div className="text-2xl md:text-3xl font-bold text-fnb-navy mt-1">
              {summaryStats.defaultRate.toFixed(1)}%
            </div>
          </div>
          <div>
            <div className="text-xs font-semibold text-gray-400 capitalize tracking-wide">Portfolio Median FICO</div>
            <div className="text-2xl md:text-3xl font-bold text-fnb-navy mt-1">
              {summaryStats.medianFico}
            </div>
          </div>
          <div>
            <div className="text-xs font-semibold text-gray-400 capitalize tracking-wide">Portfolio Median DTI</div>
            <div className="text-2xl md:text-3xl font-bold text-fnb-navy mt-1">
              {summaryStats.medianDti}%
            </div>
          </div>
        </div>
      </div>

      {/* 2. Point-Based Scorecard Allocation Architecture segment */}
      <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm">
        <h2 className="text-xl font-bold text-fnb-navy tracking-tight">
          Point-Based Scorecard Allocation Architecture
        </h2>
        <p className="text-sm text-gray-500 mt-2 leading-relaxed">
          Linear mapping models transform risk weights cleanly into a balanced asset scorecard metric system.
        </p>

        {/* Dynamic simulator columns */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
          
          {/* List Table Weights (Columns Left/Center) */}
          <div className="lg:col-span-2 space-y-6">
            <h3 className="text-base font-bold text-fnb-navy">
              Dynamic Attribute Table
            </h3>

            <div className="border border-gray-100 rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-left text-xs text-gray-650">
                <thead className="bg-[#FAFBFD] border-b border-gray-100">
                  <tr className="font-bold text-gray-405">
                    <th className="py-3 px-4 font-semibold">Credit Matrix Attribute Segment</th>
                    <th className="py-3 px-4 text-right font-semibold">Assigned Calculated Weight</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium">
                  {/* Row 1: Intercept */}
                  <tr className="hover:bg-gray-50/40">
                    <td className="py-3.5 px-4 font-semibold text-gray-900">Scorecard Intercept Baseline Weight</td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-gray-800">
                      {interceptBaseline} points
                    </td>
                  </tr>
                  {/* Row 2: FICO */}
                  <tr className="hover:bg-gray-50/40">
                    <td className="py-3.5 px-4 font-semibold text-gray-900">FICO Character Analysis Index</td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-red-500">
                      {calculatedScore.fico < 0 ? calculatedScore.fico : `+${calculatedScore.fico}`} points
                    </td>
                  </tr>
                  {/* Row 3: DTI */}
                  <tr className="hover:bg-gray-50/40">
                    <td className="py-3.5 px-4 font-semibold text-gray-900">DTI Leverage Matrix Weight</td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-green-600">
                      {calculatedScore.dti < 0 ? calculatedScore.dti : `+${calculatedScore.dti}`} points
                    </td>
                  </tr>
                  {/* Row 4: Income */}
                  <tr className="hover:bg-gray-50/40">
                    <td className="py-3.5 px-4 font-semibold text-gray-900">Income Capacity Index Profile</td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-amber-500">
                      {calculatedScore.income < 0 ? calculatedScore.income : `+${calculatedScore.income}`} points
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            <p className="text-[11px] text-gray-400 flex items-center gap-1">
              <HelpCircle className="w-3.5 h-3.5" /> Note: Point calculations follow: Score = Offset + Factor * (ln(odds) / WoE coef).
            </p>
          </div>

          {/* Points score KPI panel on right side */}
          <div className="bg-gray-50 border border-gray-100 rounded-xl p-5 shadow-sm flex flex-col justify-between">
            <div className="space-y-4">
              <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider block">
                Derived Risk Scale Credit Score
              </span>
              <div id="metric-score" className="text-5xl font-black text-fnb-navy tracking-tight font-sans">
                {calculatedScore.total}
              </div>
            </div>

            {/* Warn message alerts */}
            <div className="mt-8">
              {calculatedScore.total <= 550 ? (
                <div className="bg-[#FFFDF3] border border-[#F3E2B4] rounded-xl p-4 text-xs text-[#8A6A1E] leading-normal font-medium">
                  <strong>Adverse Classification Level:</strong> Subprime Profile Boundary triggered.
                </div>
              ) : calculatedScore.total <= 660 ? (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-800 leading-normal font-medium">
                  <strong>Nearprime Classification Level:</strong> Moderate boundary observed. Subject to loan limit caps.
                </div>
              ) : (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-xs text-green-800 leading-normal font-medium">
                  <strong>Prime Sovereign Alignment:</strong> Underwriting guidelines satisfied. Auto-Approval authorized.
                </div>
              )}
            </div>
          </div>

        </div>

      </div>

      {/* Credit score attributes simulation forms for stakeholders */}
      <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm">
        <h3 className="text-xs font-bold uppercase text-fnb-navy tracking-wider mb-5 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-fnb-gold inline" /> Test Customer Credit Simulator
        </h3>
        <p className="text-xs text-gray-500 mb-6 font-medium">
          Simulate a retail credit customer's bureau score and financial credentials here. Adjust parameters below to see the Dynamic Weights and derived Scorecard points re-allocate instantly above.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* FICO choices */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-700">Evaluate FICO Standing:</label>
            <div className="space-y-1.5">
              {ficoOptions.map(opt => (
                <button
                  key={opt.key}
                  onClick={() => setFicoBracket(opt.key)}
                  className={`w-full flex justify-between items-center text-xs p-2.5 rounded-lg border transition ${
                    ficoBracket === opt.key
                      ? 'bg-fnb-navy border-fnb-navy text-white font-semibold'
                      : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <span>{opt.label}</span>
                  <span className="font-mono font-bold opacity-90">{opt.points > 0 ? `+${opt.points}` : opt.points}pt</span>
                </button>
              ))}
            </div>
          </div>

          {/* DTI choices */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-700">Debt-To-Income Standing:</label>
            <div className="space-y-1.5">
              {dtiOptions.map(opt => (
                <button
                  key={opt.key}
                  onClick={() => setDtiBracket(opt.key)}
                  className={`w-full flex justify-between items-center text-xs p-2.5 rounded-lg border transition ${
                    dtiBracket === opt.key
                      ? 'bg-fnb-navy border-fnb-navy text-white font-semibold'
                      : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <span>{opt.label}</span>
                  <span className="font-mono font-bold opacity-90">{opt.points > 0 ? `+${opt.points}` : opt.points}pt</span>
                </button>
              ))}
            </div>
          </div>

          {/* Income choices */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-700">Annual Income Standing:</label>
            <div className="space-y-1.5">
              {incomeOptions.map(opt => (
                <button
                  key={opt.key}
                  onClick={() => setIncomeBracket(opt.key)}
                  className={`w-full flex justify-between items-center text-xs p-2.5 rounded-lg border transition ${
                    incomeBracket === opt.key
                      ? 'bg-fnb-navy border-fnb-navy text-white font-semibold'
                      : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <span>{opt.label}</span>
                  <span className="font-mono font-bold opacity-90">{opt.points > 0 ? `+${opt.points}` : opt.points}pt</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
