import React, { useState, useEffect } from 'react';
import { useSupabase } from '../../contexts/SupabaseContext';
import { useAuth } from '../../contexts/AuthContext';
import ReservationList, { Reservation } from '../../components/ReservationList';
import toast from 'react-hot-toast';

const MyReservationsPage: React.FC = () => {
  const { supabase } = useSupabase();
  const { user } = useAuth();
  
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const fetchReservations = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('reservations')
          .select(`
            *,
            courts:court_id (name)
          `)
          .eq('user_id', user.id)
          .order('start_time', { ascending: false });
        
        if (error) throw error;
        
        // Transform the data to match our Reservation type
        const transformedData = data.map(item => ({
          ...item,
          court_name: item.courts.name,
        }));
        
        setReservations(transformedData);
      } catch (error) {
        console.error('Error fetching reservations:', error);
        toast.error('Failed to load reservations');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchReservations();
  }, [user, supabase]);
  
  const handleCancelReservation = async (id: string) => {
    try {
      const { error } = await supabase
        .from('reservations')
        .update({ status: 'cancelled' })
        .eq('id', id);
      
      if (error) throw error;
      
      // Update the local state
      setReservations(prev =>
        prev.map(res =>
          res.id === id ? { ...res, status: 'cancelled' } : res
        )
      );
      
      toast.success('Reservation cancelled successfully');
    } catch (error) {
      console.error('Error cancelling reservation:', error);
      toast.error('Failed to cancel reservation');
    }
  };
  
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Reservations</h1>
        <p className="text-gray-600">View and manage your upcoming and past reservations</p>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-pulse text-gray-500">Loading reservations...</div>
        </div>
      ) : (
        <ReservationList 
          reservations={reservations} 
          onCancel={handleCancelReservation}
        />
      )}
    </div>
  );
};

export default MyReservationsPage;