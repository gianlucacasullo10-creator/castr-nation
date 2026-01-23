// ... (Keep existing imports)
import { useToast } from "@/components/ui/use-toast";

const Clubs = () => {
  const [clubs, setClubs] = useState<any[]>([]);
  const [selectedClub, setSelectedClub] = useState<any>(null);
  const [clubMembers, setClubMembers] = useState<any[]>([]);
  const [isMember, setIsMember] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchClubs = async () => {
    setLoading(true);
    const { data } = await supabase.from('clubs').select('*');
    setClubs(data || []);
    setLoading(false);
  };

  const fetchClubDetails = async (club: any) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // 1. Get member IDs
      const { data: memberships } = await supabase
        .from('club_members')
        .select('user_id')
        .eq('club_id', club.id);

      const memberIds = memberships?.map(m => m.user_id) || [];
      setIsMember(memberIds.includes(user?.id));

      // 2. Get profile and catch data for those members
      const { data: profiles } = await supabase.from('profiles').select('id, display_name, avatar_url, active_title');
      const { data: catches } = await supabase.from('catches').select('user_id, points').in('user_id', memberIds);

      const memberStats = (profiles || [])
        .filter(p => memberIds.includes(p.id))
        .map(p => ({
          ...p,
          totalPoints: (catches || []).filter(c => c.user_id === p.id).reduce((acc, curr) => acc + (curr.points || 0), 0)
        })).sort((a, b) => b.totalPoints - a.totalPoints);

      setClubMembers(memberStats);
      setSelectedClub(club);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const handleJoinClub = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (isMember) {
        // Leave logic
        await supabase.from('club_members').delete().eq('user_id', user.id).eq('club_id', selectedClub.id);
        toast({ title: "Left Club", description: `You are no longer in ${selectedClub.name}` });
      } else {
        // Join logic
        await supabase.from('club_members').insert([{ user_id: user.id, club_id: selectedClub.id }]);
        toast({ title: "Joined Club!", description: `Welcome to ${selectedClub.name}!` });
      }
      
      fetchClubDetails(selectedClub); // Refresh the view
    } catch (err) {
      toast({ variant: "destructive", title: "Action Failed" });
    }
  };

  useEffect(() => { fetchClubs(); }, []);

  // ... (Keep existing Loading and List view)

  return (
    <div className="pb-24 pt-4 px-4 max-w-md mx-auto space-y-6">
      {!selectedClub ? (
        // ... (Keep Directory View code here)
      ) : (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
          <button onClick={() => setSelectedClub(null)} className="flex items-center gap-2 text-primary font-black uppercase italic text-xs">
            <ChevronLeft size={16} /> Back to Directory
          </button>

          <div className="flex justify-between items-end">
            <div className="text-left space-y-1">
              <h1 className="text-3xl font-black italic uppercase tracking-tighter leading-none">{selectedClub.name}</h1>
              <p className="text-[10px] font-bold text-muted-foreground uppercase">{selectedClub.region}</p>
            </div>
            <Button 
              onClick={handleJoinClub} 
              variant={isMember ? "outline" : "default"}
              className="rounded-xl font-black italic uppercase text-xs h-9"
            >
              {isMember ? "Leave" : "Join Club"}
            </Button>
          </div>

          {/* ... (Keep Battle Preview and Member List code here) */}
        </div>
      )}
    </div>
  );
};
