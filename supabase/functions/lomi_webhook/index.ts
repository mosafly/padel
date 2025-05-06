import { serve } from "https://deno.land/std@0.170.0/http/server.ts";
import { createHmac } from "https://deno.land/std@0.170.0/hash/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl       = Deno.env.get("SUPABASE_URL")!;
const supabaseKey       = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const lomiSecret        = Deno.env.get("LOMI_SECRET_KEY")!;

const supabaseClient = createClient(supabaseUrl, supabaseKey);

serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const body = await req.text();
  const signature = req.headers.get("lomi-signature") || "";
  const hmac = createHmac("sha256", lomiSecret).update(body).toString();

  if (hmac !== signature) {
    return new Response("Invalid signature", { status: 401 });
  }

  let event;
  try {
    event = JSON.parse(body);
  } catch {
    return new Response("Bad payload", { status: 400 });
  }

  if (event.type === "payment.success" && event.data.metadata?.reservationId) {
    const { reservationId } = event.data.metadata;
    const { error } = await supabaseClient
      .from("reservations")
      .update({ status: "confirmed" })
      .eq("id", reservationId);
    if (error) {
      console.error("DB update error:", error);
      return new Response("DB error", { status: 500 });
    }
  }

  return new Response("OK", { status: 200 });
});
