import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";
import { getStorageUrl } from '@/utils/storage';
import {
  Shield,
  CheckCircle2,
  XCircle,
  Loader2,
  MapPin,
  Calendar,
  Trophy,
  User,
  ChevronDown,
  ChevronUp
} from "lucide-react";

interface TournamentCatch {
  id: string;
  tournament_id: string;
  user_id: string;
  catch_id: string;
  size_score: number;
  status: string;
  created_at: string;
  tournament: {
    name: string;
    species_filter: string;
  };
  user: {
    display_name: string;
    username: string;
    avatar_url: string;
  };
  catch: {
    species: string;
    points: number;
    image_url: string;
    location_name: string;
    location_city: string;
    created_at: string;
  };
}

const AdminReview = () => {
  const [pendingCatches, setPendingCatches] = useState<TournamentCatch[]>([]);
  const [approvedCatches, setApprovedCatches] = useState<TournamentCatch[]>([]);
  const [rejectedCatches, setRejectedCatches] = useState<TournamentCatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [reviewNotes, setReviewNotes] = useState<{ [key: string]: string }>({});
  const [expandedImage, setExpandedImage] = useState<string | null>(null);
  const [showApproved, setShowApproved] = useState(false);
  const [showRejected, setShowRejected] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    checkAdminStatus();
  }, []);

  const checkAdminStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/');
        return;
      }

      // Check if user is admin
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single();

      if (!profile?.is_admin) {
        toast({
          variant: "destructive",
          title: "Access Denied",
          description: "You don't have admin privileges"
        });
        navigate('/');
        return;
      }

      setIsAdmin(true);
      fetchTournamentCatches();
    } catch (error) {
      console.error('Error checking admin status:', error);
      navigate('/');
    }
  };

  const fetchTournamentCatches = async () => {
    try {
      setLoading(true);

      // Fetch all tournament catches with related data
      // Need to specify which foreign key to use for profiles (user_id vs reviewed_by)
      const { data, error } = await supabase
        .from('tournament_catches')
        .select(`
          *,
          tournament:tournaments(name, species_filter),
          user:profiles!tournament_catches_user_id_fkey(display_name, username, avatar_url),
          catch:catches(species, points, image_url, location_name, location_city, created_at)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase error details:', error);
        throw error;
      }

      if (data) {
        // Separate by status
        setPendingCatches(data.filter(c => c.status === 'pending'));
        setApprovedCatches(data.filter(c => c.status === 'approved'));
        setRejectedCatches(data.filter(c => c.status === 'rejected'));
      }
    } catch (error: any) {
      console.error('Error fetching catches:', error);
      
      // More detailed error message
      let errorMessage = "Failed to load tournament submissions";
      if (error.message) {
        errorMessage = error.message;
      }
      if (error.code === 'PGRST116') {
        errorMessage = "Tournament tables not found. Please run the database setup script.";
      }
      if (error.code === '42P01') {
        errorMessage = "Tournament tables don't exist. Please run tournament_schema.sql in Supabase.";
      }
      
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage,
        duration: 10000
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (catchSubmission: TournamentCatch, rank?: number) => {
    setProcessingId(catchSubmission.id);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from('tournament_catches')
        .update({
          status: 'approved',
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
          reviewer_notes: reviewNotes[catchSubmission.id] || null,
          rank_position: rank || null
        })
        .eq('id', catchSubmission.id);

      if (error) throw error;

      toast({
        title: "Approved! ✅",
        description: `${catchSubmission.user.display_name}'s catch has been approved`
      });

      fetchTournamentCatches();
      setReviewNotes(prev => {
        const newNotes = { ...prev };
        delete newNotes[catchSubmission.id];
        return newNotes;
      });
    } catch (error: any) {
      console.error('Error approving catch:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to approve catch"
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (catchSubmission: TournamentCatch) => {
    if (!reviewNotes[catchSubmission.id]) {
      toast({
        variant: "destructive",
        title: "Notes Required",
        description: "Please provide a reason for rejection"
      });
      return;
    }

    setProcessingId(catchSubmission.id);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from('tournament_catches')
        .update({
          status: 'rejected',
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
          reviewer_notes: reviewNotes[catchSubmission.id]
        })
        .eq('id', catchSubmission.id);

      if (error) throw error;

      toast({
        title: "Rejected",
        description: `${catchSubmission.user.display_name}'s catch has been rejected`
      });

      fetchTournamentCatches();
      setReviewNotes(prev => {
        const newNotes = { ...prev };
        delete newNotes[catchSubmission.id];
        return newNotes;
      });
    } catch (error: any) {
      console.error('Error rejecting catch:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to reject catch"
      });
    } finally {
      setProcessingId(null);
    }
  };

  const getImageUrl = (path: string) => {
    return getStorageUrl('catch_photos', path);
  };

  const renderCatchCard = (catchSubmission: TournamentCatch, showActions: boolean = true) => (
    <Card key={catchSubmission.id} className="border-2 border-muted rounded-[32px] overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/10 to-purple-500/10 p-4 border-b border-muted">
        <div className="flex items-center gap-3 mb-2">
          <img
            src={catchSubmission.user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${catchSubmission.user.username}`}
            alt={catchSubmission.user.display_name}
            className="w-10 h-10 rounded-full border-2 border-primary"
          />
          <div className="flex-1">
            <h3 className="font-black text-sm">{catchSubmission.user.display_name}</h3>
            <p className="text-xs text-muted-foreground">@{catchSubmission.user.username}</p>
          </div>
          <Badge 
            className={`font-black text-xs ${
              catchSubmission.status === 'approved' ? 'bg-green-500' :
              catchSubmission.status === 'rejected' ? 'bg-red-500' :
              'bg-yellow-500'
            }`}
          >
            {catchSubmission.status.toUpperCase()}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Trophy size={14} className="text-primary" />
          <span className="text-xs font-bold">{catchSubmission.tournament.name}</span>
        </div>
      </div>

      {/* Catch Image */}
      <div 
        className="relative aspect-square bg-muted cursor-pointer"
        onClick={() => setExpandedImage(
          expandedImage === catchSubmission.id ? null : catchSubmission.id
        )}
      >
        <img
          src={getImageUrl(catchSubmission.catch.image_url)}
          alt={catchSubmission.catch.species}
          className="w-full h-full object-cover"
        />
        {expandedImage === catchSubmission.id && (
          <div className="absolute inset-0 bg-black/90 flex items-center justify-center p-4 z-10">
            <img
              src={getImageUrl(catchSubmission.catch.image_url)}
              alt={catchSubmission.catch.species}
              className="max-w-full max-h-full object-contain"
            />
          </div>
        )}
      </div>

      {/* Details */}
      <div className="p-4 space-y-3">
        {/* Species & Points */}
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-black text-lg uppercase italic">{catchSubmission.catch.species}</h4>
            <p className="text-xs text-muted-foreground">Species</p>
          </div>
          <div className="text-right">
            <p className="font-black text-2xl text-primary">{catchSubmission.size_score}</p>
            <p className="text-xs text-muted-foreground">Size Score</p>
          </div>
        </div>

        {/* Location & Date */}
        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-muted">
          <div className="flex items-start gap-2">
            <MapPin size={14} className="text-muted-foreground mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-bold">{catchSubmission.catch.location_city || 'Unknown'}</p>
              <p className="text-[10px] text-muted-foreground">Location</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Calendar size={14} className="text-muted-foreground mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-bold">
                {new Date(catchSubmission.catch.created_at).toLocaleDateString()}
              </p>
              <p className="text-[10px] text-muted-foreground">Caught</p>
            </div>
          </div>
        </div>

        {/* Review Notes Input */}
        {showActions && (
          <div className="pt-3">
            <label className="text-xs font-bold text-muted-foreground uppercase mb-2 block">
              Review Notes {catchSubmission.status === 'pending' && '(Required for rejection)'}
            </label>
            <Textarea
              value={reviewNotes[catchSubmission.id] || ''}
              onChange={(e) => setReviewNotes(prev => ({
                ...prev,
                [catchSubmission.id]: e.target.value
              }))}
              placeholder="Add notes about this submission..."
              className="min-h-[60px] text-xs"
            />
          </div>
        )}

        {/* Review Actions */}
        {showActions && catchSubmission.status === 'pending' && (
          <div className="flex gap-2 pt-2">
            <Button
              onClick={() => handleReject(catchSubmission)}
              disabled={processingId === catchSubmission.id}
              variant="outline"
              className="flex-1 h-12 rounded-2xl border-red-500/50 text-red-500 hover:bg-red-500/10 font-black uppercase text-xs"
            >
              {processingId === catchSubmission.id ? (
                <Loader2 className="animate-spin mr-2" size={16} />
              ) : (
                <XCircle className="mr-2" size={16} />
              )}
              Reject
            </Button>
            <Button
              onClick={() => handleApprove(catchSubmission)}
              disabled={processingId === catchSubmission.id}
              className="flex-1 h-12 rounded-2xl bg-green-500 hover:bg-green-600 text-white font-black uppercase text-xs"
            >
              {processingId === catchSubmission.id ? (
                <Loader2 className="animate-spin mr-2" size={16} />
              ) : (
                <CheckCircle2 className="mr-2" size={16} />
              )}
              Approve
            </Button>
          </div>
        )}

        {/* Show reviewer notes if already reviewed */}
        {catchSubmission.status !== 'pending' && catchSubmission.reviewer_notes && (
          <div className="pt-3 border-t border-muted">
            <p className="text-xs font-bold text-muted-foreground uppercase mb-1">Reviewer Notes</p>
            <p className="text-xs text-muted-foreground italic">{catchSubmission.reviewer_notes}</p>
          </div>
        )}
      </div>
    </Card>
  );

  if (loading) {
    return (
      <div className="pb-24 pt-4 px-4 max-w-md mx-auto flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin text-primary" size={48} />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="pb-24 pt-4 px-4 max-w-md mx-auto space-y-6">
      {/* Header */}
      <div className="text-left">
        <div className="flex items-center gap-3">
          <Shield className="text-primary" size={32} />
          <div>
            <h1 className="text-4xl font-black italic tracking-tighter text-primary uppercase leading-none">
              Admin Review
            </h1>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mt-1">
              Tournament Catch Verification
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="p-4 text-center bg-yellow-500/10 border-yellow-500/30">
          <p className="text-2xl font-black text-yellow-500">{pendingCatches.length}</p>
          <p className="text-xs font-bold uppercase text-muted-foreground">Pending</p>
        </Card>
        <Card className="p-4 text-center bg-green-500/10 border-green-500/30">
          <p className="text-2xl font-black text-green-500">{approvedCatches.length}</p>
          <p className="text-xs font-bold uppercase text-muted-foreground">Approved</p>
        </Card>
        <Card className="p-4 text-center bg-red-500/10 border-red-500/30">
          <p className="text-2xl font-black text-red-500">{rejectedCatches.length}</p>
          <p className="text-xs font-bold uppercase text-muted-foreground">Rejected</p>
        </Card>
      </div>

      {/* Pending Catches */}
      <div className="space-y-4">
        <h2 className="text-xl font-black italic uppercase text-primary">
          Pending Review ({pendingCatches.length})
        </h2>
        {pendingCatches.length === 0 ? (
          <Card className="p-8 text-center rounded-[32px]">
            <CheckCircle2 className="mx-auto mb-3 text-green-500" size={48} />
            <p className="font-bold text-sm">All caught up!</p>
            <p className="text-xs text-muted-foreground mt-1">No pending reviews</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {pendingCatches.map(catchSubmission => renderCatchCard(catchSubmission, true))}
          </div>
        )}
      </div>

      {/* Approved Catches (Collapsible) */}
      {approvedCatches.length > 0 && (
        <div className="space-y-4">
          <button
            onClick={() => setShowApproved(!showApproved)}
            className="w-full flex items-center justify-between text-left"
          >
            <h2 className="text-xl font-black italic uppercase text-green-500">
              Approved ({approvedCatches.length})
            </h2>
            {showApproved ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
          {showApproved && (
            <div className="space-y-4">
              {approvedCatches.map(catchSubmission => renderCatchCard(catchSubmission, false))}
            </div>
          )}
        </div>
      )}

      {/* Rejected Catches (Collapsible) */}
      {rejectedCatches.length > 0 && (
        <div className="space-y-4">
          <button
            onClick={() => setShowRejected(!showRejected)}
            className="w-full flex items-center justify-between text-left"
          >
            <h2 className="text-xl font-black italic uppercase text-red-500">
              Rejected ({rejectedCatches.length})
            </h2>
            {showRejected ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
          {showRejected && (
            <div className="space-y-4">
              {rejectedCatches.map(catchSubmission => renderCatchCard(catchSubmission, false))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminReview;
