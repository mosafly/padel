import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { addDays, format, startOfDay } from "date-fns";
import { useSupabase } from "@/contexts/SupabaseContext";
import { useAuth } from "@/contexts/AuthContext";
import { Court } from "@/components/CourtCard";
import TimeSlotPicker from "@/components/TimeSlotPicker";
import { Calendar, Clock, DollarSign } from "lucide-react";
import toast from "react-hot-toast";
import PaymentMethodSelector from "@/components/PaymentMethodSelector";
import LomiClient from "@/services/lomiClient";

const ReservationPage: React.FC = () => {
  const { courtId } = useParams();
  const navigate = useNavigate();
  const { supabase } = useSupabase();
  const { user } = useAuth();

  // Déboguer la clé API Lomi
  console.log(
    "VITE_LOMI_SECRET_KEY available?",
    !!import.meta.env.VITE_LOMI_SECRET_KEY,
  );
  console.log(
    "VITE_LOMI_SECRET_KEY value (masked):",
    import.meta.env.VITE_LOMI_SECRET_KEY
      ? `${import.meta.env.VITE_LOMI_SECRET_KEY.substring(0, 10)}...`
      : "undefined",
  );

  const lomiClient = new LomiClient(import.meta.env.VITE_LOMI_SECRET_KEY);

  const [court, setCourt] = useState<Court | null>(null);
  const [selectedDate, setSelectedDate] = useState(startOfDay(new Date()));
  const [selectedStartTime, setSelectedStartTime] = useState<Date | null>(null);
  const [selectedEndTime, setSelectedEndTime] = useState<Date | null>(null);
  const [availableSlots, setAvailableSlots] = useState<
    { startTime: Date; endTime: Date }[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch court details
  useEffect(() => {
    const fetchCourt = async () => {
      if (!courtId) return;

      try {
        const { data, error } = await supabase
          .from("courts")
          .select("*")
          .eq("id", courtId)
          .single();

        if (error) throw error;

        setCourt(data);
      } catch (error) {
        console.error("Error fetching court:", error);
        toast.error("Failed to load court details");
        navigate("/");
      } finally {
        setIsLoading(false);
      }
    };

    fetchCourt();
  }, [courtId, supabase, navigate]);

  // Fetch available slots for selected date
  useEffect(() => {
    const fetchAvailableSlots = async () => {
      if (!courtId) return;

      try {
        // In a real app, this would query the database for existing reservations
        // and filter out time slots that are already booked

        // For the demo, we'll simulate some booked slots
        // const startDate = selectedDate; // Removed
        // const endDate = addDays(selectedDate, 1); // Removed

        // Generating all available 1-hour slots from 8am to 10pm
        const allSlots = [];
        for (let hour = 8; hour < 22; hour++) {
          const startTime = new Date(selectedDate);
          startTime.setHours(hour, 0, 0, 0);

          const endTime = new Date(startTime);
          endTime.setHours(hour + 1, 0, 0, 0);

          allSlots.push({ startTime, endTime });
        }

        // In a real app, we'd filter out booked slots here
        setAvailableSlots(allSlots);
      } catch (error) {
        console.error("Error fetching available slots:", error);
        toast.error("Failed to load available time slots");
      }
    };

    fetchAvailableSlots();
  }, [courtId, selectedDate, supabase]);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const date = new Date(e.target.value);
    setSelectedDate(date);
    setSelectedStartTime(null);
    setSelectedEndTime(null);
  };

  const handleTimeSlotSelect = (startTime: Date, endTime: Date) => {
    setSelectedStartTime(startTime);
    setSelectedEndTime(endTime);
  };

  const handleCashReservation = async () => {
    if (!court || !selectedStartTime || !selectedEndTime || !user) {
      toast.error("Please select a valid time slot");
      return;
    }

    setIsSubmitting(true);

    try {
      // Calculate the total price
      const hours = 1; // 1-hour slot
      const totalPrice = court.price_per_hour * hours;

      // Create the reservation
      const { data: reservationData, error: reservationError } = await supabase
        .from("reservations")
        .insert([
          {
            court_id: court.id,
            user_id: user.id,
            start_time: selectedStartTime.toISOString(),
            end_time: selectedEndTime.toISOString(),
            total_price: totalPrice,
            status: "pending",
          },
        ])
        .select()
        .single();

      if (reservationError) throw reservationError;

      // Create payment record
      const { data: paymentData, error: paymentError } = await supabase
        .from("payments")
        .insert([
          {
            reservation_id: reservationData.id,
            user_id: user.id,
            amount: totalPrice,
            currency: "XOF",
            payment_method: "on_spot",
            status: "pending",
            payment_date: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (paymentError) {
        console.error("Error creating payment record:", paymentError);
        toast.error("Erreur lors de l'enregistrement du paiement");
      } else {
        console.log("Payment record created:", paymentData);
      }

      toast.success("Reservation created successfully!");
      navigate("/my-reservations");
    } catch (error) {
      console.error("Error creating reservation:", error);
      toast.error("Failed to create reservation");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOnlinePayment = async () => {
    if (!court || !selectedStartTime || !selectedEndTime || !user) {
      toast.error("Choisissez un créneau valide");
      return;
    }
    setIsSubmitting(true);

    try {
      const hours =
        (selectedEndTime.getTime() - selectedStartTime.getTime()) /
        (1000 * 60 * 60);
      const totalPrice = court.price_per_hour * hours;

      console.log(
        "Starting online payment process with total price:",
        totalPrice,
      );

      // Create the reservation
      const { data: reservationData, error: reservationError } = await supabase
        .from("reservations")
        .insert([
          {
            court_id: court.id,
            user_id: user.id,
            start_time: selectedStartTime.toISOString(),
            end_time: selectedEndTime.toISOString(),
            total_price: totalPrice,
            status: "pending",
          },
        ])
        .select()
        .single();

      if (reservationError) {
        console.error("Error creating reservation:", reservationError);
        throw reservationError;
      }

      console.log("Reservation created successfully:", reservationData);

      // Initialize payment with Lomi
      console.log("Initializing Lomi payment session...");

      // Détecter si nous sommes en local ou en production
      const isLocalhost =
        window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1";

      // Utiliser l'API réelle de Lomi en production avec Wave comme moyen de paiement
      const session = await lomiClient.sessionsCreate({
        amount: totalPrice * 100,
        currency: "XOF",
        callback_url: `${window.location.origin}/payment-simulation?reservationId=${reservationData.id}`,
        // Forcer le mode simulation en local, utiliser le mode réel en production
        simulation: isLocalhost,
      });

      console.log("Lomi session created:", session);

      // Create payment record
      const { data: paymentData, error: paymentError } = await supabase
        .from("payments")
        .insert([
          {
            reservation_id: reservationData.id,
            user_id: user.id,
            amount: totalPrice,
            currency: "XOF",
            payment_method: "online",
            payment_provider: "lomi",
            provider_payment_id: session.id,
            payment_url: session.payment_url,
            status: "pending",
          },
        ])
        .select()
        .single();

      if (paymentError) {
        console.error("Error creating payment record:", paymentError);
        toast.error("Erreur lors de l'enregistrement du paiement");
      } else {
        console.log("Payment record created:", paymentData);
      }

      // Redirect to payment page
      console.log("Redirecting to payment URL:", session.payment_url);
      window.location.href = session.payment_url;
    } catch (err: unknown) {
      let errName = "Unknown error";
      let errMessage = "No error message";
      let errStack = "No stack trace";
      const originalError = err;

      if (err instanceof Error) {
        errName = err.name;
        errMessage = err.message;
        errStack = err.stack || "No stack trace";
      }

      console.error("Online payment error:", {
        name: errName,
        message: errMessage,
        stack: errStack,
        error: JSON.stringify(
          originalError,
          Object.getOwnPropertyNames(originalError || {}),
        ),
      });
      toast.error(`Paiement en ligne échoué: ${errMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const hours =
    selectedStartTime && selectedEndTime
      ? (selectedEndTime.getTime() - selectedStartTime.getTime()) /
        (1000 * 60 * 60)
      : 0;
  const totalPrice = court ? court.price_per_hour * hours : 0;

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-pulse text-gray-500">
          Loading court details...
        </div>
      </div>
    );
  }

  if (!court) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Court not found.</p>
        <button onClick={() => navigate("/")} className="mt-4 btn btn-primary">
          Back to Courts
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <button
          onClick={() => navigate("/")}
          className="text-[var(--primary)] hover:text-[var(--primary-dark)] font-medium flex items-center"
        >
          ← Back to Courts
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-6">
        <div className="md:flex">
          <div className="md:w-1/3">
            <img
              src={
                court.image_url ||
                "https://images.pexels.com/photos/2277807/pexels-photo-2277807.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
              }
              alt={court.name}
              className="w-full h-64 md:h-full object-cover"
            />
          </div>
          <div className="p-6 md:w-2/3">
            <h2 className="text-2xl font-bold text-gray-900">{court.name}</h2>
            <p className="mt-2 text-gray-600">{court.description}</p>

            <div className="mt-4 flex items-center text-gray-700">
              <DollarSign size={20} className="mr-1" />
              <span className="text-lg font-medium">
                ${court.price_per_hour.toFixed(2)}/hour
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          {isSubmitting ? "Processing Reservation..." : "Make a Reservation"}
        </h2>

        <div>
          <div className="form-group">
            <label htmlFor="date" className="form-label flex items-center">
              <Calendar size={16} className="mr-1" />
              Select Date
            </label>
            <input
              type="date"
              id="date"
              value={format(selectedDate, "yyyy-MM-dd")}
              onChange={handleDateChange}
              min={format(new Date(), "yyyy-MM-dd")}
              max={format(addDays(new Date(), 30), "yyyy-MM-dd")}
              className="form-input"
              required
            />
          </div>

          <TimeSlotPicker
            date={selectedDate}
            availableSlots={availableSlots}
            selectedStartTime={selectedStartTime}
            onSelectTimeSlot={handleTimeSlotSelect}
          />

          {selectedStartTime && selectedEndTime && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold text-gray-900">
                Reservation Summary
              </h3>
              <div className="mt-2 space-y-2">
                <div className="flex items-center text-sm text-gray-700">
                  <Calendar size={16} className="mr-2" />
                  <span>{format(selectedDate, "MMMM dd, yyyy")}</span>
                </div>
                <div className="flex items-center text-sm text-gray-700">
                  <Clock size={16} className="mr-2" />
                  <span>
                    {format(selectedStartTime, "h:mm a")} -{" "}
                    {format(selectedEndTime, "h:mm a")}
                  </span>
                </div>
                <div className="flex items-center text-sm text-gray-700">
                  <DollarSign size={16} className="mr-2" />
                  <span>Total: ${totalPrice.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}

          {selectedStartTime && selectedEndTime && (
            <div className="mt-6">
              <PaymentMethodSelector
                onComplete={async (method: "on_spot" | "online") => {
                  if (method === "on_spot") {
                    await handleCashReservation();
                  } else {
                    await handleOnlinePayment();
                  }
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReservationPage;
