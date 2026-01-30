import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Package, Sparkles } from "lucide-react";
import CaseOpening from "@/components/CaseOpening";

const CASE_PRICE = 500; // Points per case

const Shop = () => {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [opening, setOpening] = useState(false);
  const [wonItem, setWonItem] = useState<any>(null);
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

    setOpening(true);

    try {
      // Deduct points
      const { error: pointsError } = await supabase
        .from('profiles')
        .update({ current_points: userProfile.current_points - CASE_PRICE })
        .eq('id', currentUser.id);

      if (pointsError) throw pointsError;

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
          is_equipped: false
        }]);

      if (inventoryError) throw inventoryError;

      // Show the won item
      setWonItem(selectedItem);

      // Refresh user profile after a short delay
      setTimeout(async () => {
        await fetchUserData();
      }, 500);

    } catch (error: any) {
      console.error('Case opening error:', error);
      toast({
        variant: "destructive",
        title: "Error Opening Case",
        description: error.message
      });
      setOpening(false);
      setWonItem(null);
    }
  };

  const handleCaseComplete = () => {
    setOpening(false);
    setWonItem(null);
    fetchUserData(); // Refresh one more time when user closes the animation
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
      {/* Header */}
      <div className="text-left">
        <h1 className="text-4xl font-black italic tracking-tighter text-primary uppercase leading-none">
          Gear Shop
        </h1>
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mt-1">
          Open cases for legendary gear
        </p>
      </div>

      {/* Points Display */}
      <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20 p-6 rounded-[32px]">
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm font-black uppercase text-muted-foreground">Current Balance</span>
            <span className="text-3xl font-black italic text-primary">{userProfile?.current_points || 0}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm font-black uppercase text-muted-foreground">Lifetime Earned</span>
            <span className="text-xl font-bold text-muted-foreground">{userProfile?.total_points_earned || 0}</span>
          </div>
        </div>
      </Card>

      {/* Case Card */}
      <Card className="border-none rounded-[32px] overflow-hidden bg-gradient-to-br from-orange-950/30 to-red-950/30 border-2 border-orange-500/20">
        <div className="p-8 space-y-6">
          <div className="flex items-center justify-center">
            <div className="relative">
              <Package className="text-orange-500 animate-pulse" size={80} />
              <Sparkles className="absolute -top-2 -right-2 text-yellow-500" size={24} />
            </div>
          </div>

          <div className="text-center space-y-2">
            <h2 className="text-2xl font-black italic uppercase text-orange-400">Mystery Gear Case</h2>
            <p className="text-sm text-muted-foreground font-bold">Unlock rods & lures with point bonuses</p>
          </div>

          {/* Drop Rates */}
          <div className="grid grid-cols-2 gap-2">
            <Badge className="bg-gray-500/20 text-gray-200 border-gray-500/30 justify-center font-black text-xs">
              Common 50%
            </Badge>
            <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 justify-center font-black text-xs">
              Rare 30%
            </Badge>
            <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 justify-center font-black text-xs">
              Epic 15%
            </Badge>
            <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30 justify-center font-black text-xs">
              Legendary 5%
            </Badge>
          </div>

          <Button
            onClick={openCase}
            disabled={opening || (userProfile?.current_points || 0) < CASE_PRICE}
            className="w-full h-14 rounded-2xl bg-orange-500 hover:bg-orange-600 text-black font-black uppercase text-sm shadow-[0_8px_30px_rgba(249,115,22,0.3)] disabled:opacity-50"
          >
            {opening ? (
              <Loader2 className="animate-spin mr-2" size={20} />
            ) : (
              <Package className="mr-2" size={20} />
            )}
            Open Case - {CASE_PRICE} pts
          </Button>
        </div>
      </Card>

      {/* Case Opening Animation */}
      {opening && wonItem && (
        <CaseOpening item={wonItem} onComplete={handleCaseComplete} />
      )}
    </div>
  );
};

export default Shop;
