import { Heart, MessageCircle, MoreHorizontal } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface FishPostProps {
  id: string;
  user: {
    name: string;
    username: string;
    avatar?: string;
    title?: string;
  };
  fish: {
    species: string;
    weight: string;
    length: string;
    points: number;
    imageUrl: string;
  };
  likes: number;
  comments: number;
  isLiked?: boolean;
  timeAgo: string;
  onLike?: () => void;
  onComment?: () => void;
}

export function FishPost({
  user,
  fish,
  likes,
  comments,
  isLiked = false,
  timeAgo,
  onLike,
  onComment,
}: FishPostProps) {
  return (
    <article className="bg-card rounded-xl shadow-card overflow-hidden animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between p-3">
        <div className="flex items-center gap-3">
          <Avatar className="w-10 h-10 ring-2 ring-primary/20">
            <AvatarImage src={user.avatar} alt={user.name} />
            <AvatarFallback className="bg-secondary text-secondary-foreground font-semibold">
              {user.name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm">{user.name}</span>
            </div>
            {user.title && (
              <span className="title-badge text-[10px]">{user.title}</span>
            )}
          </div>
        </div>
        <button className="p-2 rounded-full hover:bg-muted transition-colors">
          <MoreHorizontal className="w-5 h-5 text-muted-foreground" />
        </button>
      </div>

      {/* Fish Image */}
      <div className="relative aspect-[4/3] bg-muted">
        <img
          src={fish.imageUrl}
          alt={`${fish.species} catch`}
          className="w-full h-full object-cover"
        />
        {/* Fish Points Badge */}
        <div className="absolute top-3 right-3 fish-points backdrop-blur-sm bg-points/90 text-points-foreground">
          <span className="font-bold">+{fish.points}</span>
          <span>pts</span>
        </div>
      </div>

      {/* Fish Stats */}
      <div className="gradient-navy p-3">
        <div className="flex items-center justify-between text-secondary-foreground">
          <div>
            <h3 className="font-bold text-lg">{fish.species}</h3>
            <div className="flex items-center gap-3 text-sm opacity-90">
              <span>{fish.weight}</span>
              <span className="opacity-50">•</span>
              <span>{fish.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="p-3 flex items-center justify-between border-t border-border">
        <div className="flex items-center gap-4">
          <button
            onClick={onLike}
            className="flex items-center gap-1.5 transition-transform active:scale-95"
          >
            <Heart
              className={cn(
                "w-5 h-5 transition-colors",
                isLiked ? "fill-destructive text-destructive" : "text-muted-foreground"
              )}
            />
            <span className={cn(
              "text-sm font-medium",
              isLiked ? "text-destructive" : "text-muted-foreground"
            )}>
              {likes}
            </span>
          </button>
          <button
            onClick={onComment}
            className="flex items-center gap-1.5"
          >
            <MessageCircle className="w-5 h-5 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">{comments}</span>
          </button>
        </div>
        <span className="text-xs text-muted-foreground">{timeAgo}</span>
      </div>
    </article>
  );
}
