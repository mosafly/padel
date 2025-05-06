import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Check, X } from "lucide-react";
import toast from "react-hot-toast";
import { useSupabase } from "@/lib/contexts/Supabase";

const PaymentSimulationPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { supabase } = useSupabase();
  const [status, setStatus] = useState<"processing" | "success" | "failed">(
    "processing",
  );
  const amount = searchParams.get("amount") || "0";
  const currency = searchParams.get("currency") || "XOF";
  const reservationId = searchParams.get("reservationId");

  useEffect(() => {
    const processPayment = async () => {
      if (!reservationId) {
        toast.error("ID de réservation manquant");
        setStatus("failed");
        return;
      }

      try {
        // Simuler un traitement de paiement
        await new Promise((resolve) => setTimeout(resolve, 3000));

        // 80% de chance de succès
        const success = Math.random() < 0.8;
        const newStatus = success ? "completed" : "failed";

        // Trouver le paiement associé à cette réservation
        const { data: paymentData, error: paymentFetchError } = await supabase
          .from("payments")
          .select("*")
          .eq("reservation_id", reservationId)
          .single();

        if (paymentFetchError) {
          console.error(
            "Erreur lors de la récupération du paiement:",
            paymentFetchError,
          );
          toast.error(
            "Erreur lors de la récupération des informations de paiement",
          );
          setStatus("failed");
          return;
        }

        // Mettre à jour le statut du paiement
        const { error: updateError } = await supabase
          .from("payments")
          .update({
            status: newStatus,
            payment_date: new Date().toISOString(),
          })
          .eq("id", paymentData.id);

        if (updateError) {
          console.error(
            "Erreur lors de la mise à jour du paiement:",
            updateError,
          );
          toast.error("Erreur lors de la mise à jour du paiement");
          setStatus("failed");
          return;
        }

        setStatus(success ? "success" : "failed");

        if (success) {
          toast.success("Paiement réussi !");
        } else {
          toast.error("Échec du paiement");
        }
      } catch (error) {
        console.error("Erreur lors du traitement du paiement:", error);
        toast.error("Une erreur est survenue lors du traitement du paiement");
        setStatus("failed");
      }
    };

    processPayment();
  }, [reservationId, supabase]);

  const handleReturn = () => {
    navigate("/");
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold text-center mb-6">
        Simulation de Paiement
      </h1>

      <div className="mb-6">
        <p className="text-gray-600 mb-2">Montant:</p>
        <p className="text-xl font-semibold">
          {(parseInt(amount) / 100).toFixed(2)} {currency}
        </p>
      </div>

      {reservationId && (
        <div className="mb-6">
          <p className="text-gray-600 mb-2">Réservation ID:</p>
          <p className="text-sm font-mono bg-gray-100 p-2 rounded">
            {reservationId}
          </p>
        </div>
      )}

      <div className="mb-8">
        <p className="text-gray-600 mb-4">Statut:</p>

        {status === "processing" && (
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mr-3"></div>
            <p>Traitement du paiement...</p>
          </div>
        )}

        {status === "success" && (
          <div className="flex items-center text-green-600">
            <Check className="h-6 w-6 mr-3" />
            <p>Paiement réussi</p>
          </div>
        )}

        {status === "failed" && (
          <div className="flex items-center text-red-600">
            <X className="h-6 w-6 mr-3" />
            <p>Échec du paiement</p>
          </div>
        )}
      </div>

      {status !== "processing" && (
        <button
          onClick={handleReturn}
          className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md transition duration-300"
        >
          Retour à l'accueil
        </button>
      )}
    </div>
  );
};

export default PaymentSimulationPage;
