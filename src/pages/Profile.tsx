import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Fish, Award, Star, Settings } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const Profile = () => {
  const [profile, setProfile] = useState<any>(null);
  const [catches, setCatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // 1. Fetch Profile with Titles
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        // 2. Fetch all Catches for Stats
        const { data: catchesData } = await supabase
          .from('catches')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        setProfile(profileData);
        setCatches(catchesData || []);
      } catch (error: any) {
        console.error("Error loading profile:", error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, []);

  const handleEquipTitle = async (title: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ active_title: title })
        .eq('id', profile.id);

      if (error) throw error;
      setProfile({ ...profile, active_title: title });
      toast({ title: "Title Equipped", description: `You are now known as a ${title}` });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Update Failed", description: error.message });
    }
  };

  // Calculate Stats
  const totalPoints = catches.reduce((sum, c) => sum + (c.points || 0), 0);
  const personalBest = catches.length > 0 
    ? [...catches].sort((a, b) => (b.points || 0) - (a.points || 0))[0] 
    : null;

  if (loading) return <div className="p-8 text-center animate-pulse font-black italic">LOADING PROFILE...</div>;

  return (
    <div className="pb-24 pt-6 px-4 max-w-md mx-auto space-y-8">
      {/* Header / Avatar */}
      <div className="flex flex-col items-center space-y-4">
        <div className="relative">
          <Avatar className="h-28 w-28 border-4 border-primary shadow-2xl">
            <AvatarImage src={profile?.avatar_url} />
            <AvatarFallback className="text-2xl font-bold bg-muted">
              {profile?.display_name?.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className="absolute -bottom-2 -right-2 bg-black p-2 rounded-full border-2 border-primary">
            <Settings size={16} className="text-primary" />
          </div>
        </div>

        <div className="text-center">
          <h2 className="text-3xl font-black italic uppercase tracking-tighter leading-none">
            {profile?.display_name}
          </h2>
          {/* THE ACTIVE TITLE */}
          <Badge className="mt-2 bg-primary text-black font-black italic px-4 py-1 rounded-full text-[10px] tracking-[0.2em] uppercase shadow-lg border-none hover:bg-primary">
            {profile?.active_title || 'Beginner'}
          </Badge>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="bg-card border-none p-4 flex flex-col items-center justify-center rounded-3xl shadow-sm">
          <span className="text-2xl font-black italic text-primary">{totalPoints.toLocaleString()}</span>
          <span className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Total Pts</span>
        </Card>
        <Card className="bg-card border-none p-4 flex flex-col items-center justify-center rounded-3xl shadow-sm">
          <span className="text-2xl font-black italic text-primary">{catches.length}</span>
          <span className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Catches</span>
        </Card>
      </div>

      {/* Personal Best Section */}
      {personalBest && (
        <div className="space-y-3">
          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
            <Trophy size={14} className="text-primary" /> Personal Best
          </h3>
          <Card className="relative overflow-hidden rounded-3xl border-none shadow-xl bg-black aspect-[16/9]">
            <img 
              src={personalBest.image_url} 
              className="absolute inset-0 w-full h-full object-cover opacity-60" 
              alt="PB Fish"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent p-4 flex flex-col justify-end">
              <p className="text-white font-black italic text-2xl leading-none uppercase">{personalBest.species}</p>
              <p className="text-primary font-black italic text-lg">{personalBest.points} PTS</p>
            </div>
          </Card>
        </div>
      )}

      {/* Earned Titles Inventory */}
      <div className="space-y-3">
        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
          <Award size={14} className="text-primary" /> Earned Titles
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {profile?.unlocked_titles?.map((title: string) => (
            <button
              key={title}
              onClick={() => handleEquipTitle(title)}
              className={`p-3 rounded-2xl border-2 font-black italic text-[10px] uppercase transition-all flex items-center justify-center gap-2 ${
                profile.active_title === title 
                  ? "border-primary bg-primary/10 text-primary" 
                  : "border-border bg-card text-muted-foreground hover:border-primary/50"
              }`}
            >
              {profile.active_title === title && <Star size={10} fill="currentColor" />}
              {title}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Profile;
