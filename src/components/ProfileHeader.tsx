import { Crown, Fish, Award, ChevronRight, Settings } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ProfileHeaderProps {
  user: {
    name: string;
    username: string;
    avatar?: string;
    title?: string;
    bio?: string;
  };
  stats: {
    totalPoints: number;
    fishCaught: number;
    titlesUnlocked: number;
  };
  onEditProfile?: () => void;
}

export function ProfileHeader({ user, stats, onEditProfile }: ProfileHeaderProps) {
  return (
    <div className="bg-card rounded-xl shadow-card overflow-hidden">
      {/* Background gradient */}
      <div className="gradient-navy h-20" />

      {/* Profile content */}
      <div className="px-4 pb-4 -mt-10">
        <div className="flex items-end justify-between mb-3">
          <Avatar className="w-20 h-20 ring-4 ring-card">
            <AvatarImage src={user.avatar} alt={user.name} />
            <AvatarFallback className="bg-secondary text-secondary-foreground text-xl font-bold">
              {user.name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <button
            onClick={onEditProfile}
            className="flex items-center gap-1 px-3 py-1.5 bg-muted rounded-full text-sm font-medium hover:bg-muted/80 transition-colors"
          >
            <Settings className="w-4 h-4" />
            <span>Edit</span>
          </button>
        </div>

        <div className="space-y-1">
          <h1 className="font-bold text-xl">{user.name}</h1>
          <p className="text-muted-foreground text-sm">@{user.username}</p>
          {user.title && (
            <div className="title-badge inline-flex mt-1">{user.title}</div>
          )}
          {user.bio && (
            <p className="text-sm text-foreground/80 mt-2">{user.bio}</p>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 mt-4">
          <div className="bg-muted rounded-lg p-3 text-center">
            <div className="flex items-center justify-center gap-1 text-points mb-1">
              <Crown className="w-4 h-4" />
            </div>
            <p className="font-bold text-lg">{stats.totalPoints.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Points</p>
          </div>
          <div className="bg-muted rounded-lg p-3 text-center">
            <div className="flex items-center justify-center gap-1 text-primary mb-1">
              <Fish className="w-4 h-4" />
            </div>
            <p className="font-bold text-lg">{stats.fishCaught}</p>
            <p className="text-xs text-muted-foreground">Fish</p>
          </div>
          <div className="bg-muted rounded-lg p-3 text-center">
            <div className="flex items-center justify-center gap-1 text-gold mb-1">
              <Award className="w-4 h-4" />
            </div>
            <p className="font-bold text-lg">{stats.titlesUnlocked}</p>
            <p className="text-xs text-muted-foreground">Titles</p>
          </div>
        </div>
      </div>
    </div>
  );
}

interface TitleBadgeItemProps {
  title: string;
  description: string;
  isUnlocked: boolean;
  progress?: number;
  maxProgress?: number;
}

export function TitleBadgeItem({
  title,
  description,
  isUnlocked,
  progress,
  maxProgress,
}: TitleBadgeItemProps) {
  return (
    <div className={`p-3 rounded-xl border ${isUnlocked ? 'bg-card border-primary/30' : 'bg-muted/50 border-border opacity-60'}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-full ${isUnlocked ? 'bg-gold/20 text-gold' : 'bg-muted text-muted-foreground'}`}>
            <Award className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-semibold text-sm">{title}</h4>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
        </div>
        {isUnlocked ? (
          <div className="title-badge">Unlocked</div>
        ) : progress !== undefined && maxProgress !== undefined && (
          <div className="text-right">
            <p className="text-xs text-muted-foreground">{progress}/{maxProgress}</p>
            <div className="w-16 h-1.5 bg-muted rounded-full mt-1 overflow-hidden">
              <div 
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: `${(progress / maxProgress) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
