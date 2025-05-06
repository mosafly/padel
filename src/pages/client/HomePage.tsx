import React, { useState, useEffect, useCallback } from "react";
import { useSupabase } from "@/contexts/SupabaseContext";
import CourtCard, { Court } from "@/components/CourtCard";
import { Search, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";

const HomePage: React.FC = () => {
  const { supabase } = useSupabase();
  const [courts, setCourts] = useState<Court[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [retryCount, setRetryCount] = useState(0);

  const fetchCourts = useCallback(async () => {
    try {
      console.log("Fetching courts...");
      setIsLoading(true);
      setError(null);

      // Requête simple sans vérification d'authentification
      const { data, error } = await supabase
        .from("courts")
        .select("*")
        .order("name");

      if (error) {
        console.error("Supabase error fetching courts:", error);
        setError(`Failed to load courts: ${error.message}`);
        toast.error("Failed to load courts");
      } else {
        console.log("Courts data received:", data?.length || 0, "courts");
        setCourts(data || []);
      }
    } catch (error) {
      console.error("Exception while fetching courts:", error);
      setError("Failed to load courts. Please try refreshing the page.");
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  const handleRefresh = () => {
    setRetryCount((prev) => prev + 1);
  };

  useEffect(() => {
    // Log session information for debugging
    const logSessionInfo = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      console.log("Current session:", session);

      if (session?.user) {
        const { data: userProfile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", session.user.id)
          .single();

        console.log("User role:", userProfile?.role);
      } else {
        console.log("No authenticated user");
      }
    };

    logSessionInfo();

    // Charger les courts immédiatement
    fetchCourts();
  }, [fetchCourts, supabase]);

  const filteredCourts = courts.filter(
    (court) =>
      court.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (court.description?.toLowerCase() || "").includes(
        searchQuery.toLowerCase(),
      ),
  );

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Find Your Court
        </h1>
        <p className="text-gray-600">Book your preferred padel court easily</p>
      </div>

      <div className="flex justify-between items-center mb-6">
        <div className="relative flex-1 max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search courts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="form-input pl-10 w-full"
          />
        </div>

        <button
          onClick={handleRefresh}
          className="ml-4 p-2 rounded-full hover:bg-gray-100 transition-colors"
          title="Refresh courts"
          disabled={isLoading}
        >
          <RefreshCw
            className={`h-5 w-5 text-gray-600 ${isLoading ? "animate-spin" : ""}`}
          />
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[var(--primary)]"></div>
            <p className="mt-3 text-gray-600">Loading courts...</p>
            <p className="text-xs text-gray-500 mt-1">
              {retryCount > 0
                ? `Retry attempt ${retryCount}`
                : "Connecting to database..."}
            </p>
          </div>
        </div>
      ) : error ? (
        <div
          className="text-center py-12 bg-white rounded-lg shadow-sm p-6"
          data-component-name="HomePage"
        >
          <p className="text-red-500 mb-4">{error}</p>
          {error.includes("auth") ||
          error.includes("credentials") ||
          error.includes("session") ? (
            <div>
              <p className="text-gray-600 mb-4">
                Vous devez être connecté pour voir les courts.
              </p>
              <button
                onClick={() => (window.location.href = "/login")}
                className="btn btn-primary mr-3"
              >
                Se connecter
              </button>
              <button onClick={handleRefresh} className="btn btn-outline mt-2">
                Réessayer
              </button>
            </div>
          ) : (
            <button onClick={handleRefresh} className="btn btn-primary">
              Refresh Page
            </button>
          )}
        </div>
      ) : filteredCourts.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm">
          <p className="text-gray-500">
            {searchQuery
              ? "No courts found with your search criteria."
              : "No courts available at the moment."}
          </p>
          {!searchQuery && courts.length === 0 && (
            <button onClick={handleRefresh} className="btn btn-primary mt-4">
              Refresh Courts
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourts.map((court) => (
            <CourtCard key={court.id} court={court} />
          ))}
        </div>
      )}
    </div>
  );
};

export default HomePage;
