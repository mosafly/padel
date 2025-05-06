import React, { useState, useEffect } from 'react';
import { useSupabase } from '../../contexts/SupabaseContext';
import { Plus, Edit, Trash, Check, X } from 'lucide-react';
import CourtForm, { CourtFormData } from '../../components/CourtForm';
import { Court } from '../../components/CourtCard';
import toast from 'react-hot-toast';

const CourtsManagement: React.FC = () => {
  const { supabase } = useSupabase();
  
  const [courts, setCourts] = useState<Court[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingCourt, setEditingCourt] = useState<Court | null>(null);
  
  useEffect(() => {
    const fetchCourts = async () => {
      try {
        const { data, error } = await supabase
          .from('courts')
          .select('*')
          .order('name');
        
        if (error) throw error;
        
        setCourts(data || []);
      } catch (error) {
        console.error('Error fetching courts:', error);
        toast.error('Failed to load courts');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchCourts();
  }, [supabase]);
  
  const handleAddCourt = () => {
    setEditingCourt(null);
    setShowForm(true);
  };
  
  const handleEditCourt = (court: Court) => {
    setEditingCourt(court);
    setShowForm(true);
  };
  
  const handleDeleteCourt = async (id: string) => {
    if (!confirm('Are you sure you want to delete this court?')) return;
    
    try {
      const { error } = await supabase
        .from('courts')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      setCourts(prev => prev.filter(court => court.id !== id));
      toast.success('Court deleted successfully');
    } catch (error) {
      console.error('Error deleting court:', error);
      toast.error('Failed to delete court');
    }
  };
  
  const handleStatusToggle = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'available' ? 'maintenance' : 'available';
    
    try {
      const { error } = await supabase
        .from('courts')
        .update({ status: newStatus })
        .eq('id', id);
      
      if (error) throw error;
      
      setCourts(prev =>
        prev.map(court =>
          court.id === id ? { ...court, status: newStatus as any } : court
        )
      );
      
      toast.success(`Court ${newStatus === 'available' ? 'activated' : 'set to maintenance'}`);
    } catch (error) {
      console.error('Error updating court status:', error);
      toast.error('Failed to update court status');
    }
  };
  
  const handleSubmit = async (data: CourtFormData) => {
    setIsSubmitting(true);
    
    try {
      if (editingCourt) {
        // Update existing court
        const { error } = await supabase
          .from('courts')
          .update(data)
          .eq('id', editingCourt.id);
        
        if (error) throw error;
        
        setCourts(prev =>
          prev.map(court =>
            court.id === editingCourt.id ? { ...court, ...data } : court
          )
        );
        
        toast.success('Court updated successfully');
      } else {
        // Create new court
        const { data: newCourt, error } = await supabase
          .from('courts')
          .insert([data])
          .select()
          .single();
        
        if (error) throw error;
        
        setCourts(prev => [...prev, newCourt]);
        toast.success('Court added successfully');
      }
      
      setShowForm(false);
      setEditingCourt(null);
    } catch (error) {
      console.error('Error saving court:', error);
      toast.error('Failed to save court');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleCancelForm = () => {
    setShowForm(false);
    setEditingCourt(null);
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Courts Management</h1>
          <p className="text-gray-600">Manage your padel courts and availability</p>
        </div>
        <button
          onClick={handleAddCourt}
          className="btn btn-primary flex items-center"
        >
          <Plus size={16} className="mr-1" />
          Add Court
        </button>
      </div>
      
      {showForm && (
        <div className="bg-white rounded-lg shadow-sm p-6 animate-fade-in">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold">
              {editingCourt ? 'Edit Court' : 'Add New Court'}
            </h2>
            <button
              onClick={handleCancelForm}
              className="text-gray-500 hover:text-gray-700"
            >
              <X size={20} />
            </button>
          </div>
          <CourtForm
            initialData={editingCourt || undefined}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
          />
        </div>
      )}
      
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-pulse text-gray-500">Loading courts...</div>
        </div>
      ) : courts.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm">
          <p className="text-gray-500">No courts found. Add your first court to get started.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Court Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {courts.map((court) => (
                <tr key={court.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">{court.name}</div>
                    <div className="text-sm text-gray-500">{court.description.substring(0, 60)}...</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    ${court.price_per_hour.toFixed(2)}/hour
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`badge ${
                      court.status === 'available' ? 'badge-success' : 
                      court.status === 'maintenance' ? 'badge-danger' : 'badge-accent'
                    }`}>
                      {court.status.charAt(0).toUpperCase() + court.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleStatusToggle(court.id, court.status)}
                        className={`p-1 rounded-full ${
                          court.status === 'available'
                            ? 'text-red-600 hover:bg-red-100'
                            : 'text-green-600 hover:bg-green-100'
                        }`}
                        title={court.status === 'available' ? 'Set to maintenance' : 'Set to available'}
                      >
                        {court.status === 'available' ? <X size={18} /> : <Check size={18} />}
                      </button>
                      <button
                        onClick={() => handleEditCourt(court)}
                        className="p-1 rounded-full text-blue-600 hover:bg-blue-100"
                        title="Edit court"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => handleDeleteCourt(court.id)}
                        className="p-1 rounded-full text-red-600 hover:bg-red-100"
                        title="Delete court"
                      >
                        <Trash size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default CourtsManagement;