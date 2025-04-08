import React, { useEffect, useState } from 'react';
import { Camera, Loader2, Plus, X } from 'lucide-react';
import { getPhotographers, getEventPhotographers, assignPhotographer, removePhotographer } from '../lib/api';
import { toast } from 'sonner';
import { Database } from '../lib/supabase-types';

type User = Database['public']['Tables']['users']['Row'];
type EventPhotographer = Database['public']['Tables']['event_photographers']['Row'] & {
  users: User;
};

interface PhotographerSelectProps {
  eventId: string | null;
  className?: string;
}

export const PhotographerSelect: React.FC<PhotographerSelectProps> = ({ eventId, className = '' }) => {
  const [photographers, setPhotographers] = useState<User[]>([]);
  const [assignedPhotographers, setAssignedPhotographers] = useState<EventPhotographer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPhotographer, setSelectedPhotographer] = useState<string>('');

  useEffect(() => {
    fetchData();
  }, [eventId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const photographersData = await getPhotographers();
      setPhotographers(photographersData);

      if (eventId) {
        const assignedData = await getEventPhotographers(eventId);
        setAssignedPhotographers(assignedData);
      } else {
        setAssignedPhotographers([]);
      }
    } catch (error) {
      console.error('Error fetching photographers:', error);
      toast.error('Failed to fetch photographers');
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedPhotographer || !eventId) return;
    
    try {
      await assignPhotographer(eventId, selectedPhotographer);
      setSelectedPhotographer('');
      await fetchData();
      toast.success('Photographer assigned successfully');
    } catch (error) {
      console.error('Error assigning photographer:', error);
      toast.error('Failed to assign photographer');
    }
  };

  const handleRemove = async (photographerId: string) => {
    if (!eventId) return;

    try {
      await removePhotographer(eventId, photographerId);
      await fetchData();
      toast.success('Photographer removed successfully');
    } catch (error) {
      console.error('Error removing photographer:', error);
      toast.error('Failed to remove photographer');
    }
  };

  const availablePhotographers = photographers.filter(
    p => !assignedPhotographers.some(ap => ap.photographer_id === p.id)
  );

  if (loading) {
    return (
      <div className="flex justify-center py-4">
        <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
      </div>
    );
  }

  if (!eventId) {
    return (
      <div className="text-sm text-gray-500 dark:text-gray-400 italic">
        Save the event first to assign photographers
      </div>
    );
  }

  if (availablePhotographers.length === 0 && assignedPhotographers.length === 0) {
    return (
      <div className="text-sm text-gray-500 dark:text-gray-400 italic">
        No photographers available
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {availablePhotographers.length > 0 && (
        <div className="flex items-center space-x-2">
          <select
            value={selectedPhotographer}
            onChange={(e) => setSelectedPhotographer(e.target.value)}
            className="flex-1 px-4 py-2 border rounded dark:bg-gray-700 dark:border-gray-600"
          >
            <option value="">Select a photographer</option>
            {availablePhotographers.map((photographer) => (
              <option key={photographer.id} value={photographer.id}>
                {photographer.email}
              </option>
            ))}
          </select>
          <button
            onClick={handleAssign}
            disabled={!selectedPhotographer}
            className="p-2 bg-gray-900 dark:bg-white text-white dark:text-black rounded hover:bg-gray-800 dark:hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>
      )}

      {assignedPhotographers.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Assigned Photographers ({assignedPhotographers.length})
          </h4>
          {assignedPhotographers.map((assignment) => (
            <div
              key={assignment.id}
              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
            >
              <div className="flex items-center space-x-3">
                <Camera className="h-5 w-5 text-gray-500" />
                <span className="text-sm font-medium">
                  {assignment.users.email}
                </span>
              </div>
              <button
                onClick={() => handleRemove(assignment.photographer_id)}
                className="p-1 text-red-500 hover:text-red-700 dark:hover:text-red-400 transition-colors"
                title="Remove photographer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};