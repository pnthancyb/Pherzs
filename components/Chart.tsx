import React from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Candle, TechnicalIndicators } from '../types';

interface Props {
  data: Candle[];
  indicators: TechnicalIndicators;
}

export const Chart: React.FC<Props> = ({ data, indicators }) => {
  // Merge data for chart
  const chartData = data.map((c, i) => ({
    ...c,
    upper: indicators.upperBand[i],
    lower: indicators.lowerBand[i],
    rsi: indicators.rsi[i]
  }));

  const minPrice = Math.min(...data.map(d => d.low));
  const maxPrice = Math.max(...data.map(d => d.high));

  // Determine stroke width based on data density. 500 points requires very thin lines.
  const strokeWidth = data.length > 200 ? 1 : 1.5;

  return (
    <div className="h-full w-full flex flex-col bg-white min-h-[400px]">
      {/* Price Chart - 70% Height */}
      <div className="h-[70%] w-full relative border-b border-neutral-200">
        <ResponsiveContainer width="100%" height="100%" minHeight={200}>
          <AreaChart data={chartData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#000000" stopOpacity={0.1}/>
                <stop offset="95%" stopColor="#000000" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <XAxis 
              dataKey="time" 
              hide 
            />
            <YAxis 
              domain={[minPrice * 0.99, maxPrice * 1.01]} 
              orientation="right" 
              tick={{fontSize: 10, fontFamily: 'JetBrains Mono'}}
              axisLine={false}
              tickLine={false}
              width={50}
            />
            <Tooltip 
              contentStyle={{ background: '#fff', border: '1px solid #000', fontFamily: 'JetBrains Mono', fontSize: '12px' }}
              itemStyle={{ color: '#000' }}
              labelStyle={{ display: 'none' }}
              formatter={(value: number) => [value.toFixed(2), 'Price']}
            />
            <Area 
              type="monotone" 
              dataKey="close" 
              stroke="#000000" 
              strokeWidth={strokeWidth}
              fillOpacity={1} 
              fill="url(#colorPrice)" 
              isAnimationActive={false}
            />
            {/* Bollinger Bands */}
            <Area type="monotone" dataKey="upper" stroke="#ccc" strokeWidth={1} strokeDasharray="3 3" fill="none" isAnimationActive={false}/>
            <Area type="monotone" dataKey="lower" stroke="#ccc" strokeWidth={1} strokeDasharray="3 3" fill="none" isAnimationActive={false}/>
          </AreaChart>
        </ResponsiveContainer>
        <div className="absolute top-2 left-2 font-mono text-xs bg-black text-white px-2 py-1 z-10">PRICE / BB(20,2)</div>
      </div>
      
      {/* RSI Chart - 30% Height */}
      <div className="h-[30%] w-full relative">
        <ResponsiveContainer width="100%" height="100%" minHeight={100}>
          <AreaChart data={chartData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
            <XAxis 
              dataKey="dateStr" 
              tick={{fontSize: 10, fontFamily: 'JetBrains Mono'}} 
              interval={Math.floor(data.length / 5)}
              axisLine={false}
              tickLine={false}
              height={30}
            />
            <YAxis 
              domain={[0, 100]} 
              orientation="right" 
              tick={{fontSize: 10, fontFamily: 'JetBrains Mono'}}
              axisLine={false}
              tickLine={false}
              ticks={[30, 70]}
              width={50}
            />
            <ReferenceLine y={70} stroke="#000" strokeDasharray="2 2" />
            <ReferenceLine y={30} stroke="#000" strokeDasharray="2 2" />
            <Area 
              type="monotone" 
              dataKey="rsi" 
              stroke="#333" 
              fill="#eee" 
              strokeWidth={1}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
        <div className="absolute top-2 left-2 font-mono text-xs bg-neutral-200 text-black px-2 py-1 z-10">RSI(14)</div>
      </div>
    </div>
  );
};