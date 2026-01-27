import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Heart, 
  MessageCircle, 
  MapPin, 
  Award, 
  Send, 
  Loader2, 
  RefreshCw, 
  LogIn, 
  UserCircle 
} from "lucide-react";

const Index = () => {
  const [feedItems, setFeedItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeCommentId, setActiveCommentId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");
  const { toast } = useToast();
  const navigate = useNavigate();

  const fetchUnifiedFeed = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);

      const { data: catches } = await supabase.from('catches').select('*').order('created_at', { ascending: false });
      const { data: activities } = await supabase.from('activities').select('*').order('created_at', { ascending: false });
      const { data: profiles } = await supabase.from('profiles').select('id, display_name, avatar_url, equipped_title');
      const { data: likes } = await supabase.from('likes').select('catch_id, user_id');
      const { data: comments } = await supabase.from('comments').select('*, profiles(display_name, avatar_url)').order('created_at', { ascending: true });

      const profileMap = (profiles || []).reduce((acc: any, p) => { acc[p.id] = p; return acc; }, {});

      const combined = [
        ...(catches || []).map(c => ({ 
          ...c, 
          itemType: 'CATCH', 
          profiles: profileMap[c.user_id],
          likes: (likes || []).filter(l => l.catch_id === c.id),
          comments: (comments || []).filter(com => com.catch_id === c.id)
        })),
        ...(activities || []).map(a => ({ 
          ...a, 
          itemType: 'ACTIVITY', 
          profiles: profileMap[a.user_id],
          comments: (comments || []).filter(com => com.activity_id === a.id)
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
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleLike = async (catchId: string) => {
    if (!currentUser) {
      toast({ title: "Login Required", description: "You must be logged in to like posts." });
      return;
    }
    const alreadyLiked = feedItems.find(item => item.id === catchId)?.likes?.some((l: any) => l.user_id === currentUser.id);
    if (alreadyLiked) return;
    const { error } = await supabase.from('likes').insert([{ user_id: currentUser.id, catch_id: catchId }]);
    if (!error) fetchUnifiedFeed(false); 
  };

  const handleSendComment = async (itemId: string, type: string) => {
    if (!commentText.trim() || !currentUser) return;
    try {
      const column = type === 'CATCH' ? 'catch_id' : 'activity_id';
      const { error } = await supabase.from('comments').insert([{ user_id: currentUser.id, [column]: itemId, comment_text: commentText }]);
      if (error) throw error;
      setCommentText("");
      setActiveCommentId(null);
      fetchUnifiedFeed(false);
      toast({ title: "Comment Posted!" });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Post Failed", description: error.message });
    }
  };

  if (loading) return (
    <div className="flex h-[80vh] flex-col items-center justify-center space-y-4">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="font-black italic uppercase text-primary tracking-tighter">Syncing CASTRS...</p>
    </div>
  );

  return (
    <div className="pb-24 pt-4 px-4 max-w-md mx-auto space-y-6">
      {/* BRANDED HEADER */}
      <div className="flex justify-between items-center bg-background/80 backdrop-blur-md sticky top-0 z-50 py-2">
        <div className="flex flex-col">
          <h1 className="text-5xl font-black italic tracking-tighter text-primary uppercase leading-none text-left">CASTRS</h1>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground mt-1">Global Angler Force</p>
        </div>
        
        <div className="flex items-center gap-2">
          {!currentUser ? (
            <Button 
              onClick={() => navigate("/auth")}
              className="rounded-full bg-primary text-black font-black italic uppercase text-[10px] px-4 h-8 shadow-[0_0_15px_rgba(var(--primary),0.3)]"
            >
              <LogIn size={14} className="mr-2" /> Join
            </Button>
          ) : (
            <Button 
              variant="ghost" 
              onClick={() => navigate("/profile")}
              className="rounded-full border border-primary/20 text-primary font-black italic uppercase text-[10px] px-4 h-8"
            >
              <UserCircle size={14} className="mr-2" /> Profile
            </Button>
          )}
          <button onClick={() => fetchUnifiedFeed(true)} className="p-2 text-primary/50 hover:text-primary transition-colors">
            <RefreshCw size={18} />
          </button>
        </div>
      </div>

      {feedItems.map((item) => {
        const isLiked = item.likes?.some((l: any) => l.user_id === currentUser?.id);

        return (
          <Card key={item.id} className={`border-none rounded-[32px] overflow-hidden shadow-2xl transition-all ${item.itemType === 'ACTIVITY' ? 'bg-primary/5 border-2 border-primary/10' : 'bg-card'}`}>
            <CardHeader 
              onClick={() => navigate(`/profile/${item.user_id}`)}
              className="flex-row items-center justify-between space-y-0 p-4 text-left cursor-pointer hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Avatar className={`h-10 w-10 border-2 ${item.itemType === 'ACTIVITY' ? 'border-primary' : 'border-primary/20'}`}>
                  <AvatarImage src={item.profiles?.avatar_url} />
                  <AvatarFallback>{item.profiles?.display_name?.charAt(0) || '?'}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col text-left">
                  <span className="font-black italic text-sm leading-none uppercase">{item.profiles?.display_name || "Castr"}</span>
                  <span className="text-[9px] font-black uppercase tracking-widest mt-1 text-primary">{item.profiles?.equipped_title || "Beginner"}</span>
                </div>
              </div>
            </CardHeader>

            {item.itemType === 'ACTIVITY' ? (
              <div className="p-8 flex flex-col items-center text-center">
                <div className="bg-black px-6 py-6 rounded-[30px] border border-primary/30 flex flex-col items-center gap-3 shadow-2xl w-full">
                  <Award className="text-yellow-500" size={40} />
                  <span className="text-xl font-black italic uppercase tracking-tighter text-white">Unlocked {item.content}</span>
                </div>
              </div>
            ) : (
              <div className="aspect-square relative overflow-hidden">
                <img src={item.image_url} className="w-full h-full object-cover" alt="Catch" />
                <Badge className="absolute top-4 right-4 bg-black/70 backdrop-blur-md text-white border-none font-black italic text-[10px] px-3 py-1 uppercase">AI Verified</Badge>
              </div>
            )}

            <CardContent className="p-4 space-y-4">
              {item.itemType === 'CATCH' && (
                <div className="text-left flex justify-between items-end">
                  <div>
                    <h3 className="text-2xl font-black uppercase italic leading-none tracking-tighter">{item.species}</h3>
                    <div className="flex items-center gap-1 mt-1 opacity-60 italic uppercase text-[10px] font-bold">
                       <MapPin size={10} /> {item.location_name}
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-3xl font-black text-primary italic leading-none">{item.points}</span>
                    <span className="text-[8px] font-black text-muted-foreground uppercase">Points</span>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-6 pt-4 border-t border-border/40">
                {item.itemType === 'CATCH' && (
                  <button 
                    onClick={() => handleLike(item.id)} 
                    className={`flex items-center gap-2 transition-all active:scale-125 ${isLiked ? "text-red-500" : "text-muted-foreground"}`}
                  >
                    <Heart size={22} className={isLiked ? "fill-current" : ""} />
                    <span className="text-[10px] font-black uppercase tracking-widest">{item.likes?.length || 0}</span>
                  </button>
                )}
                <button 
                  onClick={() => setActiveCommentId(activeCommentId === item.id ? null : item.id)} 
                  className={`flex items-center gap-2 ${activeCommentId === item.id ? "text-primary" : "text-muted-foreground"}`}
                >
                  <MessageCircle size={22} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Chat ({item.comments?.length || 0})</span>
                </button>
              </div>

              {item.comments?.length > 0 && (
                <div className="space-y-3 pt-2 text-left">
                  {item.comments.map((comment: any) => (
                    <div key={comment.id} className="flex gap-2 items-start animate-in fade-in duration-300">
                      <Avatar 
                        className="h-5 w-5 border border-primary/20 cursor-pointer"
                        onClick={() => navigate(`/profile/${comment.user_id}`)}
                      >
                        <AvatarImage src={comment.profiles?.avatar_url} />
                        <AvatarFallback className="text-[8px]">{comment.profiles?.display_name?.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="bg-muted/50 p-2 rounded-2xl rounded-tl-none flex-1">
                        <p 
                          className="text-[9px] font-black uppercase text-primary italic leading-none mb-1 cursor-pointer hover:underline inline-block"
                          onClick={() => navigate(`/profile/${comment.user_id}`)}
                        >
                          {comment.profiles?.display_name}
                        </p>
                        <p className="text-[11px] font-medium leading-tight text-foreground/80">{comment.comment_text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeCommentId === item.id && (
                <div className="flex gap-2 pt-2 animate-in slide-in-from-top-2 duration-200">
                  <Input
                    placeholder="Add to the conversation..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    className="h-10 bg-muted border-none rounded-xl text-xs font-bold"
                    autoFocus
                  />
                  <Button size="icon" onClick={() => handleSendComment(item.id, item.itemType)} className="h-10 w-10 rounded-xl bg-primary text-black shrink-0">
                    <Send size={16} />
                  </Button>
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
