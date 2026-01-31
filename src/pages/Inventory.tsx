import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Check, Trash2, Recycle, AlertCircle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const RARITY_COLORS = {
  common: { bg: "bg-gray-500/10", border: "border-gray-500/30", text: "text-gray-200" },
  rare: { bg: "bg-blue-500/10", border: "border-blue-500/30", text: "text-blue-300" },
  epic: { bg: "bg-purple-500/10", border: "border-purple-500/30", text: "text-purple-300" },
  legendary: { bg: "bg-yellow-500/10", border: "border-yellow-500/30", text: "text-yellow-300" },
};

const RECYCLE_VALUES = {
  common: 25,
  rare: 50,
  epic: 250,
  legendary: 500,
};

const Inventory = () => {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'rod' | 'lure'>('all');
  const [recycleDialogOpen, setRecycleDialogOpen] = useState(false);
  const [itemToRecycle, setItemToRecycle] = useState<any>(null);
  const [isRecycling, setIsRecycling] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUser(user);

    if (user) {
      // Fetch user profile for fish points
      const { data: profile } = await supabase
        .from('profiles')
        .select('fish_points')
        .eq('id', user.id)
        .single();
      
      setUserProfile(profile);

      const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Inventory fetch error:', error);
      } else {
        setInventory(data || []);
      }
    }
    setLoading(false);
  };

  const equipItem = async (itemId: string, itemType: string, currentlyEquipped: boolean) => {
    if (!currentUser) return;

    try {
      if (currentlyEquipped) {
        // Unequip
        const { error } = await supabase
          .from('inventory')
          .update({ is_equipped: false })
          .eq('id', itemId);

        if (error) throw error;
        toast({ title: "Item Unequipped" });
      } else {
        // Unequip any other items of the same type first
        await supabase
          .from('inventory')
          .update({ is_equipped: false })
          .eq('user_id', currentUser.id)
          .eq('item_type', itemType)
          .eq('is_equipped', true);

        // Equip this item
        const { error } = await supabase
          .from('inventory')
          .update({ is_equipped: true })
          .eq('id', itemId);

        if (error) throw error;
        toast({ title: "Item Equipped!", description: "Bonus now active on catches" });
      }

      fetchInventory();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message
      });
    }
  };

  const openRecycleDialog = (item: any) => {
    setItemToRecycle(item);
    setRecycleDialogOpen(true);
  };

  const recycleItem = async () => {
    if (!currentUser || !itemToRecycle) return;

    // Can't recycle equipped items
    if (itemToRecycle.is_equipped) {
      toast({
        variant: "destructive",
        title: "Cannot Recycle",
        description: "Unequip the item before recycling it."
      });
      setRecycleDialogOpen(false);
      return;
    }

    setIsRecycling(true);

    try {
      const pointsToAdd = RECYCLE_VALUES[itemToRecycle.rarity as keyof typeof RECYCLE_VALUES];
      
      // Delete the item from inventory
      const { error: deleteError } = await supabase
        .from('inventory')
        .delete()
        .eq('id', itemToRecycle.id)
        .eq('user_id', currentUser.id);

      if (deleteError) throw deleteError;

      // Add fish points to user profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          fish_points: (userProfile?.fish_points || 0) + pointsToAdd 
        })
        .eq('id', currentUser.id);

      if (updateError) throw updateError;

      // Optimistic update
      setInventory(prevInventory => 
        prevInventory.filter(item => item.id !== itemToRecycle.id)
      );

      setUserProfile((prev: any) => ({
        ...prev,
        fish_points: (prev?.fish_points || 0) + pointsToAdd
      }));

      toast({
        title: "Item Recycled!",
        description: `Gained ${pointsToAdd} fish points 🐟`,
      });

      setRecycleDialogOpen(false);
      setItemToRecycle(null);
      
      // Refresh to ensure everything is in sync
      await fetchInventory();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Recycling Failed",
        description: error.message
      });
      // Refresh on error
      fetchInventory();
    } finally {
      setIsRecycling(false);
    }
  };

  const filteredInventory = inventory.filter(item => 
    filter === 'all' ? true : item.item_type === filter
  );

  const groupedInventory = filteredInventory.reduce((acc, item) => {
    const key = item.rarity;
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {} as Record<string, any[]>);

  const rarityOrder = ['legendary', 'epic', 'rare', 'common'];

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
      <div className="flex justify-between items-end">
        <div className="text-left">
          <h1 className="text-4xl font-black italic tracking-tighter text-primary uppercase leading-none">
            Inventory
          </h1>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mt-1">
            {inventory.length} Items
          </p>
        </div>
        
        {/* Fish Points Display */}
        <div className="bg-primary/10 border-2 border-primary/20 rounded-2xl px-3 py-2 text-right">
          <p className="text-2xl font-black text-primary leading-none">
            {userProfile?.fish_points || 0}
          </p>
          <p className="text-[8px] font-black uppercase text-muted-foreground">
            Fish Points
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        <Button
          onClick={() => setFilter('all')}
          variant={filter === 'all' ? 'default' : 'outline'}
          className="flex-1 font-black uppercase text-xs"
        >
          All
        </Button>
        <Button
          onClick={() => setFilter('rod')}
          variant={filter === 'rod' ? 'default' : 'outline'}
          className="flex-1 font-black uppercase text-xs"
        >
          🎣 Rods
        </Button>
        <Button
          onClick={() => setFilter('lure')}
          variant={filter === 'lure' ? 'default' : 'outline'}
          className="flex-1 font-black uppercase text-xs"
        >
          🪝 Lures
        </Button>
      </div>

      {/* Empty State */}
      {filteredInventory.length === 0 && (
        <Card className="p-12 text-center rounded-[32px]">
          <p className="text-muted-foreground font-bold">No items yet</p>
          <p className="text-sm text-muted-foreground mt-2">Open cases in the shop to get gear!</p>
        </Card>
      )}

      {/* Inventory Items Grouped by Rarity */}
      {rarityOrder.map(rarity => {
        const items = groupedInventory[rarity];
        if (!items || items.length === 0) return null;

        const colors = RARITY_COLORS[rarity as keyof typeof RARITY_COLORS];

        return (
          <div key={rarity} className="space-y-3">
            <div className="flex items-center justify-between ml-2">
              <h3 className={`text-sm font-black uppercase ${colors.text}`}>
                {rarity} ({items.length})
              </h3>
              <Badge variant="outline" className="text-[10px] font-bold">
                <Recycle size={10} className="mr-1" />
                {RECYCLE_VALUES[rarity as keyof typeof RECYCLE_VALUES]} pts
              </Badge>
            </div>
            {items.map(item => (
              <Card
                key={item.id}
                className={`${colors.bg} border-2 ${colors.border} rounded-[24px] p-4 ${
                  item.is_equipped ? 'ring-2 ring-primary' : ''
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="text-3xl">
                      {item.item_type === 'rod' ? '🎣' : '🪝'}
                    </div>
                    <div className="text-left flex-1">
                      <h4 className="font-black italic uppercase text-sm leading-none">
                        {item.item_name}
                      </h4>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge className={`${colors.bg} ${colors.text} border-none font-black text-[8px] px-2 py-0`}>
                          {rarity}
                        </Badge>
                        <Badge variant="outline" className="font-bold text-[8px] px-2 py-0">
                          +{item.bonus_percentage}%
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Button
                      onClick={() => equipItem(item.id, item.item_type, item.is_equipped)}
                      size="sm"
                      variant={item.is_equipped ? 'default' : 'outline'}
                      className="font-black uppercase text-xs w-full"
                    >
                      {item.is_equipped ? (
                        <>
                          <Check size={14} className="mr-1" /> Equipped
                        </>
                      ) : (
                        'Equip'
                      )}
                    </Button>
                    
                    <Button
                      onClick={() => openRecycleDialog(item)}
                      size="sm"
                      variant="ghost"
                      disabled={item.is_equipped}
                      className="font-black uppercase text-xs text-orange-500 hover:text-orange-600 hover:bg-orange-500/10 w-full"
                    >
                      <Recycle size={14} className="mr-1" />
                      Recycle
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        );
      })}

      {/* Recycle Confirmation Dialog */}
      <AlertDialog open={recycleDialogOpen} onOpenChange={setRecycleDialogOpen}>
        <AlertDialogContent className="rounded-3xl max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-black uppercase italic text-center">
              Recycle Item?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center space-y-4 py-4">
              <div className="flex flex-col items-center gap-3">
                <div className="text-5xl">
                  {itemToRecycle?.item_type === 'rod' ? '🎣' : '🪝'}
                </div>
                <div>
                  <p className="font-black uppercase text-foreground">
                    {itemToRecycle?.item_name}
                  </p>
                  <Badge 
                    className={`mt-2 ${
                      RARITY_COLORS[itemToRecycle?.rarity as keyof typeof RARITY_COLORS]?.text
                    }`}
                  >
                    {itemToRecycle?.rarity}
                  </Badge>
                </div>
              </div>
              
              <div className="bg-primary/10 border-2 border-primary/20 rounded-2xl p-4">
                <p className="text-3xl font-black text-primary">
                  +{RECYCLE_VALUES[itemToRecycle?.rarity as keyof typeof RECYCLE_VALUES]}
                </p>
                <p className="text-xs font-bold text-muted-foreground uppercase">
                  Fish Points
                </p>
              </div>

              <div className="flex items-start gap-2 bg-destructive/10 border border-destructive/20 rounded-xl p-3">
                <AlertCircle size={16} className="text-destructive mt-0.5 shrink-0" />
                <p className="text-xs text-destructive font-bold text-left">
                  This action cannot be undone. The item will be permanently removed from your inventory.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row gap-2 sm:space-x-0">
            <AlertDialogCancel 
              className="flex-1 m-0 rounded-xl font-black uppercase"
              disabled={isRecycling}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                recycleItem();
              }}
              disabled={isRecycling}
              className="flex-1 m-0 rounded-xl font-black uppercase bg-orange-500 hover:bg-orange-600"
            >
              {isRecycling ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Recycling...
                </>
              ) : (
                <>
                  <Recycle className="mr-2 h-4 w-4" />
                  Recycle
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Inventory;
