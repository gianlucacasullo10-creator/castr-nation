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
    { name: "Musky Magician", icon: "🪄", description: "Catch a Musky", check: (c: any[]) => c.some(f => f.species?.toLowerCase().includes('musky')) },
    { name: "Walleye Wizard", icon: "🧙", description: "Catch a Walleye", check: (c: any[]) => c.some(f => f.species?.toLowerCase().includes('walleye')) },
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

      const earned = TITLE_REQUIREMENTS
        .filter(t => t.check(currentCatches))
        .map(t => t.name);
      
      setUnlockedTitles(earned);
    } finally { setLoading(false); }
  };

  const equipTitle = async (titleName: string) => {
    if (!unlockedTitles.includes(titleName)) return;
    
    const { error } = await supabase
      .from('profiles')
      .update({ equipped_title: titleName })
      .eq('id', profile.id);

    if (!error) {
      setProfile({ ...profile, equipped_title: titleName });
      toast({ title: "Title Equipped!", description: `You are now the ${titleName}` });
    }
  };

  useEffect(() => { fetchProfileData(); }, []);

  if (loading) return (
    <div className="flex h-[80vh] flex-col items-center justify-center space-y-4">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="font-black italic uppercase text-primary tracking-tighter">Syncing Angler ID...</p>
    </div>
  );

  return (
    <div className="pb-24 pt-8 px-4 max-w-md mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-black italic tracking-tighter text-primary uppercase leading-none">Angler ID</h1>
        <Button variant="ghost" size="icon" onClick={() => supabase.auth.signOut().then(() => navigate("/auth"))}>
          <LogOut size={20} className="text-muted-foreground" />
        </Button>
      </div>

      {/* IDENTITY CARD - FIXED THE TITLE DISPLAY HERE */}
      <Card className="border-none bg-card rounded-[40px] overflow-hidden shadow-2xl p-10 text-center relative border-t-8 border-primary">
        <div className="relative inline-block">
          <Avatar className="h-32 w-32 border-4 border-background shadow-2xl mx-auto mb-6">
            <AvatarImage src={profile?.avatar_url} />
            <AvatarFallback className="text-3xl font-black">{profile?.display_name?.charAt(0)}</AvatarFallback>
          </Avatar>
        </div>
        
        <h2 className="text-3xl font-black italic uppercase tracking-tighter leading-none mb-2">{profile?.display_name}</h2>
        
        {/* THIS IS THE PART THAT WAS GONE */}
        <div className="inline-block px-6 py-1 bg-primary/10 rounded-full border border-primary/20">
          <p className="text-primary font-black italic uppercase text-[12px] tracking-widest">
            {profile?.equipped_title || "Novice Castr"}
          </p>
        </div>
      </Card>

      {/* TITLE VAULT */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 px-2">
          <Trophy size={18} className="text-yellow-500" />
          <h3 className="text-sm font-black uppercase italic tracking-widest text-muted-foreground">Title Vault</h3>
        </div>
        
        <div className="space-y-3">
          {TITLE_REQUIREMENTS.map((t) => {
            const isUnlocked = unlockedTitles.includes(t.name);
            const isEquipped = profile?.equipped_title === t.name;

            return (
              <div 
                key={t.name}
                onClick={() => isUnlocked && equipTitle(t.name)}
                className={`flex items-center justify-between p-5 rounded-[24px] border-2 transition-all duration-300 transform active:scale-95 cursor-pointer ${
                  isEquipped 
                    ? "border-primary bg-primary/5 shadow-[0_0_20px_rgba(var(--primary),0.1)]" 
                    : isUnlocked 
                      ? "border-muted bg-card hover:border-primary/40 shadow-sm" 
                      : "border-transparent bg-muted/10 opacity-40 grayscale"
                }`}
              >
                <div className="flex items-center gap-4">
                  <span className="text-2xl">{t.icon}</span>
                  <div className="text-left">
                    <p className={`text-xs font-black uppercase italic leading-none ${isEquipped ? 'text-primary' : 'text-foreground'}`}>{t.name}</p>
                    <p className="text-[9px] font-bold text-muted-foreground uppercase mt-1.5 tracking-tight">{t.description}</p>
                  </div>
                </div>
                {isEquipped ? (
                  <CheckCircle2 size={18} className="text-primary animate-in zoom-in" />
                ) : !isUnlocked ? (
                  <Lock size={14} className="text-muted-foreground/50" />
                ) : (
                  <div className="w-2 h-2 rounded-full bg-primary/30" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* CATCH HISTORY GRID */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 px-2">
          <Fish size={18} className="text-primary" />
          <h3 className="text-sm font-black uppercase italic tracking-widest text-muted-foreground">Catch Log</h3>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {catches.map((c) => (
            <div key={c.id} className="aspect-square rounded-2xl overflow-hidden bg-muted border border-border/50 relative group shadow-sm">
              <img src={c.image_url} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 flex items-end justify-center p-2 transition-opacity">
                <span className="text-[7px] font-black text-white uppercase italic tracking-tighter">{c.species}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Profile;
