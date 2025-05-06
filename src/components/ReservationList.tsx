import React from 'react';
import { format } from 'date-fns';
import { Calendar, Clock, DollarSign } from 'lucide-react';

export type Reservation = {
  id: string;
  court_id: string;
  court_name: string;
  user_id: string;
  user_email?: string;
  start_time: string;
  end_time: string;
  total_price: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  created_at: string;
};

interface ReservationListProps {
  reservations: Reservation[];
  onCancel?: (id: string) => void;
  isAdmin?: boolean;
  onConfirm?: (id: string) => void;
}

const ReservationList: React.FC<ReservationListProps> = ({ 
  reservations, 
  onCancel,
  isAdmin,
  onConfirm
}) => {
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM dd, yyyy');
  };
  
  const formatTime = (dateString: string) => {
    return format(new Date(dateString), 'h:mm a');
  };
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <span className="badge badge-success">Confirmed</span>;
      case 'pending':
        return <span className="badge badge-warning">Pending</span>;
      case 'cancelled':
        return <span className="badge badge-danger">Cancelled</span>;
      default:
        return null;
    }
  };
  
  return (
    <div className="space-y-4">
      {reservations.length === 0 ? (
        <div className="text-center py-6 bg-white rounded-lg shadow-sm">
          <p className="text-gray-500">No reservations found.</p>
        </div>
      ) : (
        reservations.map((reservation) => (
          <div 
            key={reservation.id} 
            className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-200"
          >
            <div className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    {reservation.court_name}
                  </h3>
                  {isAdmin && reservation.user_email && (
                    <div className="mt-1 text-sm text-gray-700">
                      User: {reservation.user_email}
                    </div>
                  )}
                  <div className="mt-1 flex items-center text-sm text-gray-700">
                    <Calendar size={16} className="mr-1" />
                    <span>{formatDate(reservation.start_time)}</span>
                  </div>
                  <div className="mt-1 flex items-center text-sm text-gray-700">
                    <Clock size={16} className="mr-1" />
                    <span>
                      {formatTime(reservation.start_time)} - {formatTime(reservation.end_time)}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center text-sm text-gray-700">
                    <DollarSign size={16} className="mr-1" />
                    <span>${reservation.total_price.toFixed(2)}</span>
                  </div>
                </div>
                
                <div className="mt-4 sm:mt-0 flex flex-col items-end">
                  <div className="mb-3">{getStatusBadge(reservation.status)}</div>
                  
                  <div className="flex space-x-2">
                    {isAdmin && reservation.status === 'pending' && onConfirm && (
                      <button
                        onClick={() => onConfirm(reservation.id)}
                        className="btn btn-secondary text-xs px-3 py-1"
                      >
                        Confirm
                      </button>
                    )}
                    
                    {(reservation.status === 'pending' || (isAdmin && reservation.status === 'confirmed')) && onCancel && (
                      <button
                        onClick={() => onCancel(reservation.id)}
                        className="btn btn-danger text-xs px-3 py-1"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default ReservationList;