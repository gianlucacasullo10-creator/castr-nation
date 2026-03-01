import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface ProStatus {
  isPro: boolean;
  proExpiresAt: string | null;
  loading: boolean;
}

export function useProStatus(): ProStatus {
  const [isPro, setIsPro] = useState(false);
  const [proExpiresAt, setProExpiresAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const fetchStatus = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || cancelled) {
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from("profiles")
        .select("is_pro, pro_expires_at")
        .eq("id", user.id)
        .single();

      if (!cancelled && data) {
        setIsPro(data.is_pro ?? false);
        setProExpiresAt(data.pro_expires_at ?? null);
      }
      if (!cancelled) setLoading(false);
    };

    fetchStatus();
    return () => { cancelled = true; };
  }, []);

  return { isPro, proExpiresAt, loading };
}
