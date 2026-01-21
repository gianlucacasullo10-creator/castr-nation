import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Settings } from "lucide-react";

const Profile = () => {
  const [loading, setLoading] = useState(true);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    getProfile();
  }, []);

  async function getProfile() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('display_name, bio')
        .eq('id', user.id)
        .single();

      if (data) {
        setDisplayName(data.display_name || "");
        setBio(data.bio || "");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  async function updateProfile() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    const { error } = await supabase.from('profiles').upsert({
      id: user?.id,
      display_name: displayName,
      bio: bio,
      updated_at: new Date().toISOString(),
    });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Profile updated!" });
    }
    setLoading(false);
  }

  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="p-6 max-w-md mx-auto space-y-6">
      <h1 className="text-2xl font-bold italic">EDIT PROFILE</h1>
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium">Display Name</label>
          <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="e.g. BassMaster99" />
        </div>
        <div>
          <label className="text-sm font-medium">Bio</label>
          <Input value={bio} onChange={(e) => setBio(e.target.value)} placeholder="I love topwater fishing..." />
        </div>
        <Button onClick={updateProfile} className="w-full" disabled={loading}>
          {loading ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
};

export default Profile;
