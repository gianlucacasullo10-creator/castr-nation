import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Users, ShieldCheck, Loader2 } from "lucide-react";

const Clubs = () => {
  const [clubs, setClubs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClubs = async () => {
      try {
        const { data, error } = await supabase.from('clubs').select('*');
        if (error) throw error;
        setClubs(data || []);
      } catch (err) {
        console.error("Clubs Error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchClubs();
  }, []);

  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="p-6 max-w-md mx-auto space-y-6 pb-24">
      <div className="flex items-center gap-2">
        <Users className="text-primary" />
        <h1 className="text-2xl font-black italic tracking-tighter uppercase">Clubs</h1>
      </div>
      
      <div className="grid gap-4">
        {clubs.length === 0 ? (
          <div className="text-center py-10 bg-muted rounded-3xl border-2 border-dashed">
             <p className="text-muted-foreground font-medium">No clubs found in the area.</p>
          </div>
        ) : (
          clubs.map((club) => (
            <div key={club.id} className="bg-card border-2 border-border p-5 rounded-3xl shadow-sm flex items-center justify-between">
              <div>
                <h3 className="font-black italic uppercase text-lg leading-none mb-1">{club.name}</h3>
                <p className="text-xs text-muted-foreground font-medium">{club.description}</p>
              </div>
              <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                <ShieldCheck className="text-primary" size={20} />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Clubs;
