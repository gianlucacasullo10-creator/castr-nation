import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { 
  X, 
  Search, 
  UserPlus, 
  Users, 
  Check, 
  XCircle, 
  Loader2,
  Trophy
} from "lucide-react";

interface FriendsManagerProps {
  onClose: () => void;
}

const FriendsManager = ({ onClose }: FriendsManagerProps) => {
  const [activeTab, setActiveTab] = useState<'friends' | 'requests' | 'search'>('friends');
  const [friends, setFriends] = useState<any[]>([]);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchCurrentUser();
    if (activeTab === 'friends') fetchFriends();
    if (activeTab === 'requests') fetchPendingRequests();

    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [activeTab]);

  const fetchCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUserId(user?.id || null);
  };

  const fetchFriends = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: friendships } = await supabase
        .from('friendships')
        .select('*')
        .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
        .eq('status', 'accepted');

      if (!friendships || friendships.length === 0) {
        setFriends([]);
        return;
      }

      const friendIds = friendships.map(f => 
        f.user_id === user.id ? f.friend_id : f.user_id
      );

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url, total_points_earned')
        .in('id', friendIds);

      setFriends(profiles || []);
    } catch (error) {
      console.error('Error fetching friends:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingRequests = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: requests } = await supabase
        .from('friendships')
        .select('*, profiles!friendships_user_id_fkey(id, display_name, avatar_url)')
        .eq('friend_id', user.id)
        .eq('status', 'pending');

      setPendingRequests(requests || []);
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const searchUsers = async () => {
    if (!searchQuery.trim() || !currentUserId) return;
    
    setLoading(true);
    try {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url, total_points_earned')
        .ilike('display_name', `%${searchQuery}%`)
        .neq('id', currentUserId)
        .limit(20);

      if (!profiles) {
        setSearchResults([]);
        return;
      }

      const { data: existingFriendships } = await supabase
        .from('friendships')
        .select('friend_id, user_id, status')
        .or(`user_id.eq.${currentUserId},friend_id.eq.${currentUserId}`);

      const enrichedProfiles = profiles.map(profile => {
        const friendship = existingFriendships?.find(f => 
          f.user_id === profile.id || f.friend_id === profile.id
        );
        return {
          ...profile,
          friendshipStatus: friendship?.status || null
        };
      });

      setSearchResults(enrichedProfiles);
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendFriendRequest = async (friendId: string) => {
    if (!currentUserId) return;
    try {
      const { error } = await supabase
        .from('friendships')
        .insert({
          user_id: currentUserId,
          friend_id: friendId,
          status: 'pending'
        });
      if (error) throw error;
      toast({ title: "Friend Request Sent!" });
      searchUsers();
    } catch (error: any) {
      toast({ variant: "destructive", title: "Failed to send request", description: error.message });
    }
  };

  const acceptFriendRequest = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('friendships')
        .update({ status: 'accepted' })
        .eq('id', requestId);
      if (error) throw error;
      toast({ title: "Friend Request Accepted!" });
      fetchPendingRequests();
    } catch (error: any) {
      toast({ variant: "destructive", title: "Failed to accept", description: error.message });
    }
  };

  const rejectFriendRequest = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('friendships')
        .delete()
        .eq('id', requestId);
      if (error) throw error;
      toast({ title: "Friend Request Rejected" });
      fetchPendingRequests();
    } catch (error: any) {
      toast({ variant: "destructive", title: "Failed to reject", description: error.message });
    }
  };

  const removeFriend = async (friendId: string) => {
    if (!currentUserId) return;
    try {
      const { error } = await supabase
        .from('friendships')
        .delete()
        .or(`and(user_id.eq.${currentUserId},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${currentUserId})`);
      if (error) throw error;
      toast({ title: "Friend Removed" });
      fetchFriends();
    } catch (error: any) {
      toast({ variant: "destructive", title: "Failed to remove friend", description: error.message });
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-md flex justify-center overflow-hidden">
      <div className="relative h-dvh w-full max-w-[390px] overflow-y-auto px-4">
        
        <div className="flex flex-col space-y-4 pb-12 pt-4">
          <div className="flex items-start justify-between sticky top-0 bg-black/50 backdrop-blur-md z-20 py-4">
            <div className="flex-1">
              <h2 className="text-3xl font-black italic uppercase text-primary tracking-tighter leading-none">
                Friends
              </h2>
              <p className="text-xs font-bold text-muted-foreground mt-1">
                {friends.length} Friends
              </p>
            </div>
            <button 
              onClick={onClose}
              className="h-10 w-10 rounded-full bg-white/5 hover:bg-white/10 transition-colors flex items-center justify-center"
            >
              <X size={24} className="text-white/70" />
            </button>
          </div>

          <div className="flex gap-2 sticky top-[84px] bg-black/50 backdrop-blur-md z-20 py-2">
            {(['friends', 'requests', 'search'] as const).map((tab) => (
              <Button
                key={tab}
                onClick={() => setActiveTab(tab)}
                variant={activeTab === tab ? 'default' : 'outline'}
                className="flex-1 font-black uppercase text-[10px] h-9 relative"
              >
                {tab === 'friends' && <Users size={14} className="mr-1" />}
                {tab === 'requests' && <UserPlus size={14} className="mr-1" />}
                {tab === 'search' && <Search size={14} className="mr-1" />}
                {tab === 'friends' ? 'Friends' : tab === 'requests' ? 'Requests' : 'Add'}
                {tab === 'requests' && pendingRequests.length > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center bg-red-500 text-white text-[8px] animate-pulse">
                    {pendingRequests.length}
                  </Badge>
                )}
              </Button>
            ))}
          </div>

          <div className="min-h-[200px]">
            {loading && (
              <div className="flex justify-center py-12">
                <Loader2 className="animate-spin text-primary" size={32} />
              </div>
            )}

            {activeTab === 'friends' && !loading && (
              <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                {friends.length === 0 ? (
                  <Card className="p-12 text-center rounded-[32px] bg-white/5 border-dashed border-white/10">
                    <Users className="mx-auto mb-3 text-muted-foreground/50" size={48} />
                    <p className="text-muted-foreground font-bold">No friends yet</p>
                  </Card>
                ) : (
                  friends.map(friend => (
                    <Card key={friend.id} className="p-4 rounded-[24px] bg-white/5 border-white/10">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12 border-2 border-primary/20">
                          <AvatarImage src={friend.avatar_url} />
                          <AvatarFallback className="bg-primary/10 text-primary font-black">
                            {friend.display_name?.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-black uppercase text-sm text-white">{friend.display_name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Trophy size={12} className="text-primary" />
                            <p className="text-xs text-muted-foreground font-bold">
                              {friend.total_points_earned || 0} pts
                            </p>
                          </div>
                        </div>
                        <Button
                          onClick={() => removeFriend(friend.id)}
                          variant="ghost"
                          size="sm"
                          className="text-[10px] font-black uppercase text-red-500 h-7"
                        >
                          Remove
                        </Button>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            )}

            {activeTab === 'requests' && !loading && (
              <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                {pendingRequests.length === 0 ? (
                  <Card className="p-12 text-center rounded-[32px] bg-white/5 border-dashed border-white/10">
                    <UserPlus className="mx-auto mb-3 text-muted-foreground/50" size={48} />
                    <p className="text-muted-foreground font-bold">Inbox empty</p>
                  </Card>
                ) : (
                  pendingRequests.map(request => (
                    <Card key={request.id} className="p-4 rounded-[24px] bg-white/5 border-white/10">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={request.profiles?.avatar_url} />
                          <AvatarFallback>{request.profiles?.display_name?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-black uppercase text-sm text-white">{request.profiles?.display_name}</p>
                          <p className="text-[10px] text-muted-foreground uppercase font-bold">Wants to join</p>
                        </div>
                        <div className="flex gap-2">
                          <Button onClick={() => acceptFriendRequest(request.id)} size="sm" className="bg-green-600 h-8 w-8 p-0 rounded-full">
                            <Check size={16} />
                          </Button>
                          <Button onClick={() => rejectFriendRequest(request.id)} size="sm" variant="ghost" className="text-red-500 h-8 w-8 p-0 rounded-full">
                            <XCircle size={16} />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            )}

            {activeTab === 'search' && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="flex gap-2">
                  <Input
                    placeholder="Search username..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && searchUsers()}
                    {/* FIXED: Darker background, brighter text, and custom placeholder color */}
                    className="flex-1 bg-black/40 border-white/20 text-white placeholder:text-white/40 uppercase text-xs font-black h-12"
                  />
                  <Button onClick={searchUsers} disabled={loading} className="h-12 px-6">
                    <Search size={18} />
                  </Button>
                </div>

                <div className="space-y-3">
                  {searchResults.map(user => (
                    <Card key={user.id} className="p-4 rounded-[24px] bg-white/5 border-white/10">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12 border-2 border-white/10">
                          <AvatarImage src={user.avatar_url} />
                          <AvatarFallback className="bg-white/5 text-white">{user.display_name?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          {/* FIXED: Name is now white and bold for maximum visibility */}
                          <p className="font-black uppercase text-sm text-white tracking-wide">
                            {user.display_name}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Trophy size={12} className="text-primary" />
                            <p className="text-xs text-muted-foreground font-bold">
                              {user.total_points_earned || 0} pts
                            </p>
                          </div>
                        </div>
                        {user.friendshipStatus === 'accepted' ? (
                          <Badge className="bg-green-500/20 text-green-500 border-none uppercase text-[8px] font-black">Friends</Badge>
                        ) : user.friendshipStatus === 'pending' ? (
                          <Badge className="bg-yellow-500/20 text-yellow-500 border-none uppercase text-[8px] font-black">Pending</Badge>
                        ) : (
                          <Button onClick={() => sendFriendRequest(user.id)} size="sm" className="font-black uppercase text-[10px] h-8 px-4 rounded-full">
                            <UserPlus size={12} className="mr-1" />
                            Add
                          </Button>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FriendsManager;
