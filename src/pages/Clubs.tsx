import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Users, ShieldCheck, Loader2, MapPin } from "lucide-react";

const Clubs = () => {
  const [clubs, setClubs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClubs = async () => {
      // Specifically fetch only the columns you have populated
      const { data, error } = await supabase
        .from('clubs')
        .select('id, name, description');
      
      if (error) {
        console.error("Error fetching clubs:", error.message);
      } else if (data) {
        setClubs(data);
      }
      setLoading(false);
    };
    fetchClubs();
  }, []);

  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;

  return (
    <div className="p-4 max-w-md mx-auto space-y-6 pb-24">
      <div className="flex items-center justify-between pt-4">
        <div className="flex items-center gap-2">
          <Users className="text-primary" />
          <h1 className="text-2xl font-black italic tracking-tighter uppercase">Clubs</h1>
        </div>
      </div>
      
      <div className="grid gap-4">
        {clubs.length === 0 ? (
          <div className="text-center py-20 bg-muted rounded-3xl border-2 border-dashed border-border">
             <p className="text-muted-foreground font-bold uppercase italic text-sm tracking-tight">No Clubs Found</p>
             <p className="text-[10px] text-muted-foreground/60 uppercase">Check Table: 'clubs'</p>
          </div>
        ) : (
          clubs.map((club) => (
            <div key={club.id} className="bg-card border-2 border-border p-5 rounded-3xl shadow-sm hover:border-primary/50 transition-colors">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <h3 className="font-black italic uppercase text-xl leading-none">
                    {club.name || "Unnamed Club"}
                  </h3>
                  <p className="text-xs text-muted-foreground font-medium leading-tight">
                    {club.description || "No description provided."}
                  </p>
                  <div className="flex items-center gap-1 pt-2">
                    <MapPin size={10} className="text-primary" />
                    <span className="text-[10px] font-bold text-primary uppercase tracking-tighter">Global Region</span>
                  </div>
                </div>
                <div className="h-12 w-12 bg-primary/5 rounded-2xl flex items-center justify-center border border-primary/10">
                  <ShieldCheck className="text-primary" size={24} />
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Clubs;
