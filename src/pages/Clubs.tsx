import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Users, ShieldCheck, Loader2, MapPin, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const Clubs = () => {
  const [clubs, setClubs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newClubName, setNewClubName] = useState("");
  const [newClubDescription, setNewClubDescription] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    fetchClubs();
  }, []);

  const fetchClubs = async () => {
    const { data, error } = await supabase.from('clubs').select('*');
    if (!error && data) setClubs(data);
    setLoading(false);
  };

  const handleCreateClub = async () => {
    if (!newClubName.trim()) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('clubs')
        .insert([
          { 
            name: newClubName, 
            description: newClubDescription,
            created_by: user?.id 
          }
        ]);

      if (error) throw error;

      toast({ title: "Success!", description: `${newClubName} has been created.` });
      setNewClubName("");
      setNewClubDescription("");
      setIsDialogOpen(false);
      fetchClubs(); // Refresh the list
    } catch (error: any) {
      toast({ 
        title: "Error", 
        description: error.message, 
        variant: "destructive" 
      });
    }
  };

  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;

  return (
    <div className="p-4 max-w-md mx-auto space-y-6 pb-24 min-h-screen bg-background">
      <div className="flex items-center justify-between pt-4">
        <div className="flex items-center gap-2">
          <Users className="text-primary" />
          <h1 className="text-2xl font-black italic tracking-tighter uppercase">Clubs</h1>
        </div>

        {/* Create Club Popup */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="rounded-full h-10 w-10 p-0 shadow-lg border-2 border-background">
              <Plus size={20} />
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-3xl max-w-[90%] mx-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-black italic uppercase italic">Create a Club</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase ml-1">Club Name</Label>
                <Input 
                  placeholder="e.g. Bass Masters" 
                  value={newClubName}
                  onChange={(e) => setNewClubName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase ml-1">Description</Label>
                <Input 
                  placeholder="What is this club about?" 
                  value={newClubDescription}
                  onChange={(e) => setNewClubDescription(e.target.value)}
                />
              </div>
              <Button onClick={handleCreateClub} className="w-full font-black italic uppercase py-6 text-lg">
                Establish Club
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      
      <div className="grid gap-4">
        {clubs.map((club) => (
          <div key={club.id} className="bg-card border-2 border-border p-5 rounded-3xl shadow-sm">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <h3 className="font-black italic uppercase text-xl leading-none">{club.name}</h3>
                <p className="text-xs text-muted-foreground font-medium">{club.description}</p>
                <div className="flex items-center gap-1 pt-2">
                  <MapPin size={10} className="text-primary" />
                  <span className="text-[10px] font-bold text-primary uppercase">Global Region</span>
                </div>
              </div>
              <div className="h-12 w-12 bg-primary/5 rounded-2xl flex items-center justify-center border border-primary/10">
                <ShieldCheck className="text-primary" size={24} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Clubs;
