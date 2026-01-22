import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { Heart, MessageCircle, Share2, MapPin, Award, Send, Loader2, RefreshCw } from "lucide-react";

const Index = () => {
  const [feedItems, setFeedItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeCommentId, setActiveCommentId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");
  const { toast } = useToast();

  const fetchUnifiedFeed = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);

      // 1. Fetch Raw Catches
      const { data: catches } = await supabase
        .from('catches')
        .select('*')
        .order('created_at', { ascending: false });

      // 2. Fetch Raw Activities
      const { data: activities } = await supabase
        .from('activities')
        .select('*')
        .order('created_at', { ascending: false });

      // 3. Fetch All Profiles to map them manually (Fixes the "Missing Data" issue)
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url, active_title');

      // 4. Fetch Likes/Comments counts
      const { data: likes } = await supabase.from('likes').select('catch_id, user_id');

      // Create a mapping object for quick lookup
      const profileMap = (profiles || []).reduce((acc: any, p) => {
        acc[p.id] = p;
        return acc;
      }, {});

      // 5. Combine and manually attach profile data
      const combined = [
        ...(catches || []).map(c => ({ 
          ...c, 
          itemType: 'CATCH', 
          profiles: profileMap[c.user_id],
          likes: (likes || []).filter(l => l.catch_id === c.id)
        })),
        ...(activities || []).map(a => ({ 
          ...a, 
          itemType: 'ACTIVITY', 
          profiles: profileMap[a.user_id] 
        }))
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setFeedItems(combined);
    } catch (error: any) {
      console.error("Feed Error:", error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnifiedFeed();
  }, []);

  const handleLike = async (catchId: string) => {
    if (!currentUser) return;
    const { error } = await supabase.from('likes').insert([{ user_id: currentUser.id, catch_id: catchId }]);
    if (!error) fetchUnifiedFeed();
  };

  if (loading) return (
    <div className="flex h-[80vh] flex-col items-center justify-center space-y-4">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="font-black italic uppercase text-primary">Syncing The Nation...</p>
    </div>
  );

  return (
    <div className="pb-24 pt-4 px-4 max-w-md mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-black italic tracking-tighter text-primary uppercase leading-none">The Nation</h1>
        <button onClick={fetchUnifiedFeed} className="p-2 text-primary/50 hover:text-primary transition-colors">
          <RefreshCw size={20} />
        </button>
      </div>

      {feedItems.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed border-muted rounded-[40px]">
          <p className="font-black italic uppercase text-muted-foreground">No activity found</p>
          <p className="text-[10px] uppercase font-bold text-muted-foreground/50 mt-2 tracking-widest">Go log a catch to start the feed</p>
        </div>
      ) : (
        feedItems.map((item) => {
          const isLiked = item.likes?.some((l: any) => l.user_id === currentUser?.id);
          
          return (
            <Card key={item.id} className={`border-none rounded-[32px] overflow-hidden shadow-2xl ${item.itemType === 'ACTIVITY' ? 'bg-primary/5 border-2 border-primary/10' : 'bg-card'}`}>
              <CardHeader className="flex-row items-center justify-between space-y-0 p-4">
                <div className="flex items-center gap-3 text-left">
                  <Avatar className={`h-10 w-10 border-2 ${item.itemType === 'ACTIVITY' ? 'border-primary' : 'border-primary/20'}`}>
                    <AvatarImage src={item.profiles?.avatar_url} />
                    <AvatarFallback>{item.profiles?.display_name?.charAt(0) || '?'}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="font-black italic text-sm leading-none uppercase">
                      {item.profiles?.display_name || "Unknown Castr"}
                    </span>
                    <span className="text-[9px] font-black uppercase tracking-widest mt-1 text-primary">
                      {item.profiles?.active_title || "Beginner"}
                    </span>
                  </div>
                </div>
              </CardHeader>

              {item.itemType === 'ACTIVITY' ? (
                <div className="p-8 flex flex-col items-center text-center">
                  <div className="bg-black px-6 py-6 rounded-[30px] border border-primary/30 flex flex-col items-center gap-3 shadow-2xl w-full">
                    <Award className="text-yellow-500" size={40} />
                    <span className="text-2xl font-black italic uppercase tracking-tighter text-white">
                      Unlocked {item.content}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="aspect-square relative overflow-hidden">
                  <img src={item.image_url} className="w-full h-full object-cover" alt="Catch" />
                  <Badge className="absolute top-4 right-4 bg-black/70 backdrop-blur-md text-white border-none font-black italic text-[10px] px-3 py-1">AI VERIFIED</Badge>
                </div>
              )}

              <CardContent className="p-4 space-y-4">
                {item.itemType === 'CATCH' && (
                  <div className="text-left flex justify-between items-end">
                    <div>
                      <h3 className="text-2xl font-black uppercase italic leading-none tracking-tighter">{item.species}</h3>
                      <div className="flex items-center gap-1 mt-1 opacity-60 italic">
                         <MapPin size={10} />
                         <span className="text-[10px] font-bold uppercase">{item.location_name}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-3xl font-black text-primary italic leading-none">{item.points}</span>
                      <span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">Points</span>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-6 pt-4 border-t border-border/40">
                  {item.itemType === 'CATCH' && (
                    <button onClick={() => handleLike(item.id)} className={`flex items-center gap-2 ${isLiked ? "text-red-500" : "text-muted-foreground"}`}>
                      <Heart size={22} className={isLiked ? "fill-current" : ""} />
                      <span className="text-[10px] font-black uppercase tracking-widest">{item.likes?.length || 0} Likes</span>
                    </button>
                  )}
                  <button onClick={() => setActiveCommentId(activeCommentId === item.id ? null : item.id)} className="flex items-center gap-2 text-muted-foreground hover:text-primary">
                    <MessageCircle size={22} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Chat</span>
                  </button>
                </div>
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
};

export default Index;
