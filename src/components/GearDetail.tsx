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
  common: { bg: "bg-gray-500/20", border: "border-gray-500", text: "text-gray-100", glow: "shadow-[0_0_40px_rgba(156,163,175,0.5)]" },
  rare: { bg: "bg-blue-500/20", border: "border-blue-500", text: "text-blue-200", glow: "shadow-[0_0_40px_rgba(59,130,246,0.5)]" },
  epic: { bg: "bg-purple-500/20", border: "border-purple-500", text: "text-purple-200", glow: "shadow-[0_0_40px_rgba(168,85,247,0.5)]" },
  legendary: { bg: "bg-yellow-500/20", border: "border-yellow-500", text: "text-yellow-200", glow: "shadow-[0_0_60px_rgba(234,179,8,0.8)]" },
};

const GearDetail = ({ item, onClose, onEquip }: GearDetailProps) => {
  const colors = RARITY_COLORS[item.rarity];

  useEffect(() => {
    // Lock body scroll
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    document.body.style.height = '100%';

    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.height = '';
    };
  }, []);

  return (
    <div className="fixed inset-[-50px] z-[200] bg-black overflow-hidden">
      <div className="absolute inset-0 bg-black/95 backdrop-blur-md" />
      
      <div className="relative h-screen w-screen overflow-y-auto">
        <div className="max-w-md mx-auto p-4 space-y-6 pb-8">
          {/* Header */}
          <div className="flex items-start justify-between pt-4 sticky top-0 bg-black z-10 pb-4">
            <div className="flex-1">
              <h2 className="text-2xl font-black italic uppercase text-primary tracking-tighter leading-none">
                Gear Details
              </h2>
            </div>
            <button 
              onClick={onClose}
              className="h-10 w-10 rounded-full hover:bg-white/10 transition-colors flex items-center justify-center"
            >
              <X size={24} className="text-white/70" />
            </button>
          </div>

          {/* Main Card */}
          <Card className={`${colors.bg} ${colors.glow} border-4 ${colors.border} rounded-[40px] p-8`}>
            <div className="space-y-6">
              {/* Rarity Badge */}
              <div className="flex justify-center">
                <Badge className={`${colors.bg} ${colors.text} border-2 ${colors.border} font-black text-sm px-6 py-2 uppercase`}>
                  {item.rarity}
                </Badge>
              </div>

              {/* Gear Image */}
              <div className="flex justify-center">
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
                <h3 className={`text-3xl font-black italic uppercase ${colors.text} leading-tight`}>
                  {item.item_name}
                </h3>
                <Badge variant="outline" className="font-black text-xs uppercase mt-2">
                  {item.item_type}
                </Badge>
              </div>

              {/* Bonus */}
              <div className="text-center bg-primary/10 border-2 border-primary/30 rounded-3xl p-4">
                <p className="text-sm font-bold text-muted-foreground uppercase mb-1">Catch Bonus</p>
                <p className="text-5xl font-black italic text-primary">+{item.bonus_percentage}%</p>
              </div>

              {/* Description */}
              {item.description && (
                <div className="bg-muted/30 border-2 border-muted/30 rounded-3xl p-4">
                  <p className="text-sm text-muted-foreground italic text-center leading-relaxed">
                    "{item.description}"
                  </p>
                </div>
              )}

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white/5 border-2 border-white/10 rounded-2xl p-3 text-center">
                  <TrendingUp className="mx-auto mb-2 text-primary" size={20} />
                  <p className="text-2xl font-black text-white">{item.times_used || 0}</p>
                  <p className="text-[9px] font-bold text-muted-foreground uppercase">Times Used</p>
                </div>
                <div className="bg-white/5 border-2 border-white/10 rounded-2xl p-3 text-center">
                  <Award className="mx-auto mb-2 text-primary" size={20} />
                  <p className="text-2xl font-black text-white">{item.catches_made || 0}</p>
                  <p className="text-[9px] font-bold text-muted-foreground uppercase">Catches</p>
                </div>
                <div className="bg-white/5 border-2 border-white/10 rounded-2xl p-3 text-center">
                  <Calendar className="mx-auto mb-2 text-primary" size={20} />
                  <p className="text-2xl font-black text-white">
                    {item.biggest_catch_weight ? `${item.biggest_catch_weight}lb` : '0lb'}
                  </p>
                  <p className="text-[9px] font-bold text-muted-foreground uppercase">Biggest</p>
                </div>
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
                      ? 'bg-muted text-muted-foreground' 
                      : 'bg-primary hover:bg-primary/90 text-black'
                  }`}
                  disabled={item.is_equipped}
                >
                  {item.is_equipped ? 'Currently Equipped' : 'Equip Item'}
                </Button>
              )}
            </div>
          </Card>

          {/* Additional Info */}
          <Card className="bg-muted/30 border-2 border-dashed border-muted p-6 rounded-[32px]">
            <h3 className="font-black uppercase text-xs mb-3 text-center">Pro Tip</h3>
            <p className="text-xs text-muted-foreground text-center">
              Use this {item.item_type} regularly to level it up and increase its stats. Higher rarity gear has better bonuses!
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default GearDetail;
