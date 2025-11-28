import { DidYouKnowTip } from '@/constants/didYouKnowTips';
import React from 'react';

interface DefaultTipProps {
  tip: DidYouKnowTip;
}

export const DefaultTip: React.FC<DefaultTipProps> = ({ tip }) => {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center px-4">
      <div className="text-6xl mb-4">{tip.icon}</div>
      <h3 className="text-2xl font-bold text-slate-800 mb-3">{tip.title}</h3>
      <p className="text-slate-600 text-base leading-relaxed">{tip.description}</p>
    </div>
  );
};
