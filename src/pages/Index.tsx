import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Heart, MessageCircle, Share2, Loader2 } from "lucide-react";

const Index = () => {
  const [catches, setCatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) return <div className="flex h-screen items-center justify-center font-black italic">LOADING FEED...</div>;

  return (
    <div className="pb-24 pt-4 px-4 max-w-md mx-auto space-y-6">
      <h1 className="text-4xl font-black italic tracking-tighter text-primary">THE NATION</h1>
      
      {catches.map((catchItem) => (
        <Card key={catchItem.id} className="border-none bg-card rounded-[32px] overflow-hidden shadow-xl">
          <CardHeader className="flex-row items-center justify-between space-y-0 p-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 border-2 border-primary/20">
                <AvatarImage src={catchItem.profiles?.avatar_url} />
                <AvatarFallback>{catchItem.profiles?.display_name?.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="font-black italic text-sm leading-none uppercase tracking-tighter">
                  {catchItem.profiles?.display_name}
                </span>
                {/* DYNAMIC TITLE DISPLAY */}
                <span className={`text-[9px] font-black uppercase tracking-[0.15em] mt-1 ${
                  catchItem.profiles?.active_title === 'OG CASTR' ? 'text-yellow-500 animate-pulse' : 'text-primary'
                }`}>
                  {catchItem.profiles?.active_title || "Beginner"}
                </span>
              </div>
            </div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase">{catchItem.location_name}</span>
          </CardHeader>

          <div className="aspect-square relative group">
            <img src={catchItem.image_url} alt={catchItem.species} className="w-full h-full object-cover" />
          </div>

          <CardContent className="p-4 space-y-4">
            <div className="flex justify-between items-start">
              <div className="space-y-0.5">
                <h3 className="text-xl font-black uppercase italic leading-none tracking-tighter">
                  {catchItem.species}
                </h3>
                <div className="flex items-center gap-1.5">
                  <span className="text-2xl font-black text-primary italic leading-none">{catchItem.points}</span>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Points</span>
                </div>
              </div>
              <Badge variant="secondary" className="bg-primary/10 text-primary border-none font-black text-[9px] px-2 py-0.5 italic">
                AI VERIFIED
              </Badge>
            </div>

            <div className="flex items-center gap-6 pt-3 border-t border-border/50">
              <button className="flex items-center gap-1.5 text-muted-foreground"><Heart size={20} /><span className="text-xs font-bold">0</span></button>
              <button className="flex items-center gap-1.5 text-muted-foreground"><MessageCircle size={20} /><span className="text-xs font-bold">0</span></button>
              <button className="ml-auto text-muted-foreground"><Share2 size={18} /></button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default Index;
