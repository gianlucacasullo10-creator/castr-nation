import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { ProfileHeader, TitleBadgeItem } from "@/components/ProfileHeader";
import { FishPost } from "@/components/FishPost";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import fishBass from "@/assets/fish-bass.jpg";
import fishTrout from "@/assets/fish-trout.jpg";

const mockUser = {
  name: "Alex Johnson",
  username: "alexfishes",
  title: "Bass Slayer",
  bio: "Ontario angler since 2018 🎣 Pike Supremacy member. Chasing that PB largemouth!",
};

const mockStats = {
  totalPoints: 1234,
  fishCaught: 28,
  titlesUnlocked: 4,
};

const titles = [
  {
    title: "Bass Slayer",
    description: "Catch 10 largemouth bass",
    isUnlocked: true,
  },
  {
    title: "Pike Hunter",
    description: "Catch a pike over 30 inches",
    isUnlocked: true,
  },
  {
    title: "Early Bird",
    description: "Post a catch before 6 AM",
    isUnlocked: true,
  },
  {
    title: "Freshwater Elite",
    description: "Earn 5000 total points",
    isUnlocked: false,
    progress: 1234,
    maxProgress: 5000,
  },
  {
    title: "Century Angler",
    description: "Catch 100 fish",
    isUnlocked: false,
    progress: 28,
    maxProgress: 100,
  },
  {
    title: "Master Caster",
    description: "Win a club battle",
    isUnlocked: true,
  },
];

const userPosts = [
  {
    id: "u1",
    user: mockUser,
    fish: {
      species: "Largemouth Bass",
      weight: "3.8 lbs",
      length: "17 inches",
      points: 125,
      imageUrl: fishBass,
    },
    likes: 24,
    comments: 6,
    isLiked: false,
    timeAgo: "2d ago",
  },
  {
    id: "u2",
    user: mockUser,
    fish: {
      species: "Rainbow Trout",
      weight: "2.4 lbs",
      length: "15 inches",
      points: 89,
      imageUrl: fishTrout,
    },
    likes: 18,
    comments: 3,
    isLiked: true,
    timeAgo: "5d ago",
  },
];

const ProfilePage = () => {
  return (
    <div className="app-container bg-background">
      <AppHeader title="Profile" showLogo={false} showNotifications />
      
      <main className="flex-1 safe-bottom">
        <div className="p-4">
          <ProfileHeader
            user={mockUser}
            stats={mockStats}
            onEditProfile={() => console.log("Edit profile")}
          />
        </div>

        <Tabs defaultValue="catches" className="w-full">
          <div className="sticky top-[57px] z-30 bg-background border-b border-border px-4">
            <TabsList className="w-full h-12 p-0 bg-transparent rounded-none">
              <TabsTrigger value="catches" className="flex-1 h-full rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary">
                Catches
              </TabsTrigger>
              <TabsTrigger value="titles" className="flex-1 h-full rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary">
                Titles
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="catches" className="m-0 p-4 space-y-4">
            {userPosts.map((post) => (
              <FishPost
                key={post.id}
                {...post}
              />
            ))}
          </TabsContent>

          <TabsContent value="titles" className="m-0 p-4 space-y-3">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-sm text-muted-foreground">
                Your Titles
              </h3>
              <span className="text-sm text-primary font-medium">
                {titles.filter(t => t.isUnlocked).length}/{titles.length} Unlocked
              </span>
            </div>
            {titles.map((title) => (
              <TitleBadgeItem
                key={title.title}
                {...title}
              />
            ))}
          </TabsContent>
        </Tabs>
      </main>
      
      <BottomNav />
    </div>
  );
};

export default ProfilePage;
