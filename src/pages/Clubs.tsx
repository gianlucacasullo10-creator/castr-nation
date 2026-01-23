import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Users, ChevronLeft, Swords, MapPin, Loader2, Crown, Trophy, MessageSquare, Send } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const Clubs = () => {
  const [clubs, setClubs] = useState<any[]>([]);
  const [selectedClub, setSelectedClub] = useState<any>(null);
  const [clubMembers, setClubMembers] = useState<any[]>([]);
  const [isMember, setIsMember] = useState(false);
  const [loading, setLoading] = useState(true);
  const [totalPoints, setTotalPoints] = useState(0);
  const [view, setView] = useState<'INFO' | 'CHAT'>('INFO');
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const BATTLE_THRESHOLD = 2000;

  const fetchClubs = async () => {
    setLoading(true);
    const { data } = await supabase.from('clubs').select('*');
    setClubs(data || []);
    setLoading(false);
  };

  const fetchMessages = async (clubId: string) => {
    const { data } = await supabase
      .from('club_messages')
      .select('*, profiles(display_name, avatar_url)')
      .eq('club_id', clubId)
      .order('created_at', { ascending: true });
    setMessages(data || []);
    setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  // Real-time Chat Listener
  useEffect(() => {
    if (!selectedClub || view !== 'CHAT') return;

    const channel = supabase
      .channel(`club_chat_${selectedClub.id}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'club_messages',
        filter: `club_id=eq.${selectedClub.id}` 
      }, () => {
        fetchMessages(selectedClub.id);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [selectedClub, view]);

  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from('club_messages').insert([
        { 
          club_id: selectedClub.id, 
          user_id: user.id, 
          message_text: newMessage 
        }
      ]);

      if (error) throw error;
      setNewMessage("");
      fetchMessages(selectedClub.id);
    } catch (err: any) {
      toast({ variant: "destructive", title: "Chat Failed", description: err.message });
    }
  };

  const fetchClubDetails = async (club: any) => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { data: memberships } = await supabase.from('club_members').select('user_id').eq('club_id', club.id);
    const memberIds = memberships?.map(m => m.user_id) || [];
    setIsMember(memberIds.includes(user?.id || ''));

    const { data: profiles } = await supabase.from('profiles').select('*');
    const { data: catches } = await supabase.from('catches').select('user_id, points').in('user_id', memberIds);

    const memberStats = (profiles || [])
      .filter(p => memberIds.includes(p.id))
      .map(p => ({
        ...p,
        totalPoints: (catches || []).filter(c => c.user_id === p.id).reduce((acc, curr) => acc + (curr.points || 0), 0)
      })).sort((a, b) => b.totalPoints - a.totalPoints);

    setTotalPoints(memberStats.reduce((acc, m) => acc + m.totalPoints, 0));
    setClubMembers(memberStats);
    setSelectedClub(club);
    setLoading(false);
  };

  useEffect(() => { fetchClubs(); }, []);

  if (loading && !selectedClub) return (
    <div className="flex h-[80vh] flex-col items-center justify-center space-y-4">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="font-black italic uppercase text-primary">Loading Clubhouse...</p>
    </div>
  );

  return (
    <div className="pb-24 pt-4 px-4 max-w-md mx-auto space-y-6">
      {!selectedClub ? (
        <>
          <h1 className="text-4xl font-black italic tracking-tighter text-primary uppercase leading-none text-left">Clubs</h1>
          <div className="space-y-4">
            {clubs.map((club) => (
              <Card key={club.id} onClick={() => fetchClubDetails(club)} className="border-none rounded-[32px] bg-card p-6 shadow-xl cursor-pointer text-left">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <h3 className="text-xl font-black italic uppercase leading-none">{club.name}</h3>
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase text-primary">
                      <MapPin size={12} /> {club.region}
                    </div>
                  </div>
                  <Users className="text-primary/40" size={24} />
                </div>
              </Card>
            ))}
          </div>
        </>
      ) : (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
          <div className="flex justify-between items-center">
            <button onClick={() => { setSelectedClub(null); setView('INFO'); }} className="flex items-center gap-2 text-primary font-black uppercase italic text-xs">
              <ChevronLeft size={16} /> Back to Directory
            </button>
            {isMember && (
              <Button 
                variant="ghost" 
                onClick={() => {
                  setView(view === 'INFO' ? 'CHAT' : 'INFO');
                  if (view === 'INFO') fetchMessages(selectedClub.id);
                }}
                className="text-primary font-black uppercase text-[10px] italic"
              >
                {view === 'INFO' ? <><MessageSquare size={14} className="mr-1" /> Club Chat</> : "Leaderboard"}
              </Button>
            )}
          </div>

          {view === 'INFO' ? (
            <div className="space-y-6">
              <div className="flex justify-between items-start">
                <div className="text-left">
                  <h1 className="text-3xl font-black italic uppercase tracking-tighter leading-none">{selectedClub.name}</h1>
                </div>
                <Button variant="outline" className="rounded-xl font-black italic uppercase text-[10px] h-8 px-4">Leave Club</Button>
              </div>

              <Card className="bg-black border-primary/20 rounded-[32px] p-8 text-white text-left overflow-hidden shadow-2xl">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <p className="text-[10px] font-black uppercase text-primary tracking-widest leading-none opacity-80">Total Power</p>
                    <p className="text-5xl font-black italic tracking-tighter mt-2">{totalPoints.toLocaleString()}</p>
                  </div>
                  <Swords size={48} className={totalPoints >= BATTLE_THRESHOLD ? "text-primary" : "text-white/20"} />
                </div>
                
                <div className="bg-white/10 h-12 rounded-2xl flex items-center justify-center border border-white/5 relative overflow-hidden">
                   <div 
                     className="absolute inset-0 bg-primary/20 transition-all duration-1000" 
                     style={{ width: `${Math.min(100, (totalPoints / BATTLE_THRESHOLD) * 100)}%` }}
                   />
                   <span className="relative z-10 font-black italic uppercase text-[11px] tracking-widest opacity-90">
                     {totalPoints >= BATTLE_THRESHOLD ? "Battle Mode Active" : "Battle Mode Locked"}
                   </span>
                </div>
              </Card>

              <div className="space-y-4">
                <h3 className="text-left text-[11px] font-black uppercase italic tracking-widest text-muted-foreground">Members ({clubMembers.length})</h3>
                {clubMembers.map((member, index) => (
                  <div key={member.id} className="flex items-center justify-between p-4 bg-card rounded-[24px] border border-border/50">
                    <div className="flex items-center gap-4 text-left">
                      <span className="text-[10px] font-black w-3 text-primary/50">{index + 1}</span>
                      <Avatar className="h-12 w-12 border-2 border-primary/10">
                        <AvatarImage src={member.avatar_url} />
                        <AvatarFallback>{member.display_name?.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-md font-black italic uppercase leading-none">{member.display_name}</p>
                        <p className="text-[9px] font-bold text-muted-foreground uppercase mt-1.5 tracking-tighter opacity-70">OG Castr</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-md font-black italic text-primary leading-none">{member.totalPoints.toLocaleString()}</p>
                      <p className="text-[8px] font-black uppercase opacity-40 mt-1">Pts</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col h-[65vh] animate-in fade-in duration-300">
               <h2 className="text-left text-xl font-black italic uppercase tracking-tighter text-primary mb-4">Club Chat</h2>
              <div className="flex-1 overflow-y-auto space-y-4 pb-4 pr-2 scrollbar-hide">
                {messages.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center opacity-20">
                    <MessageSquare size={48} />
                    <p className="text-[10px] font-black uppercase mt-2">No messages yet</p>
                  </div>
                )}
                {messages.map((msg) => (
                  <div key={msg.id} className="flex flex-col text-left">
                    <span className="text-[9px] font-black uppercase text-primary italic ml-2 mb-1 opacity-80">{msg.profiles?.display_name}</span>
                    <div className="bg-muted/50 p-4 rounded-3xl rounded-tl-none max-w-[85%] border border-primary/5 shadow-sm">
                      <p className="text-[13px] font-medium leading-tight text-foreground/90">{msg.message_text}</p>
                    </div>
                  </div>
                ))}
                <div ref={scrollRef} />
              </div>
              
              <div className="flex gap-2 pt-4 bg-background border-t border-muted/50">
                <Input 
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Drop a message..."
                  className="rounded-2xl h-12 bg-muted border-none font-bold text-xs px-4"
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                />
                <Button onClick={sendMessage} className="rounded-2xl h-12 w-12 bg-primary text-black shrink-0 shadow-lg">
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
