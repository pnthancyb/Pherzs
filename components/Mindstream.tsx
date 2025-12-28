import React, { useEffect, useRef } from 'react';
import { MindstreamLog } from '../types';

interface Props {
  logs: MindstreamLog[];
}

export const Mindstream: React.FC<Props> = ({ logs }) => {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div className="h-full bg-black text-xs font-mono p-4 overflow-hidden flex flex-col border-t border-neutral-800">
      <div className="text-neutral-500 mb-2 uppercase tracking-widest text-[10px]">System Mindstream // Activity Log</div>
      <div className="flex-1 overflow-y-auto space-y-1">
        {logs.map((log) => (
          <div key={log.id} className="flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <span className="text-neutral-600 shrink-0">[{log.timestamp}]</span>
            <span className={`
              ${log.type === 'search' ? 'text-blue-400' : ''}
              ${log.type === 'calc' ? 'text-purple-400' : ''}
              ${log.type === 'success' ? 'text-green-400' : ''}
              ${log.type === 'error' ? 'text-red-500' : ''}
              ${log.type === 'info' ? 'text-neutral-300' : ''}
            `}>
              {log.type === 'search' && '> Searching: '}
              {log.message}
            </span>
          </div>
        ))}
        <div ref={endRef} />
      </div>
      <div className="h-4 bg-gradient-to-t from-black to-transparent pointer-events-none sticky bottom-0" />
    </div>
  );
};