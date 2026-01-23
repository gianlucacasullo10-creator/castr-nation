import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Loader2, Fish, Trophy, Lock, CheckCircle2, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";

const Profile = () => {
  const [profile, setProfile] = useState<any>(null);
  const [catches, setCatches] = useState<any[]>([]);
  const [unlockedTitles, setUnlockedTitles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  // These are your heritage titles that stay unlocked forever
  const BASE_TITLES = [
    { name: "OG CASTR", icon: "⚡", description: "Alpha Member Status" },
    { name: "Beginner", icon: "🎣", description: "The Journey Begins" },
    { name: "Novice Castr", icon: "🐣", description: "Default Status" }
  ];

  const CHALLENGE_TITLES = [
    { name: "Musky Magician", icon: "🪄", description: "Catch a Musky", check: (c: any[]) => c.some(f => f.species?.toLowerCase().includes('musk')) },
    { name: "Walleye Wizard", icon: "🧙", description: "Catch a Walleye", check: (c: any[]) => c.some(f => f.species?.toLowerCase().includes('walley')) },
    { name: "Ruler of Pikes", icon: "👑", description: "Catch 3 Pikes", check: (c: any[]) => c.filter(f => f.species?.toLowerCase().includes('pike')).length >= 3 },
    { name: "Smallmouth Smasher", icon: "💥", description: "Catch 3 Smallmouths", check: (c: any[]) => c.filter(f => f.species?.toLowerCase().includes('smallmouth')).length >= 3 },
    { name: "That's a Biggie", icon: "🐋", description: "Catch a 500+ PT fish", check: (c: any[]) => c.some(f => f.points >= 500) },
  ];

  const fetchProfileData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/auth"); return; }

      const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      const { data: catchData } = await supabase.from('catches').select('*').eq('user_id', user.id);
      
      const currentCatches = catchData || [];
      setProfile(profileData);
      setCatches(currentCatches);

      // Auto-unlock challenge titles
      const earnedChallenges = CHALLENGE_TITLES
        .filter(t => t.check(currentCatches))
        .map(t => t.name);
      
      // Merge with BASE_TITLES
      setUnlockedTitles([...BASE_TITLES.map(b => b.name), ...earnedChallenges]);
    } finally { setLoading(false); }
  };

  const equipTitle = async (titleName: string) => {
    const { error } = await supabase
      .from('profiles')
      .update({ equipped_title: titleName })
      .eq('id', profile.id);

    if (!error) {
      setProfile({ ...profile, equipped_title: titleName });
      toast({ title: "Identity Updated", description: `Equipped: ${titleName}` });
    }
  };

  useEffect(() => { fetchProfileData(); }, []);

  if (loading) return (
    <div className="flex h-[80vh] flex-col items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );

  return (
    <div className="pb-24 pt-8 px-4 max-w-md mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-black italic tracking-tighter text-primary uppercase">Angler ID</h1>
        <Button variant="ghost" size="icon" onClick={() => supabase.auth.signOut().then(() => navigate("/auth"))}>
          <LogOut size={20} className="text-muted-foreground" />
        </Button>
      </div>

      {/* Profile Identity Card */}
      <Card className="border-none bg-card rounded-[40px] shadow-2xl p-10 text-center relative border-t-8 border-primary">
        <Avatar className="h-32 w-32 border-4 border-background shadow-2xl mx-auto mb-6">
          <AvatarImage src={profile?.avatar_url} />
          <AvatarFallback className="text-3xl font-black">{profile?.display_name?.charAt(0)}</AvatarFallback>
        </Avatar>
        <h2 className="text-3xl font-black italic uppercase tracking-tighter mb-4">{profile?.display_name}</h2>
        <div className="inline-flex items-center gap-2 px-8 py-2 bg-primary text-black rounded-full shadow-lg">
          <Trophy size={14} />
          <p className="font-black italic uppercase text-[14px] tracking-widest leading-none">
            {profile?.equipped_title || "OG CASTR"}
          </p>
        </div>
      </Card>

      {/* Title Vault */}
      <div className="space-y-4">
        <h3 className="text-sm font-black uppercase italic tracking-widest text-muted-foreground px-2">Title Vault</h3>
        
        {/* Heritage Titles (Always Unlocked) */}
        <div className="space-y-2 mb-6">
          {BASE_TITLES.map((t) => (
            <div 
              key={t.name}
              onClick={() => equipTitle(t.name)}
              className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                profile?.equipped_title === t.name ? "border-primary bg-primary/5" : "border-muted bg-card hover:border-primary/30"
              }`}
            >
              <div className="flex items-center gap-4">
                <span className="text-xl">{t.icon}</span>
                <div className="text-left">
                  <p className="text-xs font-black uppercase italic leading-none">{t.name}</p>
                  <p className="text-[9px] font-bold text-muted-foreground uppercase mt-1">Heritage Status</p>
                </div>
              </div>
              {profile?.equipped_title === t.name && <CheckCircle2 size={18} className="text-primary" />}
            </div>
          ))}
        </div>

        {/* Challenge Titles */}
        <div className="space-y-2">
          <p className="text-[9px] font-black text-muted-foreground/50 uppercase tracking-[0.2em] px-2 mb-2">Earned Achievements</p>
          {CHALLENGE_TITLES.map((t) => {
            const isUnlocked = unlockedTitles.includes(t.name);
            const isEquipped = profile?.equipped_title === t.name;

            return (
              <div 
                key={t.name}
                onClick={() => isUnlocked && equipTitle(t.name)}
                className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${
                  isEquipped ? "border-primary bg-primary/5" : isUnlocked ? "border-muted bg-card hover:border-primary/30 cursor-pointer" : "bg-muted/10 opacity-30 grayscale cursor-not-allowed"
                }`}
              >
                <div className="flex items-center gap-4 text-left">
                  <span className="text-xl">{isUnlocked ? t.icon : "🔒"}</span>
                  <div>
                    <p className="text-xs font-black uppercase italic leading-none">{t.name}</p>
                    <p className="text-[9px] font-bold text-muted-foreground uppercase mt-1">{t.description}</p>
                  </div>
                </div>
                {isEquipped && <CheckCircle2 size={18} className="text-primary" />}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Profile;
