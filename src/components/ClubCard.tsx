import { Crown, Swords, Users, ChevronRight, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

interface ClubCardProps {
  id: string;
  name: string;
  memberCount: number;
  totalPoints: number;
  localRank?: number;
  location?: string;
  isInBattle?: boolean;
  battleOpponent?: string;
  battleScore?: { us: number; them: number };
  onClick?: () => void;
}

export function ClubCard({
  name,
  memberCount,
  totalPoints,
  localRank,
  location,
  isInBattle,
  battleOpponent,
  battleScore,
  onClick,
}: ClubCardProps) {
  return (
    <div
      onClick={onClick}
      className="bg-card rounded-xl shadow-card overflow-hidden cursor-pointer card-hover"
    >
      {/* Header with gradient */}
      <div className="gradient-navy p-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-lg text-secondary-foreground">{name}</h3>
          {localRank && localRank <= 3 && (
            <div className={cn(
              "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold",
              localRank === 1 && "rank-1",
              localRank === 2 && "rank-2",
              localRank === 3 && "rank-3"
            )}>
              <Crown className="w-3 h-3" />
              #{localRank}
            </div>
          )}
        </div>
        {location && (
          <div className="flex items-center gap-1 text-secondary-foreground/70 text-sm mt-1">
            <MapPin className="w-3 h-3" />
            <span>{location}</span>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Users className="w-4 h-4" />
            <span className="text-sm">{memberCount} members</span>
          </div>
          <div className="fish-points">
            <Crown className="w-3 h-3" />
            <span>{totalPoints.toLocaleString()} pts</span>
          </div>
        </div>

        {/* Battle Status */}
        {isInBattle && battleOpponent && battleScore && (
          <div className="bg-muted rounded-lg p-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground mb-2">
              <Swords className="w-4 h-4 text-primary" />
              <span>WEEKLY BATTLE</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-center">
                <p className="font-bold text-lg text-foreground">{battleScore.us}</p>
                <p className="text-xs text-muted-foreground">You</p>
              </div>
              <span className="text-muted-foreground font-bold">vs</span>
              <div className="text-center">
                <p className="font-bold text-lg text-foreground">{battleScore.them}</p>
                <p className="text-xs text-muted-foreground truncate max-w-[80px]">{battleOpponent}</p>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-end text-primary text-sm font-medium">
          <span>View Club</span>
          <ChevronRight className="w-4 h-4" />
        </div>
      </div>
    </div>
  );
}
