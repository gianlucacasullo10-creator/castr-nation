import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import GearImage from "@/components/GearImage";
import FriendsManager from "@/components/FriendsManager";
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
      
      // Fetch equipped gear
      const { data: gearData } = await supabase
        .from('inventory')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_equipped', true);
      
      const currentCatches = catchData || [];
      setProfile(profileData);
      setTempName(profileData?.display_name || "");
      setCatches(currentCatches);
      setEquippedGear(gearData || []);

      const earnedChallenges = CHALLENGE_TITLES
        .filter(t => t.check(currentCatches))
        .map(t => t.name);
      
      setUnlockedTitles([...BASE_TITLES.map(b => b.name), ...earnedChallenges]);
    } finally { setLoading(false); }
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

      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);

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
      console.log('Starting name update...');
      console.log('Profile ID:', profile.id);
      console.log('New name:', tempName.trim());
      
      const { error } = await supabase
        .from('profiles')
        .update({ display_name: tempName.trim() })
        .eq('id', profile.id);

      console.log('Update error:', error);

      if (error) {
        console.error('Name update error:', error);
        throw error;
      }

      setProfile({ ...profile, display_name: tempName.trim() });
      setIsEditingName(false);
      toast({ title: "Name Updated!" });
    } catch (error: any) {
      console.error('Full error:', error);
      toast({ 
        variant: "destructive", 
        title: "Update Failed", 
        description: error.message || "Could not update name. Check console for details." 
      });
    } finally {
      setIsUpdatingName(false);
    }
  };

  const equipTitle = async (titleName: string) => {
    try {
      console.log('Equipping title:', titleName);
      console.log('Profile ID:', profile.id);
      
      const { error } = await supabase
        .from('profiles')
        .update({ equipped_title: titleName })
        .eq('id', profile.id);

      console.log('Title update error:', error);

      if (error) {
        console.error('Title update error:', error);
        throw error;
      }

      setProfile({ ...profile, equipped_title: titleName });
      toast({ title: "Identity Updated", description: `Equipped: ${titleName}` });
    } catch (error: any) {
      console.error('Failed to equip title:', error);
      toast({ 
        variant: "destructive", 
        title: "Update Failed", 
        description: error.message || "Could not equip title. Check console for details." 
      });
    }
  };

  useEffect(() => { fetchProfileData(); }, []);

  if (loading) return (
    <div className="flex h-[80vh] flex-col items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );

  const equippedRod = equippedGear.find(g => g.item_type === 'rod');
  const equippedLure = equippedGear.find(g => g.item_type === 'lure');

  return (
    <div className="pb-24 pt-8 px-4 max-w-md mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-black italic tracking-tighter text-primary uppercase">Angler ID</h1>
        <div className="flex gap-2">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => navigate("/castrs-pro")}
            className="text-xs font-black uppercase bg-gradient-to-r from-yellow-500/20 to-primary/20 hover:from-yellow-500/30 hover:to-primary/30"
          >
            ⭐ Pro
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => navigate("/achievements")}
            className="text-xs font-black uppercase"
          >
            🏆 Badges
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
                  ? supabase.storage.from('catch_photos').getPublicUrl(catchItem.image_url).data.publicUrl 
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
        <h3 className="text-sm font-black uppercase italic tracking-widest text-muted-foreground px-2">Title Vault</h3>
        
        <div className="space-y-2 mb-6 text-left">
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
                <div>
                  <p className="text-xs font-black uppercase italic leading-none">{t.name}</p>
                  <p className="text-[9px] font-bold text-muted-foreground uppercase mt-1">Heritage Status</p>
                </div>
              </div>
              {profile?.equipped_title === t.name && <CheckCircle2 size={18} className="text-primary" />}
            </div>
          ))}
        </div>

        <div className="space-y-2 text-left">
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
                <div className="flex items-center gap-4">
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

      {/* Friends Manager Modal */}
      {showFriendsManager && (
        <FriendsManager onClose={() => setShowFriendsManager(false)} />
      )}
    </div>
  );
};

export default Profile;
