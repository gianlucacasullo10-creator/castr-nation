import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, UserCircle, LogOut } from "lucide-react";

const Profile = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState({ display_name: "", bio: "" });
  const { toast } = useToast();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (data) {
        setProfile({ display_name: data.display_name || "", bio: data.bio || "" });
      }
    }
    setLoading(false);
  };

  const handleUpdate = async () => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast({ title: "Error", description: "You must be logged in", variant: "destructive" });
      setSaving(false);
      return;
    }

    const { error } = await supabase
      .from('profiles')
      .update({ display_name: profile.display_name, bio: profile.bio })
      .eq('id', user.id);

    if (error) {
      toast({ title: "Save Failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Profile saved!" });
      setIsEditing(false);
      fetchProfile(); // Force refresh the data
    }
    setSaving(false);
  };

  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="p-4 max-w-md mx-auto space-y-6 pb-24 min-h-screen bg-background">
      <div className="bg-card rounded-3xl p-6 border-2 border-border shadow-sm">
        <div className="flex flex-col items-center space-y-4">
          <UserCircle size={80} className="text-muted-foreground" />
          <h1 className="text-2xl font-black italic uppercase italic tracking-tighter">My Profile</h1>
          
          {isEditing ? (
            <div className="w-full space-y-4">
              <Input value={profile.display_name} onChange={(e) => setProfile({...profile, display_name: e.target.value})} placeholder="Username" />
              <Input value={profile.bio} onChange={(e) => setProfile({...profile, bio: e.target.value})} placeholder="Bio" />
              <Button onClick={handleUpdate} className="w-full font-bold uppercase italic" disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </Button>
              <Button variant="ghost" onClick={() => setIsEditing(false)} className="w-full text-xs underline">Cancel</Button>
            </div>
          ) : (
            <div className="w-full text-center space-y-4">
              <div>
                <p className="text-xl font-black italic uppercase tracking-tighter">{profile.display_name || "New Angler"}</p>
                <p className="text-sm text-muted-foreground">{profile.bio || "No bio set."}</p>
              </div>
              <Button onClick={() => setIsEditing(true)} variant="outline" className="w-full font-bold rounded-xl">EDIT PROFILE</Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
