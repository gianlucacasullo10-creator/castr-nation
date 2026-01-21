import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Trophy } from "lucide-react";

const Leaderboards = () => {
  const [leaders, setLeaders] = useState<any[]>([]);

  useEffect(() => {
    const fetchLeaders = async () => {
      const { data } = await supabase.from('profiles').select('display_name, catches(id)');
      if (data) {
        const sorted = data
          .map((u: any) => ({ name: u.display_name || "New Angler", count: u.catches?.length || 0 }))
          .sort((a, b) => b.count - a.count);
        setLeaders(sorted);
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
