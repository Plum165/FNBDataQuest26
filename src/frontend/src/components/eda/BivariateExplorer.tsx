import React from 'react';
import { Card } from '../common/Cards.tsx';
import { ShieldCheck, AlertTriangle } from 'lucide-react';

export const BivariateExplorer: React.FC = () => {
  /* Mock Matrix to simulate Heatmap layouts without needing canvas weight 
  const correlations = [
    { x: 'DTI', y: 'DTI', val: 1.0 },
    { x: 'DTI', y: 'Income', val: -0.34 },
    { x: 'DTI', y: 'Age', val: 0.05 },
    { x: 'Income', y: 'Age', val: 0.28 },
  ];
*/
  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h2 className="text-xl font-bold tracking-tight">Bivariate Analytics & Compliance Engine</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">Evaluate colinearity and feature interaction vectors against systemic compliance policies[cite: 10, 56].</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Core Heatmap Element */}
        <Card title="Feature Interaction Heatmap" className="lg:col-span-1">
          <div className="grid grid-cols-4 gap-2 text-center text-[10px] font-mono font-bold">
            <div />
            <div className="text-slate-400">DTI</div>
            <div className="text-slate-400">Inc</div>
            <div className="text-slate-400">Age</div>
            
            <div className="text-left text-slate-400 flex items-center font-sans">DTI</div>
            <div className="bg-brand-600 text-white p-3 rounded">1.0</div>
            <div className="bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-200 p-3 rounded">-0.34</div>
            <div className="bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 p-3 rounded">0.05</div>

            <div className="text-left text-slate-400 flex items-center font-sans">Inc</div>
            <div className="bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-200 p-3 rounded">-0.34</div>
            <div className="bg-brand-600 text-white p-3 rounded">1.0</div>
            <div className="bg-brand-100 dark:bg-brand-950 text-brand-800 dark:text-brand-200 p-3 rounded">0.28</div>
          </div>
        </Card>

        {/* Regulatory Risk Guardrail Section  */}
        <Card title="Regulatory Feature Compliance Guardrails" className="lg:col-span-2">
          <div className="space-y-3">
            <div className="p-3.5 rounded-lg border border-rose-200 dark:border-rose-900/50 bg-rose-50/50 dark:bg-rose-950/20 flex gap-3">
              <AlertTriangle className="text-rose-500 shrink-0 mt-0.5" size={18} />
              <div className="text-xs">
                <span className="font-bold text-rose-800 dark:text-rose-300 block mb-0.5">High Compliance Risk Profile: applicant_age</span>
                Using raw age values directly threatens compliance with fair lending frameworks. System recommends using alternative non-linear proxy matrices or complete drop protocols.
              </div>
            </div>

            <div className="p-3.5 rounded-lg border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/50 dark:bg-emerald-950/20 flex gap-3">
              <ShieldCheck className="text-emerald-500 shrink-0 mt-0.5" size={18} />
              <div className="text-xs">
                <span className="font-bold text-emerald-800 dark:text-emerald-300 block mb-0.5">Compliant Risk Vector: stable_income_ratio</span>
                Calculated purely from institutional cash-flow variables. This factor conforms to standard model governance guidelines[cite: 15, 71].
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};