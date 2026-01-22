import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Award, Star, Settings } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const TITLE_LIBRARY: Record<string, { desc: string; color: string }> = {
  "Beginner": { desc: "Just started the journey.", color: "text-muted-foreground" },
  "OG CASTR": { desc: "One of the first 1,000 members.", color: "text-yellow-500" },
  "Fingerling": { desc: "Logged 5 verified catches.", color: "text-blue-400" },
  "Bass Master": { desc: "Master of the local ponds.", color: "text-green-500" }
};

const Profile = () => {
  const [profile, setProfile] = useState<any>(null);
  const [catches, setCatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data: p } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        const { data: c } = await supabase.from('catches').select('*').eq('user_id', user.id).order('points', { ascending: false });
        setProfile(p);
        setCatches(c || []);
      } finally { setLoading(false); }
    };
    fetchProfileData();
  }, []);

  const handleEquipTitle = async (title: string) => {
    const { error } = await supabase.from('profiles').update({ active_title: title }).eq('id', profile.id);
    if (!error) {
      setProfile({ ...profile, active_title: title });
      toast({ title: "Title Equipped!", description: `Now active: ${title}` });
    }
  };

  if (loading) return <div className="p-8 text-center font-black italic">LOADING...</div>;

  return (
    <div className="pb-24 pt-6 px-4 max-w-md mx-auto space-y-8">
      <div className="flex flex-col items-center text-center space-y-4">
        <Avatar className="h-28 w-28 border-4 border-primary">
          <AvatarImage src={profile?.avatar_url} />
          <AvatarFallback className="text-2xl font-bold">{profile?.display_name?.charAt(0)}</AvatarFallback>
        </Avatar>
        <div>
          <h2 className="text-3xl font-black italic uppercase tracking-tighter">{profile?.display_name}</h2>
          <Badge className="mt-2 bg-primary text-black font-black italic px-4 py-1 rounded-full text-[10px] tracking-widest uppercase shadow-lg">
            {profile?.active_title || 'Beginner'}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Card className="bg-card border-none p-4 flex flex-col items-center rounded-3xl">
          <span className="text-2xl font-black italic text-primary">{catches.reduce((s, c) => s + (c.points || 0), 0)}</span>
          <span className="text-[9px] font-black uppercase text-muted-foreground">Total Pts</span>
        </Card>
        <Card className="bg-card border-none p-4 flex flex-col items-center rounded-3xl">
          <span className="text-2xl font-black italic text-primary">{catches.length}</span>
          <span className="text-[9px] font-black uppercase text-muted-foreground">Catches</span>
        </Card>
      </div>

      <div className="space-y-4">
        <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
          <Award size={14} className="text-primary" /> Title Inventory
        </h3>
        <div className="grid grid-cols-1 gap-2">
          {profile?.unlocked_titles?.map((title: string) => (
            <button key={title} onClick={() => handleEquipTitle(title)} className={`p-4 rounded-3xl border-2 transition-all flex flex-col items-start ${profile.active_title === title ? "border-primary bg-primary/5" : "border-border bg-card"}`}>
              <div className="flex items-center gap-2">
                <span className={`font-black italic uppercase text-xs ${TITLE_LIBRARY[title]?.color || 'text-primary'}`}>{title}</span>
                {profile.active_title === title && <Star size={10} className="fill-primary text-primary" />}
              </div>
              <p className="text-[10px] font-medium text-muted-foreground">{TITLE_LIBRARY[title]?.desc || "Special title."}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Profile;
