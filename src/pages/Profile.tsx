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

      // Check which titles are earned based on logic
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

      {/* IDENTITY CARD */}
      <Card className="border-none bg-card rounded-[40px] overflow-hidden shadow-2xl p-8 text-center relative border-t-4 border-primary">
        <Avatar className="h-28 w-28 border-4 border-background shadow-xl mx-auto mb-4">
          <AvatarImage src={profile?.avatar_url} />
          <AvatarFallback className="text-2xl font-black">{profile?.display_name?.charAt(0)}</AvatarFallback>
        </Avatar>
        <h2 className="text-2xl font-black italic uppercase tracking-tighter leading-none">{profile?.display_name}</h2>
        <p className="text-primary font-black italic uppercase text-[10px] tracking-widest mt-2">
          {profile?.equipped_title || "Novice Castr"}
        </p>
      </Card>

      {/* TITLE VAULT */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 px-2">
          <Trophy size={16} className="text-yellow-500" />
          <h3 className="text-sm font-black uppercase italic tracking-widest text-muted-foreground">Title Vault</h3>
        </div>
        
        <div className="space-y-2">
          {TITLE_REQUIREMENTS.map((t) => {
            const isUnlocked = unlockedTitles.includes(t.name);
            const isEquipped = profile?.equipped_title === t.name;

            return (
              <div 
                key={t.name}
                onClick={() => isUnlocked && equipTitle(t.name)}
                className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                  isEquipped ? "border-primary bg-primary/5" : isUnlocked ? "border-muted bg-card hover:border-primary/50" : "border-transparent bg-muted/20 opacity-50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{t.icon}</span>
                  <div className="text-left">
                    <p className="text-xs font-black uppercase italic leading-none">{t.name}</p>
                    <p className="text-[9px] font-bold text-muted-foreground uppercase mt-1">{t.description}</p>
                  </div>
                </div>
                {isEquipped ? (
                  <CheckCircle2 size={16} className="text-primary" />
                ) : !isUnlocked ? (
                  <Lock size={14} className="text-muted-foreground" />
                ) : null}
              </div>
            );
          })}
        </div>
      </div>

      {/* CATCH HISTORY GRID */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 px-2">
          <Fish size={16} className="text-primary" />
          <h3 className="text-sm font-black uppercase italic tracking-widest text-muted-foreground">Recent Catches</h3>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {catches.map((c) => (
            <div key={c.id} className="aspect-square rounded-xl overflow-hidden bg-muted relative group">
              <img src={c.image_url} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <span className="text-[8px] font-black text-white uppercase italic">{c.species}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Profile;
