import { useEffect, useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles, X } from "lucide-react";

interface CaseOpeningProps {
  item: {
    item_name: string;
    item_type: string;
    rarity: string;
    bonus_percentage: number;
  };
  onComplete: () => void;
}

const RARITY_COLORS = {
  common: { bg: "bg-gray-500/20", border: "border-gray-500", text: "text-gray-100", glow: "shadow-[0_0_40px_rgba(156,163,175,0.5)]" },
  rare: { bg: "bg-blue-500/20", border: "border-blue-500", text: "text-blue-200", glow: "shadow-[0_0_40px_rgba(59,130,246,0.5)]" },
  epic: { bg: "bg-purple-500/20", border: "border-purple-500", text: "text-purple-200", glow: "shadow-[0_0_40px_rgba(168,85,247,0.5)]" },
  legendary: { bg: "bg-yellow-500/20", border: "border-yellow-500", text: "text-yellow-200", glow: "shadow-[0_0_60px_rgba(234,179,8,0.8)]" },
};

const CaseOpening = ({ item, onComplete }: CaseOpeningProps) => {
  const [phase, setPhase] = useState<'rolling' | 'reveal'>('rolling');
  const hasInitialized = useRef(false);
  const colors = RARITY_COLORS[item.rarity as keyof typeof RARITY_COLORS];

  useEffect(() => {
    // Prevent double initialization
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    // Lock body scroll
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    document.body.style.height = '100%';

    // Roll for 2 seconds, then reveal
    const timer = setTimeout(() => {
      setPhase('reveal');
    }, 2000);

    return () => {
      clearTimeout(timer);
      // Restore body scroll
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.height = '';
    };
  }, []); // Empty dependency array

  return (
    <div className="fixed inset-[-50px] z-[200] bg-black overflow-hidden">
      <div className="absolute inset-0 bg-black/95 backdrop-blur-md" />
      
      <div className="relative h-screen w-screen flex items-center justify-center px-4">
        <button 
          onClick={onComplete}
          className="absolute top-8 right-8 p-2 text-white/50 hover:text-white transition-colors z-10"
        >
          <X size={24} />
        </button>

        {phase === 'rolling' ? (
          <div className="text-center space-y-8 animate-in fade-in duration-300">
            <div className="relative">
              <div className="w-32 h-32 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
              <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary animate-pulse" size={48} />
            </div>
            <p className="text-2xl font-black italic uppercase text-primary animate-pulse">
              Opening Case...
            </p>
          </div>
        ) : (
          <Card className={`${colors.bg} ${colors.glow} border-4 ${colors.border} rounded-[40px] p-6 w-full max-w-sm ml-16 animate-in zoom-in-95 duration-500`}>
            <div className="text-center space-y-4">
              {/* Rarity Badge */}
              <Badge className={`${colors.bg} ${colors.text} border-2 ${colors.border} font-black text-sm px-4 py-1 uppercase`}>
                {item.rarity}
              </Badge>

              {/* Item Icon */}
              <div className="text-7xl">
                {item.item_type === 'rod' ? '🎣' : '🪝'}
              </div>

              {/* Item Name */}
              <h2 className={`text-2xl font-black italic uppercase ${colors.text} leading-tight`}>
                {item.item_name}
              </h2>

              {/* Bonus */}
              <div>
                <p className="text-sm font-bold text-muted-foreground uppercase mb-1">Catch Bonus</p>
                <p className="text-3xl font-black italic text-primary">+{item.bonus_percentage}%</p>
              </div>

              {/* Type */}
              <Badge variant="outline" className="font-black text-xs uppercase">
                {item.item_type}
              </Badge>

              {/* Continue Button */}
              <Button
                onClick={onComplete}
                className="w-full h-12 rounded-2xl bg-primary text-black font-black uppercase text-sm mt-4 active:scale-95 transition-transform"
              >
                Continue
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default CaseOpening;
