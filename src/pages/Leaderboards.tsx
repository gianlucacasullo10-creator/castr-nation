import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trophy, Medal, Loader2 } from "lucide-react";

const Leaderboards = () => {
  const [rankings, setRankings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRankings = async () => {
    try {
      setLoading(true);
      
      // 1. Fetch all profiles first
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url, active_title');

      if (profileError) throw profileError;

      // 2. Fetch all catches
      const { data: catches, error: catchError } = await supabase
        .from('catches')
        .select('user_id, points');

      if (catchError) throw catchError;

      // 3. Manually calculate totals (Simple & Fast)
      const userTotals: Record<string, number> = {};
      catches?.forEach((c) => {
        userTotals[c.user_id] = (userTotals[c.user_id] || 0) + (c.points || 0);
      });

      // 4. Map them together
      const finalRankings = (profiles || [])
        .map(profile => ({
          ...profile,
          totalPoints: userTotals[profile.id] || 0
        }))
        // Filter out anyone with 0 points if you want a "clean" board, 
        // or keep them to show all members. Let's keep all for now.
        .sort((a, b) => b.totalPoints - a.totalPoints);

      setRankings(finalRankings);
    } catch (error: any) {
      console.error("Leaderboard Error:", error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRankings();
  }, []);

  const getRankIcon = (index: number) => {
    if (index === 0) return <Trophy className="text-yellow-500" size={20} />;
    if (index === 1) return <Medal className="text-slate-400" size={20} />;
    if (index === 2) return <Medal className="text-amber-700" size={20} />;
    return <span className="text-[10px] font-black text-muted-foreground w-5 text-center">{index + 1}</span>;
  };

  if (loading) return (
    <div className="flex h-[80vh] flex-col items-center justify-center space-y-4">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="font-black italic uppercase text-primary">Syncing Ranks...</p>
    </div>
  );

  return (
    <div className="pb-24 pt-4 px-4 max-w-md mx-auto space-y-6">
      <div className="text-left">
        <h1 className="text-4xl font-black italic tracking-tighter text-primary uppercase leading-none">The Standings</h1>
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mt-1">North America Division</p>
      </div>

      <div className="space-y-3">
        {rankings.length === 0 ? (
          <div className="py-20 text-center opacity-30 font-black uppercase italic">No Anglers Ranked Yet</div>
        ) : (
          rankings.map((user, index) => (
            <Card 
              key={user.id} 
              className={`border-none flex items-center p-4 gap-4 rounded-[24px] shadow-lg ${
                index === 0 ? "bg-primary/10 border border-primary/20" : "bg-card"
              }`}
            >
              <div className="flex items-center justify-center min-w-[24px]">
                {getRankIcon(index)}
              </div>

              <Avatar className="h-10 w-10 border-2 border-primary/10">
                <AvatarImage src={user.avatar_url} />
                <AvatarFallback className="font-black">{user.display_name?.charAt(0) || "C"}</AvatarFallback>
              </Avatar>

              <div className="flex flex-col flex-1 text-left overflow-hidden">
                <span className="font-black italic text-sm leading-none uppercase truncate">
                  {user.display_name || "Anonymous"}
                </span>
                <span className="text-[8px] font-black uppercase tracking-widest mt-1 text-primary/70">
                  {user.active_title || "Beginner"}
                </span>
              </div>

              <div className="text-right">
                <div className="text-lg font-black italic leading-none text-primary">
                  {user.totalPoints.toLocaleString()}
                </div>
                <div className="text-[7px] font-black text-muted-foreground uppercase tracking-widest">
                  PTS
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default Leaderboards;
