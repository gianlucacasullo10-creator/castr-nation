import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { useToast } from "@/components/ui/use-toast";
import { Users, Trophy, MapPin, Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

const ClubsPage = () => {
  const [clubs, setClubs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchClubs();
  }, []);

  async function fetchClubs() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('clubs')
        .select('*')
        .order('total_points', { ascending: false });

      if (error) throw error;
      setClubs(data || []);
    } catch (error: any) {
      toast({
        title: "Error loading clubs",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app-container bg-background">
      <AppHeader title="Fishing Clubs" />
      
      <main className="flex-1 p-4 space-y-4 safe-bottom">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-lg font-bold">Top Clubs</h2>
          <Button size="sm" variant="outline" className="gap-1">
            <Plus className="w-4 h-4" /> Create
          </Button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <Loader2 className="w-8 h-8 animate-spin mb-2" />
            <p>Gathering the crews...</p>
          </div>
        ) : clubs.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed rounded-xl border-border">
            <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-20" />
            <p className="text-muted-foreground">No clubs found in your area.</p>
            <Button variant="link" className="text-primary mt-2">Start your own club</Button>
          </div>
        ) : (
          clubs.map((club) => (
            <div key={club.id} className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
              <div className="h-24 bg-muted relative">
                {club.banner_url && <img src={club.banner_url} alt="" className="w-full h-full object-cover" />}
                <div className="absolute -bottom-6 left-4 border-4 border-card rounded-lg bg-card w-16 h-16 overflow-hidden">
                  <img src={club.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${club.name}`} alt={club.name} className="w-full h-full object-cover" />
                </div>
              </div>
              <div className="p-4 pt-8">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-lg">{club.name}</h3>
                    <div className="flex items-center text-xs text-muted-foreground gap-1 mb-2">
                      <MapPin className="w-3 h-3" /> {club.region || club.location}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-primary font-bold">
                      <Trophy className="w-4 h-4" /> {club.total_points || 0}
                    </div>
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Club Points</div>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                  {club.description || "No description provided."}
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-sm font-medium">
                    <Users className="w-4 h-4" /> {club.member_count || 0} Members
                  </div>
                  <Button size="sm">View Club</Button>
                </div>
              </div>
            </div>
          ))
        )}
      </main>
      
      <BottomNav />
    </div>
  );
};

export default ClubsPage;
