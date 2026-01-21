import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trophy, Medal, Award } from "lucide-react";

const LeaderboardsPage = () => {
  const [leaders, setLeaders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  async function fetchLeaderboard() {
    try {
      setLoading(true);
      // Fetching all profiles. Later we can sort by a 'total_points' column
      const { data, error } = await supabase
        .from('profiles')
        .select('username, display_name, avatar_url')
        .limit(10);

      if (error) throw error;
      setLeaders(data || []);
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
    } finally {
      setLoading(false);
    }
  }

  const getRankIcon = (index: number) => {
    if (index === 0) return <Trophy className="w-6 h-6 text-yellow-500" />;
    if (index === 1) return <Medal className="w-6 h-6 text-slate-400" />;
    if (index === 2) return <Award className="w-6 h-6 text-amber-600" />;
    return <span className="text-muted-foreground font-bold w-6 text-center">{index + 1}</span>;
  };

  return (
    <div className="app-container bg-background">
      <AppHeader title="Leaderboard" />
      
      <main className="flex-1 p-4 safe-bottom">
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">Scouting the best anglers...</div>
          ) : leaders.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">No rankings yet. Be the first to catch a fish!</div>
          ) : (
            <div className="divide-y divide-border">
              {leaders.map((user, index) => (
                <div key={index} className="flex items-center p-4 gap-4">
                  <div className="flex-shrink-0 w-8 flex justify-center">
                    {getRankIcon(index)}
                  </div>
                  <Avatar className="h-10 w-10 border border-border">
                    <AvatarImage src={user.avatar_url} />
                    <AvatarFallback>{user.display_name?.substring(0, 2).toUpperCase() || "???"}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{user.display_name || "Unknown Angler"}</p>
                    <p className="text-xs text-muted-foreground truncate">@{user.username || "no-handle"}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-primary">0 pts</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      
      <BottomNav />
    </div>
  );
};

export default LeaderboardsPage;
