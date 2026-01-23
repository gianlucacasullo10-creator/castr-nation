import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Users, ChevronLeft, Swords, MapPin, Loader2, Crown, Trophy, MessageSquare } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const Clubs = () => {
  const [clubs, setClubs] = useState<any[]>([]);
  const [selectedClub, setSelectedClub] = useState<any>(null);
  const [clubMembers, setClubMembers] = useState<any[]>([]);
  const [isMember, setIsMember] = useState(false);
  const [loading, setLoading] = useState(true);
  const [totalPoints, setTotalPoints] = useState(0);
  const { toast } = useToast();

  const BATTLE_THRESHOLD = 2000;

  const fetchClubs = async () => {
    setLoading(true);
    try {
      const { data } = await supabase.from('clubs').select('*');
      setClubs(data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
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

      const points = memberStats.reduce((acc, m) => acc + m.totalPoints, 0);
      setTotalPoints(points);
      setClubMembers(memberStats);
      setSelectedClub(club);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleJoinClub = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (isMember) {
        await supabase.from('club_members').delete().eq('user_id', user.id).eq('club_id', selectedClub.id);
        toast({ title: "Left Club" });
      } else {
        const { data: existing } = await supabase.from('club_members').select('club_id, clubs(name)').eq('user_id', user.id).maybeSingle();
        if (existing) {
          toast({ variant: "destructive", title: "Loyalty Required", description: `Leave ${(existing.clubs as any)?.name} first!` });
          return;
        }
        await supabase.from('club_members').insert([{ user_id: user.id, club_id: selectedClub.id }]);
        toast({ title: "Joined Club!" });
      }
      fetchClubDetails(selectedClub);
    } catch (err: any) { toast({ variant: "destructive", title: "Error", description: err.message }); }
  };

  useEffect(() => { fetchClubs(); }, []);

  if (loading && !selectedClub) return (
    <div className="flex h-[80vh] flex-col items-center justify-center space-y-4">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="font-black italic uppercase text-primary">Accessing Clubhouse...</p>
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
          <button onClick={() => setSelectedClub(null)} className="flex items-center gap-2 text-primary font-black uppercase italic text-xs">
            <ChevronLeft size={16} /> Back
          </button>

          <div className="flex justify-between items-end">
            <div className="text-left">
              <h1 className="text-3xl font-black italic uppercase tracking-tighter leading-none">{selectedClub.name}</h1>
              <div className="flex gap-2 mt-2">
                <Badge className="bg-primary/10 text-primary border-none font-black text-[9px] uppercase">{selectedClub.region}</Badge>
                <Badge className="bg-orange-500/10 text-orange-500 border-none font-black text-[9px] uppercase italic">
                  <Trophy size={10} className="mr-1" /> Rank #1
                </Badge>
              </div>
            </div>
            <Button onClick={handleJoinClub} variant={isMember ? "outline" : "default"} className="rounded-xl font-black italic uppercase text-xs h-9 px-6">
              {isMember ? "Leave" : "Join"}
            </Button>
          </div>

          {/* PROGRESS TO BATTLE MODE */}
          <Card className="bg-black border-primary/20 rounded-[32px] p-6 text-white text-left relative overflow-hidden">
            <div className="relative z-10 space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-[10px] font-black uppercase text-primary tracking-widest leading-none">Club Power</p>
                  <p className="text-4xl font-black italic tracking-tighter mt-1">{totalPoints.toLocaleString()}</p>
                </div>
                <Swords className={`${totalPoints >= BATTLE_THRESHOLD ? 'text-primary' : 'text-white/20'}`} size={40} />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-[9px] font-black uppercase italic">
                  <span>Battle Progress</span>
                  <span>{Math.min(100, Math.round((totalPoints / BATTLE_THRESHOLD) * 100))}%</span>
                </div>
                <Progress value={(totalPoints / BATTLE_THRESHOLD) * 100} className="h-2 bg-white/10" />
                <p className="text-[8px] font-bold text-white/40 uppercase text-center">
                  {totalPoints >= BATTLE_THRESHOLD ? "Battle Mode Unlocked" : `${BATTLE_THRESHOLD - totalPoints} PTS to unlock Battle Mode`}
                </p>
              </div>
            </div>
          </Card>

          {/* MEMBER LIST WITH FOUNDER BADGE */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
               <h3 className="text-left text-sm font-black uppercase italic tracking-widest text-muted-foreground">Members</h3>
               {isMember && (
                 <Button variant="ghost" size="sm" className="text-primary font-black uppercase text-[10px]">
                    <MessageSquare size={14} className="mr-1" /> Club Chat
                 </Button>
               )}
            </div>
            {clubMembers.map((member, index) => (
              <div key={member.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-2xl">
                <div className="flex items-center gap-3 text-left">
                  <span className="text-[10px] font-black w-4 text-primary">{index + 1}</span>
                  <div className="relative">
                    <Avatar className="h-10 w-10 border border-primary/10">
                      <AvatarImage src={member.avatar_url} />
                      <AvatarFallback>{member.display_name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    {member.id === selectedClub.created_by && (
                      <div className="absolute -top-1 -right-1 bg-yellow-500 rounded-full p-0.5 border-2 border-background">
                        <Crown size={8} className="text-black" />
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-1">
                      <p className="text-sm font-black italic uppercase leading-none">{member.display_name || "Castr"}</p>
                    </div>
                    <p className="text-[9px] font-bold text-muted-foreground uppercase mt-1">{member.active_title}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black italic text-primary">{member.totalPoints.toLocaleString()}</p>
                  <p className="text-[8px] font-black text-muted-foreground uppercase">PTS</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Clubs;
