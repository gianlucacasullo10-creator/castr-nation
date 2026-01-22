import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { Heart, MessageCircle, Share2, MapPin, Award, Star } from "lucide-react";

const Index = () => {
  const [feedItems, setFeedItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchUnifiedFeed = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setCurrentUser(user);

        // 1. Fetch Catches
        const { data: catches } = await supabase
          .from('catches')
          .select('*, profiles(display_name, avatar_url, active_title), likes(user_id)')
          .order('created_at', { ascending: false });

        // 2. Fetch Title Unlocks
        const { data: activities } = await supabase
          .from('activities')
          .select('*, profiles(display_name, avatar_url, active_title)')
          .order('created_at', { ascending: false });

        // 3. Merge and Sort by Date
        const combined = [
          ...(catches || []).map(c => ({ ...c, itemType: 'CATCH' })),
          ...(activities || []).map(a => ({ ...a, itemType: 'ACTIVITY' }))
        ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

        setFeedItems(combined);
      } catch (error: any) {
        console.error("Feed Error:", error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUnifiedFeed();
  }, []);

  const handleLike = async (catchId: string) => {
    if (!currentUser) return;
    const { error } = await supabase.from('likes').insert([{ user_id: currentUser.id, catch_id: catchId }]);
    if (!error) {
      setFeedItems(prev => prev.map(item => {
        if (item.id === catchId) {
          return { ...item, likes: [...(item.likes || []), { user_id: currentUser.id }] };
        }
        return item;
      }));
    }
  };

  if (loading) return <div className="flex h-screen items-center justify-center font-black italic uppercase animate-pulse text-primary">Scanning The Nation...</div>;

  return (
    <div className="pb-24 pt-4 px-4 max-w-md mx-auto space-y-6">
      <h1 className="text-4xl font-black italic tracking-tighter text-primary uppercase leading-none">The Nation</h1>

      {feedItems.map((item) => {
        // --- RENDER TITLE UNLOCK ACTIVITY ---
        if (item.itemType === 'ACTIVITY') {
          return (
            <Card key={item.id} className="border-none bg-primary/5 rounded-[32px] p-6 flex flex-col items-center text-center space-y-3 border-2 border-primary/10">
              <Avatar className="h-16 w-16 border-4 border-primary shadow-lg">
                <AvatarImage src={item.profiles?.avatar_url} />
                <AvatarFallback>{item.profiles?.display_name?.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-primary italic">New Achievement</p>
                <h3 className="text-xl font-black uppercase italic leading-none">{item.profiles?.display_name}</h3>
              </div>
              <div className="bg-black px-6 py-3 rounded-2xl border border-primary/30 flex items-center gap-3">
                <Award className="text-yellow-500" size={24} />
                <span className="text-lg font-black italic uppercase tracking-tighter text-white">
                  Unlocked {item.content}
                </span>
              </div>
            </Card>
          );
        }

        // --- RENDER STANDARD CATCH POST ---
        const isLiked = item.likes?.some((l: any) => l.user_id === currentUser?.id);
        const likeCount = item.likes?.length || 0;

        return (
          <Card key={item.id} className="border-none bg-card rounded-[32px] overflow-hidden shadow-2xl">
            <CardHeader className="flex-row items-center justify-between space-y-0 p-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 border-2 border-primary/20">
                  <AvatarImage src={item.profiles?.avatar_url} />
                  <AvatarFallback className="font-bold">{item.profiles?.display_name?.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="font-black italic text-sm leading-none uppercase">{item.profiles?.display_name}</span>
                  <span className={`text-[9px] font-black uppercase tracking-widest mt-1 ${item.profiles?.active_title === 'OG CASTR' ? 'text-yellow-500 animate-pulse' : 'text-primary'}`}>
                    {item.profiles?.active_title || "Beginner"}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1 text-muted-foreground">
                <MapPin size={10} />
                <span className="text-[10px] font-bold uppercase">{item.location_name}</span>
              </div>
            </CardHeader>

            <div className="aspect-square relative overflow-hidden">
              <img src={item.image_url} className="w-full h-full object-cover" alt="Catch" />
            </div>

            <CardContent className="p-4 space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-2xl font-black uppercase italic leading-none tracking-tighter">{item.species}</h3>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-3xl font-black text-primary italic leading-none">{item.points}</span>
                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-2">Points</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-6 pt-4 border-t border-border/40">
                <button onClick={() => handleLike(item.id)} className={`flex items-center gap-2 transition-all ${isLiked ? "text-red-500" : "text-muted-foreground hover:text-red-500"}`}>
                  <Heart size={22} className={isLiked ? "fill-current" : ""} />
                  <span className="text-[10px] font-black uppercase tracking-widest">{likeCount} {likeCount === 1 ? 'Like' : 'Likes'}</span>
                </button>
                <button className="flex items-center gap-2 text-muted-foreground hover:text-primary"><MessageCircle size={22} /><span className="text-[10px] font-black uppercase tracking-widest">Chat</span></button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default Index;
