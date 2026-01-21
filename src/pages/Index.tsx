import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Loader2, MapPin, Fish } from "lucide-react";

const Index = () => {
  const [catches, setCatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCatches = async () => {
      try {
        const { data, error } = await supabase
          .from('catches')
          .select(`
            id,
            species,
            location,
            weight,
            length,
            image_url, 
            created_at,
            profiles (
              display_name,
              avatar_url
            )
          `)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setCatches(data || []);
      } catch (error: any) {
        console.error("Error fetching feed:", error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCatches();
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={40} />
      </div>
    );
  }

  return (
    <div className="pb-24 pt-4 px-4 max-w-md mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-black italic tracking-tighter text-primary">CASTR NATION</h1>
      </div>

      {catches.length === 0 ? (
        <div className="text-center py-20 bg-muted rounded-3xl border-2 border-dashed">
          <Fish className="mx-auto mb-4 text-muted-foreground" size={48} />
          <p className="text-muted-foreground font-medium">Scanning the waters...<br/>No catches yet!</p>
        </div>
      ) : (
        catches.map((catchItem) => (
          <Card key={catchItem.id} className="overflow-hidden border-none shadow-xl bg-card rounded-3xl">
            <CardHeader className="p-4 flex flex-row items-center space-x-3">
              <Avatar className="h-10 w-10 border-2 border-primary">
                <AvatarImage src={catchItem.profiles?.avatar_url} />
                <AvatarFallback className="bg-primary text-white">
                  {catchItem.profiles?.display_name?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-bold text-sm leading-none">
                  {catchItem.profiles?.display_name || "New Angler"}
                </p>
                <div className="flex items-center text-[10px] text-muted-foreground mt-1">
                  <MapPin size={10} className="mr-1" />
                  {catchItem.location}
                </div>
              </div>
            </CardHeader>
            
            <div className="aspect-square w-full bg-muted overflow-hidden">
              {catchItem.image_url ? (
                <img 
                  src={catchItem.image_url} 
                  alt={catchItem.species}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Fish className="text-muted-foreground opacity-20" size={64} />
                </div>
              )}
            </div>

            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-xl font-black uppercase italic leading-none">
                  {catchItem.species}
                </h3>
                <Badge variant="secondary" className="bg-primary/10 text-primary border-none font-bold">
                  FRESHWATER
                </Badge>
              </div>
              <div className="flex gap-4 text-xs font-medium text-muted-foreground">
                <span>{catchItem.weight} lbs</span>
                <span>{catchItem.length} in</span>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
};

export default Index;
