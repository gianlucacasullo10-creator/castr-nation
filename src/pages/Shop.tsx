import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Package, Sparkles, Tv, Trophy } from "lucide-react";
import CaseOpening from "@/components/CaseOpening";
import { checkAchievementsAfterCaseOpen } from "@/utils/achievementTracker";

const CASE_PRICE = 500; // Points per case

const Shop = () => {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [opening, setOpening] = useState(false);
  const [wonItem, setWonItem] = useState<any>(null);
  const [watchingAd, setWatchingAd] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUser(user);
    
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      setUserProfile(profile);
    }
    setLoading(false);
  };

  const openCase = async () => {
    if (!currentUser || !userProfile) return;

    // Check if user has enough points
    if (userProfile.current_points < CASE_PRICE) {
      toast({
        variant: "destructive",
        title: "Insufficient Points",
        description: `You need ${CASE_PRICE} points to open a case.`
      });
      return;
    }

    try {
      // Get loot table first, before touching points
      const { data: lootTable, error: lootError } = await supabase
        .from('gear_loot_table')
        .select('*');

      if (lootError) throw lootError;

      // Weighted random selection
      const totalWeight = lootTable.reduce((sum, item) => sum + item.drop_weight, 0);
      let random = Math.random() * totalWeight;

      let selectedItem = lootTable[0];
      for (const item of lootTable) {
        random -= item.drop_weight;
        if (random <= 0) {
          selectedItem = item;
          break;
        }
      }

      // Add to inventory FIRST — only spend points if this succeeds
      const { data: newInventoryItem, error: inventoryError } = await supabase
        .from('inventory')
        .insert([{
          user_id: currentUser.id,
          item_type: selectedItem.item_type,
          item_name: selectedItem.item_name,
          rarity: selectedItem.rarity,
          bonus_percentage: selectedItem.bonus_percentage,
          image_url: selectedItem.image_url,
          is_equipped: false
        }])
        .select('id')
        .single();

      if (inventoryError) throw inventoryError;

      // Deduct points only after item is safely in inventory
      const { error: pointsError } = await supabase
        .from('profiles')
        .update({ current_points: userProfile.current_points - CASE_PRICE })
        .eq('id', currentUser.id);

      if (pointsError) {
        // Compensating action: remove the item we just added so user isn't charged
        await supabase.from('inventory').delete().eq('id', newInventoryItem.id);
        throw pointsError;
      }

      // ✅ CHECK ACHIEVEMENTS AFTER CASE OPENING
      await checkAchievementsAfterCaseOpen(currentUser.id);

      // BATCH STATE UPDATES - Set both at the same time to prevent re-render
      setWonItem(selectedItem);
      setOpening(true);

      // Refresh user data in background (don't await)
      fetchUserData();

    } catch (error: any) {
      console.error('Case opening error:', error);
      toast({
        variant: "destructive",
        title: "Error Opening Case",
        description: error.message
      });
    }
  };

  const handleCaseComplete = () => {
    setOpening(false);
    setWonItem(null);
    fetchUserData(); // Refresh one more time when user closes the animation
  };

  const handleWatchAd = async () => {
    setWatchingAd(true);
    // TODO: Integrate with AdMob/Unity Ads SDK
    // For now, simulate ad watching
    
    // Simulate 3 second ad
    setTimeout(async () => {
      try {
        // Get loot table
        const { data: lootTable, error: lootError } = await supabase
          .from('gear_loot_table')
          .select('*');

        if (lootError) throw lootError;

        // Weighted random selection
        const totalWeight = lootTable.reduce((sum, item) => sum + item.drop_weight, 0);
        let random = Math.random() * totalWeight;
        
        let selectedItem = lootTable[0];
        for (const item of lootTable) {
          random -= item.drop_weight;
          if (random <= 0) {
            selectedItem = item;
            break;
          }
        }

        // Add to inventory
        const { error: inventoryError } = await supabase
          .from('inventory')
          .insert([{
            user_id: currentUser.id,
            item_type: selectedItem.item_type,
            item_name: selectedItem.item_name,
            rarity: selectedItem.rarity,
            bonus_percentage: selectedItem.bonus_percentage,
            image_url: selectedItem.image_url, // ✅ ADDED
            is_equipped: false
          }]);

        if (inventoryError) throw inventoryError;

        // Check achievements
        await checkAchievementsAfterCaseOpen(currentUser.id);

        // BATCH STATE UPDATES
        setWonItem(selectedItem);
        setOpening(true);

        toast({ 
          title: "Free Case Opened!", 
          description: "Thanks for watching the ad!" 
        });
        
        fetchUserData();
      } catch (error: any) {
        console.error('Ad reward error:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message
        });
      } finally {
        setWatchingAd(false);
      }
    }, 3000);
  };

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="pb-24 pt-4 px-4 max-w-md mx-auto space-y-6">
      {/* Header - Centered like Tournaments */}
      <div className="text-center">
        <h1 className="text-4xl font-black italic tracking-tighter text-primary uppercase leading-none">
          Gear Shop
        </h1>
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mt-1">
          Open cases for legendary gear
        </p>
      </div>

      {/* Points Display - Info card style */}
      <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-2 border-primary/30 p-6 rounded-[32px]">
        <div className="flex items-start gap-4">
          <div className="bg-primary/20 p-3 rounded-2xl shrink-0">
            <Trophy className="text-primary" size={24} />
          </div>
          <div className="flex-1 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-black uppercase text-muted-foreground">Current Balance</span>
              <span className="text-2xl font-black italic text-primary">{userProfile?.current_points || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs font-black uppercase text-muted-foreground">Lifetime Earned</span>
              <span className="text-lg font-bold text-muted-foreground">{userProfile?.total_points_earned || 0}</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Case Card - Liquid Glass Effect */}
      <Card className="relative rounded-[32px] overflow-hidden border-2 border-white/20 bg-white/[0.08] backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.12)]">
        {/* Gradient overlay for liquid glass effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-purple-500/10 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-white/10 pointer-events-none" />
        
        <div className="relative p-8 space-y-6">
          {/* Case Icon */}
          <div className="flex items-center justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/30 blur-2xl rounded-full scale-150" />
              <div className="relative bg-gradient-to-br from-primary/20 to-primary/5 border-2 border-primary/30 rounded-3xl p-6">
                <Package className="text-primary" size={64} />
              </div>
              <Sparkles className="absolute -top-1 -right-1 text-primary animate-pulse" size={24} />
            </div>
          </div>

          {/* Title */}
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-black italic uppercase text-primary">Mystery Gear Case</h2>
            <p className="text-sm text-muted-foreground font-medium">Unlock rods & lures with point bonuses</p>
          </div>

          {/* Drop Rates - Glass cards */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-white/[0.06] backdrop-blur-sm border border-gray-400/20 rounded-2xl px-3 py-2 text-center">
              <span className="text-[10px] font-black uppercase text-gray-400">Common</span>
              <span className="text-xs font-black text-gray-300 ml-2">50%</span>
            </div>
            <div className="bg-white/[0.06] backdrop-blur-sm border border-blue-400/30 rounded-2xl px-3 py-2 text-center">
              <span className="text-[10px] font-black uppercase text-blue-400">Rare</span>
              <span className="text-xs font-black text-blue-300 ml-2">30%</span>
            </div>
            <div className="bg-white/[0.06] backdrop-blur-sm border border-purple-400/30 rounded-2xl px-3 py-2 text-center">
              <span className="text-[10px] font-black uppercase text-purple-400">Epic</span>
              <span className="text-xs font-black text-purple-300 ml-2">15%</span>
            </div>
            <div className="bg-white/[0.06] backdrop-blur-sm border border-yellow-400/30 rounded-2xl px-3 py-2 text-center">
              <span className="text-[10px] font-black uppercase text-yellow-400">Legendary</span>
              <span className="text-xs font-black text-yellow-300 ml-2">5%</span>
            </div>
          </div>

          {/* Open Case Button - Liquid Glass */}
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary/50 to-cyan-400/50 rounded-2xl blur-lg opacity-60 group-hover:opacity-100 transition-opacity" />
            <Button
              onClick={openCase}
              disabled={opening || (userProfile?.current_points || 0) < CASE_PRICE}
              className="relative w-full h-14 rounded-2xl bg-gradient-to-r from-primary to-cyan-400 hover:from-primary/90 hover:to-cyan-400/90 text-black font-black uppercase text-sm border border-white/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {opening ? (
                <Loader2 className="animate-spin mr-2" size={20} />
              ) : (
                <Package className="mr-2" size={20} />
              )}
              Open Case - {CASE_PRICE} pts
            </Button>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-4">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            <span className="text-[10px] font-black uppercase text-muted-foreground">or</span>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          </div>

          {/* Rewarded Ad Button - Liquid Glass */}
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-purple-500/30 to-pink-500/30 rounded-2xl blur-lg opacity-40 group-hover:opacity-70 transition-opacity" />
            <Button
              onClick={handleWatchAd}
              disabled={watchingAd || opening}
              variant="outline"
              className="relative w-full h-14 rounded-2xl bg-white/[0.06] backdrop-blur-sm border-2 border-white/20 hover:bg-white/[0.12] hover:border-white/30 text-white font-black uppercase text-sm disabled:opacity-50 transition-all"
            >
              {watchingAd ? (
                <>
                  <Loader2 className="animate-spin mr-2" size={20} />
                  Loading Ad...
                </>
              ) : (
                <>
                  <Tv className="mr-2" size={20} />
                  Watch Ad - Free Case
                </>
              )}
            </Button>
          </div>
          
          <p className="text-center text-[10px] text-muted-foreground font-medium">
            Watch a short ad to open a case for free!
          </p>
        </div>
      </Card>

      {/* Info Card */}
      <Card className="bg-white/[0.04] backdrop-blur-sm border-2 border-dashed border-white/10 p-6 rounded-[32px]">
        <h3 className="font-black uppercase text-xs mb-3 text-center text-muted-foreground">How It Works</h3>
        <ul className="space-y-2 text-xs text-muted-foreground">
          <li className="flex items-start gap-2">
            <span className="text-primary mt-0.5">•</span>
            <span>Earn points by uploading verified catches</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary mt-0.5">•</span>
            <span>Spend points to open mystery gear cases</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary mt-0.5">•</span>
            <span>Equip gear for catch bonus multipliers</span>
          </li>
        </ul>
      </Card>

      {/* Case Opening Animation */}
      {opening && wonItem && (
        <CaseOpening item={wonItem} onComplete={handleCaseComplete} />
      )}
    </div>
  );
};

export default Shop;
