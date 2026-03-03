import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trophy, Star, Coins, Gift, X } from "lucide-react";

interface TournamentReward {
  id: string;
  tournament_id: string;
  rank_position: number;
  reward_description: string;
  points_granted: number;
  tournament_name?: string;
}

interface TournamentRewardPopupProps {
  rewards: TournamentReward[];
  onClose: () => void;
}

const getRankIcon = (rank: number) => {
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return `#${rank}`;
};

const getRankLabel = (rank: number) => {
  if (rank === 1) return "1st Place";
  if (rank === 2) return "2nd Place";
  if (rank === 3) return "3rd Place";
  return `Rank #${rank}`;
};

const TournamentRewardPopup = ({ rewards, onClose }: TournamentRewardPopupProps) => {
  const [claiming, setClaiming] = useState(false);

  const handleClaim = async () => {
    setClaiming(true);
    try {
      const ids = rewards.map((r) => r.id);
      await supabase
        .from("tournament_rewards")
        .update({ claimed_at: new Date().toISOString() })
        .in("id", ids);
    } catch (err) {
      console.error("Failed to mark rewards as claimed:", err);
    } finally {
      setClaiming(false);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-sm animate-zoom-in">
        {/* Background glow */}
        <div className="absolute inset-0 rounded-[40px] bg-gradient-to-br from-yellow-500/30 via-primary/20 to-purple-500/30 blur-2xl -z-10" />

        <Card className="rounded-[40px] border-2 border-yellow-500/40 bg-card overflow-hidden shadow-2xl">
          {/* Header */}
          <div className="relative bg-gradient-to-br from-yellow-500/20 via-primary/10 to-purple-500/20 p-8 text-center border-b-2 border-yellow-500/20">
            <div className="text-6xl mb-3">🏆</div>
            <h2 className="text-3xl font-black italic uppercase tracking-tighter text-primary leading-none">
              Winner!
            </h2>
            <p className="text-xs font-black uppercase tracking-widest text-muted-foreground mt-2">
              Tournament Rewards Unlocked
            </p>
          </div>

          {/* Rewards */}
          <div className="p-6 space-y-4">
            {rewards.map((reward) => (
              <div key={reward.id} className="space-y-2">
                {reward.tournament_name && (
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    {reward.tournament_name}
                  </p>
                )}
                <div className="bg-gradient-to-r from-yellow-500/10 to-primary/10 border-2 border-yellow-500/30 rounded-[24px] p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-3xl">{getRankIcon(reward.rank_position)}</span>
                    <div>
                      <p className="font-black uppercase text-sm text-foreground leading-none">
                        {getRankLabel(reward.rank_position)}
                      </p>
                      <Badge className="mt-1 bg-yellow-500/20 text-yellow-600 border-none font-black text-[9px] uppercase">
                        You Won!
                      </Badge>
                    </div>
                  </div>

                  <div className="bg-background/50 rounded-2xl p-4">
                    <div className="flex items-start gap-3">
                      <Gift className="text-primary shrink-0 mt-0.5" size={18} />
                      <p className="text-sm font-bold text-foreground leading-relaxed">
                        {reward.reward_description}
                      </p>
                    </div>
                    {reward.points_granted > 0 && (
                      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
                        <Coins className="text-yellow-500" size={16} />
                        <p className="text-sm font-black text-yellow-500">
                          +{reward.points_granted.toLocaleString()} Fish Points added to your account
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Claim button */}
          <div className="px-6 pb-6">
            <Button
              onClick={handleClaim}
              disabled={claiming}
              className="w-full h-14 rounded-2xl bg-gradient-to-r from-yellow-500 to-primary text-black font-black uppercase text-sm hover:opacity-90"
            >
              <Star size={18} className="mr-2" />
              {claiming ? "Claiming..." : "Claim Rewards!"}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default TournamentRewardPopup;
