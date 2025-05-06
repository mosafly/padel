/**
 * lomi. Payment Client
 * A client-side implementation for interacting with the lomi. payment API
 */

interface LomiSessionCreateParams {
  amount: number;
  currency: string;
  callback_url: string;
  simulation?: boolean; // Option pour utiliser le mode simulation
}

interface LomiSession {
  id: string;
  payment_url: string;
  status: string;
}

class LomiClient {
  private apiKey: string;
  // URL de Supabase pour les fonctions Edge
  private supabaseUrl: string = import.meta.env.VITE_SUPABASE_URL || "";
  // Environnement lomi. (production, development, etc.)
  private env: string = import.meta.env.VITE_LOMI_ENV || "production";

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    console.log(
      "LomiClient initialized with API key:",
      apiKey ? "API key provided" : "No API key",
    );
    console.log("lomi. environment:", this.env);

    if (!apiKey) {
      console.warn(
        "lomi. API key is not provided. Payment functionality will not work correctly.",
      );
    }
  }

  async sessionsCreate(params: LomiSessionCreateParams): Promise<LomiSession> {
    try {
      console.log("Creating lomi. payment session with params:", {
        amount: params.amount,
        currency: params.currency,
        callback_url: params.callback_url,
        simulation: params.simulation,
      });

      if (!this.apiKey) {
        throw new Error(
          "lomi. API key is not configured. Please check your environment variables.",
        );
      }

      // TOUJOURS utiliser le mode simulation en local
      // En production, cette condition sera fausse
      const isLocalhost =
        window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1";

      if (params.simulation || isLocalhost) {
        console.log(
          "⚠️ USING SIMULATED lomi. API RESPONSE (Simulation mode or local development)",
        );

        // Extraire le reservationId de l'URL de callback
        const urlParams = new URL(params.callback_url);
        const reservationId = urlParams.searchParams.get("reservationId");

        // Retourner une session simulée
        const simulatedSession = {
          id: "sim_" + Math.random().toString(36).substring(2, 15),
          payment_url: `${window.location.origin}/payment-simulation?amount=${params.amount}&currency=${params.currency}&reservationId=${reservationId}`,
          status: "pending",
        };

        console.log("Simulated lomi. session created:", simulatedSession);
        return simulatedSession;
      }

      // Mode réel - utilisation de la fonction Edge Supabase comme proxy pour l'API lomi.
      console.log("Using Supabase Edge Function as proxy for lomi. API");

      // Préparer les données pour la requête
      const requestBody = {
        amount: params.amount,
        currency: params.currency,
        callback_url: params.callback_url,
        payment_methods: ["wave"],
      };

      console.log("lomi. API request body:", JSON.stringify(requestBody));

      // Appeler la fonction Edge Supabase qui servira de proxy pour l'API lomi.
      const response = await fetch(
        `${this.supabaseUrl}/functions/v1/lomi_create_session`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            // Ajouter l'en-tête d'autorisation avec la clé anonyme de Supabase
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify(requestBody),
        },
      );

      console.log("Supabase Edge Function response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Supabase Edge Function error response text:", errorText);

        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { message: errorText };
        }

        console.error("Supabase Edge Function error response:", {
          status: response.status,
          statusText: response.statusText,
          errorData,
        });

        throw new Error(
          errorData.error ||
            `Failed to create payment session: ${response.status} ${response.statusText}`,
        );
      }

      const data = await response.json();
      console.log("lomi. session created successfully:", data);
      return data;
    } catch (error: unknown) {
      // Amélioration de la journalisation des erreurs
      let errorNameToLog = "Unknown error";
      let errorMessageToLog = "No error message";
      let errorStackToLog = "No stack trace";

      if (error instanceof Error) {
        errorNameToLog = error.name;
        errorMessageToLog = error.message;
        errorStackToLog = error.stack || "No stack trace available";
      }

      console.error("lomi. payment session creation error:", {
        name: errorNameToLog,
        message: errorMessageToLog,
        stack: errorStackToLog,
        // The original stringify attempts to get all properties, which can be complex for 'unknown'
        // For simplicity and safety, we can stringify 'error' directly,
        // or use a more robust serialization if specific properties from non-Error objects are needed.
        // The original line: error: JSON.stringify(error, Object.getOwnPropertyNames(error || {}))
        // Let's keep a similar robust approach for general serialization
        errorObjectDetails:
          typeof error === "object" && error !== null
            ? JSON.stringify(error, Object.getOwnPropertyNames(error))
            : String(error),
      });
      throw error;
    }
  }
}

export default LomiClient;
