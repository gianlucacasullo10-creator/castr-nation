import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

  const TITLE_REQUIREMENTS = [
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

      // Auto-unlock logic based on catch history
      const earned = TITLE_REQUIREMENTS
        .filter(t => t.check(currentCatches))
        .map(t => t.name);
      
      // Always allow "Novice Castr" as a fallback
      setUnlockedTitles([...earned, "Novice Castr"]);
    } finally { setLoading(false); }
  };

  const equipTitle = async (titleName: string) => {
    const { error } = await supabase
      .from('profiles')
      .update({ equipped_title: titleName })
      .eq('id', profile.id);

    if (!error) {
      setProfile({ ...profile, equipped_title: titleName });
      toast({ title: "Title Equipped!", description: `You are now known as the ${titleName}` });
    }
  };

  useEffect(() => { fetchProfileData(); }, []);

  if (loading) return (
    <div className="flex h-[80vh] flex-col items-center justify-center space-y-4">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="font-black italic uppercase text-primary">Syncing Angler ID...</p>
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

      {/* Main Identity Card */}
      <Card className="border-none bg-card rounded-[40px] shadow-2xl p-10 text-center relative border-t-8 border-primary overflow-hidden">
        {/* Subtle Background Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-primary/20 blur-[60px] rounded-full" />
        
        <Avatar className="h-32 w-32 border-4 border-background shadow-2xl mx-auto mb-6 relative z-10">
          <AvatarImage src={profile?.avatar_url} />
          <AvatarFallback className="text-3xl font-black">{profile?.display_name?.charAt(0)}</AvatarFallback>
        </Avatar>
        
        <h2 className="text-3xl font-black italic uppercase tracking-tighter mb-3 relative z-10">{profile?.display_name}</h2>
        
        <div className="inline-flex items-center gap-2 px-6 py-2 bg-primary text-black rounded-full shadow-lg transform -rotate-1">
          <Trophy size={14} />
          <p className="font-black italic uppercase text-[12px] tracking-widest">
            {profile?.equipped_title || "Novice Castr"}
          </p>
        </div>
      </Card>

      {/* Title Vault */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-2">
            <Trophy size={18} className="text-yellow-500" />
            <h3 className="text-sm font-black uppercase italic tracking-widest text-muted-foreground">Title Vault</h3>
          </div>
          <span className="text-[10px] font-black text-primary uppercase bg-primary/10 px-2 py-0.5 rounded">
            {unlockedTitles.length - 1} / 5 Earned
          </span>
        </div>
        
        <div className="space-y-3">
          {TITLE_REQUIREMENTS.map((t) => {
            const isUnlocked = unlockedTitles.includes(t.name);
            const isEquipped = (profile?.equipped_title || "Novice Castr") === t.name;

            return (
              <div 
                key={t.name}
                onClick={() => isUnlocked && equipTitle(t.name)}
                className={`flex items-center justify-between p-5 rounded-[24px] border-2 transition-all duration-300 ${
                  isEquipped 
                    ? "border-primary bg-primary/5 scale-[1.02]" 
                    : isUnlocked 
                      ? "border-muted bg-card hover:border-primary/40 cursor-pointer" 
                      : "border-transparent bg-muted/10 opacity-30 cursor-not-allowed"
                }`}
              >
                <div className="flex items-center gap-4 text-left">
                  <span className="text-2xl">{isUnlocked ? t.icon : "🔒"}</span>
                  <div>
                    <p className={`text-xs font-black uppercase italic ${isEquipped ? 'text-primary' : 'text-foreground'}`}>{t.name}</p>
                    <p className="text-[9px] font-bold text-muted-foreground uppercase mt-1">{t.description}</p>
                  </div>
                </div>
                {isEquipped && <CheckCircle2 size={18} className="text-primary" />}
              </div>
            );
          })}
        </div>
      </div>

      {/* Catch Grid */}
      <div className="space-y-4">
        <h3 className="text-left text-sm font-black uppercase italic tracking-widest text-muted-foreground px-2">Catch Log</h3>
        <div className="grid grid-cols-3 gap-3">
          {catches.map((c) => (
            <div key={c.id} className="aspect-square rounded-2xl overflow-hidden bg-muted border border-border/50">
              <img src={c.image_url} className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Profile;
