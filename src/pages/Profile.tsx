import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { ProfileHeader } from "@/components/ProfileHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";

const ProfilePage = () => {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    getProfile();
  }, []);

  async function getProfile() {
    try {
      setLoading(true);
      // 1. Get the current logged-in user's ID
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // 2. Fetch the row from your 'profiles' table
        let { data, error } = await supabase
          .from('profiles')
          .select(`username, display_name, bio, avatar_url`)
          .eq('id', user.id) // or user_id depending on your RLS
          .single();

        if (error) throw error;
        setProfile(data);
      }
    } catch (error: any) {
      toast({
        title: "Error loading profile",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="flex h-screen items-center justify-center">Loading Castr Profile...</div>;
  }

  return (
    <div className="app-container bg-background">
      <AppHeader title="Profile" showLogo={false} showNotifications />
      
      <main className="flex-1 safe-bottom">
        <div className="p-4">
          <ProfileHeader
            user={{
              name: profile?.display_name || "New Angler",
              username: profile?.username || "username",
              bio: profile?.bio || "No bio yet. Tap edit to add one!",
              avatar_url: profile?.avatar_url
            }}
            stats={{ totalPoints: 0, fishCaught: 0, titlesUnlocked: 0 }} // We will wire these next
            onEditProfile={() => console.log("Now we can build the Edit Modal!")}
          />
        </div>

        <Tabs defaultValue="catches" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="catches">Catches</TabsTrigger>
            <TabsTrigger value="titles">Titles</TabsTrigger>
          </TabsList>
          <TabsContent value="catches" className="p-4">
            <p className="text-center text-muted-foreground">No catches yet. Go fishing!</p>
          </TabsContent>
          <TabsContent value="titles" className="p-4">
            <p className="text-center text-muted-foreground">Unlock titles by catching fish.</p>
          </TabsContent>
        </Tabs>
      </main>
      
      <BottomNav />
    </div>
  );
};

export default ProfilePage;
