import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { X, ArrowRight, Loader2, Sparkles, CheckCircle2 } from "lucide-react";

interface TradeInProps {
  onClose: () => void;
  onTradeComplete: () => void;
}

const RARITY_COLORS = {
  common: { bg: "bg-gray-500/20", border: "border-gray-500", text: "text-gray-100", glow: "shadow-[0_0_40px_rgba(156,163,175,0.5)]" },
  rare: { bg: "bg-blue-500/20", border: "border-blue-500", text: "text-blue-200", glow: "shadow-[0_0_40px_rgba(59,130,246,0.5)]" },
  epic: { bg: "bg-purple-500/20", border: "border-purple-500", text: "text-purple-200", glow: "shadow-[0_0_40px_rgba(168,85,247,0.5)]" },
  legendary: { bg: "bg-yellow-500/20", border: "border-yellow-500", text: "text-yellow-200", glow: "shadow-[0_0_60px_rgba(234,179,8,0.8)]" },
};

const TRADE_RECIPES = [
  {
    id: 'rare',
    name: 'Trade for Rare',
    requirements: { common: 5 },
    output: 'rare',
    icon: '🔷'
  },
  {
    id: 'epic',
    name: 'Trade for Epic',
    requirements: { common: 5, rare: 5 },
    output: 'epic',
    icon: '💜'
  },
  {
    id: 'legendary',
    name: 'Trade for Legendary',
    requirements: { common: 5, rare: 5, epic: 5 },
    output: 'legendary',
    icon: '⭐'
  }
];

