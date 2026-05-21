import React from 'react';

export const LoadingState: React.FC = () => (
  <div className="w-full min-h-[400px] flex flex-col items-center justify-center gap-4">
    <div className="relative w-12 h-12">
      <div className="absolute inset-0 rounded-full border-4 border-slate-200 dark:border-slate-700" />
      <div className="absolute inset-0 rounded-full border-4 border-brand-500 border-t-transparent animate-spin" />
    </div>
    <p className="text-sm font-medium text-slate-500 dark:text-slate-400 animate-pulse">
      Processing regulatory-constrained financial aggregates...
    </p>
  </div>
);