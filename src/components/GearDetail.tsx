import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X, TrendingUp, Award, Calendar } from "lucide-react";
import GearImage from "@/components/GearImage";

interface GearDetailProps {
  item: {
    id: string;
    item_name: string;
    item_type: 'rod' | 'lure';
    rarity: 'common' | 'rare' | 'epic' | 'legendary';
    bonus_percentage: number;
    is_equipped: boolean;
    image_url?: string | null;
    description?: string | null;
    times_used?: number;
    catches_made?: number;
    biggest_catch_weight?: number;
    created_at?: string;
  };
  onClose: () => void;
  onEquip?: (itemId: string) => void;
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

const GearDetail = ({ item, onClose, onEquip }: GearDetailProps) => {
  const colors = RARITY_COLORS[item.rarity];

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[9999] bg-[#f5f5f5] flex justify-center overflow-hidden">
      <div className="relative h-dvh w-full max-w-md overflow-y-auto">
        
        <div className="flex flex-col space-y-6 pb-24 pt-4 px-4">
          {/* Header - Centered like Tournaments */}
          <div className="text-center pt-2">
            <h1 className="text-4xl font-black italic tracking-tighter text-primary uppercase leading-none">
              Gear Details
            </h1>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mt-1">
              {item.item_type} Statistics
            </p>
          </div>

          {/* Close Button - Positioned top right */}
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 h-10 w-10 rounded-full bg-black/5 hover:bg-black/10 transition-colors flex items-center justify-center z-30"
          >
            <X size={20} className="text-gray-500" />
          </button>

          {/* Main Gear Card */}
          <Card className={`bg-gradient-to-br ${colors.gradient} border-2 ${colors.border} rounded-[32px] p-6 overflow-hidden`}>
            <div className="space-y-5">
              {/* Rarity Badge */}
              <div className="flex justify-center">
                <Badge className={`${colors.badgeBg} ${colors.text} border-2 ${colors.border} font-black text-sm px-6 py-2 uppercase`}>
                  {item.rarity}
                </Badge>
              </div>

              {/* Gear Image */}
              <div className="flex justify-center py-4">
                <GearImage 
                  imageUrl={item.image_url}
                  itemType={item.item_type}
                  rarity={item.rarity}
                  size="xl"
                  className="animate-in zoom-in-95 duration-500"
                />
              </div>

              {/* Item Name */}
              <div className="text-center">
                <h3 className={`text-2xl font-black italic uppercase ${colors.text} leading-tight`}>
                  {item.item_name}
                </h3>
                <Badge variant="outline" className="font-black text-xs uppercase mt-2 border-gray-300 text-gray-500">
                  {item.item_type}
                </Badge>
              </div>

              {/* Bonus - Highlighted */}
              <div className="text-center bg-gradient-to-br from-primary/10 to-primary/5 border-2 border-primary/30 rounded-3xl p-5">
                <p className="text-xs font-bold text-muted-foreground uppercase mb-1">Catch Bonus</p>
                <p className="text-5xl font-black italic text-primary">+{item.bonus_percentage}%</p>
              </div>

              {/* Description */}
              {item.description && (
                <div className="bg-white/60 border-2 border-gray-200 rounded-3xl p-4">
                  <p className="text-sm text-gray-600 italic text-center leading-relaxed">
                    "{item.description}"
                  </p>
                </div>
              )}
            </div>
          </Card>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-3">
            <Card className="bg-white border-2 border-gray-100 rounded-[20px] p-4 text-center">
              <TrendingUp className="mx-auto mb-2 text-primary" size={20} />
              <p className="text-2xl font-black text-gray-800">{item.times_used || 0}</p>
              <p className="text-[9px] font-bold text-muted-foreground uppercase">Times Used</p>
            </Card>
            <Card className="bg-white border-2 border-gray-100 rounded-[20px] p-4 text-center">
              <Award className="mx-auto mb-2 text-primary" size={20} />
              <p className="text-2xl font-black text-gray-800">{item.catches_made || 0}</p>
              <p className="text-[9px] font-bold text-muted-foreground uppercase">Catches</p>
            </Card>
            <Card className="bg-white border-2 border-gray-100 rounded-[20px] p-4 text-center">
              <Calendar className="mx-auto mb-2 text-primary" size={20} />
              <p className="text-2xl font-black text-gray-800">
                {item.biggest_catch_weight ? `${item.biggest_catch_weight}lb` : '0lb'}
              </p>
              <p className="text-[9px] font-bold text-muted-foreground uppercase">Biggest</p>
            </Card>
          </div>

          {/* Acquired Date */}
          {item.created_at && (
            <div className="text-center">
              <p className="text-xs text-muted-foreground">
                Acquired {new Date(item.created_at).toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric', 
                  year: 'numeric' 
                })}
              </p>
            </div>
          )}

          {/* Equip Button */}
          {onEquip && (
            <Button
              onClick={() => onEquip(item.id)}
              className={`w-full h-14 rounded-2xl font-black uppercase text-sm ${
                item.is_equipped 
                  ? 'bg-gray-200 text-gray-500 hover:bg-gray-200' 
                  : 'bg-primary hover:bg-primary/90 text-black'
              }`}
              disabled={item.is_equipped}
            >
              {item.is_equipped ? 'Currently Equipped' : 'Equip Item'}
            </Button>
          )}

          {/* Pro Tip Card */}
          <Card className="bg-white border-2 border-dashed border-gray-200 p-6 rounded-[32px]">
            <h3 className="font-black uppercase text-xs mb-2 text-center text-gray-800">Pro Tip</h3>
            <p className="text-xs text-gray-500 text-center leading-relaxed">
              Use this {item.item_type} regularly to level it up and increase its stats. Higher rarity gear has better bonuses!
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default GearDetail;
