// src/lib/api.ts (Flask Backend Version)

import { supabase } from './supabase';
import { Database } from './supabase-types';
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

// Helper function to get face API URL
const getFaceApiUrl = () => {
  const apiUrl = import.meta.env.VITE_FACE_API_URL;
  if (!apiUrl) {
    console.warn('VITE_FACE_API_URL is not set in environment variables');
    return null;
  }
  return apiUrl;
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


// Fallback registration without face recognition
const registerForEventBasic = async (eventCode: string, userId: string, faceImageFile: File) => {
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

    // Update user with face image URL (but without embedding)
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

    return { success: true, message: "Registered without face recognition", event };
  } catch (error) {
    console.error('Error in basic registration:', error);
    throw error;
  }
};

// Upload event photo with face processing via Flask backend
export const uploadEventPhoto = async (eventId: string, file: File, userId: string) => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${eventId}-${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('event-photos')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from('event-photos')
      .getPublicUrl(filePath);

    // Create photo entry in database
    const { data: photoData, error: photoError } = await supabase
      .from('photos')
      .insert({
        event_id: eventId,
        url: publicUrl,
        uploaded_by: userId,
        processed: false
      })
      .select()
      .single();

    if (photoError) throw photoError;

    // Trigger photo processing via Flask backend
    const apiUrl = getFaceApiUrl();
    if (apiUrl) {
      try {
        // Create formData for the photo processing call
        const formData = new FormData();
        formData.append('photo_id', photoData.id);
        formData.append('supabase_url', supabase.supabaseUrl);
        formData.append('supabase_key', supabase.supabaseKey);
        
        // Call the Flask photo processing API (non-blocking)
        fetch(`${apiUrl}/process-photo`, {
          method: 'POST',
          body: formData,
        }).catch(err => {
          console.warn('Failed to trigger photo processing:', err);
        });
      } catch (error) {
        console.error('Failed to trigger photo processing:', error);
        // Don't throw, as we still uploaded the photo successfully
      }
    } else {
      console.warn('Face API URL not configured. Photo processing will not be triggered.');
    }

    return photoData;
  } catch (error) {
    console.error('Error uploading photo:', error);
    throw error;
  }
};

// Get event photos
export const getEventPhotos = async (eventId: string) => {
  const { data, error } = await supabase
    .from('photos')
    .select('*')
    .eq('event_id', eventId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching event photos:', error);
    throw error;
  }
  
  return data || [];
};

