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
    try {
      const { data } = await supabase.from('clubs').select('*');
      setClubs(data || []);
    } finally { setLoading(false); }
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

  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from('club_messages').insert([
      { club_id: selectedClub.id, user_id: user.id, message_text: newMessage }
    ]);

    if (!error) {
      setNewMessage("");
      fetchMessages(selectedClub.id);
    }
  };

  const fetchClubDetails = async (club: any) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: memberships } = await supabase.from('club_members').select('user_id').eq('club_id', club.id);
      const memberIds = memberships?.map(m => m.user_id) || [];
      setIsMember(memberIds.includes(user?.id || ''));

      const { data: profiles } = await supabase.from('profiles').select('id, display_name, avatar_url, active_title');
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
      fetchMessages(club.id);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchClubs(); }, []);

  if (loading && !selectedClub) return (
    <div className="flex h-[80vh] flex-col items-center justify-center space-y-4">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="font-black italic uppercase text-primary tracking-tighter">Accessing Clubhouse...</p>
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
                  <div>
                    <h3 className="text-xl font-black italic uppercase leading-none">{club.name}</h3>
                    <div className="flex items-center gap-2 mt-2 text-[10px] font-black uppercase text-primary">
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
              <ChevronLeft size={16} /> Back
            </button>
            {isMember && (
              <Button 
                variant="ghost" 
                onClick={() => setView(view === 'INFO' ? 'CHAT' : 'INFO')}
                className="text-primary font-black uppercase text-[10px]"
              >
                {view === 'INFO' ? <><MessageSquare size={14} className="mr-1" /> War Room</> : "Leaderboard"}
              </Button>
            )}
          </div>

          {view === 'INFO' ? (
            <>
              {/* Leaderboard & Info View */}
              <div className="flex justify-between items-end">
                <div className="text-left">
                  <h1 className="text-3xl font-black italic uppercase tracking-tighter leading-none">{selectedClub.name}</h1>
                  <div className="flex gap-2 mt-2">
                    <Badge className="bg-primary/10 text-primary border-none font-black text-[9px] uppercase">{selectedClub.region}</Badge>
                    <Badge className="bg-orange-500/10 text-orange-500 border-none font-black text-[9px] uppercase italic">Rank #1</Badge>
                  </div>
                </div>
                <Button onClick={() => {}} className="rounded-xl font-black italic uppercase text-xs h-9 px-6">Leave</Button>
              </div>

              <Card className="bg-black border-primary/20 rounded-[32px] p-6 text-white text-left relative overflow-hidden">
                <div className="flex justify-between items-center mb-4">
                  <p className="text-[10px] font-black uppercase text-primary tracking-widest leading-none">Club Power</p>
                  <p className="text-4xl font-black italic tracking-tighter">{totalPoints.toLocaleString()}</p>
                </div>
                <Progress value={(totalPoints / BATTLE_THRESHOLD) * 100} className="h-2 bg-white/10" />
                <p className="text-[8px] font-bold text-white/40 uppercase text-center mt-2">
                  {totalPoints >= BATTLE_THRESHOLD ? "Ready for Battle" : `${BATTLE_THRESHOLD - totalPoints} PTS to unlock Battle Mode`}
                </p>
              </Card>

              <div className="space-y-4">
                <h3 className="text-left text-sm font-black uppercase italic tracking-widest text-muted-foreground">Members</h3>
                {clubMembers.map((member, index) => (
                  <div key={member.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-2xl">
                    <div className="flex items-center gap-3 text-left">
                      <Avatar className="h-10 w-10 border border-primary/10">
                        <AvatarImage src={member.avatar_url} />
                        <AvatarFallback>{member.display_name?.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-black italic uppercase leading-none">{member.display_name}</p>
                        <p className="text-[9px] font-bold text-muted-foreground uppercase mt-1">{member.active_title}</p>
                      </div>
                    </div>
                    <p className="text-sm font-black italic text-primary">{member.totalPoints.toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex flex-col h-[65vh]">
              {/* Chat View */}
              <div className="flex-1 overflow-y-auto space-y-4 pb-4 pr-2 scrollbar-hide">
                {messages.map((msg) => (
                  <div key={msg.id} className="flex flex-col text-left">
                    <div className="flex items-center gap-2 mb-1">
                       <span className="text-[10px] font-black uppercase text-primary italic">{msg.profiles?.display_name}</span>
                    </div>
                    <div className="bg-muted/50 p-3 rounded-2xl rounded-tl-none max-w-[90%]">
                      <p className="text-sm font-medium">{msg.message_text}</p>
                    </div>
                  </div>
                ))}
                <div ref={scrollRef} />
              </div>
              
              <div className="flex gap-2 pt-4 bg-background">
                <Input 
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Message the team..."
                  className="rounded-xl bg-muted border-none font-bold"
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                />
                <Button onClick={sendMessage} size="icon" className="rounded-xl shrink-0">
                  <Send size={18} />
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
