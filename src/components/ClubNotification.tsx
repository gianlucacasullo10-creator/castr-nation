import { Trophy, Fish } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ClubNotificationProps {
  clubName: string;
  user: {
    name: string;
    avatar?: string;
  };
  action: "catch" | "rank" | "battle";
  details: string;
  timeAgo: string;
}

export function ClubNotification({
  clubName,
  user,
  action,
  details,
  timeAgo,
}: ClubNotificationProps) {
  const getIcon = () => {
    switch (action) {
      case "catch":
        return <Fish className="w-4 h-4" />;
      case "rank":
        return <Trophy className="w-4 h-4" />;
      case "battle":
        return <Trophy className="w-4 h-4" />;
      default:
        return <Fish className="w-4 h-4" />;
    }
  };

  const getActionColor = () => {
    switch (action) {
      case "catch":
        return "bg-success/10 text-success";
      case "rank":
        return "bg-gold/10 text-gold";
      case "battle":
        return "bg-primary/10 text-primary";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="bg-card/50 border border-border rounded-xl p-3 flex items-center gap-3 animate-fade-in">
      <div className={`p-2 rounded-full ${getActionColor()}`}>
        {getIcon()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <Avatar className="w-5 h-5">
            <AvatarImage src={user.avatar} />
            <AvatarFallback className="text-[8px] bg-secondary text-secondary-foreground">
              {user.name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="font-medium text-sm truncate">{user.name}</span>
          <span className="text-muted-foreground text-xs">in</span>
          <span className="font-semibold text-sm text-primary truncate">{clubName}</span>
        </div>
        <p className="text-sm text-muted-foreground truncate">{details}</p>
      </div>
      <span className="text-xs text-muted-foreground whitespace-nowrap">{timeAgo}</span>
    </div>
  );
}
