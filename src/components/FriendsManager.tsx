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

      // Get accepted friendships
      const { data: friendships } = await supabase
        .from('friendships')
        .select('*')
        .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
        .eq('status', 'accepted');

      if (!friendships) {
        setFriends([]);
        return;
      }

      // Get friend profiles
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

      // Get pending requests WHERE current user is the recipient
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
      // Search by display name
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

      // Check existing friendships
      const { data: existingFriendships } = await supabase
        .from('friendships')
        .select('friend_id, user_id, status')
        .or(`user_id.eq.${currentUserId},friend_id.eq.${currentUserId}`);

      // Mark profiles with friendship status
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
      searchUsers(); // Refresh results
    } catch (error: any) {
      toast({ 
        variant: "destructive", 
        title: "Failed to send request",
        description: error.message 
      });
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
      toast({ 
        variant: "destructive", 
        title: "Failed to accept",
        description: error.message 
      });
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
      toast({ 
        variant: "destructive", 
        title: "Failed to reject",
        description: error.message 
      });
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
      toast({ 
        variant: "destructive", 
        title: "Failed to remove friend",
        description: error.message 
      });
    }
  };

  return (
    <div className="fixed inset-[-50px] z-[200] bg-black overflow-hidden">
      <div className="absolute inset-0 bg-black/95 backdrop-blur-md" />
      
      <div className="relative h-screen w-screen overflow-y-auto">
        <div className="max-w-md mx-auto p-4 space-y-4 pb-8">
          {/* Header */}
          <div className="flex items-start justify-between pt-4 sticky top-0 bg-black z-10 pb-4">
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
              className="h-10 w-10 rounded-full hover:bg-white/10 transition-colors flex items-center justify-center"
            >
              <X size={24} className="text-white/70" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2">
            <Button
              onClick={() => setActiveTab('friends')}
              variant={activeTab === 'friends' ? 'default' : 'outline'}
              className="flex-1 font-black uppercase text-xs"
            >
              <Users size={14} className="mr-1" />
              Friends
            </Button>
            <Button
              onClick={() => setActiveTab('requests')}
              variant={activeTab === 'requests' ? 'default' : 'outline'}
              className="flex-1 font-black uppercase text-xs relative"
            >
              <UserPlus size={14} className="mr-1" />
              Requests
              {pendingRequests.length > 0 && (
                <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center bg-red-500 text-white text-[10px]">
                  {pendingRequests.length}
                </Badge>
              )}
            </Button>
            <Button
              onClick={() => setActiveTab('search')}
              variant={activeTab === 'search' ? 'default' : 'outline'}
              className="flex-1 font-black uppercase text-xs"
            >
              <Search size={14} className="mr-1" />
              Add
            </Button>
          </div>

          {/* Content */}
          {loading && (
            <div className="flex justify-center py-12">
              <Loader2 className="animate-spin text-primary" size={32} />
            </div>
          )}

          {/* Friends List */}
          {activeTab === 'friends' && !loading && (
            <div className="space-y-3">
              {friends.length === 0 ? (
                <Card className="p-12 text-center rounded-[32px]">
                  <Users className="mx-auto mb-3 text-muted-foreground" size={48} />
                  <p className="text-muted-foreground font-bold">No friends yet</p>
                  <p className="text-sm text-muted-foreground mt-2">Add friends to compete!</p>
                </Card>
              ) : (
                friends.map(friend => (
                  <Card key={friend.id} className="p-4 rounded-[24px]">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={friend.avatar_url} />
                        <AvatarFallback>{friend.display_name?.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-black uppercase text-sm">{friend.display_name}</p>
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
                        className="text-xs font-bold text-red-500 hover:text-red-600 hover:bg-red-500/10"
                      >
                        Remove
                      </Button>
                    </div>
                  </Card>
                ))
              )}
            </div>
          )}

          {/* Pending Requests */}
          {activeTab === 'requests' && !loading && (
            <div className="space-y-3">
              {pendingRequests.length === 0 ? (
                <Card className="p-12 text-center rounded-[32px]">
                  <UserPlus className="mx-auto mb-3 text-muted-foreground" size={48} />
                  <p className="text-muted-foreground font-bold">No pending requests</p>
                </Card>
              ) : (
                pendingRequests.map(request => (
                  <Card key={request.id} className="p-4 rounded-[24px]">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={request.profiles?.avatar_url} />
                        <AvatarFallback>{request.profiles?.display_name?.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-black uppercase text-sm">{request.profiles?.display_name}</p>
                        <p className="text-xs text-muted-foreground">Wants to be friends</p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => acceptFriendRequest(request.id)}
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 h-8 w-8 p-0"
                        >
                          <Check size={16} />
                        </Button>
                        <Button
                          onClick={() => rejectFriendRequest(request.id)}
                          size="sm"
                          variant="ghost"
                          className="text-red-500 hover:text-red-600 hover:bg-red-500/10 h-8 w-8 p-0"
                        >
                          <XCircle size={16} />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          )}

          {/* Search Users */}
          {activeTab === 'search' && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Search by username..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && searchUsers()}
                  className="flex-1"
                />
                <Button onClick={searchUsers} disabled={loading}>
                  <Search size={16} />
                </Button>
              </div>

              {searchResults.length > 0 && (
                <div className="space-y-3">
                  {searchResults.map(user => (
                    <Card key={user.id} className="p-4 rounded-[24px]">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={user.avatar_url} />
                          <AvatarFallback>{user.display_name?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-black uppercase text-sm">{user.display_name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Trophy size={12} className="text-primary" />
                            <p className="text-xs text-muted-foreground font-bold">
                              {user.total_points_earned || 0} pts
                            </p>
                          </div>
                        </div>
                        {user.friendshipStatus === 'accepted' ? (
                          <Badge className="bg-green-500/20 text-green-500 border-none">
                            Friends
                          </Badge>
                        ) : user.friendshipStatus === 'pending' ? (
                          <Badge className="bg-yellow-500/20 text-yellow-500 border-none">
                            Pending
                          </Badge>
                        ) : (
                          <Button
                            onClick={() => sendFriendRequest(user.id)}
                            size="sm"
                            className="font-black uppercase text-xs"
                          >
                            <UserPlus size={14} className="mr-1" />
                            Add
                          </Button>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FriendsManager;
