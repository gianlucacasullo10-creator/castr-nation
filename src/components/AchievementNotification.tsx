import { useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Award, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface AchievementNotificationProps {
  achievement: {
    name: string;
    description?: string;
    icon?: string;
    rarity: string;
    reward_points: number;
  };
  onClose: () => void;
}

const RARITY_COLORS: Record<string, string> = {
  common: "from-gray-500/20 to-gray-600/20 border-gray-400",
  rare: "from-blue-500/20 to-blue-600/20 border-blue-400",
  epic: "from-purple-500/20 to-purple-600/20 border-purple-400",
  legendary: "from-yellow-500/20 to-yellow-600/20 border-yellow-400",
};

const AchievementNotification = ({ achievement, onClose }: AchievementNotificationProps) => {
  useEffect(() => {
    // Auto-close after 5 seconds
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const gradientClass = RARITY_COLORS[achievement.rarity] || RARITY_COLORS.common;

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[200] w-[90%] max-w-md animate-in slide-in-from-top-4 duration-300">
      <Card className={`bg-gradient-to-br ${gradientClass} border-2 rounded-3xl p-4 shadow-2xl`}>
        <div className="flex items-center gap-4">
          {/* Icon */}
          <div className="bg-primary/20 p-3 rounded-2xl shrink-0">
            <Award className="text-primary" size={32} />
          </div>

          {/* Content */}
          <div className="flex-1 text-left">
            <p className="text-xs font-black uppercase text-primary tracking-wider">
              Achievement Unlocked!
            </p>
            <h3 className="text-lg font-black italic uppercase tracking-tight text-foreground leading-none mt-1">
              {achievement.name}
            </h3>
            {achievement.reward_points > 0 && (
              <Badge className="bg-primary/20 text-primary border-primary/30 font-black text-xs px-2 py-0.5 mt-2">
                +{achievement.reward_points} pts
              </Badge>
            )}
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="p-2 hover:bg-foreground/10 rounded-full transition-colors shrink-0"
          >
            <X size={20} className="text-foreground/60" />
          </button>
        </div>
      </Card>
    </div>
  );
};

export default AchievementNotification;
