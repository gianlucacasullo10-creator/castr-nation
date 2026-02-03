import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Users, 
  ChevronLeft, 
  Swords, 
  MapPin, 
  Loader2, 
  Crown, 
  Trophy, 
  MessageSquare, 
  Send,
  Settings,
  Camera,
  Check,
  X,
  Timer,
  Plus,
  LogOut
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { getBattleTier, BATTLE_TIERS } from "@/utils/battleTiers";

const Clubs = () => {
  const navigate = useNavigate();
  const [clubs, setClubs] = useState<any[]>([]);
  const [selectedClub, setSelectedClub] = useState<any>(null);
  const [clubMembers, setClubMembers] = useState<any[]>([]);
  const [isMember, setIsMember] = useState(false);
  const [loading, setLoading] = useState(true);
  const [totalPoints, setTotalPoints] = useState(0);
  const [regionalRank, setRegionalRank] = useState(1);
  const [view, setView] = useState<'INFO' | 'CHAT' | 'BATTLE'>('INFO');
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editRegion, setEditRegion] = useState("");

  // Create club state
  const [showCreateClub, setShowCreateClub] = useState(false);
  const [newClubName, setNewClubName] = useState("");
  const [newClubRegion, setNewClubRegion] = useState("");
  const [creatingClub, setCreatingClub] = useState(false);
  
  // Battle state
  const [activeBattle, setActiveBattle] = useState<any>(null);
  const [battleLeaderboard, setBattleLeaderboard] = useState<any[]>([]);
  const [timeRemaining, setTimeRemaining] = useState("");
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const BATTLE_THRESHOLD = 2000;

  const fetchActiveBattle = async () => {
    const { data } = await supabase
      .from('club_battles')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (data) {
      setActiveBattle(data);
      fetchBattleLeaderboard(data.id);
      calculateTimeRemaining(data.end_date);
    }
  };

  const calculateTimeRemaining = (endDate: string) => {
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const end = new Date(endDate).getTime();
      const distance = end - now;

      if (distance < 0) {
        clearInterval(interval);
        setTimeRemaining("Battle Ended");
        return;
      }

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));

      setTimeRemaining(`${days}d ${hours}h ${minutes}m`);
    }, 1000);

    return () => clearInterval(interval);
  };

  const fetchBattleLeaderboard = async (battleId: string) => {
    // Get all participants
    const { data: participants } = await supabase
      .from('club_battle_participants')
      .select('*, clubs(*)')
      .eq('battle_id', battleId)
      .order('total_points', { ascending: false });

    if (!participants) return;

    // Calculate current points for each club
    const updatedParticipants = await Promise.all(
      participants.map(async (p) => {
        const { data: members } = await supabase
          .from('club_members')
          .select('user_id')
          .eq('club_id', p.club_id);

        const memberIds = members?.map(m => m.user_id) || [];

        // Get catches during battle period
        const { data: catches } = await supabase
          .from('catches')
          .select('points')
          .in('user_id', memberIds)
          .gte('created_at', activeBattle.start_date)
          .lte('created_at', activeBattle.end_date);

        const currentPoints = catches?.reduce((sum, c) => sum + (c.points || 0), 0) || 0;

        return {
          ...p,
          total_points: currentPoints
        };
      })
    );

    // Sort by points and assign ranks
    updatedParticipants.sort((a, b) => b.total_points - a.total_points);
    updatedParticipants.forEach((p, index) => {
      p.rank = index + 1;
    });

    setBattleLeaderboard(updatedParticipants);
  };

  const fetchClubs = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUser(user);
    const { data } = await supabase.from('clubs').select('*');
    setClubs(data || []);
    await fetchActiveBattle();
    setLoading(false);
  };

  const createClub = async () => {
    if (!currentUser) {
      toast({ variant: "destructive", title: "Login Required", description: "Sign in to create a club" });
      return;
    }
    if (!newClubName.trim() || !newClubRegion.trim()) {
      toast({ variant: "destructive", title: "Missing Info", description: "Please enter a club name and region" });
      return;
    }

    setCreatingClub(true);
    try {
      // Create the club
      const { data: newClub, error: clubError } = await supabase
        .from('clubs')
        .insert([{
          name: newClubName.trim(),
          region: newClubRegion.trim(),
          created_by: currentUser.id
        }])
        .select()
        .single();

      if (clubError) throw clubError;

      // Auto-join the creator to the club
      const { error: memberError } = await supabase
        .from('club_members')
        .insert([{
          club_id: newClub.id,
          user_id: currentUser.id
        }]);

      if (memberError) throw memberError;

      toast({ title: "Club Created! 🎉", description: `${newClubName} is ready to compete!` });
      
      // Reset form and refresh
      setNewClubName("");
      setNewClubRegion("");
      setShowCreateClub(false);
      fetchClubs();

      // Open the new club
      setTimeout(() => fetchClubDetails(newClub), 500);

    } catch (error: any) {
      toast({ variant: "destructive", title: "Create Failed", description: error.message });
    } finally {
      setCreatingClub(false);
    }
  };

  const joinClub = async () => {
    if (!currentUser || !selectedClub) return;
    try {
      const { error } = await supabase
        .from('club_members')
        .insert([{ club_id: selectedClub.id, user_id: currentUser.id }]);
      if (error) throw error;
      setIsMember(true);
      fetchClubDetails(selectedClub);
      toast({ title: "SQUAD JOINED", description: "Welcome to the ranks." });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Join Failed", description: error.message });
    }
  };

  const leaveClub = async () => {
    if (!currentUser || !selectedClub) return;
    try {
      const { error } = await supabase
        .from('club_members')
        .delete()
        .eq('club_id', selectedClub.id)
        .eq('user_id', currentUser.id);
      if (error) throw error;
      setIsMember(false);
      toast({ title: "FREE AGENT", description: "You have left the club." });
      // Go back to club list
      setSelectedClub(null);
      setView('INFO');
      fetchClubs();
    } catch (error: any) {
      toast({ variant: "destructive", title: "Action Failed", description: error.message });
    }
  };

  const handleUserClick = (userId: string) => {
    navigate(`/profile/${userId}`);
  };

  const handleClubLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = event.target.files?.[0];
      if (!file || !selectedClub) return;
      const fileExt = file.name.split('.').pop();
      const fileName = `club-${selectedClub.id}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, file);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName);
      const { error: dbError } = await supabase.from('clubs').update({ image_url: publicUrl }).eq('id', selectedClub.id).select();
      if (dbError) throw dbError;

      setSelectedClub({ ...selectedClub, image_url: publicUrl });
      setClubs(prev => prev.map(c => c.id === selectedClub.id ? { ...c, image_url: publicUrl } : c));
      toast({ title: "Club Identity Saved!" });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Save Failed", description: error.message });
    }
  };

  const updateClubDetails = async () => {
    try {
      const { error } = await supabase.from('clubs').update({ name: editName, region: editRegion }).eq('id', selectedClub.id);
      if (error) throw error;
      setSelectedClub({ ...selectedClub, name: editName, region: editRegion });
      setClubs(prev => prev.map(c => c.id === selectedClub.id ? { ...c, name: editName, region: editRegion } : c));
      setIsEditing(false);
      toast({ title: "Club Details Updated!" });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Update Failed", description: error.message });
    }
  };

  const fetchMessages = async (clubId: string) => {
    const { data } = await supabase.from('club_messages').select('*, profiles(display_name, avatar_url)').eq('club_id', clubId).order('created_at', { ascending: true });
    setMessages(data || []);
    setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  useEffect(() => {
    if (!selectedClub || view !== 'CHAT') return;
    const channel = supabase.channel(`club_chat_${selectedClub.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'club_messages', filter: `club_id=eq.${selectedClub.id}` }, () => {
        fetchMessages(selectedClub.id);
      }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [selectedClub, view]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !currentUser) return;
    try {
      const { error } = await supabase.from('club_messages').insert([{ club_id: selectedClub.id, user_id: currentUser.id, message_text: newMessage }]);
      if (error) throw error;
      setNewMessage("");
      fetchMessages(selectedClub.id);
    } catch (err: any) {
      toast({ variant: "destructive", title: "Chat Failed", description: err.message });
    }
  };

  const fetchClubDetails = async (club: any) => {
    setLoading(true);
    const { data: allMemberships } = await supabase.from('club_members').select('user_id, club_id');
    const { data: allCatches } = await supabase.from('catches').select('user_id, points');
    
    const clubScoreMap: Record<string, number> = {};
    allMemberships?.forEach(m => {
      const userPoints = allCatches?.filter(c => c.user_id === m.user_id).reduce((sum, c) => sum + (c.points || 0), 0) || 0;
      clubScoreMap[m.club_id] = (clubScoreMap[m.club_id] || 0) + userPoints;
    });

    const regionalClubs = clubs.filter(c => c.region === club.region).map(c => ({ ...c, score: clubScoreMap[c.id] || 0 })).sort((a, b) => b.score - a.score);
    const rank = regionalClubs.findIndex(c => c.id === club.id) + 1;
    setRegionalRank(rank);

    const currentClubMemberIds = allMemberships?.filter(m => m.club_id === club.id).map(m => m.user_id) || [];
    setIsMember(currentClubMemberIds.includes(currentUser?.id || ''));

    const { data: profiles } = await supabase.from('profiles').select('*');
    const memberStats = (profiles || []).filter(p => currentClubMemberIds.includes(p.id))
      .map(p => ({
        ...p,
        totalPoints: (allCatches || []).filter(c => c.user_id === p.id).reduce((acc, curr) => acc + (curr.points || 0), 0)
      })).sort((a, b) => b.totalPoints - a.totalPoints);

    setTotalPoints(clubScoreMap[club.id] || 0);
    setClubMembers(memberStats);
    setSelectedClub(club);
    setEditName(club.name);
    setEditRegion(club.region);
    setLoading(false);
  };

  useEffect(() => { fetchClubs(); }, []);

  if (loading && !selectedClub) return (
    <div className="flex h-[80vh] flex-col items-center justify-center space-y-4">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="font-black italic uppercase text-primary tracking-tighter">Syncing Clubhouse...</p>
    </div>
  );

  const battleTier = getBattleTier(selectedClub?.battle_wins || 0);

  return (
    <div className="pb-24 pt-4 px-4 max-w-md mx-auto space-y-6">
      {!selectedClub ? (
        <>
          {/* Header - Centered like Tournaments */}
          <div className="text-center">
            <h1 className="text-4xl font-black italic tracking-tighter text-primary uppercase leading-none">
              Clubs
            </h1>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mt-1">
              Join a squad & compete together
            </p>
          </div>
          
          {/* Active Battle Card - Liquid Glass Style */}
          {activeBattle && (
            <Card className="relative rounded-[32px] overflow-hidden border-2 border-white/20 bg-white/[0.08] backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.12)]">
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-purple-500/20 pointer-events-none" />
              
              <div className="relative p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/20 p-2 rounded-xl">
                      <Swords className="text-primary" size={20} />
                    </div>
                    <h3 className="text-lg font-black italic uppercase text-primary">Active Battle</h3>
                  </div>
                  <Badge className="bg-primary/20 text-primary border-primary/30 font-black text-[9px]">
                    <Timer size={10} className="mr-1" /> {timeRemaining}
                  </Badge>
                </div>
                <p className="text-gray-600 text-sm font-bold mb-4">{activeBattle.battle_name}</p>
                <Button 
                  onClick={() => {
                    if (!currentUser) {
                      toast({ title: "Login Required", description: "Sign in to view the battle leaderboard" });
                      navigate("/auth");
                      return;
                    }
                    if (clubs.length > 0) {
                      fetchClubDetails(clubs[0]);
                      setTimeout(() => {
                        setView('BATTLE');
                        fetchBattleLeaderboard(activeBattle.id);
                      }, 500);
                    }
                  }}
                  className="w-full bg-primary hover:bg-primary/90 text-black font-black uppercase text-xs h-12 rounded-2xl"
                >
                  View Leaderboard
                </Button>
              </div>
            </Card>
          )}

          {/* Info Card */}
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-2 border-primary/30 p-6 rounded-[32px]">
            <div className="flex items-start gap-4">
              <div className="bg-primary/20 p-3 rounded-2xl shrink-0">
                <Users className="text-primary" size={24} />
              </div>
              <div>
                <h3 className="font-black uppercase text-sm mb-1">Team Up</h3>
                <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                  Join a club to combine points, compete in battles, and chat with fellow anglers!
                </p>
              </div>
            </div>
          </Card>

          {/* Create Club Button */}
          {!showCreateClub ? (
            <Button 
              onClick={() => {
                if (!currentUser) {
                  toast({ title: "Login Required", description: "Sign in to create a club" });
                  navigate("/auth");
                  return;
                }
                setShowCreateClub(true);
              }}
              variant="outline"
              className="w-full h-14 rounded-2xl border-2 border-dashed border-primary/30 hover:border-primary/50 hover:bg-primary/5 font-black uppercase text-xs text-primary"
            >
              <Plus size={18} className="mr-2" />
              Create New Club
            </Button>
          ) : (
            <Card className="border-2 border-primary/30 rounded-[32px] p-6 space-y-4">
              <h3 className="font-black uppercase text-sm text-center">Create Your Club</h3>
              <Input
                placeholder="Club Name"
                value={newClubName}
                onChange={(e) => setNewClubName(e.target.value)}
                className="h-12 rounded-2xl bg-muted border-none font-bold text-center"
              />
              <Input
                placeholder="Region (e.g. Ontario, Toronto)"
                value={newClubRegion}
                onChange={(e) => setNewClubRegion(e.target.value)}
                className="h-12 rounded-2xl bg-muted border-none font-bold text-center"
              />
              <div className="flex gap-2">
                <Button
                  onClick={() => setShowCreateClub(false)}
                  variant="outline"
                  className="flex-1 h-12 rounded-2xl font-black uppercase text-xs"
                >
                  Cancel
                </Button>
                <Button
                  onClick={createClub}
                  disabled={creatingClub || !newClubName.trim() || !newClubRegion.trim()}
                  className="flex-1 h-12 rounded-2xl bg-primary hover:bg-primary/90 text-black font-black uppercase text-xs"
                >
                  {creatingClub ? <Loader2 className="animate-spin" size={16} /> : "Create"}
                </Button>
              </div>
            </Card>
          )}

          {/* Clubs List */}
          <div className="space-y-3">
            {clubs.length === 0 ? (
              <Card className="p-8 text-center rounded-[32px] border-2 border-dashed border-muted">
                <Users className="mx-auto mb-3 text-muted-foreground/50" size={48} />
                <p className="text-muted-foreground font-bold">No clubs yet</p>
                <p className="text-xs text-muted-foreground mt-1">Be the first to create one!</p>
              </Card>
            ) : (
              clubs.map((club) => {
                const tier = getBattleTier(club.battle_wins || 0);
                return (
                  <Card 
                    key={club.id} 
                    onClick={() => fetchClubDetails(club)} 
                    className="border-2 border-muted rounded-[24px] bg-card p-5 cursor-pointer hover:scale-[1.02] hover:border-primary/30 transition-all"
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-4">
                        <img src={club.image_url || "/placeholder.svg"} className="h-14 w-14 rounded-2xl object-cover border-2 border-primary/20" />
                        <div className="space-y-1 text-left">
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg font-black italic uppercase leading-none tracking-tighter">{club.name}</h3>
                            {club.battle_wins > 0 && (
                              <Badge className={`${tier.bgColor} ${tier.color} border-none font-black text-[8px] px-2`}>
                                {tier.icon} {club.battle_wins}W
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-[10px] font-black uppercase text-primary">
                            <MapPin size={12} /> {club.region}
                          </div>
                        </div>
                      </div>
                      <Users className="text-primary/40" size={24} />
                    </div>
                  </Card>
                );
              })
            )}
          </div>
        </>
      ) : (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
          {/* Back Button & View Tabs */}
          <div className="flex justify-between items-center">
            <button 
              onClick={() => { setSelectedClub(null); setView('INFO'); setIsEditing(false); }} 
              className="flex items-center gap-2 text-primary font-black uppercase italic text-xs"
            >
              <ChevronLeft size={16} /> Directory
            </button>
            <div className="flex gap-2">
              {isMember && view === 'INFO' && (
                <>
                  <Button 
                    variant="outline" 
                    onClick={() => { setView('CHAT'); fetchMessages(selectedClub.id); }} 
                    className="text-primary font-black uppercase text-[10px] italic h-9 rounded-xl border-primary/30"
                  >
                    <MessageSquare size={14} className="mr-1" /> Chat
                  </Button>
                  {activeBattle && (
                    <Button 
                      variant="outline" 
                      onClick={() => { setView('BATTLE'); fetchBattleLeaderboard(activeBattle.id); }} 
                      className="text-primary font-black uppercase text-[10px] italic h-9 rounded-xl border-primary/30"
                    >
                      <Swords size={14} className="mr-1" /> Battle
                    </Button>
                  )}
                </>
              )}
              {view !== 'INFO' && (
                <Button 
                  variant="outline" 
                  onClick={() => setView('INFO')} 
                  className="text-primary font-black uppercase text-[10px] italic h-9 rounded-xl border-primary/30"
                >
                  Info
                </Button>
              )}
            </div>
          </div>

          {/* INFO VIEW */}
          {view === 'INFO' && (
            <div className="space-y-6">
              {/* Club Header */}
              <div className="flex flex-col items-center">
                <div className="relative group mb-4">
                   <img src={selectedClub.image_url || "/placeholder.svg"} className="h-24 w-24 rounded-[32px] object-cover border-4 border-primary/20 shadow-2xl" />
                   {currentUser?.id === selectedClub.created_by && (
                      <label className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-[32px] opacity-0 group-hover:opacity-100 cursor-pointer transition-all">
                        <Camera className="text-white" size={20} />
                        <input type="file" className="hidden" accept="image/*" onChange={handleClubLogoUpload} />
                      </label>
                   )}
                </div>
                <div className="w-full text-center">
                  {isEditing ? (
                    <div className="space-y-2">
                      <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="h-10 bg-muted border-primary font-black uppercase italic text-center text-xl rounded-2xl" />
                      <Input value={editRegion} onChange={(e) => setEditRegion(e.target.value)} className="h-8 bg-muted border-none font-black uppercase italic text-center text-xs text-primary rounded-2xl" />
                      <div className="flex justify-center gap-2 mt-2">
                        <Button size="sm" className="bg-primary text-black rounded-xl" onClick={updateClubDetails}><Check size={14} className="mr-1"/> Save</Button>
                        <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)}><X size={14} className="mr-1"/> Cancel</Button>
                      </div>
                    </div>
                  ) : (
                    <div className="relative group">
                      <h1 className="text-3xl font-black italic uppercase tracking-tighter leading-none">{selectedClub.name}</h1>
                      <div className="flex justify-center gap-2 mt-3 flex-wrap">
                        <Badge className="bg-primary/10 text-primary border-none font-black text-[9px] uppercase italic tracking-widest">{selectedClub.region}</Badge>
                        <Badge className={`${regionalRank === 1 ? "bg-yellow-500 text-black" : "bg-muted text-muted-foreground"} border-none font-black text-[9px] uppercase italic px-3`}>
                          <Trophy size={10} className="mr-1" /> Rank #{regionalRank}
                        </Badge>
                        {selectedClub.battle_wins > 0 && (
                          <Badge className={`${battleTier.bgColor} ${battleTier.color} ${battleTier.borderColor} border font-black text-[9px] uppercase px-3`}>
                            {battleTier.icon} {battleTier.name}
                          </Badge>
                        )}
                      </div>
                      {currentUser?.id === selectedClub.created_by && (
                        <button onClick={() => setIsEditing(true)} className="absolute -right-2 top-0 p-2 text-muted-foreground hover:text-primary transition-colors">
                          <Settings size={16} />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Battle Tier Card */}
              {selectedClub.battle_wins > 0 && (
                <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-2 border-primary/30 rounded-[32px] p-6">
                  <div className="text-center">
                    <p className="text-4xl mb-2">{battleTier.icon}</p>
                    <h3 className="text-2xl font-black italic uppercase text-primary">{battleTier.name} Tier</h3>
                    <p className="text-sm font-bold text-muted-foreground mt-2">{selectedClub.battle_wins} Battle Victories</p>
                    <div className="mt-4 space-y-1">
                      {BATTLE_TIERS.map((tier, index) => {
                        if (index === BATTLE_TIERS.length - 1) return null;
                        const nextTier = BATTLE_TIERS[index + 1];
                        const isCurrentTier = selectedClub.battle_wins >= tier.minWins && selectedClub.battle_wins < nextTier.minWins;
                        
                        if (isCurrentTier) {
                          const progress = ((selectedClub.battle_wins - tier.minWins) / (nextTier.minWins - tier.minWins)) * 100;
                          return (
                            <div key={tier.name}>
                              <div className="flex justify-between text-[10px] font-black uppercase mb-1">
                                <span className="text-primary">{tier.name}</span>
                                <span className="text-muted-foreground">{nextTier.name}</span>
                              </div>
                              <div className="h-2 bg-muted rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-gradient-to-r from-primary to-cyan-400 transition-all duration-500"
                                  style={{ width: `${progress}%` }}
                                />
                              </div>
                              <p className="text-[9px] text-muted-foreground mt-1">
                                {nextTier.minWins - selectedClub.battle_wins} wins to {nextTier.name}
                              </p>
                            </div>
                          );
                        }
                        return null;
                      })}
                    </div>
                  </div>
                </Card>
              )}

              {/* Total Club Power Card */}
              <Card className={`relative overflow-hidden rounded-[32px] p-8 transition-all duration-500 ${totalPoints >= BATTLE_THRESHOLD ? 'bg-primary' : 'bg-gradient-to-br from-primary/10 to-primary/5 border-2 border-primary/30'}`}>
                <div className="relative z-10 text-left">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <p className={`text-[10px] font-black uppercase tracking-widest leading-none ${totalPoints >= BATTLE_THRESHOLD ? 'text-black/60' : 'text-muted-foreground'}`}>Total Club Power</p>
                      <p className={`text-5xl font-black italic tracking-tighter mt-2 ${totalPoints >= BATTLE_THRESHOLD ? 'text-black' : 'text-primary'}`}>{totalPoints.toLocaleString()}</p>
                    </div>
                    <div className={`p-3 rounded-2xl ${totalPoints >= BATTLE_THRESHOLD ? 'bg-black/20' : 'bg-primary/20'}`}>
                      <Swords size={32} className={totalPoints >= BATTLE_THRESHOLD ? "text-black" : "text-primary"} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-[10px] font-black uppercase">
                      <span className={totalPoints >= BATTLE_THRESHOLD ? 'text-black/60' : 'text-muted-foreground'}>Progress</span>
                      <span className={totalPoints >= BATTLE_THRESHOLD ? 'text-black' : 'text-primary'}>{Math.min(100, Math.round((totalPoints / BATTLE_THRESHOLD) * 100))}%</span>
                    </div>
                    <div className={`h-3 rounded-full overflow-hidden ${totalPoints >= BATTLE_THRESHOLD ? 'bg-black/20' : 'bg-muted'}`}>
                      <div className={`h-full transition-all duration-1000 rounded-full ${totalPoints >= BATTLE_THRESHOLD ? 'bg-black' : 'bg-gradient-to-r from-primary to-cyan-400'}`} style={{ width: `${Math.min(100, (totalPoints / BATTLE_THRESHOLD) * 100)}%` }} />
                    </div>
                  </div>
                </div>
              </Card>

              {/* Join/Leave Button */}
              <div className="px-2 space-y-2">
                {!isMember ? (
                  <Button onClick={joinClub} className="w-full h-14 rounded-2xl bg-primary text-black font-black uppercase italic hover:bg-primary/90 transition-all">
                    <Users size={18} className="mr-2" /> Join Squad
                  </Button>
                ) : (
                  currentUser?.id !== selectedClub.created_by && (
                    <Button 
                      variant="outline" 
                      onClick={leaveClub} 
                      className="w-full h-12 rounded-2xl border-2 border-red-500/30 text-red-500 hover:bg-red-500/10 font-black uppercase italic text-xs"
                    >
                      <LogOut size={16} className="mr-2" /> Leave Club
                    </Button>
                  )
                )}
              </div>

              {/* Member Rankings */}
              <div className="space-y-3">
                <h3 className="text-left text-[11px] font-black uppercase italic tracking-widest text-muted-foreground ml-2">Member Rankings</h3>
                {clubMembers.length === 0 ? (
                  <Card className="p-8 text-center rounded-[24px] border-2 border-dashed border-muted">
                    <Users className="mx-auto mb-3 text-muted-foreground/50" size={32} />
                    <p className="text-muted-foreground font-bold text-sm">No members yet</p>
                  </Card>
                ) : (
                  clubMembers.map((member, index) => (
                    <Card 
                      key={member.id} 
                      onClick={() => handleUserClick(member.id)}
                      className="flex items-center justify-between p-4 rounded-[20px] border-2 border-muted cursor-pointer hover:border-primary/30 transition-all"
                    >
                      <div className="flex items-center gap-4 text-left">
                        <div className="flex flex-col items-center w-6">
                           {index === 0 ? <Crown size={14} className="text-yellow-500" /> : <span className="text-xs font-black text-muted-foreground">{index + 1}</span>}
                        </div>
                        <Avatar className="h-12 w-12 border-2 border-primary/20">
                          <AvatarImage src={member.avatar_url} />
                          <AvatarFallback className="bg-primary/10 text-primary font-black">{member.display_name?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-black italic uppercase leading-none tracking-tight">{member.display_name}</p>
                          <p className="text-[9px] font-bold text-muted-foreground uppercase mt-1 tracking-tighter">{member.equipped_title || "Castr"}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-black italic text-primary leading-none">{member.totalPoints.toLocaleString()}</p>
                        <p className="text-[8px] font-black uppercase text-muted-foreground mt-1">Pts</p>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </div>
          )}

          {/* CHAT VIEW */}
          {view === 'CHAT' && (
            <div className="flex flex-col h-[65vh] animate-in fade-in zoom-in-95 duration-300">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-left text-2xl font-black italic uppercase tracking-tighter text-primary">Club Chat</h2>
                <Badge variant="outline" className="text-[8px] border-primary/20 text-primary/60 font-black px-2 py-0 rounded-lg">LIVE</Badge>
              </div>
              <div className="flex-1 overflow-y-auto space-y-4 pb-4 pr-2 scrollbar-hide">
                {messages.map((msg) => (
                  <div key={msg.id} className="flex flex-col text-left">
                    <span className="text-[9px] font-black uppercase text-primary italic ml-3 mb-1 opacity-70">{msg.profiles?.display_name}</span>
                    <div className="bg-muted/50 p-4 rounded-[20px] rounded-tl-none max-w-[85%] border border-muted">
                      <p className="text-[13px] font-medium leading-relaxed">{msg.message_text}</p>
                    </div>
                  </div>
                ))}
                <div ref={scrollRef} />
              </div>
              <div className="flex gap-2 pt-4 border-t border-muted">
                <Input 
                  value={newMessage} 
                  onChange={(e) => setNewMessage(e.target.value)} 
                  placeholder="Send a message..." 
                  className="rounded-2xl h-12 bg-muted border-none font-medium text-sm px-5" 
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()} 
                />
                <Button onClick={sendMessage} className="rounded-2xl h-12 w-12 bg-primary text-black shrink-0">
                  <Send size={20} />
                </Button>
              </div>
            </div>
          )}

          {/* BATTLE VIEW */}
          {view === 'BATTLE' && activeBattle && (
            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
              {/* Battle Header Card - Liquid Glass */}
              <Card className="relative rounded-[32px] overflow-hidden border-2 border-white/20 bg-white/[0.08] backdrop-blur-xl">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-purple-500/20 pointer-events-none" />
                
                <div className="relative p-6 text-center">
                  <div className="bg-primary/20 p-3 rounded-2xl w-fit mx-auto mb-4">
                    <Swords className="text-primary" size={32} />
                  </div>
                  <h2 className="text-2xl font-black italic uppercase text-primary mb-2">{activeBattle.battle_name}</h2>
                  <div className="flex items-center justify-center gap-2 text-muted-foreground">
                    <Timer size={16} className="text-primary" />
                    <span className="font-black text-sm">{timeRemaining} Remaining</span>
                  </div>
                </div>
              </Card>

              {/* Battle Leaderboard */}
              <div className="space-y-3">
                <h3 className="text-left text-[11px] font-black uppercase italic tracking-widest text-muted-foreground ml-2">Battle Leaderboard</h3>
                {battleLeaderboard.map((participant, index) => {
                  const isMyClub = participant.club_id === selectedClub.id;
                  return (
                    <Card 
                      key={participant.id}
                      className={`rounded-[20px] p-4 border-2 transition-all ${isMyClub ? 'bg-primary/10 border-primary' : 'border-muted'}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-left">
                          <div className="flex flex-col items-center w-8">
                            {index === 0 ? (
                              <Trophy size={20} className="text-yellow-500" />
                            ) : index === 1 ? (
                              <Trophy size={18} className="text-gray-400" />
                            ) : index === 2 ? (
                              <Trophy size={16} className="text-orange-400" />
                            ) : (
                              <span className="text-lg font-black text-muted-foreground">#{index + 1}</span>
                            )}
                          </div>
                          <img 
                            src={participant.clubs.image_url || "/placeholder.svg"} 
                            className="h-12 w-12 rounded-xl object-cover border-2 border-primary/20" 
                          />
                          <div>
                            <p className="text-base font-black italic uppercase leading-none">{participant.clubs.name}</p>
                            <p className="text-[9px] font-black text-muted-foreground uppercase mt-1">{participant.clubs.region}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-black italic text-primary leading-none">{participant.total_points.toLocaleString()}</p>
                          <p className="text-[8px] font-black uppercase text-muted-foreground mt-1">Battle Pts</p>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Clubs;
