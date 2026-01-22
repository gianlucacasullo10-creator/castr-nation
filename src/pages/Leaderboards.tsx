import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Trophy } from "lucide-react";

const Leaderboards = () => {
  const [leaders, setLeaders] = useState<any[]>([]);

  useEffect(() => {
    const fetchLeaderboard = async () => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        display_name,
        avatar_url,
        catches (points)
      `);

    if (error) throw error;

    // Calculate total points per user and sort by highest
    const rankedUsers = data.map(user => {
      // Summing up the points column for every fish that user has caught
      const totalPoints = user.catches?.reduce((sum, c) => sum + (c.points || 0), 0) || 0;
      return {
        ...user,
        totalPoints
      };
    }).sort((a, b) => b.totalPoints - a.totalPoints);

    setRankings(rankedUsers);
  } catch (error: any) {
    console.error("Leaderboard Error:", error.message);
  }
};
    fetchLeaders();
  }, []);

  return (
    <div className="p-6 max-w-md mx-auto pb-24 space-y-6">
      <div className="flex items-center gap-2">
        <Trophy className="text-yellow-500" />
        <h1 className="text-2xl font-black italic uppercase tracking-tighter">Rankings</h1>
      </div>
      <div className="space-y-3">
        {leaders.map((leader, i) => (
          <div key={i} className="flex justify-between items-center p-4 bg-card border border-border rounded-2xl shadow-sm">
            <span className="font-bold">{i + 1}. {leader.name}</span>
            <span className="font-black text-primary">{leader.count} Catches</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Leaderboards;
