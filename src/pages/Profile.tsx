import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, UserCircle, LogOut, Trophy, Fish, Award } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Profile = () => {
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState({ display_name: "", bio: "", catch_count: 0 });
  const { toast } = useToast();
  const navigate = useNavigate();

  // This runs every time the component loads (like switching tabs)
  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      // Fetch logic that pulls your specific data by your unique user ID
      const { data, error } = await supabase
        .from('profiles')
        .select(`display_name, bio, catches(id)`)
        .eq('id', user.id)
        .single();

      if (error) throw error;

      if (data) {
        setProfile({
          display_name: data.display_name || "New Angler",
          bio: data.bio || "No bio yet.",
          catch_count: data.catches?.length || 0
        });
      }
    } catch (error: any) {
      console.error("Fetch error:", error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Update logic using .eq('id', user.id) to match your RLS policy
      const { error } = await supabase
        .from('profiles')
        .update({ 
          display_name: profile.display_name, 
          bio: profile.bio 
        })
        .eq('id', user?.id);

      if (error) throw error;

      toast({ title: "Success", description: "Profile updated!" });
      setIsEditing(false); // Automatically closes the edit form
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;

  return (
    <div className="p-4 max-w-md mx-auto space-y-6 pb-24">
      <div className="bg-card rounded-3xl overflow-hidden shadow-xl border border-border">
        <div className="h-24 bg-slate-800" /> 
        <div className="px-6 pb-6">
          <div className="relative flex justify-between items-end -mt-12 mb-4">
            <div className="h-24 w-24 rounded-full bg-primary border-4 border-background flex items-center justify-center text-white text-3xl font-black italic">
              {profile.display_name.charAt(0).toUpperCase()}
            </div>
            <Button variant="outline" size="sm" className="rounded-full font-bold" onClick={() => setIsEditing(!isEditing)}>
              {isEditing ? "Cancel" : "Edit Profile"}
            </Button>
          </div>

          {isEditing ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-muted-foreground ml-1 text-primary">Display Name</label>
                <Input value={profile.display_name} onChange={(e) => setProfile({...profile, display_name: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-muted-foreground ml-1 text-primary">Bio</label>
                <Input value={profile.bio} onChange={(e) => setProfile({...profile, bio: e.target.value})} />
              </div>
              <Button onClick={handleUpdate} className="w-full font-black italic uppercase">Save Changes</Button>
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-black italic uppercase tracking-tighter">{profile.display_name}</h2>
                <p className="text-muted-foreground text-sm">{profile.bio}</p>
              </div>
              
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-muted p-3 rounded-2xl text-center">
                  <Trophy size={16} className="mx-auto mb-1 text-yellow-500" />
                  <div className="font-black italic">0</div>
                  <div className="text-[10px] uppercase font-bold text-muted-foreground">Points</div>
                </div>
                <div className="bg-muted p-3 rounded-2xl text-center border-x-2 border-background">
                  <Fish size={16} className="mx-auto mb-1 text-primary" />
                  <div className="font-black italic">{profile.catch_count}</div>
                  <div className="text-[10px] uppercase font-bold text-muted-foreground">Catches</div>
                </div>
                <div className="bg-muted p-3 rounded-2xl text-center">
                  <Award size={16} className="mx-auto mb-1 text-orange-500" />
                  <div className="font-black italic">0</div>
                  <div className="text-[10px] uppercase font-bold text-muted-foreground">Titles</div>
                </div>
              </div>

              <Button variant="ghost" className="w-full text-muted-foreground mt-4" onClick={() => supabase.auth.signOut()}>
                <LogOut size={16} className="mr-2" /> Sign Out
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
