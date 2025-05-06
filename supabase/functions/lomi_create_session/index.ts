import { serve } from "https://deno.land/std@0.170.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

// Utiliser une valeur par défaut pour l'URL de l'API lomi.
const LOMI_API_URL = Deno.env.get("LOMI_API_URL") || "https://api.lomi.africa";
// Utiliser la variable d'environnement pour la clé secrète
const LOMI_SECRET_KEY = Deno.env.get("LOMI_SECRET_KEY");

console.log("LOMI_API_URL:", LOMI_API_URL);
console.log("LOMI_SECRET_KEY available:", !!LOMI_SECRET_KEY);

serve(async (req: Request) => {
  // Gestion des requêtes CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      throw new Error("Method not allowed");
    }

    // Récupérer les données de la requête
    const {
      amount,
      currency,
      callback_url,
      payment_methods = ["wave"],
    } = await req.json();

    if (!amount || !currency || !callback_url) {
      throw new Error("Missing required parameters");
    }

    console.log("Creating lomi. session with params:", {
      amount,
      currency,
      callback_url,
      payment_methods,
    });

    // Appeler l'API lomi. pour créer une session
    const response = await fetch(`${LOMI_API_URL}/v1/sessions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LOMI_SECRET_KEY}`,
      },
      body: JSON.stringify({
        amount,
        currency,
        callback_url,
        payment_methods,
        mode: "live", // ou 'test' selon l'environnement
      }),
    });

    console.log("lomi. API response status:", response.status);

    if (!response.ok) {
      const errorData = await response.json();
      console.error("lomi. API error:", errorData);
      throw new Error(`lomi. API error: ${JSON.stringify(errorData)}`);
    }

    const sessionData = await response.json();
    console.log("lomi. session created successfully:", sessionData);

    // Retourner la réponse avec les headers CORS
    return new Response(JSON.stringify(sessionData), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Error:", error.message);

    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  }
});
