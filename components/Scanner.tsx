import React from 'react';
import { MarketScanResult } from '../types';
import { ArrowUpRight, Activity, Zap } from 'lucide-react';

interface Props {
  results: MarketScanResult[];
  onSelect: (symbol: string) => void;
  isLoading: boolean;
}

export const Scanner: React.FC<Props> = ({ results, onSelect, isLoading }) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-3 gap-4 h-full">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white border border-neutral-200 h-32 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {results.map((item) => (
        <button 
          key={item.symbol}
          onClick={() => onSelect(item.symbol)}
          className="group text-left bg-white border border-neutral-200 p-4 hover:border-black transition-colors duration-200 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-100 transition-opacity">
            <ArrowUpRight size={20} />
          </div>
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-serif font-bold text-lg">{item.symbol}</h3>
            <span className="font-mono text-xs bg-black text-white px-2 py-0.5">{item.score}/100</span>
          </div>
          <div className="flex items-center gap-2 mb-2">
             <Activity size={12} className="text-neutral-500" />
             <span className="font-mono text-xs text-neutral-500">{item.volatilityIndex} VOLATILITY</span>
          </div>
          <p className="font-serif text-sm text-neutral-800 leading-tight">
            "{item.reason}"
          </p>
        </button>
      ))}
    </div>
  );
};