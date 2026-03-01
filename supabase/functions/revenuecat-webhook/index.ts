import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const WEBHOOK_AUTH = Deno.env.get("REVENUECAT_WEBHOOK_AUTH_HEADER");
const POINTS_BONUS = 500;
const POINTS_GUARD_DAYS = 28;
const DROP_GUARD_DAYS = 7;

async function maybeGrantLegendaryDrop(userId: string, lastDropAt: string | null) {
  if (lastDropAt) {
    const daysSince = (Date.now() - new Date(lastDropAt).getTime()) / 86_400_000;
    if (daysSince < DROP_GUARD_DAYS) return;
  }

  const { data: legendaries } = await supabase
    .from("gear_loot_table")
    .select("*")
    .eq("rarity", "legendary");

  if (!legendaries || legendaries.length === 0) return;

  const item = legendaries[Math.floor(Math.random() * legendaries.length)];

  await supabase.from("inventory").insert({
    user_id: userId,
    item_type: item.item_type,
    item_name: item.item_name,
    rarity: item.rarity,
    bonus_percentage: item.bonus_percentage,
    image_url: item.image_url,
    is_equipped: false,
  });

  await supabase
    .from("profiles")
    .update({ last_legendary_drop_at: new Date().toISOString() })
    .eq("id", userId);
}

async function maybeGrantPoints(userId: string, lastCreditAt: string | null) {
  if (lastCreditAt) {
    const daysSince = (Date.now() - new Date(lastCreditAt).getTime()) / 86_400_000;
    if (daysSince < POINTS_GUARD_DAYS) return;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("current_points, total_points_earned")
    .eq("id", userId)
    .single();

  if (!profile) return;

  await supabase
    .from("profiles")
    .update({
      current_points: (profile.current_points ?? 0) + POINTS_BONUS,
      total_points_earned: (profile.total_points_earned ?? 0) + POINTS_BONUS,
      last_points_credit_at: new Date().toISOString(),
    })
    .eq("id", userId);
}

Deno.serve(async (req) => {
  if (WEBHOOK_AUTH && req.headers.get("Authorization") !== WEBHOOK_AUTH) {
    return new Response("Unauthorized", { status: 401 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return new Response("Bad Request", { status: 400 });
  }

  const event = body.event;
  if (!event) return new Response("No event", { status: 400 });

  const appUserId: string = event.app_user_id;
  const type: string = event.type;
  const expiresAt: string | null = event.expiration_at_ms
    ? new Date(event.expiration_at_ms).toISOString()
    : null;

  if (!appUserId) return new Response("No user", { status: 400 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("last_points_credit_at, last_legendary_drop_at")
    .eq("id", appUserId)
    .single();

  switch (type) {
    case "INITIAL_PURCHASE":
    case "RENEWAL":
    case "UNCANCELLATION": {
      await supabase
        .from("profiles")
        .update({ is_pro: true, pro_expires_at: expiresAt })
        .eq("id", appUserId);

      if (type === "INITIAL_PURCHASE" || type === "RENEWAL") {
        await maybeGrantPoints(appUserId, profile?.last_points_credit_at ?? null);
        await maybeGrantLegendaryDrop(appUserId, profile?.last_legendary_drop_at ?? null);
      }
      break;
    }

    case "CANCELLATION":
    case "EXPIRATION":
    case "BILLING_ISSUE": {
      await supabase
        .from("profiles")
        .update({ is_pro: false })
        .eq("id", appUserId);
      break;
    }

    default:
      break;
  }

  return new Response(JSON.stringify({ ok: true }), {
    headers: { "Content-Type": "application/json" },
  });
});
