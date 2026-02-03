import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X, Loader2, Lock } from "lucide-react";
import GearImage from "@/components/GearImage";
import GearDetail from "@/components/GearDetail";

interface GearGalleryProps {
  onClose: () => void;
}

const RARITY_COLORS = {
  common: { bg: "bg-gray-500/20", border: "border-gray-500", text: "text-gray-100" },
  rare: { bg: "bg-blue-500/20", border: "border-blue-500", text: "text-blue-200" },
  epic: { bg: "bg-purple-500/20", border: "border-purple-500", text: "text-purple-200" },
  legendary: { bg: "bg-yellow-500/20", border: "border-yellow-500", text: "text-yellow-200" },
};

const GearGallery = ({ onClose }: GearGalleryProps) => {
  const [allGear, setAllGear] = useState<any[]>([]);
  const [ownedGearIds, setOwnedGearIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [filter, setFilter] = useState<'all' | 'rod' | 'lure'>('all');

  useEffect(() => {
    fetchGallery();
    
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

  const fetchGallery = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get all possible gear from loot table
      const { data: lootData, error: lootError } = await supabase
        .from('gear_loot_table')
        .select('*')
        .order('rarity', { ascending: false })
        .order('item_name', { ascending: true });

      if (lootError) throw lootError;
      setAllGear(lootData || []);

      // Get user's owned gear
      const { data: inventoryData, error: inventoryError } = await supabase
        .from('inventory')
        .select('item_name')
        .eq('user_id', user.id);

      if (inventoryError) throw inventoryError;

      // Create set of owned item names
      const owned = new Set(inventoryData?.map(item => item.item_name) || []);
      setOwnedGearIds(owned);

    } catch (error) {
      console.error('Error fetching gallery:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredGear = allGear.filter(item => 
    filter === 'all' ? true : item.item_type === filter
  );

  const stats = {
    total: allGear.length,
    owned: ownedGearIds.size,
    percentage: allGear.length > 0 ? Math.round((ownedGearIds.size / allGear.length) * 100) : 0
  };

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

  if (selectedItem) {
    return (
      <GearDetail 
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
      />
    );
  }

  return (
    <div className="fixed inset-[-50px] z-[200] bg-black overflow-hidden">
      <div className="absolute inset-0 bg-black/95 backdrop-blur-md" />
      
      <div className="relative h-screen w-screen overflow-y-auto flex justify-center">
        <div className="w-full max-w-md p-4 space-y-4 pb-8">
          {/* Header */}
          <div className="flex items-start justify-between pt-4 sticky top-0 bg-black z-10 pb-4">
            <div className="flex-1">
              <h2 className="text-3xl font-black italic uppercase text-primary tracking-tighter leading-none">
                Gear Gallery
              </h2>
              <p className="text-xs font-bold text-muted-foreground mt-1">
                {stats.owned}/{stats.total} Collected ({stats.percentage}%)
              </p>
            </div>
            <button 
              onClick={onClose}
              className="h-10 w-10 rounded-full hover:bg-white/10 transition-colors flex items-center justify-center"
            >
              <X size={24} className="text-white/70" />
            </button>
          </div>

          {/* Progress Bar */}
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-2 border-primary/30 p-4 rounded-[32px]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black uppercase text-primary">Collection Progress</span>
              <span className="text-xl font-black text-primary">{stats.percentage}%</span>
            </div>
            <div className="w-full bg-black/50 rounded-full h-3 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-primary to-primary/70 h-full rounded-full transition-all duration-500"
                style={{ width: `${stats.percentage}%` }}
              />
            </div>
          </Card>

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
              Rods
            </Button>
            <Button
              onClick={() => setFilter('lure')}
              variant={filter === 'lure' ? 'default' : 'outline'}
              className="flex-1 font-black uppercase text-xs"
            >
              Lures
            </Button>
          </div>

          {/* Gear Grid */}
          <div className="grid grid-cols-2 gap-3">
            {filteredGear.map((item) => {
              const isOwned = ownedGearIds.has(item.item_name);
              const colors = RARITY_COLORS[item.rarity as keyof typeof RARITY_COLORS];

              return (
                <Card
                  key={item.id}
                  onClick={() => isOwned && setSelectedItem(item)}
                  className={`${colors.bg} border-2 ${colors.border} rounded-[24px] p-4 cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98] ${
                    !isOwned ? 'opacity-50 grayscale' : ''
                  }`}
                >
                  <div className="space-y-3">
                    {/* Gear Image */}
                    <div className="flex justify-center relative">
                      <GearImage 
                        imageUrl={isOwned ? item.image_url : null}
                        itemType={item.item_type}
                        rarity={item.rarity}
                        size="md"
                      />
                      {!isOwned && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Lock className="text-white/50" size={32} />
                        </div>
                      )}
                    </div>

                    {/* Item Info */}
                    <div className="text-center">
                      <Badge className={`${colors.bg} ${colors.text} border-none font-black text-[8px] px-2 py-0.5 mb-1`}>
                        {item.rarity}
                      </Badge>
                      <h4 className="font-black italic uppercase text-xs leading-tight text-white">
                        {isOwned ? item.item_name : '???'}
                      </h4>
                      {isOwned && (
                        <p className="text-[10px] text-primary font-bold mt-1">
                          +{item.bonus_percentage}%
                        </p>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Info Card */}
          <Card className="bg-muted/30 border-2 border-dashed border-muted p-6 rounded-[32px]">
            <h3 className="font-black uppercase text-xs mb-2 text-center">How to Collect</h3>
            <ul className="space-y-1 text-xs text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>Open cases in the shop</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>Win tournaments for exclusive gear</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>Trade in lower rarity items</span>
              </li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default GearGallery;
