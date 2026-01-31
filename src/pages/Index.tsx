import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import CatchUpload from "@/components/CatchUpload"; 
import {  
  Heart,  
  MessageCircle,  
  MapPin,  
  Award,  
  Send,  
  Loader2,  
  RefreshCw,  
  LogIn,  
  UserCircle,
  Camera,
  Trash2
} from "lucide-react";
import { requestLocationPermission, UserLocation } from "@/utils/location";
import FeedSkeleton from "@/components/ui/FeedSkeleton";
import ImageZoom from "@/components/ImageZoom";
import { checkAchievementsAfterLike } from "@/utils/achievementTracker";

// Helper function to check achievements after comment
const checkAchievementsAfterComment = async (userId: string) => {
  const { checkAndUnlockAchievements } = await import("@/utils/achievementTracker");
  await checkAndUnlockAchievements(userId);
};

const Index = () => {
  const [feedItems, setFeedItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [activeCommentId, setActiveCommentId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");
  const [showUpload, setShowUpload] = useState(false);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [locationPermissionAsked, setLocationPermissionAsked] = useState(false);
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  
  // Pull to refresh states
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const touchStartY = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { toast } = useToast();
  const navigate = useNavigate();

  // Pull to refresh constants
  const PULL_THRESHOLD = 80; // Distance needed to trigger refresh
  const MAX_PULL = 120; // Maximum pull distance

  // Request location on app load
  useEffect(() => {
    const checkLocation = async () => {
      if (!locationPermissionAsked) {
        const location = await requestLocationPermission();
        setUserLocation(location);
        setLocationPermissionAsked(true);
        
        if (location) {
          localStorage.setItem('userLocation', JSON.stringify(location));
        }
      }
    };
    
    const savedLocation = localStorage.getItem('userLocation');
    if (savedLocation) {
      setUserLocation(JSON.parse(savedLocation));
      setLocationPermissionAsked(true);
    } else {
      checkLocation();
    }
  }, [locationPermissionAsked]);

  const fetchUnifiedFeed = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);

      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, display_name, avatar_url, equipped_title')
          .eq('id', user.id)
          .single();
        setUserProfile(profile);
      }

      const { data: catches } = await supabase.from('catches').select('*').order('created_at', { ascending: false });
      const { data: activities } = await supabase.from('activities').select('*').order('created_at', { ascending: false });
      const { data: profiles, error: profilesError } = await supabase.from('profiles').select('id, display_name, avatar_url, equipped_title');
      if (profilesError) console.error('Profiles fetch error:', profilesError);
      const { data: likes } = await supabase.from('likes').select('catch_id, user_id');
      const { data: comments } = await supabase.from('comments').select('*, profiles(display_name, avatar_url)').order('created_at', { ascending: true });

      const profileMap = (profiles || []).reduce((acc: any, p) => { acc[p.id] = p; return acc; }, {});

      // Map catches
      const catchPosts = (catches || []).map(c => ({ 
        ...c, 
        itemType: 'CATCH', 
        profiles: profileMap[c.user_id],
        likes: (likes || []).filter(l => l.catch_id === c.id),
        comments: (comments || []).filter(com => com.catch_id === c.id),
        image_url: c.image_url && c.image_url.includes('/') 
          ? supabase.storage.from('catch_photos').getPublicUrl(c.image_url).data.publicUrl 
          : null
      }));

      // Map achievement activities
      const achievementPosts = (activities || [])
        .filter(a => a.activity_type === 'achievement')
        .map(a => ({ 
          ...a, 
          itemType: 'ACTIVITY', 
          profiles: profileMap[a.user_id],
          comments: (comments || []).filter(com => com.activity_id === a.id)
        }));

      // Mix achievements into feed every 5-7 catch posts
      const mixed: any[] = [];
      let achievementIndex = 0;
      let nextAchievementAt = Math.floor(Math.random() * 3) + 5; // Random between 5-7

      catchPosts.forEach((catchPost, index) => {
        mixed.push(catchPost);
        
        // Insert an achievement every 5-7 posts if we have more to show
        if (index + 1 === nextAchievementAt && achievementIndex < achievementPosts.length) {
          mixed.push(achievementPosts[achievementIndex]);
          achievementIndex++;
          nextAchievementAt = index + Math.floor(Math.random() * 3) + 5; // Next one in 5-7 posts
        }
      });

      // Add any remaining achievements at the end
      while (achievementIndex < achievementPosts.length) {
        mixed.push(achievementPosts[achievementIndex]);
        achievementIndex++;
      }

      // Sort by created_at to maintain chronological order
      mixed.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setFeedItems(mixed);
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
      if (session?.user) fetchUnifiedFeed(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Pull to refresh handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    const scrollTop = containerRef.current?.scrollTop || 0;
    if (scrollTop === 0) {
      touchStartY.current = e.touches[0].clientY;
      setIsPulling(true);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isPulling || isRefreshing) return;
    
    const scrollTop = containerRef.current?.scrollTop || 0;
    if (scrollTop > 0) {
      setIsPulling(false);
      setPullDistance(0);
      return;
    }

    const touchY = e.touches[0].clientY;
    const distance = touchY - touchStartY.current;
    
    if (distance > 0) {
      // Apply resistance to pull
      const resistedDistance = Math.min(distance * 0.5, MAX_PULL);
      setPullDistance(resistedDistance);
    }
  };

  const handleTouchEnd = async () => {
    if (!isPulling) return;
    
    setIsPulling(false);
    
    if (pullDistance >= PULL_THRESHOLD) {
      setIsRefreshing(true);
      await fetchUnifiedFeed(false);
      
      // Add small delay for better UX
      setTimeout(() => {
        setIsRefreshing(false);
        setPullDistance(0);
        toast({ title: "Feed refreshed!" });
      }, 500);
    } else {
      setPullDistance(0);
    }
  };

  // Toggle like/unlike functionality
  const handleLike = async (catchId: string) => {
    if (!currentUser) {
      toast({ title: "Login Required", description: "You must be logged in to like posts." });
      return;
    }
    
    const currentItem = feedItems.find(item => item.id === catchId);
    const alreadyLiked = currentItem?.likes?.some((l: any) => l.user_id === currentUser.id);

    if (alreadyLiked) {
      // UNLIKE - Optimistic update
      setFeedItems(prevItems => 
        prevItems.map(item => 
          item.id === catchId 
            ? { 
                ...item, 
                likes: item.likes.filter((l: any) => l.user_id !== currentUser.id)
              }
            : item
        )
      );

      // Remove like from database
      const { error } = await supabase
        .from('likes')
        .delete()
        .eq('user_id', currentUser.id)
        .eq('catch_id', catchId);
      
      if (error) {
        // Revert on error
        setFeedItems(prevItems => 
          prevItems.map(item => 
            item.id === catchId 
              ? { 
                  ...item, 
                  likes: [...(item.likes || []), { user_id: currentUser.id, catch_id: catchId }]
                }
              : item
          )
        );
        toast({ variant: "destructive", title: "Failed to unlike post" });
      }
    } else {
      // LIKE - Optimistic update
      setFeedItems(prevItems => 
        prevItems.map(item => 
          item.id === catchId 
            ? { 
                ...item, 
                likes: [...(item.likes || []), { user_id: currentUser.id, catch_id: catchId }] 
              }
            : item
        )
      );

      // Add like to database
      const { error } = await supabase
        .from('likes')
        .insert([{ user_id: currentUser.id, catch_id: catchId }]);
      
      if (error) {
        // Revert on error
        setFeedItems(prevItems => 
          prevItems.map(item => 
            item.id === catchId 
              ? { 
                  ...item, 
                  likes: item.likes.filter((l: any) => l.user_id !== currentUser.id) 
                }
              : item
          )
        );
        toast({ variant: "destructive", title: "Failed to like post" });
      } else {
        // ✅ CHECK ACHIEVEMENTS FOR THE CATCH OWNER (receiving likes)
        const catchItem = feedItems.find(item => item.id === catchId);
        if (catchItem?.user_id) {
          await checkAchievementsAfterLike(catchItem.user_id);
        }
        
        // ✅ ALSO CHECK ACHIEVEMENTS FOR THE USER GIVING THE LIKE
        const { checkAndUnlockAchievements } = await import("@/utils/achievementTracker");
        const newAchievements = await checkAndUnlockAchievements(currentUser.id);
        // Could show notification here if needed
      }
    }
  };

  const handleSendComment = async (itemId: string, type: string) => {
    if (!commentText.trim() || !currentUser) return;
    try {
      const column = type === 'CATCH' ? 'catch_id' : 'activity_id';
      const { error } = await supabase.from('comments').insert([{ user_id: currentUser.id, [column]: itemId, comment_text: commentText }]);
      if (error) throw error;
      setCommentText("");
      setActiveCommentId(null);
      
      // ✅ CHECK ACHIEVEMENTS AFTER COMMENTING
      await checkAchievementsAfterComment(currentUser.id);
      
      fetchUnifiedFeed(false);
      toast({ title: "Comment Posted!" });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Post Failed", description: error.message });
    }
  };

  const handleDeletePost = async (itemId: string, itemType: string) => {
    if (!currentUser) return;
    
    const confirmDelete = window.confirm('Are you sure you want to delete this post?');
    if (!confirmDelete) return;

    try {
      if (itemType === 'CATCH') {
        const { error } = await supabase
          .from('catches')
          .delete()
          .eq('id', itemId)
          .eq('user_id', currentUser.id);

        if (error) throw error;
        toast({ title: "Catch Deleted" });
      } else if (itemType === 'ACTIVITY') {
        const { error } = await supabase
          .from('activities')
          .delete()
          .eq('id', itemId)
          .eq('user_id', currentUser.id);

        if (error) throw error;
        toast({ title: "Activity Deleted" });
      }

      // OPTIMISTIC UPDATE - Remove from UI immediately
      setFeedItems(prevItems => prevItems.filter(item => item.id !== itemId));
    } catch (error: any) {
      toast({ 
        variant: "destructive", 
        title: "Delete Failed", 
        description: error.message 
      });
      // Refresh on error to restore state
      fetchUnifiedFeed(false);
    }
  };

  if (loading) return (
    <div className="pb-24 pt-4 px-4 max-w-md mx-auto space-y-6">
      <div className="flex justify-between items-center bg-background/80 backdrop-blur-md sticky top-0 z-50 py-2">
        <div className="flex flex-col">
          <h1 className="text-5xl font-black italic tracking-tighter text-primary uppercase leading-none text-left">CASTRS</h1>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground mt-1 text-left">
            Loading...
          </p>
        </div>
      </div>
      <FeedSkeleton />
    </div>
  );

  return (
    <div 
      ref={containerRef}
      className="pb-24 pt-4 px-4 max-w-md mx-auto space-y-6 overflow-y-auto"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        transform: isPulling ? `translateY(${pullDistance}px)` : 'none',
        transition: isPulling ? 'none' : 'transform 0.3s ease-out'
      }}
    >
      {/* Pull to refresh indicator */}
      <div 
        className="fixed top-0 left-1/2 -translate-x-1/2 z-50 flex items-center justify-center transition-all duration-200"
        style={{
          opacity: pullDistance > 0 ? Math.min(pullDistance / PULL_THRESHOLD, 1) : 0,
          transform: `translateY(${Math.max(pullDistance - 40, 0)}px)`
        }}
      >
        <div className="bg-primary/90 backdrop-blur-md rounded-full p-3 shadow-lg">
          <RefreshCw 
            size={20} 
            className={`text-white ${isRefreshing ? 'animate-spin' : ''}`}
            style={{
              transform: `rotate(${pullDistance * 2}deg)`
            }}
          />
        </div>
      </div>

      {/* BRANDED HEADER */}
      <div className="flex justify-between items-center bg-background/80 backdrop-blur-md sticky top-0 z-40 py-2">
        <div className="flex flex-col">
          <h1 className="text-5xl font-black italic tracking-tighter text-primary uppercase leading-none text-left">CASTRS</h1>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground mt-1 text-left">
            Global Angler Force
          </p>
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
          <button 
            onClick={() => fetchUnifiedFeed(true)} 
            className="p-2 text-primary/50 hover:text-primary transition-colors"
            disabled={isRefreshing}
          >
            <RefreshCw size={18} className={isRefreshing ? 'animate-spin' : ''} />
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
              <div className="p-4 flex items-center gap-4">
                <div className="bg-gradient-to-br from-primary/20 to-primary/10 p-4 rounded-2xl border-2 border-primary/30 flex items-center justify-center shrink-0">
                  <Award className="text-primary" size={24} />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-black italic uppercase tracking-tight text-foreground leading-tight">
                    Unlocked Achievement
                  </p>
                  <p className="text-lg font-black italic uppercase tracking-tighter text-primary leading-none mt-1">
                    {item.content}
                  </p>
                </div>
              </div>
            ) : (
              <div className="aspect-square relative overflow-hidden">
                <ImageZoom 
                  src={item.image_url} 
                  alt="Catch" 
                  className="aspect-square relative overflow-hidden"
                />
                <Badge className="absolute top-4 right-4 bg-black/70 backdrop-blur-md text-white border-none font-black italic text-[10px] px-3 py-1 uppercase pointer-events-none z-10">AI Verified</Badge>
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

              <div className="flex items-center justify-between pt-4 border-t border-border/40">
                <div className="flex items-center gap-6">
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

                {/* Delete button - only show for post owner */}
                {currentUser?.id === item.user_id && (
                  <button
                    onClick={() => handleDeletePost(item.id, item.itemType)}
                    className="text-red-500/50 hover:text-red-500 transition-colors p-2"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>

              {item.comments?.length > 0 && (
                <div className="space-y-3 pt-2 text-left">
                  {/* Show first 3 comments or all if expanded */}
                  {item.comments
                    .slice(0, expandedComments.has(item.id) ? item.comments.length : 3)
                    .map((comment: any) => (
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
                  
                  {/* Show More/Less Button */}
                  {item.comments.length > 3 && (
                    <button
                      onClick={() => {
                        setExpandedComments(prev => {
                          const newSet = new Set(prev);
                          if (newSet.has(item.id)) {
                            newSet.delete(item.id);
                          } else {
                            newSet.add(item.id);
                          }
                          return newSet;
                        });
                      }}
                      className="text-xs font-bold text-primary hover:underline"
                    >
                      {expandedComments.has(item.id) 
                        ? 'Show less' 
                        : `Show ${item.comments.length - 3} more comment${item.comments.length - 3 === 1 ? '' : 's'}`
                      }
                    </button>
                  )}
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

      {/* AI AUTHENTICATION MODAL */}
      {showUpload && (
        <CatchUpload 
          key={Date.now()}
          onComplete={() => {
            setShowUpload(false);
          }} 
        />
      )}
    </div>
  );
};

export default Index;
