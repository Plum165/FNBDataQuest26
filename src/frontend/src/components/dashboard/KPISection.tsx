import React from 'react';
import { Card } from '../common/Cards';
import { Percent, TrendingUp, Users, ShieldCheck } from 'lucide-react';

interface KPISecProps {
  cutoff: number;
}

export const KPISection: React.FC<KPISecProps> = ({ cutoff }) => {
  // Reactive calculations shifting dynamically based on chosen threshold cutoff values 
  const baseApprovalRate = 74.2;
  const currentApprovalRate = Math.max(20, baseApprovalRate - (cutoff - 0.4) * 80);
  const currentDefaultRate = Math.max(1.8, 5.4 * (currentApprovalRate / 100));

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      <Card>
        <div className="flex justify-between items-start">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Approval Rate Threshold</p>
            <p className="text-2xl font-bold mt-1.5 font-mono text-slate-800 dark:text-slate-100">
              {currentApprovalRate.toFixed(1)}%
            </p>
          </div>
          <div className="p-2 bg-brand-50 dark:bg-brand-950/50 text-brand-500 rounded-lg">
            <Users size={16} />
          </div>
        </div>
      </Card>

      <Card>
        <div className="flex justify-between items-start">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Projected Portfolio Default Rate</p>
            <p className="text-2xl font-bold mt-1.5 font-mono text-rose-500">
              {currentDefaultRate.toFixed(2)}%
            </p>
          </div>
          <div className="p-2 bg-rose-50 dark:bg-rose-950/50 text-rose-500 rounded-lg">
            <TrendingUp size={16} />
          </div>
        </div>
      </Card>

      <Card>
        <div className="flex justify-between items-start">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">GLM Operational AUC</p>
            <p className="text-2xl font-bold mt-1.5 font-mono text-emerald-500">0.76</p>
          </div>
          <div className="p-2 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-500 rounded-lg">
            <ShieldCheck size={16} />
          </div>
        </div>
        <div className="mt-2 text-[10px] text-slate-400">
          Target baseline was <span className="font-bold font-mono">0.68</span> [cite: 13, 65]
        </div>
      </Card>

      <Card>
        <div className="flex justify-between items-start">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Ceiling LightGBM Gap</p>
            <p className="text-2xl font-bold mt-1.5 font-mono text-amber-500">-0.06</p>
          </div>
          <div className="p-2 bg-amber-50 dark:bg-amber-950/50 text-amber-500 rounded-lg">
            <Percent size={16} />
          </div>
        </div>
        <div className="mt-2 text-[10px] text-slate-400">
          Non-linear ceiling is <span className="font-bold font-mono">0.82</span> [cite: 14, 66]
        </div>
      </Card>
    </div>
  );
};