import { create } from 'zustand';
import { AuthUser } from '../lib/auth';
import { supabase } from '../lib/supabase';
import { Database } from '../lib/supabase-types';

type Event = Database['public']['Tables']['events']['Row'];
type Photo = Database['public']['Tables']['photos']['Row'];
type User = Database['public']['Tables']['users']['Row'];

interface AuthState {
  user: AuthUser | null;
  profile: User | null;
  events: Event[];
  photos: Photo[];
  loading: boolean;
  error: string | null;
  isDarkMode: boolean;
  setUser: (user: AuthUser | null) => void;
  setProfile: (profile: User | null) => void;
  setEvents: (events: Event[]) => void;
  setPhotos: (photos: Photo[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  toggleDarkMode: () => void;
  fetchProfile: (userId: string) => Promise<void>;
  fetchEvents: () => Promise<void>;
  fetchPhotos: (eventId?: string) => Promise<void>;
  clearSession: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  profile: null,
  events: [],
  photos: [],
  loading: false,
  error: null,
  isDarkMode: false,
  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),
  setEvents: (events) => set({ events }),
  setPhotos: (photos) => set({ photos }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  toggleDarkMode: () => set((state) => ({ isDarkMode: !state.isDarkMode })),
  clearSession: () => set({
    user: null,
    profile: null,
    events: [],
    photos: [],
    error: null
  }),
  fetchProfile: async (userId) => {
    try {
      set({ loading: true, error: null });
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      set({ profile: data });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to fetch profile' });
    } finally {
      set({ loading: false });
    }
  },
  fetchEvents: async () => {
    try {
      set({ loading: true, error: null });
      const { data, error } = await supabase
        .from('events')
        .select('*, users(*)');

      if (error) throw error;
      set({ events: data });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to fetch events' });
    } finally {
      set({ loading: false });
    }
  },
  fetchPhotos: async (eventId) => {
    try {
      set({ loading: true, error: null });
      let query = supabase.from('photos').select('*, events(*), users(*)');
      
      if (eventId) {
        query = query.eq('event_id', eventId);
      }

      const { data, error } = await query;

      if (error) throw error;
      set({ photos: data });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to fetch photos' });
    } finally {
      set({ loading: false });
    }
  },
}));