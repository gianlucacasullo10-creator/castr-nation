import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { FishPost } from "@/components/FishPost";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";

const Index = () => {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchCatches();
  }, []);

  async function fetchCatches() {
    try {
      setLoading(true);
      // We fetch catches and JOIN with profiles to get the user's name/avatar
      const { data, error } = await supabase
        .from('catches')
        .select(`
          id,
          species,
          weight,
          length,
          location,
          photo_url,
          points,
          caught_at,
          user_id,
          profiles:user_id (
            display_name,
            username,
            avatar_url
          )
        `)
        .order('caught_at', { ascending: false });

      if (error) throw error;
      setPosts(data || []);
    } catch (error: any) {
      toast({
        title: "Error fetching feed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app-container bg-background">
      <AppHeader title="Castr" showLogo={true} showNotifications />
      
      <main className="flex-1 p-4 space-y-4 safe-bottom">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <Loader2 className="w-8 h-8 animate-spin mb-2" />
            <p>Scanning the waters...</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground">No catches yet.</p>
            <p className="text-sm">Be the first to post a fish!</p>
          </div>
        ) : (
          posts.map((post) => (
            <FishPost
              key={post.id}
              user={{
                name: post.profiles?.display_name || "Unknown Angler",
                username: post.profiles?.username || "angler",
                avatar_url: post.profiles?.avatar_url
              }}
              fish={{
                species: post.species,
                weight: post.weight,
                length: post.length,
                points: post.points,
                imageUrl: post.photo_url
              }}
              location={post.location}
              timeAgo={new Date(post.caught_at).toLocaleDateString()}
              likes={0} // We can wire likes later
              comments={0}
              isLiked={false}
            />
          ))
        )}
      </main>
      
      <BottomNav />
    </div>
  );
};

export default Index;
