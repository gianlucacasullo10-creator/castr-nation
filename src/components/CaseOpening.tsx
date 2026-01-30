import { useEffect, useState } from "react";
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
  const colors = RARITY_COLORS[item.rarity as keyof typeof RARITY_COLORS];

  useEffect(() => {
    // Roll for 2 seconds
    const timer = setTimeout(() => {
      setPhase('reveal');
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
      <button 
        onClick={onComplete}
        className="absolute top-4 right-4 p-2 text-white/50 hover:text-white transition-colors"
      >
        <X size={24} />
      </button>

      {phase === 'rolling' ? (
        <div className="text-center space-y-8">
          <div className="relative">
            <div className="w-32 h-32 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary animate-pulse" size={48} />
          </div>
          <p className="text-2xl font-black italic uppercase text-primary animate-pulse">
            Opening Case...
          </p>
        </div>
      ) : (
        <Card className={`${colors.bg} ${colors.glow} border-4 ${colors.border} rounded-[40px] p-8 max-w-md w-full animate-in zoom-in-95 duration-500`}>
          <div className="text-center space-y-6">
            {/* Rarity Badge */}
            <Badge className={`${colors.bg} ${colors.text} border-2 ${colors.border} font-black text-sm px-4 py-1 uppercase animate-in slide-in-from-top-2 delay-100`}>
              {item.rarity}
            </Badge>

            {/* Item Icon/Image */}
            <div className={`text-8xl animate-in zoom-in-50 delay-200`}>
              {item.item_type === 'rod' ? '🎣' : '🪝'}
            </div>

            {/* Item Name */}
            <h2 className={`text-3xl font-black italic uppercase ${colors.text} animate-in slide-in-from-bottom-2 delay-300`}>
              {item.item_name}
            </h2>

            {/* Bonus */}
            <div className="animate-in slide-in-from-bottom-2 delay-400">
              <p className="text-sm font-bold text-muted-foreground uppercase mb-1">Catch Bonus</p>
              <p className="text-4xl font-black italic text-primary">+{item.bonus_percentage}%</p>
            </div>

            {/* Type */}
            <Badge variant="outline" className="font-black text-xs uppercase">
              {item.item_type}
            </Badge>

            {/* Continue Button */}
            <Button
              onClick={onComplete}
              className="w-full h-12 rounded-2xl bg-primary text-black font-black uppercase text-sm mt-6 animate-in slide-in-from-bottom-2 delay-500"
            >
              Continue
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};

export default CaseOpening;
