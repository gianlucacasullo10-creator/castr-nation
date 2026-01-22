import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Loader2, MapPin, Fish, Heart, MessageCircle, Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const Index = () => {
  const [catches, setCatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchCatches = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);

      const { data, error } = await supabase
        .from('catches')
        .select(`
          *,
          profiles:user_id (display_name, avatar_url),
          likes (user_id)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const catchesWithLikeStatus = data?.map(c => ({
        ...c,
        hasLiked: c.likes?.some((l: any) => l.user_id === user?.id),
        likesCount: c.likes?.length || 0
      }));

      setCatches(catchesWithLikeStatus || []);
    } catch (error: any) {
      console.error("Error fetching feed:", error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCatches();
  }, []);

  const toggleLike = async (catchId: string) => {
    if (!currentUserId) return;

    try {
      const catchItem = catches.find(c => c.id === catchId);
      if (!catchItem) return;

      if (catchItem.hasLiked) {
        await supabase
          .from('likes')
          .delete()
          .eq('user_id', currentUserId)
          .eq('catch_id', catchId);
      } else {
        await supabase
          .from('likes')
          .insert([{ user_id: currentUserId, catch_id: catchId }]);
      }
      
      fetchCatches(); 
    } catch (error) {
      console.error("Like error:", error);
    }
  };

  const deleteCatch = async (catchId: string, ownerId: string) => {
    if (currentUserId !== ownerId) return;

    if (window.confirm("Remove this trophy from the nation?")) {
      const { error } = await supabase.from('catches').delete().eq('id', catchId);
      if (!error) {
        toast({ title: "Catch Deleted" });
        fetchCatches();
      }
    }
  };

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

      {catches.length
