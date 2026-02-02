import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Trophy, 
  Calendar, 
  Users, 
  Gift,
  ExternalLink,
  Loader2,
  CheckCircle2
} from "lucide-react";

interface Tournament {
  id: string;
  name: string;
  description: string;
  sponsor_name: string;
  sponsor_logo: string;
  start_date: string;
  end_date: string;
  species_filter: string;
  prize_structure: any[];
  rules: string[];
  max_participants: number | null;
  status: string;
  participant_count?: number;
  is_joined?: boolean;
}

const Tournaments = () => {
  const { toast } = useToast();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [joiningTournament, setJoiningTournament] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // Get current user
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);
    };
    getUser();
  }, []);

  // Fetch tournaments from database
  useEffect(() => {
    fetchTournaments();
  }, [userId]);

  // Update time every second for countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchTournaments = async () => {
    try {
      setLoading(true);
      
      // Get all tournaments
      const { data: tournamentsData, error: tournamentsError } = await supabase
        .from('tournaments')
        .select('*')
        .order('start_date', { ascending: false });

      if (tournamentsError) throw tournamentsError;

      if (!tournamentsData) {
        setTournaments([]);
        return;
      }

      // For each tournament, get participant count and check if user joined
      const tournamentsWithData = await Promise.all(
        tournamentsData.map(async (tournament) => {
          // Get participant count
          const { count } = await supabase
            .from('tournament_participants')
            .select('*', { count: 'exact', head: true })
            .eq('tournament_id', tournament.id);

          // Check if current user joined
          let isJoined = false;
          if (userId) {
            const { data: participantData } = await supabase
              .from('tournament_participants')
              .select('id')
              .eq('tournament_id', tournament.id)
              .eq('user_id', userId)
              .maybeSingle();
            
            isJoined = !!participantData;
          }

          return {
            ...tournament,
            participant_count: count || 0,
            is_joined: isJoined
          };
        })
      );

      setTournaments(tournamentsWithData);
    } catch (error: any) {
      console.error('Error fetching tournaments:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load tournaments"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleJoinTournament = async (tournament: Tournament) => {
    if (!userId) {
      toast({
        variant: "destructive",
        title: "Please log in",
        description: "You must be logged in to join tournaments"
      });
      return;
    }

    // Check if tournament is full
    if (tournament.max_participants && tournament.participant_count! >= tournament.max_participants) {
      toast({
        variant: "destructive",
        title: "Tournament Full",
        description: "This tournament has reached maximum capacity"
      });
      return;
    }

    // Check if tournament is active or upcoming
    const countdown = getCountdown(tournament.start_date, tournament.end_date);
    if (countdown.status === 'ended') {
      toast({
        variant: "destructive",
        title: "Tournament Ended",
        description: "This tournament has already ended"
      });
      return;
    }

    setJoiningTournament(tournament.id);

    try {
      const { error } = await supabase
        .from('tournament_participants')
        .insert({
          tournament_id: tournament.id,
          user_id: userId
        });

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          toast({
            title: "Already Joined",
            description: "You're already registered for this tournament"
          });
        } else {
          throw error;
        }
      } else {
        toast({
          title: "Success! 🎉",
          description: `You've joined ${tournament.name}!`
        });
        
        // Refresh tournaments to update participant count
        fetchTournaments();
      }
    } catch (error: any) {
      console.error('Error joining tournament:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to join tournament. Please try again."
      });
    } finally {
      setJoiningTournament(null);
    }
  };

  const handleLeaveTournament = async (tournamentId: string) => {
    if (!userId) return;

    setJoiningTournament(tournamentId);

    try {
      const { error } = await supabase
        .from('tournament_participants')
        .delete()
        .eq('tournament_id', tournamentId)
        .eq('user_id', userId);

      if (error) throw error;

      toast({
        title: "Left Tournament",
        description: "You've left the tournament"
      });

      // Refresh tournaments
      fetchTournaments();
    } catch (error: any) {
      console.error('Error leaving tournament:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to leave tournament"
      });
    } finally {
      setJoiningTournament(null);
    }
  };

  // Calculate countdown
  const getCountdown = (startDate: string, endDate: string) => {
    const now = currentTime.getTime();
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();

    if (now < start) {
      const diff = start - now;
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      return {
        status: 'upcoming',
        label: 'Starts in',
        time: `${days}d ${hours}h ${minutes}m ${seconds}s`
      };
    } else if (now >= start && now < end) {
      const diff = end - now;
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      return {
        status: 'active',
        label: 'Ends in',
        time: `${days}d ${hours}h ${minutes}m ${seconds}s`
      };
    } else {
      return {
        status: 'ended',
        label: 'Ended',
        time: ''
      };
    }
  };

  const getStatusBadge = (countdown: { status: string; label: string; time: string }) => {
    switch (countdown.status) {
      case "active":
        return (
          <div className="text-right">
            <Badge className="bg-green-500 text-white border-none font-black text-xs mb-2">LIVE</Badge>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{countdown.label}</p>
            <p className="text-xs font-black text-primary tabular-nums">{countdown.time}</p>
          </div>
        );
      case "upcoming":
        return (
          <div className="text-right">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">{countdown.label}</p>
            <p className="text-sm font-black text-primary tabular-nums">{countdown.time}</p>
          </div>
        );
      case "ended":
        return (
          <div className="text-right">
            <Badge className="bg-gray-500 text-white border-none font-black text-xs">ENDED</Badge>
          </div>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="pb-24 pt-4 px-4 max-w-md mx-auto flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin text-primary" size={48} />
      </div>
    );
  }

  return (
    <div className="pb-24 pt-4 px-4 max-w-md mx-auto space-y-6">
      {/* Header */}
      <div className="text-left">
        <h1 className="text-4xl font-black italic tracking-tighter text-primary uppercase leading-none">
          Tournaments
        </h1>
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mt-1">
          Compete for exclusive rewards
        </p>
      </div>

      {/* Info Card */}
      <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-2 border-primary/30 p-6 rounded-[32px]">
        <div className="flex items-start gap-4">
          <div className="bg-primary/20 p-3 rounded-2xl shrink-0">
            <Trophy className="text-primary" size={24} />
          </div>
          <div>
            <h3 className="font-black uppercase text-sm mb-1">Weekly Tournaments</h3>
            <p className="text-xs text-muted-foreground font-medium leading-relaxed">
              Compete in fishing challenges to win exclusive gear, points, and climb the leaderboards!
            </p>
          </div>
        </div>
      </Card>

      {/* Tournaments List */}
      {tournaments.length === 0 ? (
        <Card className="p-8 text-center rounded-[32px]">
          <p className="text-muted-foreground text-sm">No active tournaments right now</p>
          <p className="text-xs text-muted-foreground mt-2">Check back soon!</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {tournaments.map((tournament) => {
            const countdown = getCountdown(tournament.start_date, tournament.end_date);
            
            return (
              <Card 
                key={tournament.id}
                className="border-2 border-muted rounded-[32px] overflow-hidden"
              >
                {/* Header */}
                <div className="bg-gradient-to-r from-primary/20 to-purple-500/20 p-6 border-b-2 border-muted">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-4xl">{tournament.sponsor_logo}</span>
                      <div>
                        <h3 className="text-lg font-black italic uppercase leading-none">
                          {tournament.name}
                        </h3>
                        <p className="text-xs font-bold text-muted-foreground mt-1">
                          Sponsored by {tournament.sponsor_name}
                        </p>
                      </div>
                    </div>
                    {getStatusBadge(countdown)}
                  </div>
                  <p className="text-sm font-medium text-foreground/80">
                    {tournament.description}
                  </p>
                </div>

                {/* Details */}
                <div className="p-6 space-y-4">
                  {/* Dates & Participants */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-start gap-2">
                      <Calendar size={16} className="text-muted-foreground mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-muted-foreground uppercase">Dates</p>
                        <p className="text-xs font-black">{new Date(tournament.start_date).toLocaleDateString()}</p>
                        <p className="text-xs font-black">to {new Date(tournament.end_date).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Users size={16} className="text-muted-foreground mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-muted-foreground uppercase">Participants</p>
                        <p className="text-xs font-black">
                          {tournament.participant_count} {tournament.max_participants ? `/ ${tournament.max_participants}` : '(Unlimited)'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Prizes */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Gift size={16} className="text-primary" />
                      <p className="text-xs font-black uppercase text-primary">Prizes</p>
                    </div>
                    <div className="space-y-2">
                      {tournament.prize_structure.map((prize: any, index: number) => (
                        <div 
                          key={index}
                          className="flex items-center justify-between bg-muted/50 p-3 rounded-xl"
                        >
                          <span className="text-xs font-black">{prize.place}</span>
                          <span className="text-xs font-bold text-muted-foreground">{prize.reward}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Rules */}
                  <div>
                    <p className="text-xs font-black uppercase text-muted-foreground mb-2">Rules</p>
                    <ul className="space-y-1">
                      {tournament.rules.map((rule: string, index: number) => (
                        <li key={index} className="text-xs text-muted-foreground flex items-start gap-2">
                          <span className="text-primary mt-0.5">•</span>
                          <span>{rule}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    {tournament.is_joined ? (
                      <Button
                        onClick={() => handleLeaveTournament(tournament.id)}
                        disabled={joiningTournament === tournament.id}
                        variant="outline"
                        className="flex-1 h-12 rounded-2xl font-black uppercase text-xs"
                      >
                        {joiningTournament === tournament.id ? (
                          <Loader2 className="animate-spin mr-2" size={16} />
                        ) : (
                          <CheckCircle2 className="mr-2" size={16} />
                        )}
                        Joined
                      </Button>
                    ) : (
                      <Button
                        onClick={() => handleJoinTournament(tournament)}
                        disabled={countdown.status === "ended" || joiningTournament === tournament.id}
                        className="flex-1 h-12 rounded-2xl bg-primary hover:bg-primary/90 text-black font-black uppercase text-xs disabled:opacity-50"
                      >
                        {joiningTournament === tournament.id ? (
                          <>
                            <Loader2 className="animate-spin mr-2" size={16} />
                            Joining...
                          </>
                        ) : (
                          countdown.status === "active" ? "Join Now" : countdown.status === "upcoming" ? "Register" : "Tournament Ended"
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* CTA for Sponsors */}
      <Card className="bg-muted/30 border-2 border-dashed border-muted p-6 rounded-[32px] text-center">
        <h3 className="font-black uppercase text-sm mb-2">Want to Sponsor?</h3>
        <p className="text-xs text-muted-foreground mb-4">
          Reach thousands of passionate anglers with your brand
        </p>
        <Button
          variant="outline"
          className="font-bold uppercase text-xs"
          onClick={() => window.location.href = "mailto:sponsors@castrs.com"}
        >
          Contact Us
        </Button>
      </Card>
    </div>
  );
};

export default Tournaments;
