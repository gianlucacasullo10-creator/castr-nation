import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import GearImage from "@/components/GearImage";
import FriendsManager from "@/components/FriendsManager";
import { getStorageUrl } from '@/utils/storage';
import { useProStatus } from "@/hooks/useProStatus";
import { 
  Loader2, 
  Trophy, 
  CheckCircle2, 
  LogOut, 
  Camera, 
  Edit2, 
  Check, 
  X,
  Users
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";

const RARITY_COLORS = {
  common: { bg: "bg-gray-500/10", border: "border-gray-500/30", text: "text-gray-200", glow: "shadow-[0_0_20px_rgba(156,163,175,0.3)]" },
  rare: { bg: "bg-blue-500/10", border: "border-blue-500/30", text: "text-blue-300", glow: "shadow-[0_0_20px_rgba(59,130,246,0.4)]" },
  epic: { bg: "bg-purple-500/10", border: "border-purple-500/30", text: "text-purple-300", glow: "shadow-[0_0_20px_rgba(168,85,247,0.5)]" },
  legendary: { bg: "bg-yellow-500/10", border: "border-yellow-500/30", text: "text-yellow-300", glow: "shadow-[0_0_30px_rgba(234,179,8,0.6)]" },
};

const Profile = () => {
  const [profile, setProfile] = useState<any>(null);
  const [catches, setCatches] = useState<any[]>([]);
  const [equippedGear, setEquippedGear] = useState<any[]>([]);
  const [unlockedTitles, setUnlockedTitles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState("");
  const [isUpdatingName, setIsUpdatingName] = useState(false);
  const [showFriendsManager, setShowFriendsManager] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isPro } = useProStatus();

  const TITLE_RARITY_STYLES = {
    common:    { activeBg: "bg-gradient-to-r from-gray-500/20 to-gray-600/10",    border: "border-gray-400/60",    glow: "shadow-[0_0_18px_rgba(156,163,175,0.35)]", iconBg: "bg-gray-500/20",    badge: "bg-gray-500 text-white",        label: "text-gray-400" },
    rare:      { activeBg: "bg-gradient-to-r from-blue-500/20 to-cyan-500/10",     border: "border-blue-400/60",    glow: "shadow-[0_0_20px_rgba(59,130,246,0.45)]",  iconBg: "bg-blue-500/20",    badge: "bg-blue-500 text-white",        label: "text-blue-400" },
    epic:      { activeBg: "bg-gradient-to-r from-purple-500/20 to-pink-500/10",   border: "border-purple-400/60",  glow: "shadow-[0_0_24px_rgba(168,85,247,0.5)]",   iconBg: "bg-purple-500/20",  badge: "bg-purple-500 text-white",      label: "text-purple-400" },
    legendary: { activeBg: "bg-gradient-to-r from-yellow-500/20 to-amber-500/10", border: "border-yellow-400/70",  glow: "shadow-[0_0_30px_rgba(234,179,8,0.65)]",   iconBg: "bg-yellow-500/20",  badge: "bg-yellow-500 text-black",      label: "text-yellow-400" },
  };

  const ALL_TITLES = [
    // Always unlocked — common
    { name: "Beginner",           icon: "🎣", description: "The journey begins",             rarity: "common",    check: (_: any[]) => true },
    { name: "Novice Castr",       icon: "🐣", description: "Still learning the ropes",       rarity: "common",    check: (_: any[]) => true },
    // Catch-count milestones
    { name: "Fingerling",         icon: "🐟", description: "Catch 3 fish",                   rarity: "common",    check: (c: any[]) => c.length >= 3 },
    { name: "On the Hook",        icon: "🪝", description: "Catch 5 fish",                   rarity: "common",    check: (c: any[]) => c.length >= 5 },
    { name: "Hookset Hero",       icon: "🎯", description: "Catch 10 fish",                  rarity: "rare",      check: (c: any[]) => c.length >= 10 },
    // Species titles — rare
    { name: "Walleye Wizard",     icon: "🧙", description: "Catch a Walleye",                rarity: "rare",      check: (c: any[]) => c.some((f: any) => (f.species || '').toLowerCase().includes('walley')) },
    { name: "Ruler of Pikes",     icon: "👑", description: "Catch 3 Pikes",                  rarity: "rare",      check: (c: any[]) => c.filter((f: any) => (f.species || '').toLowerCase().includes('pike')).length >= 3 },
    { name: "Smallmouth Smasher", icon: "💥", description: "Catch 3 Smallmouths",            rarity: "rare",      check: (c: any[]) => c.filter((f: any) => (f.species || '').toLowerCase().includes('smallmouth')).length >= 3 },
    // Epic tier
    { name: "Musky Magician",     icon: "🪄", description: "Catch a Muskellunge",             rarity: "epic",      check: (c: any[]) => c.some((f: any) => (f.species || '').toLowerCase().includes('musk')) },
    { name: "Trophy Hunter",      icon: "🏆", description: "Catch 20 fish",                  rarity: "epic",      check: (c: any[]) => c.length >= 20 },
    { name: "That's a Biggie",    icon: "🐋", description: "Catch a 75+ point fish",         rarity: "epic",      check: (c: any[]) => c.some((f: any) => (f.points || 0) >= 75) },
    // Legendary tier
    { name: "Legend of the Lake", icon: "🌊", description: "Catch 50 fish",                  rarity: "legendary", check: (c: any[]) => c.length >= 50 },
    { name: "OG CASTR",           icon: "⚡", description: "Alpha member status",            rarity: "legendary", check: (_: any[]) => true },
  ];

  const fetchProfileData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/auth"); return; }

      // Run all three queries in parallel
      const [{ data: profileData }, { data: catchData }, { data: gearData }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('catches').select('*').eq('user_id', user.id),
        supabase.from('inventory').select('*').eq('user_id', user.id).eq('is_equipped', true),
      ]);

      const currentCatches = catchData || [];
      setProfile(profileData);
      setTempName(profileData?.display_name || "");
      setCatches(currentCatches);
      setEquippedGear(gearData || []);

      try {
        setUnlockedTitles(ALL_TITLES.filter(t => t.check(currentCatches)).map(t => t.name));
      } catch (titleErr) {
        console.warn('Title check error:', titleErr);
        setUnlockedTitles(['Beginner', 'Novice Castr', 'OG CASTR']);
      }
    } catch (err) {
      console.error('fetchProfileData error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = event.target.files?.[0];
      if (!file) return;

      const fileExt = file.name.split('.').pop();
      const filePath = `${profile.id}/${Math.random()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const publicUrl = getStorageUrl('avatars', filePath);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', profile.id);

      if (updateError) throw updateError;
      
      setProfile({ ...profile, avatar_url: publicUrl });
      toast({ title: "Avatar Updated!" });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Upload failed", description: error.message });
    }
  };

  const updateDisplayName = async () => {
    if (!profile) {
      toast({ 
        variant: "destructive", 
        title: "Error", 
        description: "Profile not loaded. Please refresh the page." 
      });
      return;
    }

    if (!tempName.trim()) {
      toast({ 
        variant: "destructive", 
        title: "Name Required", 
        description: "Display name cannot be empty" 
      });
      return;
    }

    setIsUpdatingName(true);
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ display_name: tempName.trim() })
        .eq('id', profile.id);

      if (error) throw error;

      setProfile({ ...profile, display_name: tempName.trim() });
      setIsEditingName(false);
      toast({ title: "Name Updated!" });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: error.message || "Could not update name."
      });
    } finally {
      setIsUpdatingName(false);
    }
  };

  const equipTitle = async (titleName: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ equipped_title: titleName })
        .eq('id', profile.id);

      if (error) throw error;

      setProfile({ ...profile, equipped_title: titleName });
      toast({ title: "Identity Updated", description: `Equipped: ${titleName}` });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: error.message || "Could not equip title."
      });
    }
  };

  useEffect(() => { fetchProfileData(); }, []);

  if (loading) return (
    <div className="flex h-[80vh] flex-col items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );

  const equippedRod = equippedGear.find(g => g.item_type?.toLowerCase() === 'rod');
  const equippedLure = equippedGear.find(g => g.item_type?.toLowerCase() === 'lure');

  return (
    <div className="pb-24 pt-8 px-4 max-w-md mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-black italic tracking-tighter text-primary uppercase">Angler ID</h1>
        <div className="flex gap-2">
          {isPro ? (
            <Badge className="bg-gradient-to-r from-yellow-500/30 to-primary/30 text-primary border-primary/30 font-black text-xs px-3 py-1 rounded-full">
              ⭐ Pro
            </Badge>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/castrs-pro")}
              className="text-xs font-black uppercase bg-gradient-to-r from-yellow-500/20 to-primary/20 hover:from-yellow-500/30 hover:to-primary/30"
            >
              ⭐ Pro
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/achievements")}
            className="text-xs font-black uppercase"
          >
            Badges
          </Button>
          <Button variant="ghost" size="icon" onClick={() => supabase.auth.signOut().then(() => navigate("/auth"))}>
            <LogOut size={20} className="text-muted-foreground" />
          </Button>
        </div>
      </div>

      {/* Friends Button */}
      <Button 
        onClick={() => setShowFriendsManager(true)}
        variant="outline"
        className="w-full font-black uppercase text-xs"
      >
        <Users size={14} className="mr-1" />
        {profile?.friend_count || 0} Friends
      </Button>

      <Card className="border-none bg-card rounded-[40px] shadow-2xl p-10 text-center relative border-t-8 border-primary overflow-hidden">
        {/* AVATAR WITH UPLOAD OVERLAY */}
        <div className="relative group mx-auto mb-6 w-32 h-32">
          <Avatar className="h-32 w-32 border-4 border-background shadow-2xl relative z-10">
            <AvatarImage src={profile?.avatar_url} />
            <AvatarFallback className="text-3xl font-black">{profile?.display_name?.charAt(0)}</AvatarFallback>
          </Avatar>
          <label className="absolute inset-0 z-20 flex items-center justify-center bg-black/60 rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-all">
            <Camera className="text-white" size={24} />
            <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} />
          </label>
        </div>

        {/* EDITABLE DISPLAY NAME */}
        <div className="flex items-center justify-center gap-2 mb-4">
          {isEditingName ? (
            <div className="flex gap-1 animate-in zoom-in-95">
              <Input 
                value={tempName} 
                onChange={(e) => setTempName(e.target.value)} 
                className="h-8 bg-muted border-primary font-black uppercase italic text-center" 
                autoFocus
                disabled={isUpdatingName}
              />
              <Button 
                size="icon" 
                className="h-8 w-8 bg-primary text-black" 
                onClick={updateDisplayName}
                disabled={isUpdatingName}
              >
                {isUpdatingName ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              </Button>
              <Button 
                size="icon" 
                variant="ghost" 
                className="h-8 w-8" 
                onClick={() => setIsEditingName(false)}
                disabled={isUpdatingName}
              >
                <X size={14} />
              </Button>
            </div>
          ) : (
            <>
              <h2 className="text-3xl font-black italic uppercase tracking-tighter">{profile?.display_name}</h2>
              <button onClick={() => setIsEditingName(true)} className="text-muted-foreground hover:text-primary transition-colors">
                <Edit2 size={16} />
              </button>
            </>
          )}
        </div>

        <div className="inline-flex items-center gap-2 px-8 py-2 bg-primary text-black rounded-full shadow-lg">
          <Trophy size={14} />
          <p className="font-black italic uppercase text-[14px] tracking-widest leading-none">
            {profile?.equipped_title || "OG CASTR"}
          </p>
        </div>
      </Card>

      {/* EQUIPPED GEAR SHOWCASE - UPDATED WITH GEARIMAGE */}
      {equippedGear.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-black uppercase italic tracking-widest text-muted-foreground px-2">Equipped Loadout</h3>
          
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
              <Card className="bg-muted/10 border-2 border-dashed border-muted rounded-[24px] p-4 text-center opacity-50">
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
              <Card className="bg-muted/10 border-2 border-dashed border-muted rounded-[24px] p-4 text-center opacity-50">
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

          <button 
            onClick={() => navigate('/inventory')}
            className="w-full text-center text-xs font-black uppercase text-primary hover:opacity-70 transition-opacity"
          >
            Manage Gear →
          </button>
        </div>
      )}

      {/* TOP 3 CATCHES */}
      {catches.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-black uppercase italic tracking-widest text-muted-foreground px-2">Trophy Cabinet</h3>
          
          <div className="grid grid-cols-3 gap-3">
            {catches
              .sort((a, b) => b.points - a.points)
              .slice(0, 3)
              .map((catchItem, index) => {
                const publicUrl = catchItem.image_url && catchItem.image_url.includes('/') 
                  ? getStorageUrl('catch_photos', catchItem.image_url) 
                  : null;

                return (
                  <Card 
                    key={catchItem.id}
                    className="relative rounded-2xl overflow-hidden border-2 border-primary/20 group cursor-pointer hover:border-primary transition-all"
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
                      <div className="aspect-square bg-muted flex items-center justify-center">
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
              Upload more catches to fill your trophy cabinet!
            </p>
          )}
        </div>
      )}

      {/* Title Vault */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <h3 className="text-sm font-black uppercase italic tracking-widest text-muted-foreground">Title Vault</h3>
          <span className="text-[10px] font-black text-primary">{unlockedTitles.length}/{ALL_TITLES.length} Unlocked</span>
        </div>

        <div className="space-y-2 text-left">
          {ALL_TITLES.map((t) => {
            const isUnlocked = unlockedTitles.includes(t.name);
            const isEquipped = profile?.equipped_title === t.name;
            const rs = TITLE_RARITY_STYLES[t.rarity as keyof typeof TITLE_RARITY_STYLES];

            return (
              <div
                key={t.name}
                onClick={() => isUnlocked && equipTitle(t.name)}
                className={`flex items-center gap-4 p-4 rounded-[20px] border-2 transition-all ${
                  isEquipped
                    ? `${rs.activeBg} ${rs.border} ${rs.glow} cursor-pointer`
                    : isUnlocked
                    ? `bg-card border-muted hover:${rs.border} cursor-pointer`
                    : 'bg-muted/5 border-muted/20 opacity-40 grayscale cursor-not-allowed'
                }`}
              >
                {/* Icon bubble */}
                <div className={`w-11 h-11 flex items-center justify-center rounded-2xl shrink-0 text-xl ${isUnlocked ? rs.iconBg : 'bg-muted/30'}`}>
                  {isUnlocked ? t.icon : '🔒'}
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-black uppercase italic leading-none ${isEquipped ? rs.label : 'text-foreground'}`}>
                    {t.name}
                  </p>
                  <p className="text-[9px] font-bold text-muted-foreground uppercase mt-1 truncate">
                    {t.description}
                  </p>
                </div>

                {/* Right side */}
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${rs.badge}`}>
                    {t.rarity}
                  </span>
                  {isEquipped && <CheckCircle2 size={14} className="text-primary" />}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Friends Manager Modal */}
      {showFriendsManager && (
        <FriendsManager onClose={() => setShowFriendsManager(false)} />
      )}
    </div>
  );
};

export default Profile;
