import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Loader2, MapPin, Fish, Heart, MessageCircle, Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const Index = () => {
  const [catches, setCatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchCatches = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);

      const { data, error } = await supabase
        .from('catches')
        .select(`
          *,
          profiles:user_id (display_name, avatar_url),
          likes (user_id)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const catchesWithLikeStatus = data?.map(c => ({
        ...c,
        hasLiked: c.likes?.some((l: any) => l.user_id === user?.id),
        likesCount: c.likes?.length || 0
      }));

      setCatches(catchesWithLikeStatus || []);
    } catch (error: any) {
      console.error("Error fetching feed:", error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCatches();
  }, []);

  const toggleLike = async (catchId: string) => {
    if (!currentUserId) return;

    try {
      const catchItem = catches.find(c => c.id === catchId);
      if (!catchItem) return;

      if (catchItem.hasLiked) {
        await supabase
          .from('likes')
          .delete()
          .eq('user_id', currentUserId)
          .eq('catch_id', catchId);
      } else {
        await supabase
          .from('likes')
          .insert([{ user_id: currentUserId, catch_id: catchId }]);
      }
      
      fetchCatches(); 
    } catch (error) {
      console.error("Like error:", error);
    }
  };

  const deleteCatch = async (catchId: string, ownerId: string) => {
    if (currentUserId !== ownerId) return;

    if (window.confirm("Remove this trophy from the nation?")) {
      const { error } = await supabase.from('catches').delete().eq('id', catchId);
      if (!error) {
        toast({ title: "Catch Deleted" });
        fetchCatches();
      }
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={40} />
      </div>
    );
  }

  return (
    <div className="pb-24 pt-4 px-4 max-w-md mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-black italic tracking-tighter text-primary">CASTR NATION</h1>
      </div>

      {catches.length === 0 ? (
        <div className="text-center py-20 bg-muted rounded-3xl border-2 border-dashed">
          <Fish className="mx-auto mb-4 text-muted-foreground" size={48} />
          <p className="text-muted-foreground font-medium">Scanning the waters...<br/>No catches yet!</p>
        </div>
      ) : (
        catches.map((catchItem) => (
          <Card key={catchItem.id} className="overflow-hidden border-none shadow-xl bg-card rounded-3xl">
            <CardHeader className="p-4 flex flex-row items-center space-x-3">
              <Avatar className="h-10 w-10 border-2 border-primary">
                <AvatarImage src={catchItem.profiles?.avatar_url} />
                <AvatarFallback className="bg-primary text-white">
                  {catchItem.profiles?.display_name?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-bold text-sm leading-none">
                  {catchItem.profiles?.display_name || "New Angler"}
                </p>
                <div className="flex items-center text-[10px] text-muted-foreground mt-1">
                  <MapPin size={10} className="mr-1" />
                  {catchItem.location_name || "Unknown Location"}
                </div>
              </div>
              {currentUserId === catchItem.user_id && (
                <button 
                  onClick={() => deleteCatch(catchItem.id, catchItem.user_id)}
                  className="text-muted-foreground hover:text-destructive transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              )}
            </CardHeader>
            
            <div className="aspect-square w-full bg-muted overflow-hidden">
              {catchItem.image_url ? (
                <img 
                  src={catchItem.image_url} 
                  alt={catchItem.species}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Fish className="text-muted-foreground opacity-20" size={64} />
                </div>
              )}
            </div>

           <CardContent className="p-4 space-y-4">
  <div className="flex justify-between items-start">
    <div className="space-y-0.5">
      {/* Species Name */}
      <h3 className="text-xl font-black uppercase italic leading-none tracking-tighter">
        {catchItem.species}
      </h3>
      
      {/* POINTS DISPLAY - Replaces lbs and in */}
      <div className="flex items-center gap-1.5">
        <span className="text-2xl font-black text-primary italic leading-none">
          {catchItem.points || 0}
        </span>
        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">
          Points
        </span>
      </div>
    </div>

    {/* Verified Status Badge */}
    <Badge variant="secondary" className="bg-primary/10 text-primary border-none font-black text-[9px] px-2 py-0.5 italic">
      AI VERIFIED
    </Badge>
  </div>

  {/* Social Interaction Bar */}
  <div className="flex items-center gap-6 pt-3 border-t border-border/50">
    <button 
      onClick={() => toggleLike(catchItem.id)}
      className={`flex items-center gap-1.5 transition-all active:scale-125 ${
        catchItem.hasLiked ? "text-red-500" : "text-muted-foreground hover:text-red-400"
      }`}
    >
      <Heart 
        size={20} 
        fill={catchItem.hasLiked ? "currentColor" : "none"} 
      />
      <span className="text-xs font-bold">{catchItem.likesCount}</span>
    </button>

    <button className="flex items-center gap-1.5 hover:text-primary transition-colors text-muted-foreground">
      <MessageCircle size={20} />
      <span className="text-xs font-bold">0</span>
    </button>
  </div>
</CardContent>
          </Card>
        ))
      )}
    </div>
  );
};

export default Index;
