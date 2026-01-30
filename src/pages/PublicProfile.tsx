import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { 
  ChevronLeft, 
  Trophy, 
  Anchor, 
  MapPin, 
  Loader2, 
  ShieldCheck, 
  Flame 
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

const RARITY_COLORS = {
  common: { bg: "bg-gray-500/10", border: "border-gray-500/30", text: "text-gray-200", glow: "shadow-[0_0_20px_rgba(156,163,175,0.3)]" },
  rare: { bg: "bg-blue-500/10", border: "border-blue-500/30", text: "text-blue-300", glow: "shadow-[0_0_20px_rgba(59,130,246,0.4)]" },
  epic: { bg: "bg-purple-500/10", border: "border-purple-500/30", text: "text-purple-300", glow: "shadow-[0_0_20px_rgba(168,85,247,0.5)]" },
  legendary: { bg: "bg-yellow-500/10", border: "border-yellow-500/30", text: "text-yellow-300", glow: "shadow-[0_0_30px_rgba(234,179,8,0.6)]" },
};

const PublicProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState({ totalPoints: 0, catchCount: 0 });
  const [equippedGear, setEquippedGear] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPublicData = async () => {
      setLoading(true);
      try {
        // 1. Fetch Profile Info
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', id)
          .single();

        if (profileError) throw profileError;

        // 2. Fetch Catch Stats
        const { data: catches } = await supabase
          .from('catches')
          .select('points')
          .eq('user_id', id);

        const total = catches?.reduce((sum, c) => sum + (c.points || 0), 0) || 0;

        // 3. Fetch Equipped Gear
        const { data: gearData } = await supabase
          .from('inventory')
          .select('*')
          .eq('user_id', id)
          .eq('is_equipped', true);

        setProfile(profileData);
        setStats({ totalPoints: total, catchCount: catches?.length || 0 });
        setEquippedGear(gearData || []);
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchPublicData();
  }, [id]);

  if (loading) return (
    <div className="flex h-screen flex-col items-center justify-center space-y-4">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="font-black italic uppercase text-primary tracking-tighter">Identifying Angler...</p>
    </div>
  );

  if (!profile) return <div className="p-8 text-center font-black uppercase italic">User Not Found</div>;

  const equippedRod = equippedGear.find(g => g.item_type === 'rod');
  const equippedLure = equippedGear.find(g => g.item_type === 'lure');

  return (
    <div className="min-h-screen pb-24 pt-6 px-4 max-w-md mx-auto space-y-8 animate-in fade-in duration-500">
      
      {/* HEADER / BACK */}
      <div className="flex items-center">
        <button 
          onClick={() => navigate(-1)} 
          className="flex items-center gap-2 text-primary font-black uppercase italic text-xs hover:opacity-70 transition-opacity"
        >
          <ChevronLeft size={18} /> Back
        </button>
      </div>

      {/* IDENTITY SECTION */}
      <div className="flex flex-col items-center space-y-4">
        <div className="relative">
          <div className="absolute -inset-1 bg-primary/20 blur-2xl rounded-full" />
          <Avatar className="h-32 w-32 rounded-[40px] border-4 border-card shadow-2xl relative z-10">
            <AvatarImage src={profile.avatar_url} className="object-cover" />
            <AvatarFallback className="bg-muted text-2xl font-black">{profile.display_name?.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="absolute -bottom-2 -right-2 bg-primary text-black p-2 rounded-xl z-20 shadow-lg">
            <ShieldCheck size={20} />
          </div>
        </div>
        
        <div className="text-center space-y-1">
          <h1 className="text-4xl font-black italic uppercase tracking-tighter leading-tight">
            {profile.display_name}
          </h1>
          <div className="flex items-center justify-center gap-2">
            <span className="text-primary font-black uppercase italic text-[10px] tracking-[0.2em]">
              {profile.equipped_title || "LEGENDARY CASTR"}
            </span>
          </div>
        </div>
      </div>

      {/* EQUIPPED GEAR SHOWCASE */}
      {equippedGear.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-black uppercase italic tracking-widest text-muted-foreground text-center">Equipped Loadout</h3>
          
          <div className="grid grid-cols-2 gap-3">
            {equippedRod && (
              <Card className={`${RARITY_COLORS[equippedRod.rarity as keyof typeof RARITY_COLORS].bg} ${RARITY_COLORS[equippedRod.rarity as keyof typeof RARITY_COLORS].glow} border-2 ${RARITY_COLORS[equippedRod.rarity as keyof typeof RARITY_COLORS].border} rounded-[24px] p-4 text-center animate-in zoom-in-95`}>
                <div className="text-4xl mb-2">🎣</div>
                <p className={`text-xs font-black uppercase italic leading-none ${RARITY_COLORS[equippedRod.rarity as keyof typeof RARITY_COLORS].text}`}>
                  {equippedRod.item_name}
                </p>
                <Badge className={`${RARITY_COLORS[equippedRod.rarity as keyof typeof RARITY_COLORS].bg} ${RARITY_COLORS[equippedRod.rarity as keyof typeof RARITY_COLORS].text} border-none font-black text-[8px] mt-2`}>
                  {equippedRod.rarity}
                </Badge>
                <p className="text-[10px] font-bold text-primary mt-1">+{equippedRod.bonus_percentage}%</p>
              </Card>
            )}

            {equippedLure && (
              <Card className={`${RARITY_COLORS[equippedLure.rarity as keyof typeof RARITY_COLORS].bg} ${RARITY_COLORS[equippedLure.rarity as keyof typeof RARITY_COLORS].glow} border-2 ${RARITY_COLORS[equippedLure.rarity as keyof typeof RARITY_COLORS].border} rounded-[24px] p-4 text-center animate-in zoom-in-95 delay-75`}>
                <div className="text-4xl mb-2">🪝</div>
                <p className={`text-xs font-black uppercase italic leading-none ${RARITY_COLORS[equippedLure.rarity as keyof typeof RARITY_COLORS].text}`}>
                  {equippedLure.item_name}
                </p>
                <Badge className={`${RARITY_COLORS[equippedLure.rarity as keyof typeof RARITY_COLORS].bg} ${RARITY_COLORS[equippedLure.rarity as keyof typeof RARITY_COLORS].text} border-none font-black text-[8px] mt-2`}>
                  {equippedLure.rarity}
                </Badge>
                <p className="text-[10px] font-bold text-primary mt-1">+{equippedLure.bonus_percentage}%</p>
              </Card>
            )}
          </div>

          {!equippedRod && !equippedLure && (
            <p className="text-center text-sm text-muted-foreground italic">No gear equipped</p>
          )}
        </div>
      )}

      {/* STATS GRID */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-card border-none rounded-[32px] p-6 text-center shadow-xl">
          <Trophy className="mx-auto mb-3 text-primary" size={24} />
          <p className="text-3xl font-black italic leading-none">{stats.totalPoints.toLocaleString()}</p>
          <p className="text-[9px] font-black uppercase opacity-40 mt-2 tracking-widest">Lifetime Pts</p>
        </Card>
        
        <Card className="bg-card border-none rounded-[32px] p-6 text-center shadow-xl">
          <Anchor className="mx-auto mb-3 text-primary" size={24} />
          <p className="text-3xl font-black italic leading-none">{stats.catchCount}</p>
          <p className="text-[9px] font-black uppercase opacity-40 mt-2 tracking-widest">Total Catches</p>
        </Card>
      </div>

      {/* INFO LIST */}
      <div className="space-y-3">
        <div className="flex items-center justify-between p-5 bg-card rounded-[24px] border border-white/5">
          <div className="flex items-center gap-3">
            <MapPin size={18} className="text-primary" />
            <span className="font-black uppercase italic text-xs tracking-tight">Current Region</span>
          </div>
          <span className="font-bold text-xs opacity-60 uppercase">{profile.region || "International"}</span>
        </div>

        <div className="flex items-center justify-between p-5 bg-card rounded-[24px] border border-white/5">
          <div className="flex items-center gap-3">
            <Flame size={18} className="text-orange-500" />
            <span className="font-black uppercase italic text-xs tracking-tight">Status</span>
          </div>
          <span className="text-primary font-black text-[10px] uppercase">Active Hunter</span>
        </div>
      </div>

      {/* FOOTER DECORATION */}
      <div className="pt-4 text-center">
        <p className="text-[8px] font-black uppercase tracking-[0.4em] opacity-20 italic">
          CASTRS // ANGLER_PROFILE_{profile.display_name?.toUpperCase()}
        </p>
      </div>

    </div>
  );
};

export default PublicProfile;
