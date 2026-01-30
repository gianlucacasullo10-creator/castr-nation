import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trophy, Medal, Loader2, MapPin, AlertCircle, Crown } from "lucide-react";
import { requestLocationPermission, calculateDistance, UserLocation } from "@/utils/location";

const Leaderboards = () => {
  const navigate = useNavigate();
  const [rankings, setRankings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [leaderboardType, setLeaderboardType] = useState<"provincial" | "local">("provincial");
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [locationDenied, setLocationDenied] = useState(false);

  const LOCAL_RADIUS_KM = 50; // 50km radius for "Your Area"

  useEffect(() => {
    fetchCurrentUser();
    checkLocationPermission();
  }, []);

  useEffect(() => {
    if (leaderboardType === "provincial") {
      fetchProvincialRankings();
    } else {
      fetchLocalRankings();
    }
  }, [leaderboardType, userLocation]);

  const fetchCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUser(user);
  };

  const checkLocationPermission = async () => {
    // Check if we have saved location
    const savedLocation = localStorage.getItem('userLocation');
    if (savedLocation) {
      setUserLocation(JSON.parse(savedLocation));
      return;
    }

    // Request new location
    const location = await requestLocationPermission();
    if (location) {
      setUserLocation(location);
      localStorage.setItem('userLocation', JSON.stringify(location));
      
      // Save location to user profile
      if (currentUser) {
        await supabase
          .from('profiles')
          .update({
            location_lat: location.latitude,
            location_lon: location.longitude,
            location_city: location.city,
            location_province: location.province
          })
          .eq('id', currentUser.id);
      }
    } else {
      setLocationDenied(true);
    }
  };

  const fetchProvincialRankings = async () => {
    try {
      setLoading(true);
      
      // Fetch all profiles (filtering by Ontario)
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url, active_title, location_province');

      if (profileError) throw profileError;

      // Filter to Ontario only
      const ontarioProfiles = profiles?.filter(p => 
        p.location_province === 'Ontario' || !p.location_province
      ) || [];

      // Fetch all catches
      const { data: catches, error: catchError } = await supabase
        .from('catches')
        .select('user_id, points');

      if (catchError) throw catchError;

      // Calculate totals
      const userTotals: Record<string, number> = {};
      catches?.forEach((c) => {
        userTotals[c.user_id] = (userTotals[c.user_id] || 0) + (c.points || 0);
      });

      // Map and sort
      const finalRankings = ontarioProfiles
        .map(profile => ({
          ...profile,
          totalPoints: userTotals[profile.id] || 0
        }))
        .sort((a, b) => b.totalPoints - a.totalPoints);

      setRankings(finalRankings);
    } catch (error: any) {
      console.error("Leaderboard Error:", error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchLocalRankings = async () => {
    if (!userLocation) {
      setRankings([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Fetch all profiles with location data
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url, active_title, location_lat, location_lon')
        .not('location_lat', 'is', null)
        .not('location_lon', 'is', null);

      if (profileError) throw profileError;

      // Filter users within radius
      const nearbyProfiles = profiles?.filter(profile => {
        const distance = calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          profile.location_lat!,
          profile.location_lon!
        );
        return distance <= LOCAL_RADIUS_KM;
      }) || [];

      // Fetch all catches
      const { data: catches, error: catchError } = await supabase
        .from('catches')
        .select('user_id, points');

      if (catchError) throw catchError;

      // Calculate totals
      const userTotals: Record<string, number> = {};
      catches?.forEach((c) => {
        userTotals[c.user_id] = (userTotals[c.user_id] || 0) + (c.points || 0);
      });

      // Map and sort
      const finalRankings = nearbyProfiles
        .map(profile => ({
          ...profile,
          totalPoints: userTotals[profile.id] || 0
        }))
        .sort((a, b) => b.totalPoints - a.totalPoints);

      setRankings(finalRankings);
    } catch (error: any) {
      console.error("Local Leaderboard Error:", error.message);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (index: number) => {
    if (index === 0) return <Trophy className="text-yellow-500" size={20} />;
    if (index === 1) return <Medal className="text-slate-400" size={20} />;
    if (index === 2) return <Medal className="text-amber-700" size={20} />;
    return <span className="text-[10px] font-black text-muted-foreground w-5 text-center">{index + 1}</span>;
  };

  const myRank = rankings.findIndex(r => r.id === currentUser?.id) + 1;

  if (loading) return (
    <div className="flex h-[80vh] flex-col items-center justify-center space-y-4">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="font-black italic uppercase text-primary">Syncing Ranks...</p>
    </div>
  );

  return (
    <div className="pb-24 pt-4 px-4 max-w-md mx-auto space-y-6">
      {/* Header */}
      <div className="text-left">
        <h1 className="text-4xl font-black italic tracking-tighter text-primary uppercase leading-none">
          The Standings
        </h1>
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mt-1">
          {leaderboardType === "provincial" ? "ONTARIO DIVISION" : "YOUR AREA"}
        </p>
      </div>

      {/* Dropdown Selector */}
      <div className="flex items-center gap-3">
        <MapPin className="text-primary" size={20} />
        <Select value={leaderboardType} onValueChange={(value: any) => setLeaderboardType(value)}>
          <SelectTrigger className="w-full h-12 rounded-2xl bg-card border-primary/20 font-black uppercase italic text-sm">
            <SelectValue placeholder="Select region" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="provincial" className="font-black uppercase italic">
              Ontario Province
            </SelectItem>
            <SelectItem 
              value="local" 
              className="font-black uppercase italic"
              disabled={!userLocation}
            >
              Your Area (50km) {!userLocation && "🔒"}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Location Denied Warning */}
      {leaderboardType === "local" && locationDenied && (
        <Card className="bg-yellow-950/30 border-yellow-500/30 p-4 rounded-2xl">
          <div className="flex items-start gap-3">
            <AlertCircle className="text-yellow-500 shrink-0" size={20} />
            <div className="text-left">
              <h3 className="text-sm font-black uppercase text-yellow-500 mb-1">Location Required</h3>
              <p className="text-xs text-yellow-200/70 leading-relaxed">
                Enable location permissions to view nearby anglers. You can update this in your browser settings.
              </p>
              <Button 
                onClick={checkLocationPermission}
                size="sm"
                className="mt-3 bg-yellow-500 text-black hover:bg-yellow-600 font-black uppercase text-xs"
              >
                Enable Location
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Current User Rank Card */}
      {myRank > 0 && (leaderboardType === "provincial" || userLocation) && (
        <Card className="bg-primary/10 border-primary/30 border-2 rounded-[32px] p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/20 font-black text-primary">
                #{myRank}
              </div>
              <div className="text-left">
                <p className="text-sm font-black uppercase text-primary">Your Rank</p>
                <p className="text-xs text-muted-foreground font-bold">
                  {leaderboardType === "provincial" ? "in Ontario" : `within ${LOCAL_RADIUS_KM}km`}
                </p>
              </div>
            </div>
            <Trophy className="text-primary" size={24} />
          </div>
        </Card>
      )}

      {/* Rankings List */}
      <div className="space-y-3">
        {rankings.length === 0 ? (
          <div className="py-20 text-center opacity-30 font-black uppercase italic">
            {leaderboardType === "local" && !userLocation 
              ? "Enable location to view nearby anglers" 
              : "No Anglers Ranked Yet"}
          </div>
        ) : (
          rankings.map((user, index) => {
            const isCurrentUser = user.id === currentUser?.id;
            return (
              <Card 
                key={user.id} 
                onClick={() => navigate(`/profile/${user.id}`)}
                className={`border-none flex items-center p-4 gap-4 rounded-[24px] shadow-lg cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98] ${
                  isCurrentUser 
                    ? "bg-primary/10 border-2 border-primary" 
                    : index === 0 
                    ? "bg-primary/10 border border-primary/20" 
                    : "bg-card hover:bg-muted/50"
                }`}
              >
                <div className="flex items-center justify-center min-w-[24px]">
                  {getRankIcon(index)}
                </div>

                <Avatar className="h-10 w-10 border-2 border-primary/10">
                  <AvatarImage src={user.avatar_url} />
                  <AvatarFallback className="font-black">{user.display_name?.charAt(0) || "C"}</AvatarFallback>
                </Avatar>

                <div className="flex flex-col flex-1 text-left overflow-hidden">
                  <span className="font-black italic text-sm leading-none uppercase truncate">
                    {user.display_name || "Anonymous"}
                  </span>
                  <span className="text-[8px] font-black uppercase tracking-widest mt-1 text-primary/70">
                    {user.active_title || "Beginner"}
                  </span>
                </div>

                <div className="text-right">
                  <div className="text-lg font-black italic leading-none text-primary">
                    {user.totalPoints.toLocaleString()}
                  </div>
                  <div className="text-[7px] font-black text-muted-foreground uppercase tracking-widest">
                    PTS
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Leaderboards;
