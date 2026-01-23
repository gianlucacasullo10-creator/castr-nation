import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LogOut, Settings, Award, Fish, Grid, Trophy, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

const TITLE_LIBRARY: Record<string, { desc: string; color: string }> = {
  "Beginner": { desc: "Just started the journey.", color: "text-slate-400" },
  "OG CASTR": { desc: "One of the first 1,000 members.", color: "text-yellow-500" },
  "Fingerling": { desc: "Logged 5+ verified catches.", color: "text-primary" },
  "First Blood": { desc: "Logged your very first catch.", color: "text-red-500" }
};

const Profile = () => {
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState({ totalPoints: 0, catchCount: 0 });
  const [uniqueSpecies, setUniqueSpecies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      // 1. Get Profile
      const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      setProfile(profileData);

      // 2. Get Catches for Stats & Gallery
      const { data: catches } = await supabase.from('catches').select('*').eq('user_id', user.id).order('created_at', { ascending: false });

      if (catches) {
        const total = catches.reduce((acc, c) => acc + (c.points || 0), 0);
        setStats({ totalPoints: total, catchCount: catches.length });

        // 3. Filter for Unique Species Gallery
        const seen = new Set();
        const unique = catches.filter(c => {
          const duplicate = seen.has(c.species);
          seen.add(c.species);
          return !duplicate;
        });
        setUniqueSpecies(unique);
      }
    } catch (error) {
      console.error("Error loading profile:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileData();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  if (loading) return (
    <div className="flex h-[80vh] flex-col items-center justify-center space-y-4">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="font-black italic uppercase text-primary">Loading Trophy Room...</p>
    </div>
  );

  return (
    <div className="pb-24 pt-4 px-4 max-w-md mx-auto space-y-8">
      {/* HEADER SECTION */}
      <div className="flex flex-col items-center text-center space-y-4">
        <div className="relative">
          <Avatar className="h-28 w-28 border-4 border-primary shadow-2xl">
            <AvatarImage src={profile?.avatar_url} />
            <AvatarFallback className="text-2xl font-black">{profile?.display_name?.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="absolute -bottom-2 -right-2 bg-black p-2 rounded-full border border-primary">
            <Trophy className="text-primary" size={16} />
          </div>
        </div>
        
        <div className="space-y-1">
          <h2 className="text-3xl font-black italic uppercase tracking-tighter">{profile?.display_name || "Castr"}</h2>
          <Badge variant="outline" className="border-primary text-primary font-black italic px-4">
            {profile?.active_title || "Beginner"}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-4 w-full pt-4">
          <Card className="p-4 bg-card border-none rounded-3xl text-center">
            <p className="text-2xl font-black italic text-primary">{stats.totalPoints.toLocaleString()}</p>
            <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">Lifetime Pts</p>
          </Card>
          <Card className="p-4 bg-card border-none rounded-3xl text-center">
            <p className="text-2xl font-black italic text-primary">{stats.catchCount}</p>
            <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">Catches</p>
          </Card>
        </div>
      </div>

      <Tabs defaultValue="gallery" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-muted/50 rounded-2xl p-1">
          <TabsTrigger value="gallery" className="rounded-xl font-black italic uppercase text-[10px]">
            <Grid size={14} className="mr-2" /> Gallery
          </TabsTrigger>
          <TabsTrigger value="titles" className="rounded-xl font-black italic uppercase text-[10px]">
            <Award size={14} className="mr-2" /> Titles
          </TabsTrigger>
        </TabsList>

        <TabsContent value="gallery" className="pt-6">
          {uniqueSpecies.length === 0 ? (
            <div className="text-center py-10 opacity-30 italic font-bold">No species logged yet.</div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {uniqueSpecies.map((fish) => (
                <Card key={fish.id} className="relative aspect-square overflow-hidden rounded-[24px] border-none group">
                  <img src={fish.image_url} className="w-full h-full object-cover grayscale-[20%] group-hover:grayscale-0 transition-all" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  <div className="absolute bottom-3 left-3 text-left">
                    <p className="text-[10px] font-black italic uppercase text-white leading-none">{fish.species}</p>
                    <p className="text-[8px] font-bold text-primary uppercase mt-1">Verified</p>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="titles" className="pt-6 space-y-3">
          {profile?.unlocked_titles?.map((title: string) => (
            <Card key={title} className="p-4 bg-card border-none rounded-2xl flex items-center gap-4">
              <Award className={TITLE_LIBRARY[title]?.color || "text-primary"} size={24} />
              <div className="text-left">
                <p className={`font-black italic uppercase text-sm ${TITLE_LIBRARY[title]?.color}`}>{title}</p>
                <p className="text-[10px] font-bold text-muted-foreground">{TITLE_LIBRARY[title]?.desc}</p>
              </div>
            </Card>
          ))}
        </TabsContent>
      </Tabs>

      <Button variant="ghost" className="w-full text-muted-foreground font-bold hover:text-red-500" onClick={handleSignOut}>
        <LogOut size={16} className="mr-2" /> Sign Out
      </Button>
    </div>
  );
};

export default Profile;
