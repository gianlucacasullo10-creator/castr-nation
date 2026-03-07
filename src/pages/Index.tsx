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
import { getStorageUrl } from '@/utils/storage';
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

type FeedFilter = 'all' | 'friends' | 'nearby';

function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

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
  const [feedFilter, setFeedFilter] = useState<FeedFilter>('all');
  const [friendIds, setFriendIds] = useState<string[]>([]);
  
  // Pull to refresh states
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const touchStartY = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { toast } = useToast();
  const navigate = useNavigate();

  // Pull to refresh constants
  const PULL_THRESHOLD = 80;
  const MAX_PULL = 120;

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

      // Run auth + catches + activities in parallel
      const [{ data: { user } }, catchResult, activityResult] = await Promise.all([
        supabase.auth.getUser(),
        supabase
          .from('catches')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(30),
        supabase
          .from('activities')
          .select('*')
          .eq('activity_type', 'achievement')
          .order('created_at', { ascending: false })
          .limit(10),
      ]);

      setCurrentUser(user);

      const catches = catchResult.data || [];
      const activities = activityResult.data || [];
      const catchIds = catches.map((c: any) => c.id);
      const activityIds = activities.map((a: any) => a.id);

      // Collect all unique user_ids we need profiles for
      const userIds = [...new Set([
        ...catches.map((c: any) => c.user_id),
        ...activities.map((a: any) => a.user_id),
        ...(user ? [user.id] : []),
      ])].filter(Boolean) as string[];

      // Fetch profiles, likes, comments all in parallel — scoped to loaded IDs
      const [profilesResult, currentProfileResult, likesResult, commentsResult] = await Promise.all([
        userIds.length > 0
          ? supabase.from('profiles').select('id, display_name, avatar_url, equipped_title').in('id', userIds)
          : Promise.resolve({ data: [] }),
        user
          ? supabase.from('profiles').select('id, display_name, avatar_url, equipped_title, is_admin').eq('id', user.id).single()
          : Promise.resolve({ data: null }),
        catchIds.length > 0
          ? supabase.from('likes').select('catch_id, user_id').in('catch_id', catchIds)
          : Promise.resolve({ data: [] }),
        catchIds.length > 0 || activityIds.length > 0
          ? supabase
              .from('comments')
              .select('*, profiles(display_name, avatar_url)')
              .or(
                [
                  catchIds.length > 0 ? `catch_id.in.(${catchIds.join(',')})` : null,
                  activityIds.length > 0 ? `activity_id.in.(${activityIds.join(',')})` : null,
                ].filter(Boolean).join(',')
              )
              .order('created_at', { ascending: true })
          : Promise.resolve({ data: [] }),
      ]);

      if (currentProfileResult.data) setUserProfile(currentProfileResult.data);

      const profileMap = (profilesResult.data || []).reduce((acc: any, p: any) => { acc[p.id] = p; return acc; }, {});
      const likes = likesResult.data || [];
      const comments = commentsResult.data || [];

      const catchPosts = catches.map((c: any) => ({
        ...c,
        itemType: 'CATCH',
        profiles: profileMap[c.user_id],
        likes: likes.filter((l: any) => l.catch_id === c.id),
        comments: comments.filter((com: any) => com.catch_id === c.id),
        image_url: c.image_url
          ? (c.image_url.startsWith('http') ? c.image_url : getStorageUrl('catch_photos', c.image_url))
          : null,
      }));

      const achievementPosts = activities.map((a: any) => ({
        ...a,
        itemType: 'ACTIVITY',
        profiles: profileMap[a.user_id],
        comments: comments.filter((com: any) => com.activity_id === a.id),
      }));

      const mixed: any[] = [];
      let achievementIndex = 0;
      let nextAchievementAt = Math.floor(Math.random() * 3) + 5;

      catchPosts.forEach((catchPost: any, index: number) => {
        mixed.push(catchPost);
        if (index + 1 === nextAchievementAt && achievementIndex < achievementPosts.length) {
          mixed.push(achievementPosts[achievementIndex]);
          achievementIndex++;
          nextAchievementAt = index + Math.floor(Math.random() * 3) + 5;
        }
      });

      while (achievementIndex < achievementPosts.length) {
        mixed.push(achievementPosts[achievementIndex]);
        achievementIndex++;
      }

      mixed.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setFeedItems(mixed);
    } catch (error: any) {
      console.error("Feed Error:", error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchFriendIds = async (userId: string) => {
    const { data } = await supabase
      .from('friendships')
      .select('user_id, friend_id')
      .or(`user_id.eq.${userId},friend_id.eq.${userId}`)
      .eq('status', 'accepted');
    if (data) {
      setFriendIds(data.map(f => f.user_id === userId ? f.friend_id : f.user_id));
    }
  };

  useEffect(() => {
    fetchUnifiedFeed();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setCurrentUser(session?.user ?? null);
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
        fetchUnifiedFeed(false);
        if (session?.user) fetchFriendIds(session.user.id);
        else setFriendIds([]);
      }
    });
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) fetchFriendIds(user.id);
    });
    const handleFeedRefresh = () => fetchUnifiedFeed(false);
    window.addEventListener('feedRefresh', handleFeedRefresh);
    return () => {
      subscription.unsubscribe();
      window.removeEventListener('feedRefresh', handleFeedRefresh);
    };
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
      setFeedItems(prevItems => 
        prevItems.map(item => 
          item.id === catchId 
            ? { ...item, likes: item.likes.filter((l: any) => l.user_id !== currentUser.id) }
            : item
        )
      );

      const { error } = await supabase
        .from('likes')
        .delete()
        .eq('user_id', currentUser.id)
        .eq('catch_id', catchId);
      
      if (error) {
        setFeedItems(prevItems => 
          prevItems.map(item => 
            item.id === catchId 
              ? { ...item, likes: [...(item.likes || []), { user_id: currentUser.id, catch_id: catchId }] }
              : item
          )
        );
        toast({ variant: "destructive", title: "Failed to unlike post" });
      }
    } else {
      setFeedItems(prevItems => 
        prevItems.map(item => 
          item.id === catchId 
            ? { ...item, likes: [...(item.likes || []), { user_id: currentUser.id, catch_id: catchId }] }
            : item
        )
      );

      const { error } = await supabase
        .from('likes')
        .insert([{ user_id: currentUser.id, catch_id: catchId }]);
      
      if (error) {
        setFeedItems(prevItems => 
          prevItems.map(item => 
            item.id === catchId 
              ? { ...item, likes: item.likes.filter((l: any) => l.user_id !== currentUser.id) }
              : item
          )
        );
        toast({ variant: "destructive", title: "Failed to like post" });
      } else {
        const catchItem = feedItems.find(item => item.id === catchId);
        if (catchItem?.user_id) {
          await checkAchievementsAfterLike(catchItem.user_id);
        }
        
        const { checkAndUnlockAchievements } = await import("@/utils/achievementTracker");
        const newAchievements = await checkAndUnlockAchievements(currentUser.id);
      }
    }
  };

  const handleSendComment = async (itemId: string, type: string) => {
    if (!commentText.trim()) {
      toast({ variant: "destructive", title: "Comment Required", description: "Please enter a comment" });
      return;
    }

    if (commentText.trim().length > 300) {
      toast({ variant: "destructive", title: "Too Long", description: "Comments must be 300 characters or less." });
      return;
    }
    
    if (!currentUser || !currentUser.id) {
      toast({ variant: "destructive", title: "Not Logged In", description: "Please log in to comment" });
      return;
    }

    try {
      const column = type === 'CATCH' ? 'catch_id' : 'activity_id';
      const { error } = await supabase.from('comments').insert([{
        user_id: currentUser.id,
        [column]: itemId,
        comment_text: commentText.trim()
      }]);

      if (error) throw error;
      
      setCommentText("");
      setActiveCommentId(null);
      
      await checkAchievementsAfterComment(currentUser.id);
      
      fetchUnifiedFeed(false);
      toast({ title: "Comment Posted!" });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Post Failed", description: error.message || "Could not post comment" });
    }
  };

  const handleDeletePost = async (itemId: string, itemType: string) => {
    if (!currentUser) return;
    
    const confirmDelete = window.confirm('Are you sure you want to delete this post?');
    if (!confirmDelete) return;

    const isAdmin = userProfile?.is_admin === true;

    try {
      if (itemType === 'CATCH') {
        let query = supabase.from('catches').delete().eq('id', itemId);
        if (!isAdmin) query = query.eq('user_id', currentUser.id);
        const { error } = await query;
        if (error) throw error;
        toast({ title: "Catch Deleted" });
      } else if (itemType === 'ACTIVITY') {
        let query = supabase.from('activities').delete().eq('id', itemId);
        if (!isAdmin) query = query.eq('user_id', currentUser.id);
        const { error } = await query;
        if (error) throw error;
        toast({ title: "Activity Deleted" });
      }

      setFeedItems(prevItems => prevItems.filter(item => item.id !== itemId));
    } catch (error: any) {
      toast({ 
        variant: "destructive", 
        title: "Delete Failed", 
        description: error.message 
      });
      fetchUnifiedFeed(false);
    }
  };

  const visibleItems = feedItems.filter(item => {
    if (feedFilter === 'friends') {
      return friendIds.includes(item.user_id) || item.user_id === currentUser?.id;
    }
    if (feedFilter === 'nearby' && userLocation) {
      if (item.latitude && item.longitude) {
        return getDistanceKm(userLocation.latitude, userLocation.longitude, item.latitude, item.longitude) <= 100;
      }
      return false;
    }
    return true;
  });

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
            Social Fishing Network
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            onClick={() => navigate("/tournaments")}
            variant="outline"
            size="sm"
            className="rounded-full font-black uppercase text-xs px-4 h-8"
          >
            Events
          </Button>
          
          {!currentUser && (
            <Button 
              onClick={() => navigate("/auth")}
              className="rounded-full bg-primary text-black font-black italic uppercase text-[10px] px-4 h-8 shadow-[0_0_15px_rgba(var(--primary),0.3)]"
            >
              <LogIn size={14} className="mr-2" /> Join
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

      {/* Feed filter pills */}
      <div className="flex gap-2 pb-1">
        {(['all', 'friends', 'nearby'] as FeedFilter[]).map(f => (
          <button
            key={f}
            onClick={() => setFeedFilter(f)}
            className={`flex-1 h-9 rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all ${
              feedFilter === f
                ? 'bg-primary text-black shadow-md'
                : 'bg-muted/60 text-muted-foreground hover:bg-muted'
            }`}
          >
            {f === 'all' ? '🌍 All' : f === 'friends' ? '👥 Friends' : '📍 Nearby'}
          </button>
        ))}
      </div>

      {visibleItems.length === 0 && !loading && (
        <div className="text-center py-16 text-muted-foreground space-y-2">
          <p className="text-4xl">{feedFilter === 'friends' ? '👥' : '📍'}</p>
          <p className="font-black uppercase text-sm">
            {feedFilter === 'friends' ? 'No catches from friends yet' : 'No catches near you yet'}
          </p>
          <p className="text-xs">
            {feedFilter === 'friends' ? 'Add friends to see their catches here' : 'Be the first to catch something nearby!'}
          </p>
        </div>
      )}

      {visibleItems.map((item, index) => {
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
                  priority={index < 3}
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
                       <MapPin size={10} /> {item.location_city || item.location_province || item.location_name || 'Ontario'}
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

                {/* Delete button - show for post owner OR admin */}
                {(currentUser?.id === item.user_id || userProfile?.is_admin === true) && (
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
