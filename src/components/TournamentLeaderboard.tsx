import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Trophy, 
  Medal, 
  Loader2, 
  X, 
  RefreshCw,
  ChevronDown,
  ChevronUp
} from "lucide-react";

interface TournamentLeaderboardProps {
  tournamentId: string;
  tournamentName: string;
  onClose: () => void;
}

interface LeaderboardEntry {
  id: string;
  user_id: string;
  catch_id: string;
  size_score: number;
  rank_position: number | null;
  user: {
    display_name: string;
    username: string;
    avatar_url: string;
    active_title: string;
  };
  catch: {
    species: string;
    points: number;
    image_url: string;
    location_city: string;
    created_at: string;
  };
}

const TournamentLeaderboard = ({ tournamentId, tournamentName, onClose }: TournamentLeaderboardProps) => {
  const [rankings, setRankings] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [showAllRanks, setShowAllRanks] = useState(false);

  useEffect(() => {
    fetchCurrentUser();
    fetchLeaderboard();
  }, [tournamentId]);

  const fetchCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUserId(user?.id || null);
  };

  const fetchLeaderboard = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      // Fetch only approved tournament catches
      const { data, error } = await supabase
        .from('tournament_catches')
        .select(`
          id,
          user_id,
          catch_id,
          size_score,
          rank_position,
          user:profiles!tournament_catches_user_id_fkey(display_name, username, avatar_url, active_title),
          catch:catches(species, points, image_url, location_city, created_at)
        `)
        .eq('tournament_id', tournamentId)
        .eq('status', 'approved')
        .order('size_score', { ascending: false });

      if (error) throw error;

      if (data) {
        // Assign ranks based on size_score (1 = highest)
        const rankedData = data.map((entry, index) => ({
          ...entry,
          rank_position: index + 1
        }));

        setRankings(rankedData);
      }
    } catch (error: any) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    fetchLeaderboard(true);
  };

  const getImageUrl = (path: string) => {
    const { data } = supabase.storage.from('catch_photos').getPublicUrl(path);
    return data.publicUrl;
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="text-yellow-500" size={20} />;
    if (rank === 2) return <Medal className="text-slate-400" size={20} />;
    if (rank === 3) return <Medal className="text-amber-700" size={20} />;
    return <span className="text-[10px] font-black text-muted-foreground w-5 text-center">{rank}</span>;
  };

  const getPrizeForRank = (rank: number): string | null => {
    if (rank === 1) return "🏆 Limited Edition 1/1 Legendary Rod";
    if (rank === 2) return "🥈 Limited Edition 1/1 Epic Lure";
    if (rank === 3) return "🥉 1,500 Fish Points";
    if (rank >= 4 && rank <= 10) return "500 Fish Points";
    if (rank >= 11 && rank <= 50) return "250 Fish Points";
    return null;
  };

  const myRank = rankings.findIndex(r => r.user_id === currentUserId) + 1;
  const displayRankings = showAllRanks ? rankings : rankings.slice(0, 10);

  if (loading) {
    return (
      <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-primary" size={48} />
          <p className="font-black italic uppercase text-primary text-sm">Loading Rankings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex flex-col animate-in fade-in">
      <div className="flex-1 overflow-y-auto pb-24">
        <div className="max-w-md mx-auto p-4 space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between sticky top-0 bg-black/80 backdrop-blur-sm py-4 -mt-4 z-10">
            <div className="flex-1">
              <h2 className="text-2xl font-black italic uppercase text-primary tracking-tighter leading-none">
                Leaderboard
              </h2>
              <p className="text-xs font-bold text-muted-foreground mt-1 truncate">
                {tournamentName}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={handleRefresh}
                disabled={refreshing}
                variant="ghost"
                size="sm"
                className="h-10 w-10 p-0 rounded-full"
              >
                <RefreshCw className={`${refreshing ? 'animate-spin' : ''}`} size={18} />
              </Button>
              <button 
                onClick={onClose}
                className="h-10 w-10 rounded-full hover:bg-white/10 transition-colors flex items-center justify-center"
              >
                <X size={24} className="text-white/70" />
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            <Card className="p-4 text-center bg-primary/10 border-primary/30">
              <p className="text-2xl font-black text-primary">{rankings.length}</p>
              <p className="text-xs font-bold uppercase text-muted-foreground">Approved</p>
            </Card>
            {myRank > 0 && (
              <Card className="p-4 text-center bg-primary/10 border-primary/30">
                <p className="text-2xl font-black text-primary">#{myRank}</p>
                <p className="text-xs font-bold uppercase text-muted-foreground">Your Rank</p>
              </Card>
            )}
          </div>

          {/* My Rank Card (if outside top 10) */}
          {myRank > 10 && (
            <Card className="bg-primary/10 border-2 border-primary/30 rounded-[32px] p-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/20 font-black text-primary text-sm">
                  #{myRank}
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-black uppercase text-primary">Your Position</p>
                  <p className="text-xs text-muted-foreground font-bold">
                    {getPrizeForRank(myRank) || "Keep fishing to rank higher!"}
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* Rankings */}
          {rankings.length === 0 ? (
            <div className="py-20 text-center">
              <Trophy className="mx-auto mb-4 text-muted-foreground opacity-30" size={48} />
              <p className="font-black uppercase italic text-muted-foreground">
                No Approved Catches Yet
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Be the first to submit!
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {displayRankings.map((entry) => {
                  const isCurrentUser = entry.user_id === currentUserId;
                  const rank = entry.rank_position || 0;
                  const prize = getPrizeForRank(rank);

                  return (
                    <Card 
                      key={entry.id}
                      className={`flex items-center p-3 gap-3 rounded-[24px] shadow-lg overflow-hidden ${
                        isCurrentUser 
                          ? "bg-primary/10 border-2 border-primary" 
                          : rank === 1 
                          ? "bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border border-yellow-500/30" 
                          : rank === 2
                          ? "bg-gradient-to-r from-slate-400/20 to-slate-500/20 border border-slate-400/30"
                          : rank === 3
                          ? "bg-gradient-to-r from-amber-700/20 to-amber-800/20 border border-amber-700/30"
                          : "bg-card border border-muted"
                      }`}
                    >
                      {/* Rank */}
                      <div className="flex items-center justify-center min-w-[24px]">
                        {getRankIcon(rank)}
                      </div>

                      {/* Profile */}
                      <Avatar className="h-10 w-10 border-2 border-primary/20 shrink-0">
                        <AvatarImage src={entry.user.avatar_url} />
                        <AvatarFallback className="font-black text-xs">
                          {entry.user.display_name?.charAt(0) || "C"}
                        </AvatarFallback>
                      </Avatar>

                      {/* Catch Image */}
                      <div className="relative w-12 h-12 rounded-xl overflow-hidden border-2 border-primary/20 shrink-0">
                        <img
                          src={getImageUrl(entry.catch.image_url)}
                          alt={entry.catch.species}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-black italic text-sm leading-none uppercase truncate">
                          {entry.user.display_name}
                        </p>
                        <p className="text-xs text-muted-foreground font-bold truncate mt-1">
                          {entry.catch.species}
                        </p>
                        {prize && rank <= 10 && (
                          <p className="text-[9px] text-primary font-black uppercase truncate mt-0.5">
                            {prize.replace(/🏆|🥈|🥉/g, '').trim()}
                          </p>
                        )}
                      </div>

                      {/* Score */}
                      <div className="text-right shrink-0">
                        <div className="text-lg font-black italic leading-none text-primary">
                          {entry.size_score}
                        </div>
                        <div className="text-[7px] font-black text-muted-foreground uppercase tracking-widest">
                          SCORE
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>

              {/* Show More/Less Button */}
              {rankings.length > 10 && (
                <Button
                  onClick={() => setShowAllRanks(!showAllRanks)}
                  variant="outline"
                  className="w-full h-12 rounded-2xl font-black uppercase text-xs"
                >
                  {showAllRanks ? (
                    <>
                      <ChevronUp className="mr-2" size={16} />
                      Show Top 10
                    </>
                  ) : (
                    <>
                      <ChevronDown className="mr-2" size={16} />
                      Show All {rankings.length} Ranks
                    </>
                  )}
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default TournamentLeaderboard;
