import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Trophy, Fish } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const Leaderboards = () => {
  const [leaders, setLeaders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaders = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select(`
            id,
            display_name,
            avatar_url,
            active_title,
            catches (points)
          `);

        if (error) throw error;

        const rankedUsers = data.map(user => {
          const totalPoints = user.catches?.reduce((sum: number, c: any) => sum + (c.points || 0), 0) || 0;
          const totalCatches = user.catches?.length || 0;
          return { ...user, totalPoints, totalCatches };
        }).sort((a, b) => b.totalPoints - a.totalPoints);

        setLeaders(rankedUsers);
      } catch (error: any) {
        console.error("Leaderboard Error:", error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaders();
  }, []);

  return (
    <div className="p-6 max-w-md mx-auto pb-24 space-y-6">
      <div className="flex items-center gap-2">
        <Trophy className="text-primary" size={28} />
        <h1 className="text-3xl font-black italic uppercase tracking-tighter text-primary">Rankings</h1>
      </div>

      <div className="space-y-3">
        {leaders.map((leader, i) => (
          <div key={leader.id || i} className={`flex items-center justify-between p-4 rounded-3xl transition-all ${
            i === 0 ? "bg-gradient-to-br from-primary/20 to-primary/5 border-2 border-primary shadow-lg scale-[1.02]" : "bg-card border border-border/50"
          }`}>
            <div className="flex items-center gap-4">
              <div className="w-8 flex justify-center">
                {i === 0 ? <span className="text-2xl animate-bounce">🏆</span> : <span className="text-lg font-black italic text-muted-foreground">#{i + 1}</span>}
              </div>

              <Avatar className={`h-12 w-12 border-2 ${i === 0 ? "border-primary" : "border-transparent"}`}>
                <AvatarImage src={leader.avatar_url} />
                <AvatarFallback className="font-bold bg-muted">{leader.display_name?.charAt(0)}</AvatarFallback>
              </Avatar>

              <div>
                <p className={`font-black italic uppercase leading-none ${i === 0 ? "text-lg" : "text-sm"}`}>
                  {leader.display_name || "Unknown"}
                </p>
                {/* DYNAMIC TITLE DISPLAY */}
                <p className={`text-[10px] font-black uppercase tracking-widest mt-1 ${
                  leader.active_title === 'OG CASTR' ? 'text-yellow-500 animate-pulse' : 'text-primary'
                }`}>
                  {leader.active_title || "Beginner"}
                </p>
                <p className="text-[8px] font-bold text-muted-foreground uppercase mt-1 flex items-center gap-1">
                  <Fish size={8} /> {leader.totalCatches} Catches
                </p>
              </div>
            </div>

            <div className="text-right">
              <p className={`font-black italic text-primary leading-none ${i === 0 ? "text-2xl" : "text-xl"}`}>
                {leader.totalPoints.toLocaleString()}
              </p>
              <p className="text-[10px] font-black text-muted-foreground uppercase">Points</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Leaderboards;
