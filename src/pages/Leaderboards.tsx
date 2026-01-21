import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Trophy, Medal } from "lucide-react";

const Leaderboards = () => {
  const [leaders, setLeaders] = useState<any[]>([]);

  useEffect(() => {
    const fetchLeaders = async () => {
      // This query gets profiles and counts their catches
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          display_name,
          catches (id)
        `);

      if (data) {
        const sorted = data
          .map((user: any) => ({
            name: user.display_name || "Unknown Angler",
            count: user.catches?.length || 0
          }))
          .sort((a, b) => b.count - a.count);
        setLeaders(sorted);
      }
    };
    fetchLeaders();
  }, []);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-2">
        <Trophy className="text-yellow-500" />
        <h1 className="text-2xl font-bold italic">RANKINGS</h1>
      </div>
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {leaders.map((leader, index) => (
          <div key={index} className="flex justify-between items-center p-4 border-b border-border last:border-0">
            <div className="flex items-center gap-4">
              <span className="font-bold text-muted-foreground w-4">{index + 1}</span>
              <span className="font-semibold">{leader.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-primary font-bold">{leader.count}</span>
              <span className="text-xs text-muted-foreground">Catches</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Leaderboards;
