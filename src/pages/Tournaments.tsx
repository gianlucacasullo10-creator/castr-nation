import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { 
  Trophy, 
  Calendar, 
  MapPin, 
  Users, 
  Gift,
  ExternalLink,
  Clock
} from "lucide-react";

const Tournaments = () => {
  const { toast } = useToast();
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every second for countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Calculate countdown
  const getCountdown = (startDate: string, endDate: string) => {
    const now = currentTime.getTime();
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();

    if (now < start) {
      // Tournament hasn't started - countdown to start
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
      // Tournament is active - countdown to end
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
      // Tournament has ended
      return {
        status: 'ended',
        label: 'Ended',
        time: ''
      };
    }
  };

  // Tournament data - will be from database later
  const tournaments = [
    {
      id: 1,
      name: "Largest Bass Challenge",
      sponsor: "CASTRS Official",
      sponsorLogo: "🎣",
      description: "Catch the biggest largemouth bass to win exclusive legendary gear!",
      startDate: "March 1, 2026",
      endDate: "March 14, 2026",
      status: "upcoming",
      participants: 0,
      maxParticipants: null, // Unlimited
      prizes: [
        { place: "1st", reward: "Limited Edition 1/1 Legendary Rod", value: 100 },
        { place: "2nd", reward: "Limited Edition 1/1 Epic Lure", value: 50 },
        { place: "3rd", reward: "1,500 Fish Points", value: 15 },
        { place: "4th-10th", reward: "500 Fish Points", value: 5 },
        { place: "11th-50th", reward: "250 Fish Points", value: 2 },
      ],
      rules: [
        "Must catch largemouth bass only",
        "Largest bass by weight/points wins",
        "AI verification required for all catches",
        "Top 10 entries will be manually reviewed",
        "Catches must be submitted during tournament dates",
        "Account must be in good standing"
      ],
      sponsorLink: null
    }
  ];

  const handleJoinTournament = (tournamentId: number) => {
    // TODO: Implement tournament joining logic
    toast({
      title: "Coming Soon!",
      description: "Tournament registration will be available soon.",
    });
  };

  const getStatusBadge = (countdown: { status: string; label: string; time: string }) => {
    switch (countdown.status) {
      case "active":
        return (
          <div className="text-right">
            <Badge className="bg-green-500 text-white border-none font-black text-xs mb-1">🔴 LIVE</Badge>
            <p className="text-xs font-bold text-muted-foreground">{countdown.label}</p>
            <p className="text-sm font-black text-primary">{countdown.time}</p>
          </div>
        );
      case "upcoming":
        return (
          <div className="text-right">
            <Badge className="bg-blue-500 text-white border-none font-black text-xs mb-1">📅 UPCOMING</Badge>
            <p className="text-xs font-bold text-muted-foreground">{countdown.label}</p>
            <p className="text-sm font-black text-primary">{countdown.time}</p>
          </div>
        );
      case "ended":
        return (
          <div className="text-right">
            <Badge className="bg-gray-500 text-white border-none font-black text-xs">⏹️ ENDED</Badge>
          </div>
        );
      default:
        return null;
    }
  };

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
      <div className="space-y-4">
        {tournaments.map((tournament) => {
          const countdown = getCountdown(tournament.startDate, tournament.endDate);
          
          return (
            <Card 
              key={tournament.id}
              className="border-2 border-muted rounded-[32px] overflow-hidden"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-primary/20 to-purple-500/20 p-6 border-b-2 border-muted">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-4xl">{tournament.sponsorLogo}</span>
                    <div>
                      <h3 className="text-lg font-black italic uppercase leading-none">
                        {tournament.name}
                      </h3>
                      <p className="text-xs font-bold text-muted-foreground mt-1">
                        Sponsored by {tournament.sponsor}
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
                    <p className="text-xs font-black">{tournament.startDate}</p>
                    <p className="text-xs font-black">to {tournament.endDate}</p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <Users size={16} className="text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-muted-foreground uppercase">Participants</p>
                    <p className="text-xs font-black">
                      {tournament.participants} {tournament.maxParticipants ? `/ ${tournament.maxParticipants}` : '(Unlimited)'}
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
                  {tournament.prizes.map((prize, index) => (
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
                  {tournament.rules.map((rule, index) => (
                    <li key={index} className="text-xs text-muted-foreground flex items-start gap-2">
                      <span className="text-primary mt-0.5">•</span>
                      <span>{rule}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button
                  onClick={() => handleJoinTournament(tournament.id)}
                  disabled={countdown.status === "ended"}
                  className="flex-1 h-12 rounded-2xl bg-primary hover:bg-primary/90 text-black font-black uppercase text-xs disabled:opacity-50"
                >
                  {countdown.status === "active" ? "Join Now" : countdown.status === "upcoming" ? "Register" : "Tournament Ended"}
                </Button>

                {tournament.sponsorLink && (
                  <Button
                    variant="outline"
                    className="h-12 px-4 rounded-2xl font-bold"
                    onClick={() => window.open(tournament.sponsorLink, '_blank')}
                  >
                    <ExternalLink size={16} />
                  </Button>
                )}
              </div>
            </div>
          </Card>
          );
        })}
      </div>

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