const TradeIn = ({ onClose, onTradeComplete }: TradeInProps) => {
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [trading, setTrading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [selectedRecipe, setSelectedRecipe] = useState<typeof TRADE_RECIPES[0] | null>(null);
  const [selectedItems, setSelectedItems] = useState<{[key: string]: string[]}>({});
  const [receivedItem, setReceivedItem] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchInventory();
    
    // Lock body scroll
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    document.body.style.height = '100%';

    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.height = '';
    };
  }, []);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      setUserId(user.id);

      const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_equipped', false)
        .order('rarity', { ascending: true })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInventory(data || []);
    } catch (error) {
      console.error('Error fetching inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  const getItemCounts = () => {
    const counts = {
      common: inventory.filter(i => i.rarity === 'common').length,
      rare: inventory.filter(i => i.rarity === 'rare').length,
      epic: inventory.filter(i => i.rarity === 'epic').length,
      legendary: inventory.filter(i => i.rarity === 'legendary').length,
    };
    return counts;
  };

  const toggleItemSelection = (itemId: string, rarity: string) => {
    if (!selectedRecipe) return;

    const rarityNeeded = selectedRecipe.requirements[rarity as keyof typeof selectedRecipe.requirements] || 0;
    const currentSelected = selectedItems[rarity] || [];

    if (currentSelected.includes(itemId)) {
      // Deselect
      setSelectedItems(prev => ({
        ...prev,
        [rarity]: currentSelected.filter(id => id !== itemId)
      }));
    } else {
      // Select (if under limit)
      if (currentSelected.length < rarityNeeded) {
        setSelectedItems(prev => ({
          ...prev,
          [rarity]: [...currentSelected, itemId]
        }));
      }
    }
  };

  const canTrade = () => {
    if (!selectedRecipe) return false;
    
    return Object.entries(selectedRecipe.requirements).every(
      ([rarity, needed]) => (selectedItems[rarity] || []).length === needed
    );
  };

  const handleTrade = async () => {
    if (!userId || !selectedRecipe || !canTrade()) return;

    setTrading(true);

    try {
      // Collect all selected item IDs
      const itemsToDelete = Object.values(selectedItems).flat();

      // Delete the traded items
      const { error: deleteError } = await supabase
        .from('inventory')
        .delete()
        .in('id', itemsToDelete);

      if (deleteError) throw deleteError;

      // Get loot table for the output rarity
      const { data: lootTable, error: lootError } = await supabase
        .from('gear_loot_table')
        .select('*')
        .eq('rarity', selectedRecipe.output);

      if (lootError) throw lootError;
      if (!lootTable || lootTable.length === 0) throw new Error('No items found');

      // Random selection from output rarity
      const randomItem = lootTable[Math.floor(Math.random() * lootTable.length)];

      // Add new item to inventory
      const { error: insertError } = await supabase
        .from('inventory')
        .insert([{
          user_id: userId,
          item_type: randomItem.item_type,
          item_name: randomItem.item_name,
          rarity: randomItem.rarity,
          bonus_percentage: randomItem.bonus_percentage,
          is_equipped: false
        }]);

      if (insertError) throw insertError;

      // Show result
      setReceivedItem(randomItem);

    } catch (error: any) {
      console.error('Trade error:', error);
      toast({
        variant: "destructive",
        title: "Trade Failed",
        description: error.message
      });
      setTrading(false);
    }
  };

  const handleResultClose = () => {
    setReceivedItem(null);
    setSelectedRecipe(null);
    setSelectedItems({});
    setTrading(false);
    fetchInventory();
    onTradeComplete();
  };

  const counts = getItemCounts();

  // Show result screen
  if (receivedItem) {
    const colors = RARITY_COLORS[receivedItem.rarity as keyof typeof RARITY_COLORS];
    
    return (
      <div className="fixed inset-[-50px] z-[200] bg-black overflow-hidden">
        <div className="absolute inset-0 bg-black/95 backdrop-blur-md" />
        
        <div className="relative h-screen w-screen flex items-center justify-center px-4">
          <Card className={`${colors.bg} ${colors.glow} border-4 ${colors.border} rounded-[40px] p-6 w-full max-w-sm animate-in zoom-in-95 duration-500`}>
            <div className="text-center space-y-4">
              <CheckCircle2 size={48} className="mx-auto text-green-500 mb-3" />
              
              <h2 className="text-2xl font-black italic uppercase text-primary">Trade Complete!</h2>
              
              {/* Rarity Badge */}
              <Badge className={`${colors.bg} ${colors.text} border-2 ${colors.border} font-black text-sm px-4 py-1 uppercase`}>
                {receivedItem.rarity}
              </Badge>

              {/* Item Icon */}
              <div className="text-7xl">
                {receivedItem.item_type === 'rod' ? '🎣' : '🪝'}
              </div>

              {/* Item Name */}
              <h3 className={`text-2xl font-black italic uppercase ${colors.text} leading-tight`}>
                {receivedItem.item_name}
              </h3>

              {/* Bonus */}
              <div>
                <p className="text-sm font-bold text-muted-foreground uppercase mb-1">Catch Bonus</p>
                <p className="text-3xl font-black italic text-primary">+{receivedItem.bonus_percentage}%</p>
              </div>

              {/* Type */}
              <Badge variant="outline" className="font-black text-xs uppercase">
                {receivedItem.item_type}
              </Badge>

              {/* Continue Button */}
              <Button
                onClick={handleResultClose}
                className="w-full h-12 rounded-2xl bg-primary text-black font-black uppercase text-sm mt-4 active:scale-95 transition-transform"
              >
                Continue
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // Show item selection screen
  if (selectedRecipe) {
    return (
      <div className="fixed inset-[-50px] z-[200] bg-black overflow-hidden">
        <div className="absolute inset-0 bg-black/95 backdrop-blur-md" />
        
        <div className="relative h-screen w-screen overflow-y-auto">
          <div className="max-w-md mx-auto p-4 space-y-4 pb-8">
            {/* Header */}
            <div className="flex items-start justify-between pt-4 sticky top-0 bg-black z-10 pb-4">
              <div className="flex-1">
                <h2 className="text-2xl font-black italic uppercase text-primary tracking-tighter leading-none">
                  Select Items
                </h2>
                <p className="text-xs font-bold text-muted-foreground mt-1">
                  Choose which items to trade in
                </p>
              </div>
              <button 
                onClick={() => {
                  setSelectedRecipe(null);
                  setSelectedItems({});
                }}
                className="h-10 w-10 rounded-full hover:bg-white/10 transition-colors flex items-center justify-center"
              >
                <X size={24} className="text-white/70" />
              </button>
            </div>

            {/* Requirements */}
            <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-2 border-primary/30 p-4 rounded-[32px]">
              <h3 className="font-black uppercase text-xs mb-3 text-primary">Requirements</h3>
              <div className="flex items-center gap-2 flex-wrap">
                {Object.entries(selectedRecipe.requirements).map(([rarity, count]) => {
                  const selected = (selectedItems[rarity] || []).length;
                  const colors = RARITY_COLORS[rarity as keyof typeof RARITY_COLORS];
                  
                  return (
                    <Badge 
                      key={rarity}
                      className={`${colors.bg} ${colors.text} border-2 ${colors.border} font-black text-xs px-3 py-1`}
                    >
                      {selected}/{count} {rarity}
                    </Badge>
                  );
                })}
              </div>
            </Card>

            {/* Item Selection by Rarity */}
            {Object.entries(selectedRecipe.requirements).map(([rarity, needed]) => {
              const items = inventory.filter(i => i.rarity === rarity);
              const colors = RARITY_COLORS[rarity as keyof typeof RARITY_COLORS];
              const selected = selectedItems[rarity] || [];

              if (items.length === 0) {
                return (
                  <Card key={rarity} className="p-6 rounded-[32px] text-center">
                    <p className="text-muted-foreground text-sm">No {rarity} items available</p>
                  </Card>
                );
              }

              return (
                <div key={rarity} className="space-y-3">
                  <h3 className={`text-sm font-black uppercase ${colors.text} ml-2`}>
                    {rarity} - Select {needed}
                  </h3>
                  {items.map(item => {
                    const isSelected = selected.includes(item.id);
                    
                    return (
                      <Card
                        key={item.id}
                        onClick={() => toggleItemSelection(item.id, rarity)}
                        className={`${colors.bg} border-2 ${isSelected ? colors.border + ' ring-2 ring-primary' : 'border-muted'} rounded-[24px] p-4 cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98]`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="text-3xl">
                            {item.item_type === 'rod' ? '🎣' : '🪝'}
                          </div>
                          <div className="flex-1 text-left">
                            <h4 className="font-black italic uppercase text-sm leading-tight text-white">
                              {item.item_name}
                            </h4>
                            <Badge variant="outline" className="font-bold text-[10px] px-2 py-0.5 mt-1.5 border-white/30">
                              +{item.bonus_percentage}%
                            </Badge>
                          </div>
                          {isSelected && (
                            <CheckCircle2 className="text-primary shrink-0" size={24} />
                          )}
                        </div>
                      </Card>
                    );
                  })}
                </div>
              );
            })}

            {/* Trade Button */}
            <div className="sticky bottom-0 bg-black pt-4 pb-4">
              <Button
                onClick={handleTrade}
                disabled={!canTrade() || trading}
                className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/90 text-black font-black uppercase text-sm disabled:opacity-50 disabled:bg-muted"
              >
                {trading ? (
                  <>
                    <Loader2 className="animate-spin mr-2" size={20} />
                    Trading...
                  </>
                ) : canTrade() ? (
                  <>
                    <Sparkles className="mr-2" size={20} />
                    Complete Trade
                  </>
                ) : (
                  `Select ${Object.entries(selectedRecipe.requirements).map(([r, n]) => `${n} ${r}`).join(', ')}`
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show recipe selection screen (main view)
  if (loading) {
    return (
      <div className="fixed inset-[-50px] z-[200] bg-black overflow-hidden">
        <div className="absolute inset-0 bg-black/95 backdrop-blur-md" />
        <div className="relative h-screen w-screen flex items-center justify-center">
          <Loader2 className="animate-spin text-primary" size={48} />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-[-50px] z-[200] bg-black overflow-hidden">
      <div className="absolute inset-0 bg-black/95 backdrop-blur-md" />
      
      <div className="relative h-screen w-screen overflow-y-auto">
        <div className="max-w-md mx-auto p-4 space-y-4 pb-8">
          {/* Header */}
          <div className="flex items-start justify-between pt-4 sticky top-0 bg-black z-10 pb-4">
            <div className="flex-1">
              <h2 className="text-3xl font-black italic uppercase text-primary tracking-tighter leading-none">
                Trade-In
              </h2>
              <p className="text-xs font-bold text-muted-foreground mt-1">
                Upgrade your gear by trading items
              </p>
            </div>
            <button 
              onClick={onClose}
              className="h-10 w-10 rounded-full hover:bg-white/10 transition-colors flex items-center justify-center"
            >
              <X size={24} className="text-white/70" />
            </button>
          </div>

          {/* Your Inventory Counts */}
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-2 border-primary/30 p-6 rounded-[32px]">
            <h3 className="font-black uppercase text-sm mb-4 text-primary">Your Inventory (Unequipped)</h3>
            <div className="grid grid-cols-4 gap-3">
              <div className="text-center">
                <div className="text-2xl font-black text-gray-200">{counts.common}</div>
                <p className="text-[9px] font-bold text-gray-400 uppercase">Common</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-black text-blue-300">{counts.rare}</div>
                <p className="text-[9px] font-bold text-blue-400 uppercase">Rare</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-black text-purple-300">{counts.epic}</div>
                <p className="text-[9px] font-bold text-purple-400 uppercase">Epic</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-black text-yellow-300">{counts.legendary}</div>
                <p className="text-[9px] font-bold text-yellow-400 uppercase">Legendary</p>
              </div>
            </div>
          </Card>

          {/* Trade Recipes */}
          <div className="space-y-4">
            {TRADE_RECIPES.map((recipe) => {
              const hasEnough = Object.entries(recipe.requirements).every(
                ([rarity, needed]) => counts[rarity as keyof typeof counts] >= needed
              );
              const colors = RARITY_COLORS[recipe.output as keyof typeof RARITY_COLORS];

              return (
                <Card 
                  key={recipe.id}
                  className={`${colors.bg} border-2 ${colors.border} rounded-[32px] p-6 ${
                    !hasEnough ? 'opacity-50' : ''
                  }`}
                >
                  <div className="space-y-4">
                    {/* Recipe Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-4xl">{recipe.icon}</span>
                        <div>
                          <h3 className={`font-black italic uppercase text-lg ${colors.text}`}>
                            {recipe.name}
                          </h3>
                          <Badge className={`${colors.bg} ${colors.text} border-none font-black text-xs mt-1`}>
                            {recipe.output}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Requirements */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {Object.entries(recipe.requirements).map(([rarity, count], index) => (
                        <div key={rarity} className="flex items-center gap-2">
                          {index > 0 && <span className="text-muted-foreground text-sm">+</span>}
                          <Badge variant="outline" className="font-black text-xs">
                            {count}x {rarity}
                          </Badge>
                        </div>
                      ))}
                      <ArrowRight className="text-primary mx-1" size={20} />
                      <Badge className={`${colors.bg} ${colors.text} border-2 ${colors.border} font-black text-xs`}>
                        1x {recipe.output}
                      </Badge>
                    </div>

                    {/* Start Button */}
                    <Button
                      onClick={() => setSelectedRecipe(recipe)}
                      disabled={!hasEnough}
                      className={`w-full h-12 rounded-2xl font-black uppercase text-sm ${
                        hasEnough 
                          ? 'bg-primary hover:bg-primary/90 text-black' 
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {hasEnough ? (
                        <>
                          <ArrowRight className="mr-2" size={16} />
                          Select Items
                        </>
                      ) : (
                        'Not Enough Items'
                      )}
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Info Card */}
          <Card className="bg-muted/30 border-2 border-dashed border-muted p-6 rounded-[32px]">
            <h3 className="font-black uppercase text-xs mb-2 text-center">Trade-In Rules</h3>
            <ul className="space-y-1 text-xs text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>Only unequipped items can be traded</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>Choose which specific items to sacrifice</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>Traded items are permanently removed</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>You receive a random item of the output rarity</span>
              </li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TradeIn;
