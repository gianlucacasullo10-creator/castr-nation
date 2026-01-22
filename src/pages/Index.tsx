import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { Heart, MessageCircle, Share2, MapPin, Award, Send, Loader2 } from "lucide-react";

const Index = () => {
  const [feedItems, setFeedItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeCommentId, setActiveCommentId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");
  const { toast } = useToast();

  const fetchUnifiedFeed = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);

      // Fetch catches with error handling for each join
      const { data: catches, error: catchError } = await supabase
        .from('catches')
        .select(`
          *,
          profiles(display_name, avatar_url, active_title),
          likes(user_id),
          comments(id, comment_text, profiles(display_name))
        `)
        .order('created_at', { ascending: false });

      // Fetch activities (achievements)
      const { data: activities, error: activityError } = await supabase
        .from('activities')
        .select(`
          *,
          profiles(display_name, avatar_url, active_title),
          comments(id, comment_text, profiles(display_name))
        `)
        .order('created_at', { ascending: false });

      if (catchError) console.error("Catch Fetch Error:", catchError);
      if (activityError) console.error("Activity Fetch Error:", activityError);

      // Merge only if data exists to prevent crashes
      const combined = [
        ...(catches || []).map(c => ({ ...c, itemType: 'CATCH' })),
        ...(activities || []).map(a => ({ ...a, itemType: 'ACTIVITY' }))
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setFeedItems(combined);
    } catch (error: any) {
      console.error("Critical Feed Error:", error.message);
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
    if (error) {
      toast({ title: "Already Liked", variant: "destructive" });
    } else {
      fetchUnifiedFeed();
    }
  };

  const handleSendComment = async (itemId: string, type: 'CATCH' | 'ACTIVITY') => {
    if (!commentText.trim() || !currentUser) return;
    const column = type === 'CATCH' ? 'catch_id' : 'activity_id';
    
    const { error } = await supabase
      .from('comments')
      .insert([{ user_id: currentUser.id, [column]: itemId, comment_text: commentText }]);

    if (!error) {
      setCommentText("");
      setActiveCommentId(null);
      fetchUnifiedFeed();
      toast({ title: "Comment Sent!" });
    }
  };

  if (loading) return (
    <div className="flex h-[80vh] flex-col items-center justify-center space-y-4">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="font-black italic uppercase text-primary tracking-tighter">Syncing The Nation...</p>
    </div>
  );

  return (
    <div className="pb-24 pt-4 px-4 max-w-md mx-auto space-y-6">
      <h1 className="text-4xl font-black italic tracking-tighter text-primary uppercase leading-none">The Nation</h1>

      {feedItems.length === 0 && !loading && (
        <div className="text-center py-20 opacity-50">
          <p className="font-bold italic uppercase">No activity yet. Go catch some fish!</p>
        </div>
      )}

      {feedItems.map((item) => {
        const isLiked = item.likes?.some((l: any) => l.user_id === currentUser?.id);
        const commentCount = item.comments?.length || 0;

        return (
          <Card key={item.id} className={`border-none rounded-[32px] overflow-hidden shadow-2xl ${item.itemType === 'ACTIVITY' ? 'bg-primary/5 border-2 border-primary/10' : 'bg-card'}`}>
            <CardHeader className="flex-row items-center justify-between space-y-0 p-4">
              <div className="flex items-center gap-3 text-left">
                <Avatar className={`h-10 w-10 border-2 ${item.itemType === 'ACTIVITY' ? 'border-primary' : 'border-primary/20'}`}>
                  <AvatarImage src={item.profiles?.avatar_url} />
                  <AvatarFallback>{item.profiles?.display_name?.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="font-black italic text-sm leading-none uppercase">{item.profiles?.display_name || "Unknown"}</span>
                  <span className={`text-[9px] font-black uppercase tracking-widest mt-1 ${item.profiles?.active_title === 'OG CASTR' ? 'text-yellow-500 animate-pulse' : 'text-primary'}`}>
                    {item.profiles?.active_title || "Beginner"}
                  </span>
                </div>
              </div>
            </CardHeader>

            {item.itemType === 'ACTIVITY' ? (
              <div className="p-6 flex flex-col items-center text-center space-y-4">
                <div className="bg-black px-6 py-4 rounded-3xl border border-primary/30 flex items-center gap-3 shadow-xl">
                  <Award className="text-yellow-500" size={28} />
                  <span className="text-xl font-black italic uppercase tracking-tighter text-white">Unlocked {item.content}</span>
                </div>
              </div>
            ) : (
              <div className="aspect-square relative overflow-hidden">
                <img src={item.image_url} className="w-full h-full object-cover" alt="Catch" />
                <Badge className="absolute top-4 right-4 bg-black/60 backdrop-blur-md text-white border-none font-black italic text-[10px] px-3 py-1">AI VERIFIED</Badge>
              </div>
            )}

            <CardContent className="p-4 space-y-4">
              {item.itemType === 'CATCH' && (
                <div className="text-left">
                  <h3 className="text-2xl font-black uppercase italic leading-none tracking-tighter">{item.species}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-3xl font-black text-primary italic leading-none">{item.points}</span>
                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-2">Points</span>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-6 pt-4 border-t border-border/40">
                {item.itemType === 'CATCH' && (
                  <button onClick={() => handleLike(item.id)} className={`flex items-center gap-2 ${isLiked ? "text-red-500" : "text-muted-foreground"}`}>
                    <Heart size={22} className={isLiked ? "fill-current" : ""} />
                    <span className="text-[10px] font-black uppercase tracking-widest">{item.likes?.length || 0}</span>
                  </button>
                )}
                <button onClick={() => setActiveCommentId(activeCommentId === item.id ? null : item.id)} className="flex items-center gap-2 text-muted-foreground">
                  <MessageCircle size={22} />
                  <span className="text-[10px] font-black uppercase tracking-widest">{commentCount} Comments</span>
                </button>
              </div>

              {activeCommentId === item.id && (
                <div className="pt-4 space-y-3">
                  <div className="max-h-32 overflow-y-auto space-y-2 text-left">
                    {item.comments?.map((c: any) => (
                      <div key={c.id} className="bg-muted/50 p-2 rounded-xl">
                        <span className="text-[10px] font-black uppercase text-primary mr-2">{c.profiles?.display_name}:</span>
                        <span className="text-xs">{c.comment_text}</span>
                      </div>
                    ))}
                  </div>
                  <div className="relative flex items-center">
                    <Input 
                      placeholder="Add comment..." 
                      className="h-10 pr-10 bg-muted border-none rounded-xl text-xs font-bold"
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                    />
                    <button onClick={() => handleSendComment(item.id, item.itemType)} className="absolute right-2 text-primary">
                      <Send size={18} />
                    </button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default Index;