// Get faces for a photo
export const getPhotoFaces = async (photoId: string) => {
  const { data, error } = await supabase
    .from('faces')
    .select(`
      *,
      users (
        id,
        full_name,
        email,
        avatar_url
      )
    `)
    .eq('photo_id', photoId)
    .order('confidence', { ascending: false });

  if (error) {
    console.error('Error fetching photo faces:', error);
    throw error;
  }
  
  return data || [];
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

    // Get face recognition stats
    const { data: faceStats } = await supabase
      .from('faces')
      .select('confidence, user_id')
      .then(({ data }) => {
        if (!data || data.length === 0) {
          return { data: { total: 0, avgConfidence: 0, recognizedCount: 0, recognitionRate: 0 } };
        }
        
        const total = data.length;
        const recognizedCount = data.filter(face => face.user_id !== null).length;
        const avgConfidence = data
          .filter(face => face.user_id !== null)
          .reduce((sum, face) => sum + face.confidence, 0) / (recognizedCount || 1);
        
        return { 
          data: { 
            total, 
            avgConfidence: parseFloat(avgConfidence.toFixed(2)),
            recognizedCount,
            recognitionRate: parseFloat((recognizedCount / total * 100).toFixed(1))
          } 
        };
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
      photographerStats,
      faceStats
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


// Upload multiple photos for an event
export const uploadEventPhotos = async (eventId: string, files: File[]): Promise<string[]> => {
  try {
    const photoIds: string[] = [];
    
    for (const file of files) {
      // Generate a unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${uuidv4()}.${fileExt}`;
      const filePath = `${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('event-photos')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Error uploading file:', uploadError);
        continue;
      }

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('event-photos')
        .getPublicUrl(filePath);

      // Get current user ID
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id;

      if (!userId) {
        throw new Error('User not authenticated');
      }

      // Create photo record in database
      const { data: photo, error: dbError } = await supabase
        .from('photos')
        .insert({
          event_id: eventId,
          url: publicUrl,
          uploaded_by: userId,
          processed: false
        })
        .select('id')
        .single();

      if (dbError) {
        console.error('Error creating photo record:', dbError);
        continue;
      }

      photoIds.push(photo.id);
    }

    return photoIds;
  } catch (error) {
    console.error('Error uploading photos:', error);
    throw error;
  }
};

// Mark photo uploads as complete and start processing
export const completePhotoUploads = async (eventId: string, photoIds: string[]): Promise<void> => {
  try {
    if (photoIds.length === 0) {
      throw new Error('No photos to process');
    }
    
    // Verify that all photos exist and belong to this event
    const { data: photos, error: verifyError } = await supabase
      .from('photos')
      .select('id')
      .eq('event_id', eventId)
      .in('id', photoIds);

    if (verifyError) {
      console.error('Error verifying photos:', verifyError);
      throw verifyError;
    }

    if (!photos || photos.length !== photoIds.length) {
      throw new Error('Some photos could not be verified');
    }

    // Call Supabase Edge Function to process photos
    for (const photoId of photoIds) {
      const { error } = await supabase.functions.invoke('process-photo', {
        body: { photoId }
      });

      if (error) {
        console.error(`Error processing photo ${photoId}:`, error);
        // Continue with other photos even if one fails
      }
    }

    // Update the event status to indicate photos are being processed
    await supabase
      .from('events')
      .update({ 
        status: 'processing_photos',
        updated_at: new Date().toISOString()
      })
      .eq('id', eventId);

  } catch (error) {
    console.error('Error completing photo uploads:', error);
    throw error;
  }
};


// Set your Python API URL
const FACE_API_URL = process.env.FACE_API_URL || 'http://localhost:5000';

/**
 * Register a user's face with the Python API
 */
export const registerFace = async (eventCode: string, userId: string, imageFile: File): Promise<any> => {
  try {
    const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
    
    const formData = new FormData();
    formData.append('event_code', eventCode);
    formData.append('user_id', userId);
    formData.append('supabase_url', supabaseUrl);
    formData.append('supabase_key', supabaseKey); 
    formData.append('image', imageFile);

    // Call the Python API endpoint
    const response = await fetch(`${FACE_API_URL}/register-face`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to register face');
    }

    return await response.json();
  } catch (error) {
    console.error('Error registering face:', error);
    throw error;
  }
};

/**
 * Process a single photo with the Python API
 */
export const processPhoto = async (photoId: string): Promise<any> => {
  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
    const supabaseKey = import.meta.env.VITE_SUPABASE_SERVICE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY || '';
    
    const formData = new FormData();
    formData.append('photo_id', photoId);
    formData.append('supabase_url', supabaseUrl);
    formData.append('supabase_key', supabaseKey);

    // Call the Python API endpoint
    const response = await fetch(`${FACE_API_URL}/process-photo`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to process photo');
    }

    return await response.json();
  } catch (error) {
    console.error(`Error processing photo ${photoId}:`, error);
    throw error;
  }
};

/**
 * Process multiple photos in sequence
 */
export const processPhotos = async (photoIds: string[]): Promise<boolean> => {
  try {
    let allSuccessful = true;
    
    // Process photos in sequence to avoid overwhelming the API
    for (const photoId of photoIds) {
      try {
        await processPhoto(photoId);
      } catch (error) {
        console.error(`Error processing photo ${photoId}:`, error);
        allSuccessful = false;
      }
      
      // Add a small delay between requests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    return allSuccessful;
  } catch (error) {
    console.error('Error processing photos:', error);
    throw error;
  }
};

/**
 * Process all unprocessed photos for an event
 */
export const processEventPhotos = async (eventId: string): Promise<{
  total: number;
  processed: number;
}> => {
  try {
    // Get all unprocessed photos for this event
    const { data: photos, error } = await supabase
      .from('photos')
      .select('id')
      .eq('event_id', eventId)
      .eq('processed', false);
      
    if (error) throw error;
    
    if (!photos || photos.length === 0) {
      return { total: 0, processed: 0 };
    }
    
    const photoIds = photos.map(p => p.id);
    let processedCount = 0;
    
    // Process in smaller batches to avoid overwhelming the system
    const batchSize = 3;
    const batches = [];
    
    for (let i = 0; i < photoIds.length; i += batchSize) {
      batches.push(photoIds.slice(i, i + batchSize));
    }
    
    for (const batch of batches) {
      const success = await processPhotos(batch);
      if (success) {
        processedCount += batch.length;
      }
      
      // Add a delay between batches
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
    
    return {
      total: photoIds.length,
      processed: processedCount
    };
  } catch (error) {
    console.error('Error processing event photos:', error);
    throw error;
  }
};

// Register for an event with face embedding extraction using Flask backend
export const registerForEvent = async (eventCode: string, userId: string, faceImageFile: File) => {
  try {
    const apiUrl = getFaceApiUrl();
    if (!apiUrl) {
      // Fallback to basic registration without face recognition
      return registerForEventBasic(eventCode, userId, faceImageFile);
    }

    // Create formData for the face registration call
    const formData = new FormData();
    formData.append('event_code', eventCode);
    formData.append('user_id', userId);
    formData.append('image', faceImageFile);
    formData.append('supabase_url', supabase.supabaseUrl);
    formData.append('supabase_key', supabase.supabaseKey);

    // Call the Flask face registration API
    const response = await fetch(`${apiUrl}/register-face`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to register for event');
    }

    const result = await response.json();
    
    // Get the event details to return to the caller
    const { data: event } = await supabase
      .from('events')
      .select('*')
      .eq('qr_code', eventCode)
      .single();
      
    return {
      ...result,
      event
    };
  } catch (error) {
    console.error('Error registering for event:', error);
    throw error;
  }
};