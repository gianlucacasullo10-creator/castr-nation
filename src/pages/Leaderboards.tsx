import { useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { LeaderboardItem } from "@/components/LeaderboardItem";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin, Crown, Fish, ChevronDown } from "lucide-react";

// Ontario regions
const regions = [
  "Toronto",
  "Newmarket",
  "Barrie",
  "Muskoka",
  "Ottawa",
  "Hamilton",
  "London",
];

// Mock leaderboard data
const localLeaderboard = [
  { rank: 1, user: { name: "Jake Wilson", title: "Bass Master" }, points: 2450, fishCount: 67 },
  { rank: 2, user: { name: "Sarah Chen", title: "Pike Hunter" }, points: 2180, fishCount: 52 },
  { rank: 3, user: { name: "Mike Thompson", title: "Freshwater Elite" }, points: 1920, fishCount: 48 },
  { rank: 4, user: { name: "Emma Rivers", title: "Trout Whisperer" }, points: 1650, fishCount: 41 },
  { rank: 5, user: { name: "You" }, points: 1234, fishCount: 28, isCurrentUser: true },
  { rank: 6, user: { name: "Alex Kim" }, points: 1100, fishCount: 25 },
  { rank: 7, user: { name: "Jordan Lee" }, points: 980, fishCount: 22 },
  { rank: 8, user: { name: "Casey Brown" }, points: 870, fishCount: 19 },
  { rank: 9, user: { name: "Taylor Swift" }, points: 750, fishCount: 16 },
  { rank: 10, user: { name: "Morgan Chen" }, points: 620, fishCount: 14 },
];

const provincialLeaderboard = [
  { rank: 1, user: { name: "OntarioKing", title: "Provincial Champion" }, points: 8920, fishCount: 234 },
  { rank: 2, user: { name: "LakeSimcoeGuy", title: "Walleye King" }, points: 7650, fishCount: 198 },
  { rank: 3, user: { name: "MuskokaAngler", title: "Northern Legend" }, points: 6890, fishCount: 176 },
  { rank: 4, user: { name: "GTAFisher", title: "Bass Master" }, points: 5430, fishCount: 145 },
  { rank: 5, user: { name: "KawarLaker" }, points: 4980, fishCount: 132 },
  { rank: 6, user: { name: "NiagaraCaster" }, points: 4560, fishCount: 121 },
  { rank: 7, user: { name: "OttawaRiver" }, points: 4120, fishCount: 108 },
  { rank: 8, user: { name: "ThunderBayPro" }, points: 3780, fishCount: 96 },
  { rank: 9, user: { name: "You" }, points: 1234, fishCount: 28, isCurrentUser: true },
  { rank: 10, user: { name: "LondonFisher" }, points: 1100, fishCount: 25 },
];

const LeaderboardsPage = () => {
  const [selectedRegion, setSelectedRegion] = useState("Newmarket");
  const [showRegionPicker, setShowRegionPicker] = useState(false);
  const [leaderboardType, setLeaderboardType] = useState<"points" | "fish">("points");

  const sortedLocalLeaderboard = [...localLeaderboard].sort((a, b) => 
    leaderboardType === "points" ? b.points - a.points : (b.fishCount || 0) - (a.fishCount || 0)
  );

  const sortedProvincialLeaderboard = [...provincialLeaderboard].sort((a, b) => 
    leaderboardType === "points" ? b.points - a.points : (b.fishCount || 0) - (a.fishCount || 0)
  );

  return (
    <div className="app-container bg-background">
      <AppHeader title="Leaderboards" showLogo={false} showNotifications />
      
      <main className="flex-1 safe-bottom">
        <Tabs defaultValue="local" className="w-full">
          <div className="sticky top-[57px] z-30 bg-background border-b border-border px-4">
            <TabsList className="w-full h-12 p-0 bg-transparent rounded-none">
              <TabsTrigger value="local" className="flex-1 h-full rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary">
                Local
              </TabsTrigger>
              <TabsTrigger value="provincial" className="flex-1 h-full rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary">
                Ontario
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Filter Bar */}
          <div className="px-4 py-3 flex items-center gap-3 border-b border-border">
            {/* Leaderboard Type Toggle */}
            <div className="flex items-center gap-1 bg-muted rounded-full p-1">
              <button
                onClick={() => setLeaderboardType("points")}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  leaderboardType === "points" 
                    ? "bg-card text-foreground shadow-sm" 
                    : "text-muted-foreground"
                }`}
              >
                <Crown className="w-3 h-3" />
                Points
              </button>
              <button
                onClick={() => setLeaderboardType("fish")}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  leaderboardType === "fish" 
                    ? "bg-card text-foreground shadow-sm" 
                    : "text-muted-foreground"
                }`}
              >
                <Fish className="w-3 h-3" />
                Fish Count
              </button>
            </div>
          </div>

          <TabsContent value="local" className="m-0">
            {/* Region Selector */}
            <div className="px-4 py-3 border-b border-border">
              <div className="relative">
                <button
                  onClick={() => setShowRegionPicker(!showRegionPicker)}
                  className="flex items-center gap-2 px-3 py-2 bg-muted rounded-lg text-sm font-medium w-full justify-between"
                >
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-primary" />
                    <span>{selectedRegion}</span>
                  </div>
                  <ChevronDown className={`w-4 h-4 transition-transform ${showRegionPicker ? "rotate-180" : ""}`} />
                </button>
                
                {showRegionPicker && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg z-10 overflow-hidden">
                    {regions.map((region) => (
                      <button
                        key={region}
                        onClick={() => {
                          setSelectedRegion(region);
                          setShowRegionPicker(false);
                        }}
                        className={`w-full px-4 py-3 text-left text-sm hover:bg-muted transition-colors ${
                          selectedRegion === region ? "text-primary font-medium" : ""
                        }`}
                      >
                        {region}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Leaderboard */}
            <div className="p-4 space-y-2">
              <h3 className="font-semibold text-sm text-muted-foreground mb-3">
                Top Anglers in {selectedRegion}
              </h3>
              {sortedLocalLeaderboard.map((item, index) => (
                <LeaderboardItem
                  key={item.rank}
                  {...item}
                  rank={index + 1}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="provincial" className="m-0 p-4 space-y-2">
            <h3 className="font-semibold text-sm text-muted-foreground mb-3">
              Top Anglers in Ontario
            </h3>
            {sortedProvincialLeaderboard.map((item, index) => (
              <LeaderboardItem
                key={item.rank}
                {...item}
                rank={index + 1}
              />
            ))}
          </TabsContent>
        </Tabs>
      </main>
      
      <BottomNav />
    </div>
  );
};

export default LeaderboardsPage;
