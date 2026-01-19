import { Crown, Fish } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface LeaderboardItemProps {
  rank: number;
  user: {
    name: string;
    avatar?: string;
    title?: string;
  };
  points: number;
  fishCount?: number;
  isCurrentUser?: boolean;
}

export function LeaderboardItem({
  rank,
  user,
  points,
  fishCount,
  isCurrentUser = false,
}: LeaderboardItemProps) {
  const getRankStyle = () => {
    if (rank === 1) return "rank-1";
    if (rank === 2) return "rank-2";
    if (rank === 3) return "rank-3";
    return "bg-muted text-muted-foreground";
  };

  return (
    <div
      className={cn(
        "flex items-center gap-3 p-3 rounded-xl transition-colors",
        isCurrentUser ? "bg-primary/10 border border-primary/30" : "hover:bg-muted/50"
      )}
    >
      {/* Rank */}
      <div
        className={cn(
          "w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm",
          getRankStyle()
        )}
      >
        {rank <= 3 ? <Crown className="w-4 h-4" /> : rank}
      </div>

      {/* User Info */}
      <Avatar className="w-10 h-10 ring-2 ring-border">
        <AvatarImage src={user.avatar} alt={user.name} />
        <AvatarFallback className="bg-secondary text-secondary-foreground font-semibold text-sm">
          {user.name.slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={cn(
            "font-semibold text-sm truncate",
            isCurrentUser && "text-primary"
          )}>
            {user.name}
          </span>
          {isCurrentUser && (
            <span className="text-xs text-primary font-medium">(You)</span>
          )}
        </div>
        {user.title && (
          <span className="title-badge text-[10px]">{user.title}</span>
        )}
      </div>

      {/* Stats */}
      <div className="text-right">
        <div className="fish-points">
          <Crown className="w-3 h-3" />
          <span>{points.toLocaleString()}</span>
        </div>
        {fishCount !== undefined && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
            <Fish className="w-3 h-3" />
            <span>{fishCount}</span>
          </div>
        )}
      </div>
    </div>
  );
}
