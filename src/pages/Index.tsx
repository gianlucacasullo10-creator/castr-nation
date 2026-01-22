import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { Heart, MessageCircle, Share2, MapPin } from "lucide-react";

const Index = () => {
  const [catches, setCatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchCatches = async () => {
      try {
        const { data, error } = await supabase
          .from('catches')
          .select(`
            *,
            profiles (
              display_name,
              avatar_url,
              active_title
            )
          `)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setCatches(data || []);
      } catch (error: any) {
        console.error("Error fetching feed:", error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCatches();
  }, []);

  const handleLike = async (catchId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({ title: "Authentication Required", description: "Log in to hype this catch!" });
        return;
      }

      const { error } = await supabase
        .from('likes')
        .insert([{ user_id: user.id, catch_id: catchId }]);

      if (error) {
        if (error.code === '23505') {
          toast({ title: "Already Liked", description: "You've already hyped this catch!" });
        } else {
          throw error;
        }
        return;
      }

      // Success toast (Realtime in App.tsx handles the global notification)
      toast({ title: "Hype Sent!", description: "You liked this catch." });
      
    } catch (error: any) {
      console.error("Error liking catch:", error.message);
    }
  };

  if (loading) return <div className="flex h-screen items-center justify-center font-black italic uppercase tracking-widest animate-pulse">Scanning The Nation...</div>;

  return (
    <div className="pb-24 pt-4 px-4 max-w-md mx-auto space-y-6">
      <div className="flex justify-between items-end">
        <h1 className="text-4xl font-black italic tracking-tighter text-primary uppercase">The Nation</h1>
        <Badge variant="outline" className="border-primary text-primary font-black italic mb-1">LIVE FEED</Badge>
      </div>
      
      {catches.map((catchItem) => (
        <Card key={catchItem.id} className="border-none bg-card rounded-[32px] overflow-hidden shadow-2xl transition-transform active:scale-[0.98]">
          <CardHeader className="flex-row items-center justify-between space-y-0 p-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 border-2 border-primary/20 shadow-sm">
                <AvatarImage src={catchItem.profiles?.avatar_url} />
                <AvatarFallback className="font-bold">{catchItem.profiles?.display_name?.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="font-black italic text-sm leading-none uppercase tracking-tighter">
                  {catchItem.profiles?.display_name}
                </span>
                <span className={`text-[9px] font-black uppercase tracking-[0.15em] mt-1 ${
                  catchItem.profiles?.active_title === 'OG CASTR' ? 'text-yellow-500 animate-pulse' : 'text-primary'
                }`}>
                  {catchItem.profiles?.active_title || "Beginner"}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <MapPin size={10} />
              <span className="text-[10px] font-bold uppercase tracking-tight">{catchItem.location_name}</span>
            </div>
          </CardHeader>

          <div className="aspect-square relative overflow-hidden">
            <img 
              src={catchItem.image_url} 
              alt={catchItem.species} 
              className="w-full h-full object-cover"
            />
            <div className="absolute top-4 right-4">
              <Badge className="bg-black/60 backdrop-blur-md text-white border-none font-black italic text-[10px] px-3 py-1">
                AI VERIFIED
              </Badge>
            </div>
          </div>

          <CardContent className="p-4 space-y-4">
            <div className="flex justify-between items-start">
              <div className="space-y-0.5">
                <h3 className="text-2xl font-black uppercase italic leading-none tracking-tighter">
                  {catchItem.species}
                </h3>
                <div className="flex items-center gap-1.5">
                  <span className="text-3xl font-black text-primary italic leading-none tracking-tighter">
                    {catchItem.points}
                  </span>
                  <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mt-2">Points</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-6 pt-4 border-t border-border/40">
              <button 
                onClick={() => handleLike(catchItem.id)}
                className="flex items-center gap-2 text-muted-foreground hover:text-red-500 transition-all active:scale-125"
              >
                <Heart size={22} className="transition-colors" />
                <span className="text-[10px] font-black uppercase tracking-widest">Hype</span>
              </button>
              
              <button className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-all">
                <MessageCircle size={22} />
                <span className="text-[10px] font-black uppercase tracking-widest">Chat</span>
              </button>
              
              <button className="ml-auto text-muted-foreground hover:text-primary transition-all">
                <Share2 size={20} />
              </button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default Index;
