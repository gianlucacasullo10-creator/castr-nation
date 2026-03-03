import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/** Extract an integer point value from a reward description string.
 *  e.g. "500 Fish Points" → 500, "1,500 Points" → 1500
 */
function parsePoints(reward: string): number {
  const match = reward.match(/(\d[\d,]*)\s*(?:fish\s*)?points?/i);
  if (!match) return 0;
  return parseInt(match[1].replace(/,/g, ""), 10);
}

/**
 * Map a 1-based rank to a prize entry from prize_structure.
 * prize_structure items have { place: string, reward: string }.
 * Falls back to hardcoded tiers if no match.
 */
function getPrize(
  rank: number,
  prizeStructure: Array<{ place: string; reward: string }>
): { reward: string; points: number } {
  const rank1Prize = prizeStructure.find((p) =>
    p.place?.toLowerCase().includes("1st")
  );
  const rank2Prize = prizeStructure.find((p) =>
    p.place?.toLowerCase().includes("2nd")
  );
  const rank3Prize = prizeStructure.find((p) =>
    p.place?.toLowerCase().includes("3rd")
  );
  const top10Prize = prizeStructure.find((p) =>
    p.place?.toLowerCase().includes("10") || p.place?.toLowerCase().includes("top 10")
  );
  const top50Prize = prizeStructure.find((p) =>
    p.place?.toLowerCase().includes("50") || p.place?.toLowerCase().includes("top 50")
  );

  let rewardStr = "";
  if (rank === 1) rewardStr = rank1Prize?.reward ?? "🏆 Legendary Rod + 500 Fish Points";
  else if (rank === 2) rewardStr = rank2Prize?.reward ?? "🥈 Epic Lure + 250 Fish Points";
  else if (rank === 3) rewardStr = rank3Prize?.reward ?? "🥉 1,500 Fish Points";
  else if (rank >= 4 && rank <= 10) rewardStr = top10Prize?.reward ?? "500 Fish Points";
  else if (rank >= 11 && rank <= 50) rewardStr = top50Prize?.reward ?? "250 Fish Points";

  return { reward: rewardStr, points: parsePoints(rewardStr) };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { tournament_id } = await req.json();

    if (!tournament_id) {
      return new Response(
        JSON.stringify({ error: "tournament_id required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use service role key so we can write to multiple users' records
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 1. Load tournament — verify it has ended and rewards not yet distributed
    const { data: tournament, error: tErr } = await supabaseAdmin
      .from("tournaments")
      .select("id, name, end_date, prize_structure, rewards_distributed")
      .eq("id", tournament_id)
      .single();

    if (tErr || !tournament) {
      return new Response(
        JSON.stringify({ error: "Tournament not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (new Date(tournament.end_date) > new Date()) {
      return new Response(
        JSON.stringify({ error: "Tournament has not ended yet" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (tournament.rewards_distributed) {
      return new Response(
        JSON.stringify({ alreadyDistributed: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Get ranked catches (approved only, best score per user)
    const { data: catches, error: cErr } = await supabaseAdmin
      .from("tournament_catches")
      .select("user_id, size_score")
      .eq("tournament_id", tournament_id)
      .eq("status", "approved")
      .order("size_score", { ascending: false });

    if (cErr) throw cErr;

    // Deduplicate: keep best score per user (DB may have multiple entries)
    const bestByUser = new Map<string, number>();
    for (const c of catches ?? []) {
      if (!bestByUser.has(c.user_id) || c.size_score > bestByUser.get(c.user_id)!) {
        bestByUser.set(c.user_id, c.size_score);
      }
    }

    // Sort descending to assign ranks
    const ranked = Array.from(bestByUser.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([user_id, size_score], i) => ({ user_id, size_score, rank: i + 1 }));

    const prizeStructure: Array<{ place: string; reward: string }> =
      tournament.prize_structure ?? [];

    // 3. Distribute rewards to top 50
    const rewardRows: Array<{
      tournament_id: string;
      user_id: string;
      rank_position: number;
      reward_description: string;
      points_granted: number;
    }> = [];

    const pointUpdates: Array<{ user_id: string; points: number }> = [];

    for (const entry of ranked) {
      if (entry.rank > 50) continue;

      const { reward, points } = getPrize(entry.rank, prizeStructure);
      if (!reward) continue;

      rewardRows.push({
        tournament_id,
        user_id: entry.user_id,
        rank_position: entry.rank,
        reward_description: reward,
        points_granted: points,
      });

      if (points > 0) {
        pointUpdates.push({ user_id: entry.user_id, points });
      }
    }

    // Insert reward records (ignore conflicts — idempotent)
    if (rewardRows.length > 0) {
      const { error: rErr } = await supabaseAdmin
        .from("tournament_rewards")
        .upsert(rewardRows, { onConflict: "tournament_id,user_id", ignoreDuplicates: true });
      if (rErr) throw rErr;
    }

    // Grant points to each winner
    for (const { user_id, points } of pointUpdates) {
      await supabaseAdmin.rpc("increment_user_points", {
        p_user_id: user_id,
        p_points: points,
      }).catch(() => {
        // Fallback if RPC doesn't exist: direct update
        return supabaseAdmin
          .from("profiles")
          .select("current_points, total_points_earned")
          .eq("id", user_id)
          .single()
          .then(({ data }) => {
            if (!data) return;
            return supabaseAdmin
              .from("profiles")
              .update({
                current_points: (data.current_points ?? 0) + points,
                total_points_earned: (data.total_points_earned ?? 0) + points,
              })
              .eq("id", user_id);
          });
      });
    }

    // 4. Mark tournament rewards as distributed
    await supabaseAdmin
      .from("tournaments")
      .update({ rewards_distributed: true })
      .eq("id", tournament_id);

    return new Response(
      JSON.stringify({ distributed: rewardRows.length, rewards: rewardRows }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("distribute-tournament-rewards error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
