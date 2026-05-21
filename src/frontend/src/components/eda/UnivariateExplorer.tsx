import React, { useState } from 'react';
import { Card } from '../common/Cards.tsx';
import { AlertCircle, HelpCircle } from 'lucide-react';

interface BinData {
  range: string;
  total: number;
  defaults: number;
  nonDefaults: number;
  woe: number;
}

export const UnivariateExplorer: React.FC = () => {
  const [selectedFeature, setSelectedFeature] = useState('debt_to_income');

  // Simulated feature data showing structural profiles across defaults 
  const mockBinnedData: Record<string, { iv: number; analysis: string; bins: BinData[] }> = {
    debt_to_income: {
      iv: 0.42,
      analysis: "Highly predictive feature showing monotonic trend. High DTI shows strong positive WoE values indicating elevated systemic risk profile.",
      bins: [
        { range: '0% - 15%', total: 3000, defaults: 150, nonDefaults: 2850, woe: -0.84 },
        { range: '15% - 30%', total: 4500, defaults: 450, nonDefaults: 4050, woe: -0.10 },
        { range: '30% - 45%', total: 2000, defaults: 400, nonDefaults: 1600, woe: 0.61 },
        { range: '45%+', total: 500, defaults: 200, nonDefaults: 300, woe: 1.39 },
      ]
    },
    employment_length: {
      iv: 0.18,
      analysis: "Medium predictive predictive power. Shorter employment duration maps directly to increased application failure states[cite: 9].",
      bins: [
        { range: '< 2 years', total: 2500, defaults: 500, nonDefaults: 2000, woe: 0.51 },
        { range: '2 - 5 years', total: 3500, defaults: 420, nonDefaults: 3080, woe: 0.01 },
        { range: '5 - 10 years', total: 2500, defaults: 200, nonDefaults: 2300, woe: -0.54 },
        { range: '10+ years', total: 1500, defaults: 80, nonDefaults: 1420, woe: -0.98 },
      ]
    }
  };

  const currentData = mockBinnedData[selectedFeature] || mockBinnedData.debt_to_income;

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Univariate Risk Profiler</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Isolate parameters to measure Weight of Evidence (WoE) and predictive weight.</p>
        </div>
        <select
          value={selectedFeature}
          onChange={(e) => setSelectedFeature(e.target.value)}
          className="block w-full sm:w-64 px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <option value="debt_to_income">Debt-to-Income Ratio (DTI)</option>
          <option value="employment_length">Employment Length</option>
        </select>
      </div>

      {/* Metric Breakdown Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Card>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Information Value (IV)</span>
            <HelpCircle size={14} className="text-slate-400" />
          </div>
          <p className="text-3xl font-bold mt-2 text-brand-500">{currentData.iv}</p>
          <span className="inline-block mt-2 text-[10px] font-medium bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded">
            {currentData.iv > 0.3 ? 'Strong Predictor' : 'Medium Predictor'}
          </span>
        </Card>
        
        <Card className="md:col-span-2">
          <div className="flex gap-2 items-start text-sm text-slate-600 dark:text-slate-300">
            <AlertCircle size={18} className="text-brand-500 mt-0.5 shrink-0" />
            <div>
              <span className="font-semibold text-slate-800 dark:text-slate-100 block mb-1">Risk Architecture Breakdown</span>
              {currentData.analysis}
            </div>
          </div>
        </Card>
      </div>

      {/* WoE Calculation Matrix */}
      <Card title="Weight of Evidence (WoE) Binned Matrix" subtitle="Calculated as: ln(% Non-Defaults / % Defaults)">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-400 font-medium bg-slate-50 dark:bg-slate-900/30">
                <th className="p-3">Feature Bin Range</th>
                <th className="p-3 text-right">Volume Count</th>
                <th className="p-3 text-right">Defaults (Y=1)</th>
                <th className="p-3 text-right">Non-Defaults (Y=0)</th>
                <th className="p-3 text-right">WoE Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {currentData.bins.map((bin, index) => (
                <tr key={index} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/20">
                  <td className="p-3 text-slate-800 dark:text-slate-200 font-semibold">{bin.range}</td>
                  <td className="p-3 text-right font-mono">{bin.total.toLocaleString()}</td>
                  <td className="p-3 text-right text-rose-500 font-mono">{bin.defaults.toLocaleString()}</td>
                  <td className="p-3 text-right text-emerald-500 font-mono">{bin.nonDefaults.toLocaleString()}</td>
                  <td className={`p-3 text-right font-mono font-bold ${bin.woe >= 0 ? 'text-amber-600' : 'text-indigo-600'}`}>
                    {bin.woe > 0 ? `+${bin.woe.toFixed(2)}` : bin.woe.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};