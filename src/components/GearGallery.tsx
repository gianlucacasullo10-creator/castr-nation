import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X, Loader2, Lock, Sparkles } from "lucide-react";
import GearImage from "@/components/GearImage";
import GearDetail from "@/components/GearDetail";

interface GearGalleryProps {
  onClose: () => void;
}

const RARITY_COLORS = {
  common: { bg: "bg-gray-100", border: "border-gray-300", text: "text-gray-600", badgeBg: "bg-gray-200" },
  rare: { bg: "bg-blue-50", border: "border-blue-300", text: "text-blue-600", badgeBg: "bg-blue-100" },
  epic: { bg: "bg-purple-50", border: "border-purple-300", text: "text-purple-600", badgeBg: "bg-purple-100" },
  legendary: { bg: "bg-yellow-50", border: "border-yellow-400", text: "text-yellow-600", badgeBg: "bg-yellow-100" },
};

const GearGallery = ({ onClose }: GearGalleryProps) => {
  const [allGear, setAllGear] = useState<any[]>([]);
  const [ownedGearIds, setOwnedGearIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [filter, setFilter] = useState<'all' | 'rod' | 'lure'>('all');

  useEffect(() => {
    fetchGallery();
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const fetchGallery = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: lootData, error: lootError } = await supabase
        .from('gear_loot_table')
        .select('*')
        .order('rarity', { ascending: false })
        .order('item_name', { ascending: true });

      if (lootError) throw lootError;
      setAllGear(lootData || []);

      const { data: inventoryData, error: inventoryError } = await supabase
        .from('inventory')
        .select('item_name')
        .eq('user_id', user.id);

      if (inventoryError) throw inventoryError;

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
      <div className="fixed inset-0 z-[9999] bg-[#f5f5f5] flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={48} />
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
    <div className="fixed inset-0 z-[9999] bg-[#f5f5f5] flex justify-center overflow-hidden">
      <div className="relative h-dvh w-full max-w-md overflow-y-auto">
        
        <div className="flex flex-col space-y-6 pb-24 pt-4 px-4">
          {/* Header - Centered like Tournaments */}
          <div className="text-center pt-2">
            <h1 className="text-4xl font-black italic tracking-tighter text-primary uppercase leading-none">
              Gear Gallery
            </h1>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mt-1">
              {stats.owned}/{stats.total} Collected ({stats.percentage}%)
            </p>
          </div>

          {/* Close Button - Positioned top right */}
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 h-10 w-10 rounded-full bg-black/5 hover:bg-black/10 transition-colors flex items-center justify-center z-30"
          >
            <X size={20} className="text-gray-500" />
          </button>

          {/* Progress Card - Matching Tournaments info card style */}
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-2 border-primary/30 p-6 rounded-[32px]">
            <div className="flex items-start gap-4">
              <div className="bg-primary/20 p-3 rounded-2xl shrink-0">
                <Sparkles className="text-primary" size={24} />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-black uppercase text-sm text-gray-800">Collection Progress</h3>
                  <span className="text-2xl font-black text-primary">{stats.percentage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-primary to-cyan-400 h-full rounded-full transition-all duration-500"
                    style={{ width: `${stats.percentage}%` }}
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Filter Tabs */}
          <div className="flex gap-2">
            {(['all', 'rod', 'lure'] as const).map((t) => (
              <Button
                key={t}
                onClick={() => setFilter(t)}
                variant={filter === t ? 'default' : 'outline'}
                className={`flex-1 font-black uppercase text-xs h-11 rounded-2xl ${
                  filter === t 
                    ? 'bg-primary text-black hover:bg-primary/90' 
                    : 'bg-white border-2 border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {t === 'rod' ? 'Rods' : t === 'lure' ? 'Lures' : 'All'}
              </Button>
            ))}
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
                    !isOwned ? 'opacity-60 grayscale' : ''
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex justify-center relative">
                      <GearImage 
                        imageUrl={isOwned ? item.image_url : null}
                        itemType={item.item_type}
                        rarity={item.rarity}
                        size="md"
                      />
                      {!isOwned && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Lock className="text-gray-400" size={32} />
                        </div>
                      )}
                    </div>

                    <div className="text-center">
                      <Badge className={`${colors.badgeBg} ${colors.text} border-none font-black text-[8px] px-2 py-0.5 mb-1`}>
                        {item.rarity}
                      </Badge>
                      <h4 className="font-black italic uppercase text-xs leading-tight text-gray-800">
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
          <Card className="bg-white border-2 border-dashed border-gray-200 p-6 rounded-[32px]">
            <h3 className="font-black uppercase text-xs mb-3 text-center text-gray-800">How to Collect</h3>
            <ul className="space-y-2 text-xs text-gray-500">
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
