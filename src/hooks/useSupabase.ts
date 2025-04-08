import { useEffect } from 'react';
import { useAuthStore } from '../store';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

export const useSupabaseSubscriptions = () => {
  const { user, fetchEvents, fetchPhotos, fetchProfile } = useAuthStore();

  useEffect(() => {
    if (!user) return;

    // Subscribe to events changes
    const eventsSubscription = supabase
      .channel('events_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'events',
        },
        () => {
          fetchEvents();
          toast.info('Events updated');
        }
      )
      .subscribe();

    // Subscribe to photos changes
    const photosSubscription = supabase
      .channel('photos_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'photos',
        },
        () => {
          fetchPhotos();
          toast.info('Photos updated');
        }
      )
      .subscribe();

    // Subscribe to profile changes
    const profileSubscription = supabase
      .channel('profile_changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user.id}`,
        },
        () => {
          fetchProfile(user.id);
          toast.info('Profile updated');
        }
      )
      .subscribe();

    return () => {
      eventsSubscription.unsubscribe();
      photosSubscription.unsubscribe();
      profileSubscription.unsubscribe();
    };
  }, [user, fetchEvents, fetchPhotos, fetchProfile]);
};