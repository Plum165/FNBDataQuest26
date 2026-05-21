import React from 'react';
import { Card } from '../common/Cards';

interface RiskVolumeChartProps {
  cutoff: number;
}

export const RiskVolumeChart: React.FC<RiskVolumeChartProps> = ({ cutoff }) => {
  // Simulated portfolio distributions spanning various decision threshold configurations [cite: 17, 80]
  const dataPoints = [
    { threshold: 0.2, volume: 95, defaultRisk: 12.4 },
    { threshold: 0.4, volume: 78, defaultRisk: 5.2 },
    { threshold: 0.6, volume: 45, defaultRisk: 2.1 },
    { threshold: 0.8, volume: 12, defaultRisk: 0.4 },
  ];

  return (
    <Card title="Portfolio Impact Analysis Matrix" subtitle="Evaluating approved volume against default risks across varying decision thresholds.">
      <div className="h-64 flex items-end justify-between gap-4 pt-6 border-b border-slate-200 dark:border-slate-700 px-2">
        {dataPoints.map((pt, index) => {
          const isActive = Math.abs(pt.threshold - cutoff) < 0.15;
          return (
            <div key={index} className="flex-1 flex flex-col items-center gap-2 h-full justify-end relative">
              {/* Volume Column rendering */}
              <div 
                style={{ height: `${pt.volume}%` }}
                className={`w-full max-w-[32px] rounded-t-md transition-all duration-300 relative group ${
                  isActive ? 'bg-brand-500' : 'bg-brand-200 dark:bg-brand-900/40'
                }`}
              >
                <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 transform -translate-x-1/2 bg-slate-900 text-white text-[10px] px-1.5 py-0.5 rounded pointer-events-none z-10 font-mono">
                  Vol:{pt.volume}%
                </div>
              </div>
              
              {/* Risk Vector Column rendering */}
              <div 
                style={{ height: `${pt.defaultRisk * 6}%` }}
                className={`w-full max-w-[12px] rounded-t-sm transition-all duration-300 ${
                  isActive ? 'bg-rose-500' : 'bg-rose-200 dark:bg-rose-900/40'
                }`}
              />

              <div className="text-[10px] font-mono text-slate-400 mt-2">
                τ={pt.threshold}
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex justify-center gap-6 mt-4 text-xs font-medium">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 bg-brand-500 rounded-sm" />
          <span className="text-slate-600 dark:text-slate-400">Approval Volume Metric</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 bg-rose-500 rounded-sm" />
          <span className="text-slate-600 dark:text-slate-400">Default Risk Probability (%)</span>
        </div>
      </div>
    </Card>
  );
};