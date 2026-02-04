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
  Flame,
  Users
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import GearImage from "@/components/GearImage";

const RARITY_COLORS = {
  common: { 
    bg: "bg-gray-100", 
    border: "border-gray-300", 
    text: "text-gray-600", 
    glow: "" 
  },
  rare: { 
    bg: "bg-blue-50", 
    border: "border-blue-300", 
    text: "text-blue-600", 
    glow: "" 
  },
  epic: { 
    bg: "bg-purple-50", 
    border: "border-purple-300", 
    text: "text-purple-600", 
    glow: "" 
  },
  legendary: { 
    bg: "bg-yellow-50", 
    border: "border-yellow-400", 
    text: "text-yellow-600", 
    glow: "shadow-[0_0_20px_rgba(234,179,8,0.3)]" 
  },
};

const PublicProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState({ totalPoints: 0, catchCount: 0 });
  const [catches, setCatches] = useState<any[]>([]);
  const [equippedGear, setEquippedGear] = useState<any[]>([]);
  const [friendCount, setFriendCount] = useState(0);
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

        // 2. Fetch Catch Stats & Data
        const { data: catchData } = await supabase
          .from('catches')
          .select('*')
          .eq('user_id', id);

        const total = catchData?.reduce((sum, c) => sum + (c.points || 0), 0) || 0;

        // 3. Fetch Equipped Gear
        // Try both the URL id and profile's user_id to handle mismatched profiles
        const { data: gearData } = await supabase
          .from('inventory')
          .select('*')
          .or(`user_id.eq.${id},user_id.eq.${profileData?.user_id}`)
          .eq('is_equipped', true);

        // 4. Fetch Friend Count
        const { count } = await supabase
          .from('friendships')
          .select('*', { count: 'exact', head: true })
          .or(`user_id.eq.${id},friend_id.eq.${id}`)
          .eq('status', 'accepted');

        setProfile(profileData);
        setStats({ totalPoints: total, catchCount: catchData?.length || 0 });
        setCatches(catchData || []);
        setEquippedGear(gearData || []);
        setFriendCount(count || 0);
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchPublicData();
  }, [id]);

  if (loading) return (
    <div className="flex h-screen flex-col items-center justify-center space-y-4 bg-[#f5f5f5]">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="font-black italic uppercase text-primary tracking-tighter">Identifying Angler...</p>
    </div>
  );

  if (!profile) return (
    <div className="p-8 text-center font-black uppercase italic bg-[#f5f5f5] min-h-screen">
      User Not Found
    </div>
  );

  const equippedRod = equippedGear.find(g => g.item_type === 'rod');
  const equippedLure = equippedGear.find(g => g.item_type === 'lure');

  return (
    <div className="min-h-screen bg-[#f5f5f5] pb-24 pt-6 px-4 max-w-md mx-auto space-y-6 animate-in fade-in duration-500">
      
      {/* HEADER / BACK */}
      <div className="flex items-center">
        <button 
          onClick={() => navigate(-1)} 
          className="flex items-center gap-2 text-primary font-black uppercase italic text-xs hover:opacity-70 transition-opacity"
        >
          <ChevronLeft size={18} /> Back
        </button>
      </div>

      {/* MAIN PROFILE CARD */}
      <Card className="border-2 border-gray-100 bg-white rounded-[40px] shadow-xl p-8 text-center relative overflow-hidden">
        {/* Top accent */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-primary" />
        
        {/* AVATAR */}
        <div className="relative group mx-auto mb-6 w-32 h-32">
          <div className="absolute -inset-2 bg-primary/10 blur-2xl rounded-full" />
          <Avatar className="h-32 w-32 border-4 border-white shadow-2xl relative z-10 rounded-[32px]">
            <AvatarImage src={profile.avatar_url} className="object-cover" />
            <AvatarFallback className="text-3xl font-black bg-gray-100">{profile.display_name?.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="absolute -bottom-2 -right-2 bg-primary text-black p-2 rounded-xl z-20 shadow-lg">
            <ShieldCheck size={20} />
          </div>
        </div>

        {/* NAME & TITLE */}
        <h1 className="text-3xl font-black italic uppercase tracking-tighter leading-tight text-gray-800">
          {profile.display_name}
        </h1>
        
        <div className="inline-flex items-center gap-2 px-6 py-2 bg-primary text-black rounded-full shadow-lg mt-4">
          <Trophy size={14} />
          <p className="font-black italic uppercase text-[12px] tracking-widest leading-none">
            {profile.equipped_title || "OG CASTR"}
          </p>
        </div>

        {/* Friend Count */}
        <div className="flex items-center justify-center gap-2 mt-4 text-muted-foreground">
          <Users size={14} />
          <span className="text-xs font-bold">{friendCount} Friends</span>
        </div>
      </Card>

      {/* STATS GRID */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-white border-2 border-gray-100 rounded-[32px] p-6 text-center shadow-lg">
          <div className="bg-primary/10 p-3 rounded-2xl w-fit mx-auto mb-3">
            <Trophy className="text-primary" size={24} />
          </div>
          <p className="text-3xl font-black italic leading-none text-gray-800">{stats.totalPoints.toLocaleString()}</p>
          <p className="text-[9px] font-black uppercase text-muted-foreground mt-2 tracking-widest">Lifetime Pts</p>
        </Card>
        
        <Card className="bg-white border-2 border-gray-100 rounded-[32px] p-6 text-center shadow-lg">
          <div className="bg-primary/10 p-3 rounded-2xl w-fit mx-auto mb-3">
            <Anchor className="text-primary" size={24} />
          </div>
          <p className="text-3xl font-black italic leading-none text-gray-800">{stats.catchCount}</p>
          <p className="text-[9px] font-black uppercase text-muted-foreground mt-2 tracking-widest">Total Catches</p>
        </Card>
      </div>

      {/* EQUIPPED GEAR SHOWCASE */}
      <div className="space-y-4">
        <h3 className="text-xs font-black uppercase italic tracking-widest text-muted-foreground px-2">Equipped Loadout</h3>
        
        <div className="grid grid-cols-2 gap-3">
          {equippedRod ? (
            <Card className={`${RARITY_COLORS[equippedRod.rarity as keyof typeof RARITY_COLORS].bg} ${RARITY_COLORS[equippedRod.rarity as keyof typeof RARITY_COLORS].glow} border-2 ${RARITY_COLORS[equippedRod.rarity as keyof typeof RARITY_COLORS].border} rounded-[24px] p-4 text-center`}>
              <div className="flex justify-center mb-2">
                <GearImage 
                  imageUrl={equippedRod.image_url}
                  itemType="rod"
                  rarity={equippedRod.rarity}
                  size="md"
                />
              </div>
              <p className={`text-xs font-black uppercase italic leading-none ${RARITY_COLORS[equippedRod.rarity as keyof typeof RARITY_COLORS].text}`}>
                {equippedRod.item_name}
              </p>
              <Badge className={`${RARITY_COLORS[equippedRod.rarity as keyof typeof RARITY_COLORS].bg} ${RARITY_COLORS[equippedRod.rarity as keyof typeof RARITY_COLORS].text} border-none font-black text-[8px] mt-2`}>
                {equippedRod.rarity}
              </Badge>
              <p className="text-[10px] font-bold text-primary mt-1">+{equippedRod.bonus_percentage}%</p>
            </Card>
          ) : (
            <Card className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-[24px] p-4 text-center opacity-50">
              <div className="flex justify-center mb-2">
                <GearImage 
                  imageUrl={null}
                  itemType="rod"
                  rarity="common"
                  size="md"
                />
              </div>
              <p className="text-xs font-bold uppercase text-muted-foreground">No Rod</p>
            </Card>
          )}

          {equippedLure ? (
            <Card className={`${RARITY_COLORS[equippedLure.rarity as keyof typeof RARITY_COLORS].bg} ${RARITY_COLORS[equippedLure.rarity as keyof typeof RARITY_COLORS].glow} border-2 ${RARITY_COLORS[equippedLure.rarity as keyof typeof RARITY_COLORS].border} rounded-[24px] p-4 text-center`}>
              <div className="flex justify-center mb-2">
                <GearImage 
                  imageUrl={equippedLure.image_url}
                  itemType="lure"
                  rarity={equippedLure.rarity}
                  size="md"
                />
              </div>
              <p className={`text-xs font-black uppercase italic leading-none ${RARITY_COLORS[equippedLure.rarity as keyof typeof RARITY_COLORS].text}`}>
                {equippedLure.item_name}
              </p>
              <Badge className={`${RARITY_COLORS[equippedLure.rarity as keyof typeof RARITY_COLORS].bg} ${RARITY_COLORS[equippedLure.rarity as keyof typeof RARITY_COLORS].text} border-none font-black text-[8px] mt-2`}>
                {equippedLure.rarity}
              </Badge>
              <p className="text-[10px] font-bold text-primary mt-1">+{equippedLure.bonus_percentage}%</p>
            </Card>
          ) : (
            <Card className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-[24px] p-4 text-center opacity-50">
              <div className="flex justify-center mb-2">
                <GearImage 
                  imageUrl={null}
                  itemType="lure"
                  rarity="common"
                  size="md"
                />
              </div>
              <p className="text-xs font-bold uppercase text-muted-foreground">No Lure</p>
            </Card>
          )}
        </div>
      </div>

      {/* TROPHY CABINET - Top 3 Catches */}
      {catches.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xs font-black uppercase italic tracking-widest text-muted-foreground px-2">Trophy Cabinet</h3>
          
          <div className="grid grid-cols-3 gap-3">
            {catches
              .sort((a, b) => b.points - a.points)
              .slice(0, 3)
              .map((catchItem, index) => {
                const publicUrl = catchItem.image_url 
                  ? (catchItem.image_url.startsWith('http') 
                      ? catchItem.image_url 
                      : supabase.storage.from('catch_photos').getPublicUrl(catchItem.image_url).data.publicUrl)
                  : null;

                return (
                  <Card 
                    key={catchItem.id}
                    className="relative rounded-2xl overflow-hidden border-2 border-gray-100 group bg-white"
                  >
                    {/* Rank Badge */}
                    <div className="absolute top-2 left-2 z-10">
                      <Badge className={`
                        font-black text-xs px-2 py-0.5 border-none
                        ${index === 0 ? 'bg-yellow-500 text-yellow-950' : ''}
                        ${index === 1 ? 'bg-gray-400 text-gray-900' : ''}
                        ${index === 2 ? 'bg-orange-600 text-orange-950' : ''}
                      `}>
                        #{index + 1}
                      </Badge>
                    </div>

                    {/* Image */}
                    {publicUrl ? (
                      <div className="aspect-square overflow-hidden">
                        <img 
                          src={publicUrl} 
                          alt={catchItem.species}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                      </div>
                    ) : (
                      <div className="aspect-square bg-gray-100 flex items-center justify-center">
                        <span className="text-4xl">🎣</span>
                      </div>
                    )}

                    {/* Info Overlay */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-2 text-left">
                      <p className="text-[10px] font-black uppercase italic text-white leading-none truncate">
                        {catchItem.species}
                      </p>
                      <p className="text-lg font-black text-primary leading-none mt-1">
                        {catchItem.points}
                      </p>
                      <p className="text-[8px] font-bold text-white/60 uppercase">pts</p>
                    </div>
                  </Card>
                );
              })}
          </div>

          {catches.length < 3 && (
            <p className="text-center text-xs text-muted-foreground italic">
              {3 - catches.length} more catch{catches.length === 2 ? '' : 'es'} to fill the cabinet
            </p>
          )}
        </div>
      )}

      {/* INFO CARDS */}
      <div className="space-y-3">
        <Card className="flex items-center justify-between p-5 bg-white rounded-[24px] border-2 border-gray-100">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-xl">
              <MapPin size={18} className="text-primary" />
            </div>
            <span className="font-black uppercase italic text-xs tracking-tight text-gray-700">Region</span>
          </div>
          <span className="font-bold text-xs text-muted-foreground uppercase">
            {profile.location_city || profile.location_province || "Ontario"}
          </span>
        </Card>

        <Card className="flex items-center justify-between p-5 bg-white rounded-[24px] border-2 border-gray-100">
          <div className="flex items-center gap-3">
            <div className="bg-orange-500/10 p-2 rounded-xl">
              <Flame size={18} className="text-orange-500" />
            </div>
            <span className="font-black uppercase italic text-xs tracking-tight text-gray-700">Status</span>
          </div>
          <span className="text-primary font-black text-[10px] uppercase">Active Angler</span>
        </Card>
      </div>

      {/* FOOTER DECORATION */}
      <div className="pt-4 text-center">
        <p className="text-[8px] font-black uppercase tracking-[0.3em] text-muted-foreground/30 italic">
          CASTRS // {profile.display_name?.toUpperCase()}
        </p>
      </div>
    </div>
  );
};

export default PublicProfile;
