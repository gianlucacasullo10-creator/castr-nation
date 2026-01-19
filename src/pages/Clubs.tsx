import { useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { ClubCard } from "@/components/ClubCard";
import { LeaderboardItem } from "@/components/LeaderboardItem";
import { Users, Plus, Crown, Swords, MessageSquare, ChevronLeft } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Mock club data
const myClubs = [
  {
    id: "1",
    name: "Pike Supremacy",
    memberCount: 24,
    totalPoints: 3784,
    localRank: 2,
    location: "Newmarket",
    isInBattle: true,
    battleOpponent: "Bass Bandits",
    battleScore: { us: 457, them: 389 },
  },
  {
    id: "2",
    name: "Ontario Anglers",
    memberCount: 156,
    totalPoints: 12450,
    localRank: 1,
    location: "Greater Toronto",
    isInBattle: false,
  },
];

const discoverClubs = [
  {
    id: "3",
    name: "Muskoka Masters",
    memberCount: 45,
    totalPoints: 8920,
    location: "Muskoka",
  },
  {
    id: "4",
    name: "Lake Simcoe Squad",
    memberCount: 32,
    totalPoints: 5670,
    location: "Barrie",
  },
];

const clubMembers = [
  { rank: 1, user: { name: "GL10", title: "Member" }, points: 1500, fishCount: 34 },
  { rank: 2, user: { name: "Nick", title: "Leader" }, points: 1367, fishCount: 28 },
  { rank: 3, user: { name: "Jacob", title: "Co-Leader" }, points: 789, fishCount: 19 },
  { rank: 4, user: { name: "Sammy", title: "Member" }, points: 84, fishCount: 5 },
  { rank: 5, user: { name: "You" }, points: 44, fishCount: 3, isCurrentUser: true },
];

const ClubsPage = () => {
  const [selectedClub, setSelectedClub] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("my-clubs");

  const selectedClubData = myClubs.find(c => c.id === selectedClub);

  if (selectedClub && selectedClubData) {
    return (
      <div className="app-container bg-background">
        {/* Club Detail Header */}
        <header className="sticky top-0 z-40 glass border-b border-border">
          <div className="gradient-navy">
            <div className="flex items-center gap-3 px-4 py-3">
              <button
                onClick={() => setSelectedClub(null)}
                className="p-2 -ml-2 rounded-full hover:bg-secondary-foreground/10 transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-secondary-foreground" />
              </button>
              <div className="flex-1">
                <h1 className="font-bold text-lg text-secondary-foreground">{selectedClubData.name}</h1>
                <div className="flex items-center gap-2 text-secondary-foreground/70 text-sm">
                  <Users className="w-3 h-3" />
                  <span>{selectedClubData.memberCount} members</span>
                  {selectedClubData.localRank && (
                    <>
                      <span className="opacity-50">•</span>
                      <Crown className="w-3 h-3 text-gold" />
                      <span>#{selectedClubData.localRank} in {selectedClubData.location}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            
            {/* Club Stats */}
            <div className="px-4 pb-4 flex gap-3">
              <div className="flex-1 bg-secondary-foreground/10 rounded-lg p-3 text-center">
                <p className="font-bold text-xl text-secondary-foreground">{selectedClubData.totalPoints.toLocaleString()}</p>
                <p className="text-xs text-secondary-foreground/70">Total Points</p>
              </div>
              {selectedClubData.isInBattle && (
                <div className="flex-1 bg-secondary-foreground/10 rounded-lg p-3 text-center">
                  <div className="flex items-center justify-center gap-1 text-secondary-foreground mb-1">
                    <Swords className="w-4 h-4" />
                  </div>
                  <p className="text-xs text-secondary-foreground/70">In Battle</p>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 safe-bottom">
          <Tabs defaultValue="leaderboard" className="w-full">
            <div className="sticky top-[140px] z-30 bg-background border-b border-border">
              <TabsList className="w-full h-12 p-0 bg-transparent rounded-none">
                <TabsTrigger value="leaderboard" className="flex-1 h-full rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary">
                  Leaderboard
                </TabsTrigger>
                <TabsTrigger value="battles" className="flex-1 h-full rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary">
                  Battles
                </TabsTrigger>
                <TabsTrigger value="chat" className="flex-1 h-full rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary">
                  Chat
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="leaderboard" className="m-0 p-4 space-y-2">
              {clubMembers.map((member) => (
                <LeaderboardItem
                  key={member.rank}
                  {...member}
                />
              ))}
            </TabsContent>

            <TabsContent value="battles" className="m-0 p-4">
              {selectedClubData.isInBattle ? (
                <div className="bg-card rounded-xl shadow-card p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-primary mb-4">
                    <Swords className="w-5 h-5" />
                    <span>Weekly Club Battle</span>
                  </div>
                  <div className="flex items-center justify-around">
                    <div className="text-center">
                      <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center mb-2">
                        <span className="text-primary-foreground font-bold text-lg">PS</span>
                      </div>
                      <p className="font-bold text-2xl">{selectedClubData.battleScore?.us}</p>
                      <p className="text-sm text-muted-foreground">You</p>
                    </div>
                    <div className="text-muted-foreground font-bold text-xl">VS</div>
                    <div className="text-center">
                      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-2">
                        <span className="text-muted-foreground font-bold text-lg">BB</span>
                      </div>
                      <p className="font-bold text-2xl">{selectedClubData.battleScore?.them}</p>
                      <p className="text-sm text-muted-foreground">{selectedClubData.battleOpponent}</p>
                    </div>
                  </div>
                  <p className="text-center text-sm text-muted-foreground mt-4">Ends in 3 days</p>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Swords className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No active battles</p>
                  <button className="mt-4 px-4 py-2 gradient-primary text-primary-foreground rounded-full text-sm font-medium">
                    Challenge a Club
                  </button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="chat" className="m-0 p-4">
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Club chat coming soon!</p>
              </div>
            </TabsContent>
          </Tabs>
        </main>
        
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="app-container bg-background">
      <AppHeader title="Clubs" showLogo={false} showNotifications />
      
      <main className="flex-1 safe-bottom">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="sticky top-[57px] z-30 bg-background border-b border-border px-4">
            <TabsList className="w-full h-12 p-0 bg-transparent rounded-none">
              <TabsTrigger value="my-clubs" className="flex-1 h-full rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary">
                My Clubs
              </TabsTrigger>
              <TabsTrigger value="discover" className="flex-1 h-full rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary">
                Discover
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="my-clubs" className="m-0 p-4 space-y-4">
            {myClubs.map((club) => (
              <ClubCard
                key={club.id}
                {...club}
                onClick={() => setSelectedClub(club.id)}
              />
            ))}
            
            {/* Create Club Button */}
            <button className="w-full p-4 border-2 border-dashed border-border rounded-xl flex items-center justify-center gap-2 text-muted-foreground hover:border-primary hover:text-primary transition-colors">
              <Plus className="w-5 h-5" />
              <span className="font-medium">Create a Club</span>
            </button>
          </TabsContent>

          <TabsContent value="discover" className="m-0 p-4 space-y-4">
            {discoverClubs.map((club) => (
              <ClubCard
                key={club.id}
                {...club}
              />
            ))}
          </TabsContent>
        </Tabs>
      </main>
      
      <BottomNav />
    </div>
  );
};

export default ClubsPage;
