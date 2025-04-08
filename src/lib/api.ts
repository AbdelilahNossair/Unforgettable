import { supabase } from './supabase';
import { Database } from './supabase-types';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';

type Tables = Database['public']['Tables'];
type User = Tables['users']['Row'];
type Event = Tables['events']['Row'];
type Photo = Tables['photos']['Row'];
type EventPhotographer = Tables['event_photographers']['Row'];

// Helper function to validate UUID
const isValidUUID = (str: string) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
};

// Generate a unique event code
const generateEventCode = () => {
  // Generate a 6-character alphanumeric code
  const code = Math.random().toString(36).substring(2, 8).toUpperCase();
  return code;
};

// Events
export const getEvents = async () => {
  const { data, error } = await supabase
    .from('events')
    .select('*, users(*)')
    .order('date', { ascending: true });

  if (error) {
    console.error('Error fetching events:', error);
    throw error;
  }
  return data;
};

export const createEvent = async (event: Omit<Event, 'id' | 'created_at' | 'updated_at'>, imageFile?: File) => {
  try {
    let imageUrl = '';
    
    if (imageFile) {
      imageUrl = await uploadEventImage(imageFile);
    }

    // Generate a unique event code
    const eventCode = generateEventCode();

    const { data, error } = await supabase
      .from('events')
      .insert([{ 
        ...event, 
        image_url: imageUrl, 
        qr_code: eventCode // Use the generated code
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating event:', error);
    throw error;
  }
};

export const updateEvent = async (id: string, updates: Partial<Event>, imageFile?: File) => {
  try {
    let imageUrl = updates.image_url;
    
    if (imageFile) {
      // Delete old image if it exists
      if (updates.image_url) {
        const oldImagePath = updates.image_url.split('/').pop();
        if (oldImagePath) {
          await supabase.storage
            .from('event-images')
            .remove([oldImagePath]);
        }
      }
      
      imageUrl = await uploadEventImage(imageFile);
    }

    const { data, error } = await supabase
      .from('events')
      .update({ ...updates, image_url: imageUrl })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating event:', error);
    throw error;
  }
};

export const deleteEvent = async (id: string) => {
  try {
    // Get the event to find the image URL
    const { data: event } = await supabase
      .from('events')
      .select('image_url')
      .eq('id', id)
      .single();

    if (event?.image_url) {
      // Extract file path from URL
      const filePath = event.image_url.split('/').pop();
      if (filePath) {
        // Delete the image from storage
        await supabase.storage
          .from('event-images')
          .remove([filePath]);
      }
    }

    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting event:', error);
    throw error;
  }
};

export const uploadEventImage = async (file: File): Promise<string> => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${uuidv4()}.${fileExt}`;
  const filePath = `${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('event-images')
    .upload(filePath, file);

  if (uploadError) {
    console.error('Error uploading file:', uploadError);
    throw uploadError;
  }

  const { data: { publicUrl } } = supabase.storage
    .from('event-images')
    .getPublicUrl(filePath);

  return publicUrl;
};

// Get event by ID or code
export const getEventByIdOrCode = async (idOrCode: string) => {
  try {
    let query;

    // Check if the provided string is a valid UUID
    if (isValidUUID(idOrCode)) {
      // Try to fetch by ID
      query = supabase
        .from('events')
        .select('*')
        .eq('id', idOrCode)
        .limit(1)
        .maybeSingle();
    } else {
      // Try event code
      query = supabase
        .from('events')
        .select('*')
        .eq('qr_code', idOrCode.toUpperCase()) // Convert to uppercase for consistency
        .limit(1)
        .maybeSingle();
    }

    const { data, error } = await query;

    if (error) throw error;
    if (!data) throw new Error('Event not found');
    
    return data;
  } catch (error) {
    console.error('Error fetching event:', error);
    throw error;
  }
};

// Register for an event
export const registerForEvent = async (eventCode: string, userId: string, faceImageFile: File) => {
  try {
    // Get the event
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('id')
      .eq('qr_code', eventCode.toUpperCase())
      .single();

    if (eventError) throw eventError;
    if (!event) throw new Error('Event not found');

    // Check if already registered
    const { data: existingRegistration, error: checkError } = await supabase
      .from('event_attendees')
      .select('id')
      .eq('event_id', event.id)
      .eq('user_id', userId)
      .maybeSingle();

    if (checkError) throw checkError;
    if (existingRegistration) throw new Error('Already registered for this event');

    // Upload face image
    const fileExt = faceImageFile.name.split('.').pop();
    const fileName = `${userId}-${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('face-images')
      .upload(filePath, faceImageFile);

    if (uploadError) throw uploadError;

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('face-images')
      .getPublicUrl(filePath);

    // Update user with face image URL
    const { error: userError } = await supabase
      .from('users')
      .update({
        face_image_url: publicUrl
      })
      .eq('id', userId);

    if (userError) throw userError;

    // Create registration
    const { error: registrationError } = await supabase
      .from('event_attendees')
      .insert({
        event_id: event.id,
        user_id: userId,
        registration_complete: true,
        face_registration_date: new Date().toISOString()
      });

    if (registrationError) throw registrationError;

    return event;
  } catch (error) {
    console.error('Error registering for event:', error);
    throw error;
  }
};

// Dashboard Analytics
export const getDashboardStats = async () => {
  try {
    const [
      { count: totalUsers },
      { count: totalEvents },
      { count: totalPhotos },
      { count: totalAttendees }
    ] = await Promise.all([
      supabase.from('users').select('*', { count: 'exact', head: true }),
      supabase.from('events').select('*', { count: 'exact', head: true }),
      supabase.from('photos').select('*', { count: 'exact', head: true }),
      supabase.from('event_attendees').select('*', { count: 'exact', head: true })
    ]);

    const { data: recentEvents } = await supabase
      .from('events')
      .select('*')
      .order('date', { ascending: true })
      .limit(5);

    const { data: userStats } = await supabase
      .from('users')
      .select('role')
      .then(({ data }) => {
        const stats = {
          admin: 0,
          photographer: 0,
          attendee: 0
        };
        data?.forEach(user => {
          stats[user.role as keyof typeof stats]++;
        });
        return { data: stats };
      });

    const { data: eventsByStatus } = await supabase
      .from('events')
      .select('status')
      .then(({ data }) => {
        const stats = {
          upcoming: 0,
          active: 0,
          completed: 0,
          archived: 0
        };
        data?.forEach(event => {
          stats[event.status as keyof typeof stats]++;
        });
        return { data: stats };
      });

    const { data: monthlyEvents } = await supabase
      .from('events')
      .select('date')
      .gte('date', new Date(new Date().setMonth(new Date().getMonth() - 6)).toISOString())
      .then(({ data }) => {
        const months: Record<string, number> = {};
        data?.forEach(event => {
          const month = new Date(event.date).toLocaleString('default', { month: 'short' });
          months[month] = (months[month] || 0) + 1;
        });
        return { data: months };
      });

    const { data: photographerStats } = await supabase
      .from('event_photographers')
      .select(`
        photographer_id,
        users!event_photographers_photographer_id_fkey (
          email,
          full_name
        ),
        events!event_photographers_event_id_fkey (
          id
        )
      `)
      .then(({ data }) => {
        const stats = new Map();
        data?.forEach(record => {
          const photographer = record.users;
          const key = photographer?.email || 'Unknown';
          const current = stats.get(key) || { name: photographer?.full_name, count: 0 };
          current.count++;
          stats.set(key, current);
        });
        return { data: Array.from(stats, ([email, stats]) => ({ email, ...stats })) };
      });

    return {
      totalUsers,
      totalEvents,
      totalPhotos,
      totalAttendees,
      recentEvents,
      userStats,
      eventsByStatus,
      monthlyEvents,
      photographerStats
    };
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    throw error;
  }
};

// Get photographers
export const getPhotographers = async () => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('role', 'photographer')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching photographers:', error);
    throw error;
  }
  return data;
};

// Get event photographers
export const getEventPhotographers = async (eventId: string) => {
  const { data, error } = await supabase
    .from('event_photographers')
    .select('*, users(*)')
    .eq('event_id', eventId);

  if (error) {
    console.error('Error fetching event photographers:', error);
    throw error;
  }
  return data;
};

// Assign photographer to event
export const assignPhotographer = async (eventId: string, photographerId: string) => {
  const { data, error } = await supabase
    .from('event_photographers')
    .insert([{ 
      event_id: eventId, 
      photographer_id: photographerId 
    }])
    .select()
    .single();

  if (error) {
    console.error('Error assigning photographer:', error);
    throw error;
  }
  return data;
};

// Remove photographer from event
export const removePhotographer = async (eventId: string, photographerId: string) => {
  const { error } = await supabase
    .from('event_photographers')
    .delete()
    .eq('event_id', eventId)
    .eq('photographer_id', photographerId);

  if (error) {
    console.error('Error removing photographer:', error);
    throw error;
  }
};

// Get all users
export const getUsers = async () => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching users:', error);
    throw error;
  }

  return data;
};

// Create a new user
export const createUser = async (userData: { 
  email: string; 
  password_hash: string; 
  role: 'admin' | 'photographer' | 'attendee';
  full_name?: string;
  avatar_url?: string;
}) => {
  const { data, error } = await supabase
    .from('users')
    .insert([userData])
    .select()
    .single();

  if (error) {
    console.error('Error creating user:', error);
    throw error;
  }

  return data;
};

// Update an existing user
export const updateUser = async (
  id: string, 
  userData: {
    email?: string;
    password_hash?: string;
    role?: 'admin' | 'photographer' | 'attendee';
    full_name?: string;
    avatar_url?: string;
  }
) => {
  const { data, error } = await supabase
    .from('users')
    .update(userData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating user:', error);
    throw error;
  }

  return data;
};

// Delete a user
export const deleteUser = async (id: string) => {
  const { error } = await supabase
    .from('users')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
};

// Update user profile
export const updateProfile = async (
  id: string,
  profileData: {
    full_name?: string;
    email?: string;
    avatar_url?: string;
  }
) => {
  // Only include fields that have actually changed
  const updates: Record<string, any> = {};
  
  // Only add fields that have a value and are different from empty string
  Object.entries(profileData).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      updates[key] = value;
    }
  });

  // If there are no updates, return early
  if (Object.keys(updates).length === 0) {
    return;
  }

  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating profile:', error);
    throw error;
  }

  return data;
};