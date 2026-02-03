import { useEffect, useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles, X } from "lucide-react";
import GearImage from "@/components/GearImage";

interface CaseOpeningProps {
  item: {
    item_name: string;
    item_type: string;
    rarity: string;
    bonus_percentage: number;
    image_url?: string | null;
  };
  onComplete: () => void;
}

const RARITY_COLORS = {
  common: { 
    bg: "bg-gray-100", 
    border: "border-gray-300", 
    text: "text-gray-600", 
    badgeBg: "bg-gray-200",
    gradient: "from-gray-200/50 to-gray-100/30"
  },
  rare: { 
    bg: "bg-blue-50", 
    border: "border-blue-300", 
    text: "text-blue-600", 
    badgeBg: "bg-blue-100",
    gradient: "from-blue-200/50 to-blue-100/30"
  },
  epic: { 
    bg: "bg-purple-50", 
    border: "border-purple-300", 
    text: "text-purple-600", 
    badgeBg: "bg-purple-100",
    gradient: "from-purple-200/50 to-purple-100/30"
  },
  legendary: { 
    bg: "bg-yellow-50", 
    border: "border-yellow-400", 
    text: "text-yellow-600", 
    badgeBg: "bg-yellow-100",
    gradient: "from-yellow-200/50 to-yellow-100/30"
  },
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
  }, []);

  return (
    <div className="fixed inset-0 z-[9999] bg-[#f5f5f5] flex justify-center overflow-hidden">
      <div className="relative h-dvh w-full max-w-md flex flex-col items-center justify-center px-4">
        
        {/* Close Button */}
        <button 
          onClick={onComplete}
          className="absolute top-4 right-4 h-10 w-10 rounded-full bg-black/5 hover:bg-black/10 transition-colors flex items-center justify-center z-30"
        >
          <X size={20} className="text-gray-500" />
        </button>

        {phase === 'rolling' ? (
          <div className="text-center space-y-8 animate-in fade-in duration-300">
            {/* Spinner */}
            <div className="relative">
              <div className="w-32 h-32 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
              <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary animate-pulse" size={48} />
            </div>
            <div>
              <p className="text-3xl font-black italic uppercase text-primary animate-pulse">
                Opening Case...
              </p>
              <p className="text-xs font-bold text-muted-foreground mt-2 uppercase tracking-widest">
                Good luck!
              </p>
            </div>
          </div>
        ) : (
          <div className="w-full space-y-6 animate-in zoom-in-95 fade-in duration-500">
            {/* Header */}
            <div className="text-center">
              <h1 className="text-4xl font-black italic tracking-tighter text-primary uppercase leading-none">
                You Got!
              </h1>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mt-1">
                New gear unlocked
              </p>
            </div>

            {/* Item Card */}
            <Card className={`bg-gradient-to-br ${colors.gradient} border-2 ${colors.border} rounded-[32px] p-6 overflow-hidden`}>
              <div className="text-center space-y-5">
                {/* Rarity Badge */}
                <div className="flex justify-center">
                  <Badge className={`${colors.badgeBg} ${colors.text} border-2 ${colors.border} font-black text-sm px-6 py-2 uppercase`}>
                    {item.rarity}
                  </Badge>
                </div>

                {/* Item Icon */}
                <div className="flex justify-center py-4">
                  <GearImage 
                    imageUrl={item.image_url}
                    itemType={item.item_type as 'rod' | 'lure'}
                    rarity={item.rarity as 'common' | 'rare' | 'epic' | 'legendary'}
                    size="xl"
                  />
                </div>

                {/* Item Name */}
                <h2 className={`text-2xl font-black italic uppercase ${colors.text} leading-tight`}>
                  {item.item_name}
                </h2>

                {/* Type Badge */}
                <Badge variant="outline" className="font-black text-xs uppercase border-gray-300 text-gray-500">
                  {item.item_type}
                </Badge>

                {/* Bonus */}
                <div className="bg-gradient-to-br from-primary/10 to-primary/5 border-2 border-primary/30 rounded-3xl p-5">
                  <p className="text-xs font-bold text-muted-foreground uppercase mb-1">Catch Bonus</p>
                  <p className="text-5xl font-black italic text-primary">+{item.bonus_percentage}%</p>
                </div>
              </div>
            </Card>

            {/* Continue Button */}
            <Button
              onClick={onComplete}
              className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/90 text-black font-black uppercase text-sm active:scale-95 transition-transform"
            >
              Continue
            </Button>

            {/* Hint */}
            <p className="text-center text-[10px] text-muted-foreground font-medium">
              Equip this gear in your inventory for bonus points!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CaseOpening;
