import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";

const Profile = () => {
  const [loading, setLoading] = useState(true);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        if (data) {
          setDisplayName(data.display_name || "");
          setBio(data.bio || "");
        }
      }
      setLoading(false);
    };
    fetchProfile();
  }, []);

  const handleUpdate = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    // We use .update() specifically. This matches the UPDATE policy you just made.
    const { error } = await supabase
      .from('profiles')
      .update({ display_name: displayName, bio: bio })
      .eq('id', user?.id);

    if (error) {
      toast({ title: "Update Failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Profile saved!" });
    }
    setLoading(false);
  };

  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="p-6 max-w-md mx-auto space-y-4 pb-24">
      <h1 className="text-2xl font-black italic uppercase">Profile Settings</h1>
      <div className="space-y-2">
        <label className="text-xs font-bold uppercase text-muted-foreground">Display Name</label>
        <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
      </div>
      <div className="space-y-2">
        <label className="text-xs font-bold uppercase text-muted-foreground">Bio</label>
        <Input value={bio} onChange={(e) => setBio(e.target.value)} />
      </div>
      <Button onClick={handleUpdate} className="w-full font-bold" disabled={loading}>
        {loading ? "Saving..." : "SAVE CHANGES"}
      </Button>
    </div>
  );
};

export default Profile;
