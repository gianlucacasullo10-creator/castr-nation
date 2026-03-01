import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const DROP_GUARD_DAYS = 7;

Deno.serve(async (req) => {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response("Unauthorized", { status: 401 });
  }

  const jwt = authHeader.replace("Bearer ", "");

  // Use the anon client with the user's JWT to verify their identity
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } },
  );

  const { data: { user }, error: authError } = await supabase.auth.getUser(jwt);
  if (authError || !user) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Service role for writes
  const adminClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { data: profile } = await adminClient
    .from("profiles")
    .select("is_pro, last_legendary_drop_at")
    .eq("id", user.id)
    .single();

  if (!profile?.is_pro) {
    return new Response(JSON.stringify({ granted: false, reason: "not_pro" }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  if (profile.last_legendary_drop_at) {
    const daysSince =
      (Date.now() - new Date(profile.last_legendary_drop_at).getTime()) / 86_400_000;
    if (daysSince < DROP_GUARD_DAYS) {
      return new Response(
        JSON.stringify({ granted: false, reason: "too_soon", next_drop_in_days: Math.ceil(DROP_GUARD_DAYS - daysSince) }),
        { headers: { "Content-Type": "application/json" } },
      );
    }
  }

  const { data: legendaries } = await adminClient
    .from("gear_loot_table")
    .select("*")
    .eq("rarity", "legendary");

  if (!legendaries || legendaries.length === 0) {
    return new Response(JSON.stringify({ granted: false, reason: "no_legendaries" }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  const item = legendaries[Math.floor(Math.random() * legendaries.length)];

  await adminClient.from("inventory").insert({
    user_id: user.id,
    item_type: item.item_type,
    item_name: item.item_name,
    rarity: item.rarity,
    bonus_percentage: item.bonus_percentage,
    image_url: item.image_url,
    is_equipped: false,
  });

  await adminClient
    .from("profiles")
    .update({ last_legendary_drop_at: new Date().toISOString() })
    .eq("id", user.id);

  return new Response(
    JSON.stringify({ granted: true, item: { name: item.item_name, type: item.item_type } }),
    { headers: { "Content-Type": "application/json" } },
  );
});
