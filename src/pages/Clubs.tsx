import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Users, Loader2 } from "lucide-react";

const Clubs = () => {
  const [clubs, setClubs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getClubs() {
      try {
        console.log("Fetching clubs...");
        const { data, error } = await supabase.from('clubs').select('*');
        if (error) {
          console.error("Supabase Error:", error);
        } else {
          console.log("Data received:", data);
          setClubs(data || []);
        }
      } catch (err) {
        console.error("Crash prevented:", err);
      } finally {
        setLoading(false);
      }
    }
    getClubs();
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <div className="text-center">
          <Loader2 className="animate-spin mx-auto text-primary mb-2" />
          <p className="text-xs font-bold uppercase tracking-widest">Loading Clubs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-md mx-auto pb-24 min-h-screen bg-background">
      <div className="flex items-center gap-2 mb-6">
        <Users className="text-primary" />
        <h1 className="text-2xl font-black italic tracking-tighter uppercase">Clubs</h1>
      </div>

      {/* EMERGENCY STATIC TEST: If you see this, the code is working */}
      <div className="p-2 mb-4 bg-yellow-100 text-[10px] font-bold text-center rounded">
        SYSTEM CHECK: PAGE RENDER SUCCESSFUL
      </div>
      
      <div className="space-y-4">
        {clubs && clubs.length > 0 ? (
          clubs.map((club) => (
            <div key={club.id} className="p-4 border-2 border-border rounded-2xl bg-card">
              <p className="font-black italic uppercase">{club.name || "Unnamed Club"}</p>
              <p className="text-xs text-muted-foreground">{club.description || "No description"}</p>
            </div>
          ))
        ) : (
          <div className="text-center py-10 opacity-50">
            <p className="font-bold">EMPTY LIST RETURNED</p>
            <p className="text-[10px]">Database connection is okay, but no rows were found.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Clubs;
