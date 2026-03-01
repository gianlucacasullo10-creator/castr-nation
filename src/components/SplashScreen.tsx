import { useEffect, useState } from "react";

const SplashScreen = ({ onComplete }: { onComplete: () => void }) => {
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const fadeTimer = setTimeout(() => setFading(true), 1800);
    const doneTimer = setTimeout(onComplete, 2300);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(doneTimer);
    };
  }, [onComplete]);

  return (
    <div
      className={`fixed inset-0 z-[200] bg-black flex flex-col items-center justify-center transition-opacity duration-500 ${
        fading ? "opacity-0" : "opacity-100"
      }`}
    >
      <div className="animate-in zoom-in-95 duration-500 flex flex-col items-center gap-5">
        <div className="flex items-center justify-center bg-primary rounded-3xl px-14 py-6 shadow-2xl">
          <span className="text-6xl font-black italic tracking-tighter text-black">CASTRS</span>
        </div>
        <p className="text-xs font-black uppercase tracking-[0.3em] text-white/40">
          Social Fishing Network
        </p>
      </div>
    </div>
  );
};

export default SplashScreen;
