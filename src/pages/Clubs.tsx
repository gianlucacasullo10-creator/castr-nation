import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getStorageUrl } from '@/utils/storage';
import {
  Users,
  ChevronLeft,
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
  Plus,
  LogOut
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const Clubs = () => {
  const navigate = useNavigate();
  const [clubs, setClubs] = useState<any[]>([]);
  const [selectedClub, setSelectedClub] = useState<any>(null);
  const [clubMembers, setClubMembers] = useState<any[]>([]);
  const [isMember, setIsMember] = useState(false);
  const [loading, setLoading] = useState(true);
  const [totalPoints, setTotalPoints] = useState(0);
  const [regionalRank, setRegionalRank] = useState(1);
  const [view, setView] = useState<'INFO' | 'CHAT'>('INFO');
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

  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const MESSAGE_MAX_LENGTH = 500;

  const fetchClubs = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUser(user);
    const { data } = await supabase.from('clubs').select('*');
    setClubs(data || []);
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

    // Enforce one-club-at-a-time
    const { data: existingMembership } = await supabase
      .from('club_members')
      .select('club_id, clubs(name)')
      .eq('user_id', currentUser.id)
      .limit(1)
      .maybeSingle();

    if (existingMembership) {
      toast({
        variant: "destructive",
        title: "Already in a Club",
        description: `Leave ${(existingMembership.clubs as any)?.name || 'your current club'} before creating a new one.`
      });
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

      setNewClubName("");
      setNewClubRegion("");
      setShowCreateClub(false);
      fetchClubs();

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
      // Enforce one-club-at-a-time
      const { data: existingMembership } = await supabase
        .from('club_members')
        .select('club_id, clubs(name)')
        .eq('user_id', currentUser.id)
        .neq('club_id', selectedClub.id)
        .limit(1)
        .maybeSingle();

      if (existingMembership) {
        toast({
          variant: "destructive",
          title: "Already in a Club",
          description: `Leave ${(existingMembership.clubs as any)?.name || 'your current club'} before joining another.`
        });
        return;
      }

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
      const isLeader = currentUser.id === selectedClub.created_by;

      if (isLeader) {
        const { data: remainingMembers } = await supabase
          .from('club_members')
          .select('user_id, created_at')
          .eq('club_id', selectedClub.id)
          .neq('user_id', currentUser.id)
          .order('created_at', { ascending: true })
          .limit(1);

        if (remainingMembers && remainingMembers.length > 0) {
          const { error: transferError } = await supabase
            .from('clubs')
            .update({ created_by: remainingMembers[0].user_id })
            .eq('id', selectedClub.id);
          if (transferError) throw transferError;
        } else {
          const { error: deleteClubError } = await supabase
            .from('clubs')
            .delete()
            .eq('id', selectedClub.id);
          if (deleteClubError) throw deleteClubError;
          setIsMember(false);
          setSelectedClub(null);
          setView('INFO');
          fetchClubs();
          toast({ title: "CLUB DISBANDED", description: "You were the last member." });
          return;
        }
      }

      const { error } = await supabase
        .from('club_members')
        .delete()
        .eq('club_id', selectedClub.id)
        .eq('user_id', currentUser.id);
      if (error) throw error;
      setIsMember(false);
      toast({
        title: isLeader ? "LEADERSHIP TRANSFERRED" : "FREE AGENT",
        description: isLeader ? "Next oldest member is now leader." : "You have left the club."
      });
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

      const publicUrl = getStorageUrl('avatars', fileName);
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

    if (newMessage.trim().length > MESSAGE_MAX_LENGTH) {
      toast({
        variant: "destructive",
        title: "Message Too Long",
        description: `Messages must be ${MESSAGE_MAX_LENGTH} characters or less.`
      });
      return;
    }

    try {
      const { error } = await supabase.from('club_messages').insert([{ club_id: selectedClub.id, user_id: currentUser.id, message_text: newMessage.trim() }]);
      if (error) throw error;
      setNewMessage("");
      fetchMessages(selectedClub.id);
    } catch (err: any) {
      toast({ variant: "destructive", title: "Chat Failed", description: err.message });
    }
  };

  const fetchClubDetails = async (club: any) => {
    setLoading(true);
    try {
      // Fetch only members of this specific club
      const { data: clubMemberships } = await supabase
        .from('club_members')
        .select('user_id, created_at')
        .eq('club_id', club.id);

      const currentClubMemberIds = clubMemberships?.map(m => m.user_id) || [];
      setIsMember(currentClubMemberIds.includes(currentUser?.id || ''));

      // Fetch catches only for this club's members
      const { data: memberCatches } = currentClubMemberIds.length > 0
        ? await supabase.from('catches').select('user_id, points').in('user_id', currentClubMemberIds)
        : { data: [] };

      const clubTotal = (memberCatches || []).reduce((sum, c) => sum + (c.points || 0), 0);
      setTotalPoints(clubTotal);

      // Compute regional rank
      const regionalClubs = clubs.filter(c => c.region === club.region && c.id !== club.id);
      let rank = 1;
      for (const rc of regionalClubs) {
        const { data: rcMembers } = await supabase
          .from('club_members').select('user_id').eq('club_id', rc.id);
        const rcMemberIds = rcMembers?.map(m => m.user_id) || [];
        if (rcMemberIds.length === 0) continue;
        const { data: rcCatches } = await supabase
          .from('catches').select('points').in('user_id', rcMemberIds);
        const rcTotal = (rcCatches || []).reduce((sum, c) => sum + (c.points || 0), 0);
        if (rcTotal > clubTotal) rank++;
      }
      setRegionalRank(rank);

      // Fetch profiles for this club's members only
      const { data: profiles } = currentClubMemberIds.length > 0
        ? await supabase.from('profiles').select('*').in('id', currentClubMemberIds)
        : { data: [] };

      const memberStats = (profiles || []).map(p => ({
        ...p,
        totalPoints: (memberCatches || [])
          .filter(c => c.user_id === p.id)
          .reduce((acc, curr) => acc + (curr.points || 0), 0)
      })).sort((a, b) => b.totalPoints - a.totalPoints);

      setClubMembers(memberStats);
      setSelectedClub(club);
      setEditName(club.name);
      setEditRegion(club.region);
    } catch (error: any) {
      console.error('fetchClubDetails error:', error);
      toast({ variant: "destructive", title: "Error", description: "Failed to load club details." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClubs();
  }, []);

  if (loading && !selectedClub) return (
    <div className="flex h-[80vh] flex-col items-center justify-center space-y-4">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="font-black italic uppercase text-primary tracking-tighter">Syncing Clubhouse...</p>
    </div>
  );

  return (
    <div className="pb-24 pt-4 px-4 max-w-md mx-auto space-y-6">
      {!selectedClub ? (
        <>
          {/* Header */}
          <div className="text-center">
            <h1 className="text-4xl font-black italic tracking-tighter text-primary uppercase leading-none">
              Clubs
            </h1>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mt-1">
              Join a squad & compete together
            </p>
          </div>

          {/* Info Card */}
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-2 border-primary/30 p-6 rounded-[32px]">
            <div className="flex items-start gap-4">
              <div className="bg-primary/20 p-3 rounded-2xl shrink-0">
                <Trophy className="text-primary" size={24} />
              </div>
              <div>
                <h3 className="font-black uppercase text-sm mb-1">Team Up & Dominate</h3>
                <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                  Join a club, combine your catch points, and climb the regional rankings. The club with the most combined points rules the leaderboard!
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
              clubs.map((club) => (
                <Card
                  key={club.id}
                  onClick={() => fetchClubDetails(club)}
                  className="border-2 border-muted rounded-[24px] bg-card p-5 cursor-pointer hover:scale-[1.02] hover:border-primary/30 transition-all"
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                      <img src={club.image_url || "/placeholder.svg"} className="h-14 w-14 rounded-2xl object-cover border-2 border-primary/20" />
                      <div className="space-y-1 text-left">
                        <h3 className="text-lg font-black italic uppercase leading-none tracking-tighter">{club.name}</h3>
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase text-primary">
                          <MapPin size={12} /> {club.region}
                        </div>
                      </div>
                    </div>
                    <Users className="text-primary/40" size={24} />
                  </div>
                </Card>
              ))
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
                <Button
                  variant="outline"
                  onClick={() => { setView('CHAT'); fetchMessages(selectedClub.id); }}
                  className="text-primary font-black uppercase text-[10px] italic h-9 rounded-xl border-primary/30"
                >
                  <MessageSquare size={14} className="mr-1" /> Chat
                </Button>
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
                        <Button size="sm" className="bg-primary text-black rounded-xl" onClick={updateClubDetails}><Check size={14} className="mr-1" /> Save</Button>
                        <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)}><X size={14} className="mr-1" /> Cancel</Button>
                      </div>
                    </div>
                  ) : (
                    <div className="relative group">
                      <h1 className="text-3xl font-black italic uppercase tracking-tighter leading-none">{selectedClub.name}</h1>
                      <div className="flex justify-center gap-2 mt-3 flex-wrap">
                        <span className="bg-primary/10 text-primary border-none font-black text-[9px] uppercase italic tracking-widest px-3 py-1 rounded-full">{selectedClub.region}</span>
                        <span className={`${regionalRank === 1 ? "bg-yellow-500 text-black" : "bg-muted text-muted-foreground"} border-none font-black text-[9px] uppercase italic px-3 py-1 rounded-full flex items-center gap-1`}>
                          <Trophy size={10} /> Rank #{regionalRank}
                        </span>
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

              {/* Total Club Power Card */}
              <Card className="relative overflow-hidden rounded-[32px] p-8 bg-gradient-to-br from-primary/10 to-primary/5 border-2 border-primary/30">
                <div className="relative z-10 text-left">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest leading-none text-muted-foreground">Total Club Power</p>
                      <p className="text-5xl font-black italic tracking-tighter mt-2 text-primary">{totalPoints.toLocaleString()}</p>
                    </div>
                    <div className="p-3 rounded-2xl bg-primary/20">
                      <Trophy size={32} className="text-primary" />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground font-bold">
                    Combined catch points from all {clubMembers.length} member{clubMembers.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </Card>

              {/* Join/Leave Button */}
              <div className="px-2 space-y-2">
                {!isMember ? (
                  <Button onClick={joinClub} className="w-full h-14 rounded-2xl bg-primary text-black font-black uppercase italic hover:bg-primary/90 transition-all">
                    <Users size={18} className="mr-2" /> Join Squad
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    onClick={leaveClub}
                    className="w-full h-12 rounded-2xl border-2 border-red-500/30 text-red-500 hover:bg-red-500/10 font-black uppercase italic text-xs"
                  >
                    <LogOut size={16} className="mr-2" />
                    {currentUser?.id === selectedClub.created_by ? 'Leave & Transfer Leadership' : 'Leave Club'}
                  </Button>
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
                          {member.id === selectedClub.created_by ? <Crown size={14} className="text-yellow-500" /> : <span className="text-xs font-black text-muted-foreground">{index + 1}</span>}
                        </div>
                        <Avatar className="h-12 w-12 border-2 border-primary/20">
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
                <span className="text-[8px] border-primary/20 text-primary/60 font-black px-2 py-0.5 rounded-lg border">LIVE</span>
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
        </div>
      )}
    </div>
  );
};

export default Clubs;
