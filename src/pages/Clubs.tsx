import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Users, ShieldCheck } from "lucide-react";

const Clubs = () => {
  const [clubs, setClubs] = useState<any[]>([]);

  useEffect(() => {
    const fetchClubs = async () => {
      const { data } = await supabase.from('clubs').select('*');
      if (data) setClubs(data);
    };
    fetchClubs();
  }, []);

  return (
    <div className="p-4 max-w-md mx-auto space-y-6 pb-24">
      <div className="flex items-center gap-2">
        <Users className="text-primary" />
        <h1 className="text-2xl font-black italic tracking-tighter uppercase">CLUBS</h1>
      </div>
      
      <div className="grid gap-4">
        {clubs.length === 0 ? (
          <p className="text-muted-foreground text-center py-10">No clubs found yet.</p>
        ) : (
          clubs.map((club) => (
            <div key={club.id} className="bg-card border border-border p-4 rounded-3xl shadow-md flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg">{club.name}</h3>
                <p className="text-xs text-muted-foreground">{club.description}</p>
              </div>
              <ShieldCheck className="text-primary opacity-20" size={32} />
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Clubs;
