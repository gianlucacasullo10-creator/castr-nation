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
  const [pendingCount, setPendingCount] = useState(0);
  const [totalSubmissions, setTotalSubmissions] = useState(0);

  useEffect(() => {
    fetchCurrentUser();
    fetchLeaderboard();
    
    // Lock body scroll when modal opens
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    document.body.style.height = '100%';
    
    return () => {
      // Restore body scroll when modal closes
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.height = '';
    };
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

      // Get pending count
      const { count: pending } = await supabase
        .from('tournament_catches')
        .select('*', { count: 'exact', head: true })
        .eq('tournament_id', tournamentId)
        .eq('status', 'pending');

      setPendingCount(pending || 0);

      // Get total submissions count
      const { count: total } = await supabase
        .from('tournament_catches')
        .select('*', { count: 'exact', head: true })
        .eq('tournament_id', tournamentId);

      setTotalSubmissions(total || 0);

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
      <div className="fixed inset-0 z-[200] bg-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-primary" size={48} />
          <p className="font-black italic uppercase text-primary text-sm">Loading Rankings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-[-10px] z-[200] bg-black overflow-hidden">
      <div className="h-screen w-screen overflow-y-auto pt-2">
        <div className="max-w-md mx-auto px-4 space-y-4 pb-8">
          {/* Header */}
          <div className="flex items-start justify-between pt-4 sticky top-0 bg-black z-10 pb-4 -mx-4 px-4">
            <div className="flex-1">
              <h2 className="text-3xl font-black italic uppercase text-primary tracking-tighter leading-none">
                Leaderboard
              </h2>
              <p className="text-xs font-bold text-muted-foreground mt-1">
                {tournamentName}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={handleRefresh}
                disabled={refreshing}
                variant="ghost"
                size="sm"
                className="h-10 w-10 p-0 rounded-full hover:bg-white/10"
              >
                <RefreshCw className={`text-primary ${refreshing ? 'animate-spin' : ''}`} size={20} />
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
          <div className="grid grid-cols-3 gap-3">
            <Card className="p-4 text-center bg-green-500/10 border-green-500/30 rounded-[24px]">
              <p className="text-2xl font-black text-green-500">{rankings.length}</p>
              <p className="text-[9px] font-black uppercase text-muted-foreground tracking-wider">Approved</p>
            </Card>
            <Card className="p-4 text-center bg-yellow-500/10 border-yellow-500/30 rounded-[24px]">
              <p className="text-2xl font-black text-yellow-500">{pendingCount}</p>
              <p className="text-[9px] font-black uppercase text-muted-foreground tracking-wider">Under Review</p>
            </Card>
            <Card className="p-4 text-center bg-primary/10 border-primary/30 rounded-[24px]">
              <p className="text-2xl font-black text-primary">{totalSubmissions}</p>
              <p className="text-[9px] font-black uppercase text-muted-foreground tracking-wider">Total Catches</p>
            </Card>
          </div>

          {/* My Rank Card */}
          {myRank > 0 && (
            <Card className="bg-gradient-to-r from-primary/20 to-purple-500/20 border-2 border-primary/30 rounded-[32px] p-5">
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-14 h-14 rounded-full bg-primary/20 border-2 border-primary font-black text-primary text-lg">
                  #{myRank}
                </div>
                <div className="flex-1 text-left">
                  <p className="text-base font-black italic uppercase text-primary leading-none">Your Position</p>
                  <p className="text-xs text-muted-foreground font-bold mt-2">
                    {getPrizeForRank(myRank) || "Keep fishing to rank higher!"}
                  </p>
                </div>
                <Trophy className="text-primary" size={28} />
              </div>
            </Card>
          )}

          {/* Rankings */}
          {rankings.length === 0 ? (
            <div className="py-32 text-center">
              <div className="bg-muted/30 rounded-full p-8 w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                <Trophy className="text-muted-foreground/30" size={48} />
              </div>
              <p className="text-xl font-black uppercase italic text-muted-foreground mb-2">
                No Approved Catches Yet
              </p>
              <p className="text-sm text-muted-foreground">
                Be the first to submit and get ranked!
              </p>
              {pendingCount > 0 && (
                <p className="text-xs text-yellow-500 mt-4 font-bold">
                  {pendingCount} catch{pendingCount !== 1 ? 'es' : ''} currently under review
                </p>
              )}
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
                      className={`flex items-center p-4 gap-3 rounded-[32px] border-2 overflow-hidden transition-all ${
                        isCurrentUser 
                          ? "bg-gradient-to-r from-primary/20 to-purple-500/20 border-primary shadow-[0_8px_30px_rgba(34,211,238,0.3)]" 
                          : rank === 1 
                          ? "bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border-yellow-500/40 shadow-[0_8px_30px_rgba(234,179,8,0.2)]" 
                          : rank === 2
                          ? "bg-gradient-to-r from-slate-400/20 to-slate-500/20 border-slate-400/40 shadow-[0_8px_30px_rgba(148,163,184,0.2)]"
                          : rank === 3
                          ? "bg-gradient-to-r from-amber-700/20 to-amber-800/20 border-amber-700/40 shadow-[0_8px_30px_rgba(180,83,9,0.2)]"
                          : "bg-card/50 border-muted hover:border-primary/30"
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
                      <div className="relative w-14 h-14 rounded-2xl overflow-hidden border-2 border-primary/30 shrink-0 shadow-lg">
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
                  className="w-full h-14 rounded-[24px] font-black uppercase text-xs border-2 border-primary/30 hover:bg-primary/10 hover:border-primary"
                >
                  {showAllRanks ? (
                    <>
                      <ChevronUp className="mr-2" size={18} />
                      Show Top 10 Only
                    </>
                  ) : (
                    <>
                      <ChevronDown className="mr-2" size={18} />
                      Show All {rankings.length} Ranks
                    </>
                  )}
                </Button>
              )}
            </>
          )}

          {/* Bottom spacing */}
          <div className="h-8" />
        </div>
      </div>
    </div>
  );
};

export default TournamentLeaderboard;
