import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Loader2, Lock, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

const RARITY_COLORS = {
  common: { bg: "bg-gray-500/10", border: "border-gray-500/30", text: "text-gray-200" },
  rare: { bg: "bg-blue-500/10", border: "border-blue-500/30", text: "text-blue-300" },
  epic: { bg: "bg-purple-500/10", border: "border-purple-500/30", text: "text-purple-300" },
  legendary: { bg: "bg-yellow-500/10", border: "border-yellow-500/30", text: "text-yellow-300" },
};

const CATEGORY_LABELS = {
  catching: "🎣 Catching",
  social: "💬 Social",
  gear: "⚙️ Gear",
  explorer: "🗺️ Explorer",
  special: "✨ Special"
};

const Achievements = () => {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [allAchievements, setAllAchievements] = useState<any[]>([]);
  const [unlockedAchievements, setUnlockedAchievements] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const navigate = useNavigate();

  useEffect(() => {
    fetchAchievements();
  }, []);

  const fetchAchievements = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);

      // Fetch all achievements
      const { data: achievementsData } = await supabase
        .from('achievements')
        .select('*')
        .order('rarity', { ascending: true });

      setAllAchievements(achievementsData || []);

      if (user) {
        // Fetch user's unlocked achievements
        const { data: unlockedData } = await supabase
          .from('user_achievements')
          .select('achievement_id')
          .eq('user_id', user.id);

        const unlockedIds = new Set(unlockedData?.map(a => a.achievement_id) || []);
        setUnlockedAchievements(unlockedIds);
      }
    } finally {
      setLoading(false);
    }
  };

  const filteredAchievements = allAchievements.filter(a => 
    filter === 'all' ? true : 
    filter === 'unlocked' ? unlockedAchievements.has(a.id) :
    filter === 'locked' ? !unlockedAchievements.has(a.id) :
    a.category === filter
  );

  const stats = {
    total: allAchievements.length,
    unlocked: unlockedAchievements.size,
    percentage: allAchievements.length > 0 ? Math.round((unlockedAchievements.size / allAchievements.length) * 100) : 0
  };

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="pb-24 pt-4 px-4 max-w-md mx-auto space-y-6">
      {/* Header */}
      <div className="text-left">
        <h1 className="text-4xl font-black italic tracking-tighter text-primary uppercase leading-none">
          Achievements
        </h1>
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mt-1">
          Unlock badges & earn rewards
        </p>
      </div>

      {/* Progress Card */}
      <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20 p-6 rounded-[32px]">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm font-black uppercase text-muted-foreground">Progress</span>
            <span className="text-2xl font-black italic text-primary">{stats.percentage}%</span>
          </div>
          <Progress value={stats.percentage} className="h-3" />
          <div className="flex justify-between items-center text-xs font-bold">
            <span className="text-muted-foreground">{stats.unlocked} / {stats.total} Unlocked</span>
            <span className="text-primary">{stats.total - stats.unlocked} Remaining</span>
          </div>
        </div>
      </Card>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        <Button
          onClick={() => setFilter('all')}
          variant={filter === 'all' ? 'default' : 'outline'}
          className="font-black uppercase text-xs shrink-0"
          size="sm"
        >
          All
        </Button>
        <Button
          onClick={() => setFilter('unlocked')}
          variant={filter === 'unlocked' ? 'default' : 'outline'}
          className="font-black uppercase text-xs shrink-0"
          size="sm"
        >
          Unlocked
        </Button>
        <Button
          onClick={() => setFilter('locked')}
          variant={filter === 'locked' ? 'default' : 'outline'}
          className="font-black uppercase text-xs shrink-0"
          size="sm"
        >
          Locked
        </Button>
        {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
          <Button
            key={key}
            onClick={() => setFilter(key)}
            variant={filter === key ? 'default' : 'outline'}
            className="font-black uppercase text-xs shrink-0"
            size="sm"
          >
            {label}
          </Button>
        ))}
      </div>

      {/* Achievements Grid */}
      <div className="space-y-3">
        {filteredAchievements.map(achievement => {
          const isUnlocked = unlockedAchievements.has(achievement.id);
          const colors = RARITY_COLORS[achievement.rarity as keyof typeof RARITY_COLORS];

          return (
            <Card
              key={achievement.id}
              className={`${colors.bg} border-2 ${colors.border} rounded-[24px] p-4 ${
                !isUnlocked ? 'opacity-50 grayscale' : ''
              }`}
            >
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className="text-4xl shrink-0">
                  {isUnlocked ? achievement.icon : '🔒'}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className={`font-black uppercase italic text-sm leading-none ${colors.text}`}>
                      {achievement.is_secret && !isUnlocked ? '???' : achievement.name}
                    </h3>
                    {isUnlocked && (
                      <CheckCircle2 size={18} className="text-primary shrink-0" />
                    )}
                  </div>

                  <p className="text-xs text-foreground/70 font-medium mb-2">
                    {achievement.is_secret && !isUnlocked ? 'Hidden achievement' : achievement.description}
                  </p>

                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className={`${colors.bg} ${colors.text} border-none font-black text-[8px] px-2`}>
                      {achievement.rarity}
                    </Badge>
                    <Badge variant="outline" className="font-bold text-[10px] px-2 text-foreground/80">
                      {CATEGORY_LABELS[achievement.category as keyof typeof CATEGORY_LABELS]}
                    </Badge>
                    {achievement.reward_points > 0 && (
                      <Badge className="bg-primary/20 text-primary border-none font-black text-[8px] px-2">
                        +{achievement.reward_points} pts
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {filteredAchievements.length === 0 && (
        <Card className="p-12 text-center rounded-[32px]">
          <Lock size={48} className="mx-auto mb-4 text-muted-foreground opacity-20" />
          <p className="text-muted-foreground font-bold">No achievements found</p>
          <p className="text-sm text-muted-foreground mt-2">Try a different filter!</p>
        </Card>
      )}
    </div>
  );
};

export default Achievements;
