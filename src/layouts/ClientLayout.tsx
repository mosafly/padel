import React, { useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Brackets as Racket, Calendar, User, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const ClientLayout: React.FC = () => {
  const { signOut, user, userRole, isLoading } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    // Handle any auth-related errors that might occur
    if (!isLoading && !user) {
      console.log('No user in ClientLayout, redirecting to login');
      navigate('/login');
    }
  }, [isLoading, user, navigate]);
  
  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error during sign out:', error);
      toast.error('Failed to sign out properly');
    }
  };
  
  // Show a mini loading indicator if auth state is still loading
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[var(--primary)]"></div>
          <p className="mt-2">Loading your account...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <Racket className="h-8 w-8 text-[var(--primary)]" />
            <h1 className="ml-2 text-xl font-bold text-[var(--primary)]">PadelBooking</h1>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-gray-700">
              {user?.email}
            </span>
            <button
              onClick={handleSignOut}
              className="text-gray-500 hover:text-gray-700"
              aria-label="Sign out"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>
      
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-12">
            <div className="flex space-x-8">
              <NavLink
                to="/"
                className={({ isActive }) =>
                  `flex items-center px-2 py-1 border-b-2 text-sm font-medium ${
                    isActive
                      ? 'border-[var(--primary)] text-[var(--primary)]'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`
                }
              >
                <Racket size={16} className="mr-1" />
                Courts
              </NavLink>
              
              <NavLink
                to="/my-reservations"
                className={({ isActive }) =>
                  `flex items-center px-2 py-1 border-b-2 text-sm font-medium ${
                    isActive
                      ? 'border-[var(--primary)] text-[var(--primary)]'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`
                }
              >
                <Calendar size={16} className="mr-1" />
                My Reservations
              </NavLink>
            </div>
          </div>
        </div>
      </nav>
      
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
      
      <footer className="bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-center text-sm text-gray-500">
            &copy; {new Date().getFullYear()} PadelBooking. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default ClientLayout;