import React from 'react';
import { RAGState } from '../../types';
import { ICON_MAP } from '../../constants';

interface RAGPillProps {
  state: RAGState;
  label: string;
}

const stateConfig = {
  // Fix: Use correct enum member 'Green' instead of 'GREEN'.
  [RAGState.Green]: {
    colorClasses: 'bg-green-100 text-green-800',
    icon: ICON_MAP.StateGreen,
    tooltip: 'Green: Available / Accepted / Unlocked',
  },
  // Fix: Use correct enum member 'Amber' instead of 'AMBER'.
  [RAGState.Amber]: {
    colorClasses: 'bg-yellow-100 text-yellow-800',
    icon: ICON_MAP.StateAmber,
    tooltip: 'Amber: Hold / Pending / Reserved',
  },
  // Fix: Use correct enum member 'Red' instead of 'RED'.
  [RAGState.Red]: {
    colorClasses: 'bg-red-100 text-red-800',
    icon: ICON_MAP.StateRed,
    tooltip: 'Red: Restricted / Rejected / Locked',
  },
};

export const RAGPill: React.FC<RAGPillProps> = ({ state, label }) => {
  const config = stateConfig[state];

  return (
    <div className="group relative inline-block">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.colorClasses}`}>
            <span className="mr-1.5">{React.cloneElement(config.icon, { stroke: 'currentColor' })}</span>
            {label}
        </span>
        <div className="absolute bottom-full left-1/2 z-10 w-max -translate-x-1/2 transform opacity-0 group-hover:opacity-100 transition-opacity duration-300 mb-2 px-3 py-1.5 text-xs font-medium text-white bg-gray-900 rounded-md shadow-sm">
            {config.tooltip}
            <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-gray-900"></div>
        </div>
    </div>
  );
};