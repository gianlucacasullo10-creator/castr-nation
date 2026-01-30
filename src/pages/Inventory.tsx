import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Check } from "lucide-react";

const RARITY_COLORS = {
  common: { bg: "bg-gray-500/10", border: "border-gray-500/30", text: "text-gray-400" },
  rare: { bg: "bg-blue-500/10", border: "border-blue-500/30", text: "text-blue-400" },
  epic: { bg: "bg-purple-500/10", border: "border-purple-500/30", text: "text-purple-400" },
  legendary: { bg: "bg-yellow-500/10", border: "border-yellow-500/30", text: "text-yellow-400" },
};

const Inventory = () => {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'rod' | 'lure'>('all');
  const { toast } = useToast();

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUser(user);

    if (user) {
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
      <div className="text-left">
        <h1 className="text-4xl font-black italic tracking-tighter text-primary uppercase leading-none">
          Inventory
        </h1>
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mt-1">
          {inventory.length} Items
        </p>
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
            <h3 className={`text-sm font-black uppercase ${colors.text} ml-2`}>
              {rarity} ({items.length})
            </h3>
            {items.map(item => (
              <Card
                key={item.id}
                className={`${colors.bg} border-2 ${colors.border} rounded-[24px] p-4 ${
                  item.is_equipped ? 'ring-2 ring-primary' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="text-3xl">
                      {item.item_type === 'rod' ? '🎣' : '🪝'}
                    </div>
                    <div className="text-left">
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

                  <Button
                    onClick={() => equipItem(item.id, item.item_type, item.is_equipped)}
                    size="sm"
                    variant={item.is_equipped ? 'default' : 'outline'}
                    className="font-black uppercase text-xs"
                  >
                    {item.is_equipped ? (
                      <>
                        <Check size={14} className="mr-1" /> Equipped
                      </>
                    ) : (
                      'Equip'
                    )}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        );
      })}
    </div>
  );
};

export default Inventory;
