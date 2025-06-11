import React, { useState } from 'react';
import { BarChart3, Calendar } from 'lucide-react';
import { ChartData } from '../types';

interface PerformanceChartProps {
  data: ChartData[];
}

export const PerformanceChart: React.FC<PerformanceChartProps> = ({ data }) => {
  const [timeframe, setTimeframe] = useState('30D');
  
  const timeframes = ['7D', '30D', '90D', '1Y'];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const minValue = Math.min(...data.map(d => d.value));
  const maxValue = Math.max(...data.map(d => d.value));
  const currentValue = data[data.length - 1]?.value || 0;
  const startValue = data[0]?.value || 0;
  const totalChange = currentValue - startValue;
  const totalChangePercent = ((totalChange / startValue) * 100);

  const normalizeValue = (value: number) => {
    return ((value - minValue) / (maxValue - minValue)) * 100;
  };

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-green-500/10 rounded-lg">
            <BarChart3 className="w-5 h-5 text-green-400" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Portfolio Performance</h2>
            <p className="text-xs text-slate-400">Track your investment growth</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-1">
          {timeframes.map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-2.5 py-1 text-xs rounded-lg transition-all duration-200 ${
                timeframe === tf
                  ? 'bg-green-500 text-white'
                  : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700 hover:text-white'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-4">
        <div className="flex items-center space-x-4">
          <div>
            <p className="text-xl font-bold text-white">{formatCurrency(currentValue)}</p>
            <div className="flex items-center space-x-2">
              <span className={`text-xs ${totalChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {totalChange >= 0 ? '+' : ''}{formatCurrency(totalChange)}
              </span>
              <span className={`text-xs ${totalChangePercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                ({totalChangePercent >= 0 ? '+' : ''}{totalChangePercent.toFixed(2)}%)
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="relative h-56 overflow-hidden">
        <svg className="w-full h-full" viewBox="0 0 800 200">
          <defs>
            <linearGradient id="portfolioGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="rgb(34, 197, 94)" stopOpacity="0.3" />
              <stop offset="100%" stopColor="rgb(34, 197, 94)" stopOpacity="0.05" />
            </linearGradient>
          </defs>
          
          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map((y) => (
            <line
              key={y}
              x1="0"
              y1={200 - (y * 2)}
              x2="800"
              y2={200 - (y * 2)}
              stroke="rgb(71, 85, 105)"
              strokeOpacity="0.3"
              strokeWidth="1"
            />
          ))}
          
          {/* Chart area */}
          <path
            d={`M 0 ${200 - normalizeValue(data[0]?.value || 0) * 2} ${data.map((point, index) => 
              `L ${(index / (data.length - 1)) * 800} ${200 - normalizeValue(point.value) * 2}`
            ).join(' ')}`}
            fill="url(#portfolioGradient)"
          />
          
          {/* Chart line */}
          <path
            d={`M 0 ${200 - normalizeValue(data[0]?.value || 0) * 2} ${data.map((point, index) => 
              `L ${(index / (data.length - 1)) * 800} ${200 - normalizeValue(point.value) * 2}`
            ).join(' ')}`}
            fill="none"
            stroke="rgb(34, 197, 94)"
            strokeWidth="2"
          />
          
          {/* Data points */}
          {data.map((point, index) => (
            <circle
              key={index}
              cx={(index / (data.length - 1)) * 800}
              cy={200 - normalizeValue(point.value) * 2}
              r="3"
              fill="rgb(34, 197, 94)"
              className="opacity-0 hover:opacity-100 transition-opacity duration-200"
            />
          ))}
        </svg>

        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-slate-400 -ml-16">
          <span>{formatCurrency(maxValue)}</span>
          <span>{formatCurrency((maxValue + minValue) / 2)}</span>
          <span>{formatCurrency(minValue)}</span>
        </div>
      </div>
    </div>
  );
};