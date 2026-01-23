import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Trophy, ChevronLeft, Swords, MapPin, Loader2 } from "lucide-react";

const Clubs = () => {
  const [clubs, setClubs] = useState<any[]>([]);
  const [selectedClub, setSelectedClub] = useState<any>(null);
  const [clubMembers, setClubMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchClubs = async () => {
    try {
      setLoading(true);
      // Fetch clubs and their member counts
      const { data } = await supabase.from('clubs').select('*');
      setClubs(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchClubDetails = async (club: any) => {
    setLoading(true);
    try {
      // 1. Fetch member profiles for this club
      const { data: memberships } = await supabase
        .from('club_members')
        .select('user_id')
        .eq('club_id', club.id);

      const memberIds = memberships?.map(m => m.user_id) || [];

      // 2. Get profile info and their total points for battle stats
      const { data: members } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url, active_title');

      const { data: catches } = await supabase
        .from('catches')
        .select('user_id, points')
        .in('user_id', memberIds);

      // Calculate member stats
      const memberStats = (members || [])
        .filter(m => memberIds.includes(m.id))
        .map(member => ({
          ...member,
          totalPoints: (catches || [])
            .filter(c => c.user_id === member.id)
            .reduce((acc, curr) => acc + (curr.points || 0), 0)
        })).sort((a, b) => b.totalPoints - a.totalPoints);

      setClubMembers(memberStats);
      setSelectedClub(club);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClubs();
  }, []);

  if (loading && !selectedClub) return (
    <div className="flex h-[80vh] items-center justify-center">
      <Loader2 className="animate-spin text-primary" />
    </div>
  );

  return (
    <div className="pb-24 pt-4 px-4 max-w-md mx-auto space-y-6">
      {!selectedClub ? (
        <>
          <div className="flex justify-between items-center">
            <h1 className="text-4xl font-black italic tracking-tighter text-primary uppercase">Clubs</h1>
            <Button size="icon" className="rounded-full h-10 w-10 shadow-lg">+</Button>
          </div>

          <div className="space-y-4">
            {clubs.map((club) => (
              <Card 
                key={club.id} 
                onClick={() => fetchClubDetails(club)}
                className="border-none rounded-[32px] bg-card p-6 shadow-xl cursor-pointer transition-transform active:scale-95"
              >
                <div className="flex justify-between items-start">
                  <div className="text-left">
                    <h3 className="text-xl font-black italic uppercase leading-none">{club.name}</h3>
                    <p className="text-xs text-muted-foreground mt-1 font-bold">{club.description}</p>
                    <div className="flex items-center gap-2 mt-4 text-[10px] font-black uppercase text-primary tracking-widest">
                      <MapPin size={12} /> {club.region || "Global Region"}
                    </div>
                  </div>
                  <div className="bg-primary/10 p-3 rounded-2xl">
                    <Users className="text-primary" size={20} />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </>
      ) : (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
          <button onClick={() => setSelectedClub(null)} className="flex items-center gap-2 text-primary font-black uppercase italic text-xs">
            <ChevronLeft size={16} /> Back to Directory
          </button>

          <div className="text-left space-y-2">
            <h1 className="text-4xl font-black italic uppercase tracking-tighter leading-none">{selectedClub.name}</h1>
            <Badge className="bg-primary/10 text-primary border-none font-black italic">{selectedClub.region}</Badge>
          </div>

          {/* BATTLE PREVIEW CARD */}
          <Card className="bg-black border-primary/30 rounded-[32px] p-6 text-white overflow-hidden relative">
            <div className="relative z-10 flex justify-between items-center">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-primary">Total Power</p>
                <p className="text-4xl font-black italic tracking-tighter">
                  {clubMembers.reduce((acc, m) => acc + m.totalPoints, 0).toLocaleString()}
                </p>
              </div>
              <Swords className="text-primary opacity-50" size={48} />
            </div>
            <div className="mt-4">
              <Button disabled className="w-full bg-primary text-black font-black italic uppercase rounded-2xl opacity-50">
                Battle Mode Locked
              </Button>
            </div>
          </Card>

          <div className="space-y-4">
            <h3 className="text-left text-sm font-black uppercase italic tracking-widest text-muted-foreground">Club Members ({clubMembers.length})</h3>
            {clubMembers.map((member, index) => (
              <div key={member.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-2xl">
                <div className="flex items-center gap-3 text-left">
                  <span className="text-[10px] font-black w-4 text-primary">{index + 1}</span>
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={member.avatar_url} />
                    <AvatarFallback>{member.display_name?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-black italic uppercase leading-none">{member.display_name}</p>
                    <p className="text-[9px] font-bold text-muted-foreground uppercase mt-1">{member.active_title}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black italic text-primary">{member.totalPoints}</p>
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
