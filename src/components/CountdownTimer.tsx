import { useState, useEffect } from 'react';

interface CountdownTimerProps {
  endTime: Date;
  compact?: boolean;
}

export default function CountdownTimer({ endTime, compact = false }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<{ h: number, m: number, s: number } | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const end = endTime.getTime();
      const distance = end - now;

      if (distance < 0) {
        setTimeLeft(null);
        clearInterval(timer);
        return;
      }

      setTimeLeft({
        h: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        m: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        s: Math.floor((distance % (1000 * 60)) / 1000)
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [endTime]);

  if (!timeLeft) return null;

  if (compact) {
    return (
      <div className="flex items-center gap-1 font-black text-xs">
        <span className="bg-red-600 text-white px-1.5 py-0.5 rounded">{String(timeLeft.h).padStart(2, '0')}</span>
        <span className="text-red-600">:</span>
        <span className="bg-red-600 text-white px-1.5 py-0.5 rounded">{String(timeLeft.m).padStart(2, '0')}</span>
        <span className="text-red-600">:</span>
        <span className="bg-red-600 text-white px-1.5 py-0.5 rounded">{String(timeLeft.s).padStart(2, '0')}</span>
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      {[
        { val: timeLeft.h, label: 'giờ' },
        { val: timeLeft.m, label: 'phút' },
        { val: timeLeft.s, label: 'giây' }
      ].map((unit, i) => (
        <div key={i} className="flex flex-col items-center">
          <div className="w-12 h-12 bg-white text-red-600 rounded-xl flex items-center justify-center text-xl font-black shadow-lg">
            {String(unit.val).padStart(2, '0')}
          </div>
          <span className="text-[8px] font-black uppercase tracking-widest mt-1 opacity-80">{unit.label}</span>
        </div>
      ))}
    </div>
  );
}
