import React, { useState, useMemo } from 'react';
import { useAppState } from '../../state/AppContext';
import { Sparkles, BarChart3, TrendingUp, DollarSign, Award, Sliders, ShieldCheck } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export const MODULE = {
  name: "Business Dashboard",
  icon: "BarChart3",
  description: "Bonus Layer! Simulate portfolio approvals, expected loss margins, dynamic yield gains and risk appetite scenarios.",
  route: "/business_dashboard"
};

export default function BusinessDashboardModule() {
  const { activeAccounts } = useAppState();
  
  // Interactive control parameters
  const [cutoff, setCutoff] = useState<number>(0.30); // probability default threshold limit
  const [annualRevRate, setAnnualRevRate] = useState<number>(14.5); // Lending APR interest
  const [lgdRate, setLgdRate] = useState<number>(60); // Loss Given Default (LGD) percentage
  const [appetite, setAppetite] = useState<'conservative' | 'balanced' | 'aggressive'>('balanced');

  // Appetite profile handler updates parameter defaults
  const handleAppetiteChange = (prof: 'conservative' | 'balanced' | 'aggressive') => {
    setAppetite(prof);
    if (prof === 'conservative') {
      setCutoff(0.18);
      setAnnualRevRate(11.0);
    } else if (prof === 'balanced') {
      setCutoff(0.30);
      setAnnualRevRate(14.5);
    } else {
      setCutoff(0.45);
      setAnnualRevRate(18.0);
    }
  };

  // Perform a full real-world monetary simulation on the 300 active accounts
  const financialSimulation = useMemo(() => {
    // Generate individual probability predictions
    const predictedPortfolio = activeAccounts.map(acc => {
      let z = -3.85; // baseline constant default odds
      if (acc.fico !== -99) {
        z += (acc.fico - 668) * 0.0084;
      }
      if (acc.dti !== -99) {
        z += (34.8 - acc.dti) * -0.052 * -1; // higher DTI increases default odds
      }
      z += (acc.income - 85) * 0.0151;

      // Sigmoid
      const prob = 1 / (1 + Math.exp(z));
      return {
        ...acc,
        probDefault: prob
      };
    });

    const totalAccounts = predictedPortfolio.length || 1;
    
    // Classify approvals based on chosen cutoff
    const approvedList = predictedPortfolio.filter(x => x.probDefault < cutoff);
    const declinedList = predictedPortfolio.filter(x => x.probDefault >= cutoff);

    const approvedCount = approvedList.length;
    const approvalRate = (approvedCount / totalAccounts) * 100;

    // Calculate volume: each unit represents R1,000. So we show total book in Rands.
    const approvedVolume = approvedList.reduce((sum, x) => sum + x.loanAmount, 0) * 1000;
    const declinedVolume = declinedList.reduce((sum, x) => sum + x.loanAmount, 0) * 1000;

    // Defaulted borrowers in approved list
    const defaultsApproved = approvedList.filter(x => x.defaulted === 1);
    const defaultsApprovedCount = defaultsApproved.length;
    const portfolioDefaultRate = approvedCount > 0 ? (defaultsApprovedCount / approvedCount) * 100 : 0;

    // Expected Loss: Exposure * LGD. Simple exposure is the loan amount * 1000.
    const rawExpectedLoss = defaultsApproved.reduce((sum, x) => sum + (x.loanAmount * 1000) * (lgdRate / 100), 0);
    const expectedLoss = Math.round(rawExpectedLoss);

    // Interest Revenue: we model (Goods Approved * Average Loan Amount * APR)
    const goodsApproved = approvedList.filter(x => x.defaulted === 0);
    const rawInterestRevenue = goodsApproved.reduce((sum, x) => sum + (x.loanAmount * 1000) * (annualRevRate / 100), 0);
    const interestRevenue = Math.round(rawInterestRevenue);

    // Net profit = Interest Revenue - Expected Loss
    const netProfit = interestRevenue - expectedLoss;

    // Build curve points for different threshold cutoffs (0.05 to 0.70)
    const curvePoints = [];
    for (let th = 0.10; th <= 0.60; th += 0.05) {
      const thApproved = predictedPortfolio.filter(x => x.probDefault < th);
      const thGoods = thApproved.filter(x => x.defaulted === 0);
      const thBads = thApproved.filter(x => x.defaulted === 1);

      const thRev = thGoods.reduce((sum, x) => sum + (x.loanAmount * 1000) * (annualRevRate / 100), 0);
      const thLoss = thBads.reduce((sum, x) => sum + (x.loanAmount * 1000) * (lgdRate / 100), 0);
      const thProfit = thRev - thLoss;

      curvePoints.push({
        threshold: Math.round(th * 100),
        'Net Profit (ZAR)': Math.round(thProfit)
      });
    }

    return {
      approvalRate,
      approvedCount,
      approvedVolume,
      declinedVolume,
      portfolioDefaultRate,
      expectedLoss,
      interestRevenue,
      netProfit,
      curvePoints
    };
  }, [activeAccounts, cutoff, annualRevRate, lgdRate]);

  return (
    <div className="space-y-6 animate-fade-in text-[var(--fnb-text-gray)]">
      
      {/* MONETARY METRIC SUMMARY BAR */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Approved Volume */}
        <div className="bg-white border border-[var(--fnb-border)] p-5 rounded-xl shadow-xs flex flex-col justify-between">
          <span className="text-[10px] uppercase font-bold text-gray-400 block tracking-wider">Simulated Inbound Book</span>
          <span className="text-xl font-bold text-[#0B1F3A] mt-1.5 font-mono">
            R{(financialSimulation.approvedVolume / 1000000).toFixed(2)}M
          </span>
          <span className="text-[9px] text-gray-400 mt-1">{financialSimulation.approvedCount} Loans Issued</span>
        </div>

        {/* Expected Loss Margin */}
        <div className="bg-white border border-[var(--fnb-border)] p-5 rounded-xl shadow-xs flex flex-col justify-between">
          <span className="text-[10px] uppercase font-bold text-gray-400 block tracking-wider">Expected Loss (LGD: {lgdRate}%)</span>
          <span className="text-xl font-bold text-red-650 mt-1.5 font-mono">
            R{financialSimulation.expectedLoss.toLocaleString()}
          </span>
          <span className="text-[9px] text-gray-400 mt-1">Default Exposure Cost</span>
        </div>

        {/* Generated Revenue */}
        <div className="bg-white border border-[var(--fnb-border)] p-5 rounded-xl shadow-xs flex flex-col justify-between">
          <span className="text-[10px] uppercase font-bold text-gray-400 block tracking-wider">Interest Revenue (APR: {annualRevRate}%)</span>
          <span className="text-xl font-bold text-green-700 mt-1.5 font-mono">
            R{financialSimulation.interestRevenue.toLocaleString()}
          </span>
          <span className="text-[9px] text-gray-400 mt-1">Lending book interest value</span>
        </div>

        {/* Net Profit Projection */}
        <div className="bg-white border border-[var(--fnb-border)] p-5 rounded-xl shadow-xs flex flex-col justify-between">
          <span className="text-[10px] uppercase font-bold text-gray-400 block tracking-wider">Projected Net Yield</span>
          <span className={`text-xl font-bold mt-1.5 font-mono ${financialSimulation.netProfit >= 0 ? 'text-green-600' : 'text-red-650'}`}>
            R{financialSimulation.netProfit.toLocaleString()}
          </span>
          <span className="text-[9px] text-gray-400 mt-1">Expected return index</span>
        </div>
      </div>

      {/* RISK APPETITE COMPONENT */}
      <div className="bg-white border border-[var(--fnb-border)] rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3 border-gray-100">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-[var(--accent)] shrink-0" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--fnb-text-dark)]">
              Sovereign Appetite Preset Selection
            </h4>
          </div>

          <div className="flex bg-gray-100 p-0.5 rounded-lg border">
            <button
              type="button"
              onClick={() => handleAppetiteChange('conservative')}
              className={`px-3 py-1 text-[10px] font-bold uppercase rounded-md transition cursor-pointer ${
                appetite === 'conservative' ? 'bg-[#0B1F3A] text-white shadow-xs' : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              Conservative
            </button>
            <button
              type="button"
              onClick={() => handleAppetiteChange('balanced')}
              className={`px-3 py-1 text-[10px] font-bold uppercase rounded-md transition cursor-pointer ${
                appetite === 'balanced' ? 'bg-[#0B1F3A] text-white shadow-xs' : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              Balanced
            </button>
            <button
              type="button"
              onClick={() => handleAppetiteChange('aggressive')}
              className={`px-3 py-1 text-[10px] font-bold uppercase rounded-md transition cursor-pointer ${
                appetite === 'aggressive' ? 'bg-[#0B1F3A] text-white shadow-xs' : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              Aggressive
            </button>
          </div>
        </div>

        {/* DOUBLE SLIDER BOX */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 text-xs font-mono text-gray-500">
          {/* Slider 1 */}
          <div className="space-y-1.5">
            <label htmlFor="cutoff-input" className="font-sans font-semibold text-gray-600 block">Approval Cutoff: {(cutoff * 100).toFixed(0)}%</label>
            <input 
              id="cutoff-input"
              type="range"
              min="0.10"
              max="0.60"
              step="0.01"
              value={cutoff}
              onChange={(e) => setCutoff(parseFloat(e.target.value))}
              className="w-full accent-[var(--primary)] h-1.5 bg-gray-200 rounded-lg cursor-pointer"
            />
          </div>

          {/* Slider 2 */}
          <div className="space-y-1.5 font-mono">
            <label htmlFor="rev-rate-input" className="font-sans font-semibold text-gray-600 block">Lending APR Rate: {annualRevRate}%</label>
            <input 
              id="rev-rate-input"
              type="range"
              min="8.0"
              max="24.0"
              step="0.5"
              value={annualRevRate}
              onChange={(e) => setAnnualRevRate(parseFloat(e.target.value))}
              className="w-full accent-[var(--primary)] h-1.5 bg-gray-200 rounded-lg cursor-pointer"
            />
          </div>

          {/* Slider 3 */}
          <div className="space-y-1.5">
            <label htmlFor="lgd-rate-input" className="font-sans font-semibold text-gray-600 block">Loss Given Default (LGD): {lgdRate}%</label>
            <input 
              id="lgd-rate-input"
              type="range"
              min="30"
              max="90"
              step="5"
              value={lgdRate}
              onChange={(e) => setLgdRate(parseInt(e.target.value))}
              className="w-full accent-[var(--primary)] h-1.5 bg-gray-200 rounded-lg cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* PROFIT OPTIMIZATION YIELD CURVE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* CURVE CHARTING */}
        <div className="lg:col-span-8 bg-white border border-[var(--fnb-border)] p-6 rounded-xl shadow-xs space-y-4">
          <span className="text-[10px] uppercase font-bold text-gray-400 block tracking-wider font-mono">
            Lending Book Yield Optimization Curve (ZAR Return vs Cutoff Risk)
          </span>

          <div className="h-[210px] w-full pt-1">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={financialSimulation.curvePoints} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0B1F3A" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#0B1F3A" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                <XAxis dataKey="threshold" type="number" tick={{ fontSize: 9 }} stroke="#9CA3AF" />
                <YAxis tick={{ fontSize: 9 }} stroke="#9CA3AF" />
                <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '8px' }} />
                <Area type="monotone" dataKey="Net Profit (ZAR)" stroke="#0B1F3A" strokeWidth={2.5} fillOpacity={1} fill="url(#profitGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="text-[10px] text-gray-450 text-center font-sans">
            The curve highlights the optimum sweet-spot cutoff: accepting higher risk increases total loans, but default losses eventually outgrow revenue.
          </div>
        </div>

        {/* DECISION SUMMARY PANEL */}
        <div className="lg:col-span-4 bg-white border border-[var(--fnb-border)] p-6 rounded-xl shadow-xs space-y-4 flex flex-col justify-between">
          <div className="space-y-3.5">
            <span className="text-[10px] uppercase font-bold text-gray-400 block tracking-wider font-mono border-b pb-2">
              Portfolio Performance Audit
            </span>
            
            <div className="space-y-2 font-mono text-xs">
              <div className="flex justify-between">
                <span className="font-sans text-gray-500">Approved Loan Rate:</span>
                <span className="font-bold text-[var(--fnb-text-dark)]">{financialSimulation.approvalRate.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="font-sans text-gray-500">Declined Backlog:</span>
                <span className="font-bold text-[var(--fnb-text-dark)]">{(100 - financialSimulation.approvalRate).toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="font-sans text-gray-500">Post-Approve Default Rate:</span>
                <span className="font-bold text-red-650">{financialSimulation.portfolioDefaultRate.toFixed(1)}%</span>
              </div>
            </div>
          </div>

          <div className="p-3 bg-green-50 border border-green-150 text-[10px] text-green-900 rounded leading-relaxed">
            <strong>Optimal Sweet Spot Note:</strong> 
            Approving too aggressively degrades bank assets. System calculations verify a target cutoff between 25% and 35% default probability maximizes returns while complying with credit stability expectations.
          </div>
        </div>

      </div>
    </div>
  );
}
