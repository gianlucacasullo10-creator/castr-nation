import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Users, ShieldCheck, Loader2 } from "lucide-react";

const Clubs = () => {
  const [clubs, setClubs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [debugError, setDebugError] = useState<string | null>(null);

  useEffect(() => {
    const fetchClubs = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase.from('clubs').select('*');
        
        if (error) {
          setDebugError(error.message);
        } else {
          setClubs(data || []);
        }
      } catch (err: any) {
        setDebugError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchClubs();
  }, []);

  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;

  return (
    <div className="p-4 max-w-md mx-auto space-y-6 pb-24 min-h-screen bg-background">
      <div className="flex items-center gap-2 pt-4">
        <Users className="text-primary" />
        <h1 className="text-2xl font-black italic tracking-tighter uppercase">Clubs</h1>
      </div>

      {debugError && (
        <div className="p-4 bg-red-50 text-red-600 rounded-xl text-xs font-mono">
          DEBUG ERROR: {debugError}
        </div>
      )}
      
      <div className="grid gap-4">
        {clubs.length === 0 ? (
          <div className="text-center py-20 bg-muted rounded-3xl border-2 border-dashed border-border">
             <p className="text-muted-foreground font-bold uppercase italic text-sm">No Clubs Found</p>
             <p className="text-[10px] text-muted-foreground/60 uppercase">Check Table: 'clubs'</p>
          </div>
        ) : (
          clubs.map((club) => (
            <div key={club?.id} className="bg-card border-2 border-border p-5 rounded-3xl shadow-sm">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <h3 className="font-black italic uppercase text-xl leading-none">
                    {club?.name || "Unnamed Club"}
                  </h3>
                  <p className="text-xs text-muted-foreground font-medium leading-tight">
                    {club?.description || "No description provided."}
                  </p>
                </div>
                <ShieldCheck className="text-primary/20" size={24} />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Clubs;
