import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, UserCircle, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Profile = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const { toast } = useToast();
  const navigate = useNavigate();

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

      const { data, error } = await supabase
        .from('profiles')
        .select('display_name, bio')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      
      if (data) {
        setDisplayName(data.display_name || "");
        setBio(data.bio || "");
      }
    } catch (error: any) {
      console.error("Error fetching profile:", error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // This .update().eq() method matches your "Allow update for owner" policy
      const { error } = await supabase
        .from('profiles')
        .update({ 
          display_name: displayName, 
          bio: bio 
        })
        .eq('id', user?.id);

      if (error) throw error;

      toast({ title: "Success", description: "Profile updated successfully!" });
    } catch (error: any) {
      toast({ 
        title: "Update Failed", 
        description: error.message, 
        variant: "destructive" 
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={40} />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-md mx-auto min-h-screen bg-background pb-24 space-y-8">
      {/* Profile Header */}
      <div className="flex flex-col items-center space-y-4 pt-4">
        <div className="relative">
          <UserCircle size={100} className="text-muted-foreground" />
          <div className="absolute bottom-0 right-0 bg-primary h-6 w-6 rounded-full border-4 border-background" />
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-black italic uppercase tracking-tighter">Profile Settings</h1>
          <p className="text-xs text-muted-foreground font-bold tracking-widest uppercase">Angler Identity</p>
        </div>
      </div>

      {/* Form Fields */}
      <div className="space-y-6">
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
            Display Name
          </label>
          <Input 
            value={displayName} 
            onChange={(e) => setDisplayName(e.target.value)} 
            placeholder="Username" 
            className="rounded-2xl border-2 h-12 focus-visible:ring-primary"
          />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
            Bio
          </label>
          <Input 
            value={bio} 
            onChange={(e) => setBio(e.target.value)} 
            placeholder="Tell us about your fishing style..." 
            className="rounded-2xl border-2 h-12 focus-visible:ring-primary"
          />
        </div>

        <div className="pt-4 space-y-3">
          <Button 
            onClick={handleUpdate} 
            className="w-full font-black h-14 rounded-2xl shadow-lg text-lg italic uppercase" 
            disabled={saving}
          >
            {saving ? <Loader2 className="animate-spin mr-2" /> : null}
            Save Changes
          </Button>

          <Button 
            variant="ghost" 
            onClick={handleSignOut} 
            className="w-full text-muted-foreground font-bold hover:text-destructive"
          >
            <LogOut size={18} className="mr-2" />
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
