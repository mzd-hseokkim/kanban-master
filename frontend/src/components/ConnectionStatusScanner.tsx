import { useWebSocket } from '@/context/WebSocketContext';
import { useEffect, useState } from 'react';

export const ConnectionStatusScanner = () => {
  const { isConnected } = useWebSocket();
  const [color, setColor] = useState('#3b82f6'); // blue-500
  const [animationState, setAnimationState] = useState('animate-scanner');

  useEffect(() => {
    if (isConnected) {
      setColor('#3b82f6');
      setAnimationState('animate-scanner');
    } else {
      setColor('#f97316'); // orange-500
      setAnimationState('opacity-100'); // Stop animation, keep visible
    }
  }, [isConnected]);

  return (
    <div className="fixed top-0 left-0 w-full h-1 z-[9999] pointer-events-none overflow-hidden">
      {/* Background track */}
      <div className="absolute inset-0 bg-black/10" />

      {/* Scanner light */}
      <div
        className={`absolute top-0 bottom-0 w-[20%] blur-[4px] transition-all duration-300 ${animationState}`}
        style={{
          background: `linear-gradient(90deg, transparent 0%, ${color} 50%, transparent 100%)`,
          boxShadow: `0 0 15px 2px ${color}, 0 0 30px 5px ${color}`
        }}
      />
    </div>
  );
};
