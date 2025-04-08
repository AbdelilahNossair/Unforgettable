import React, { useState, useEffect } from 'react';
import { QRCodeDownload } from '../components/QRCodeDownload';
import { PhotographerSelect } from '../components/PhotographerSelect';
import { DataControls } from '../components/DataControls';
import { EmptyState } from '../components/EmptyState';
import { useDataControls } from '../hooks/useDataControls';
import { useAuthStore } from '../store';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { ImageUpload } from '../components/ImageUpload';
import { Pencil, Trash2, Plus, Calendar, MapPin, Users, Building2, User, Clock, X, Check, Camera, Upload } from 'lucide-react';
import { deleteEvent, updateEvent, createEvent } from '../lib/api';
import { Database } from '../lib/supabase-types';

type Event = Database['public']['Tables']['events']['Row'];

interface EventForm {
  name: string;
  description: string;
  date: string;
  event_time: string;
  location: string;
  host_type: 'company' | 'individual';
  host_name: string;
  expected_attendees: number;
  image_url: string;
}

const sortOptions = [
  { label: 'Name (A-Z)', value: 'name_asc' },
  { label: 'Name (Z-A)', value: 'name_desc' },
  { label: 'Date (Newest)', value: 'date_desc' },
  { label: 'Date (Oldest)', value: 'date_asc' },
];

const filterOptions = [
  { label: 'Upcoming', value: 'upcoming' },
  { label: 'Active', value: 'active' },
  { label: 'Completed', value: 'completed' },
  { label: 'Company Events', value: 'company' },
  { label: 'Individual Events', value: 'individual' },
];

export const Events: React.FC = () => {
  const [events, setEvents] = useState<any[]>([]);
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [editingEvent, setEditingEvent] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [uploadingPhotos, setUploadingPhotos] = useState<{ [key: string]: boolean }>({});
  const [form, setForm] = useState<EventForm>({
    name: '',
    description: '',
    date: '',
    event_time: '',
    location: '',
    host_type: 'company',
    host_name: '',
    expected_attendees: 0,
    image_url: '',
  });

  const {
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy,
    activeFilters,
    setActiveFilters,
    filteredData,
  } = useDataControls({
    data: events,
    searchFields: ['name', 'description', 'location', 'host_name'],
    initialSort: 'date_desc',
  });

  useEffect(() => {
    fetchEvents();
  }, [user]);

  const fetchEvents = async () => {
    try {
      let query = supabase.from('events').select('*').order('date', { ascending: true });

      if (user?.role === 'photographer') {
        const { data: photographerEvents, error: photographerError } = await supabase
          .from('event_photographers')
          .select('event_id')
          .eq('photographer_id', user.id);

        if (photographerError) throw photographerError;

        const eventIds = photographerEvents?.map(pe => pe.event_id) || [];
        if (eventIds.length > 0) {
          query = query.in('id', eventIds);
        } else {
          setEvents([]);
          setLoading(false);
          return;
        }
      }

      const { data: eventsData, error: eventsError } = await query;

      if (eventsError) throw eventsError;

      const eventsWithPhotographers = await Promise.all(
        (eventsData || []).map(async (event) => {
          const { data: photographers, error: photographersError } = await supabase
            .from('event_photographers')
            .select(`
              id,
              photographer_id,
              users (
                id,
                email,
                full_name
              )
            `)
            .eq('event_id', event.id);

          if (photographersError) throw photographersError;

          return {
            ...event,
            photographers: photographers || [],
          };
        })
      );

      setEvents(eventsWithPhotographers);
    } catch (error) {
      toast.error('Failed to fetch events');
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const getEventStatus = (event: Event) => {
    const eventDate = new Date(event.date);
    const now = new Date();

    if (eventDate > now) {
      return 'upcoming';
    } else if (eventDate <= now && !event.image_url) {
      return 'active';
    } else {
      return 'completed';
    }
  };

  const handleCreate = async () => {
    try {
      if (!user) return;

      await createEvent({
        ...form,
        status: getEventStatus({
          ...form,
          date: new Date(form.date).toISOString(),
        } as Event),
        created_by: user.id,
      }, selectedImage || undefined);

      setIsCreating(false);
      setSelectedImage(null);
      setForm({
        name: '',
        description: '',
        date: '',
        event_time: '',
        location: '',
        image_url: '',
        host_type: 'company',
        host_name: '',
        expected_attendees: 0,
      });
      await fetchEvents();
      toast.success('Event created successfully');
    } catch (error) {
      console.error('Error creating event:', error);
      toast.error('Failed to create event');
    }
  };

  const handlePhotoUpload = async (eventId: string, files: FileList) => {
    setUploadingPhotos(prev => ({ ...prev, [eventId]: true }));

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `event-photos/${eventId}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('event-photos')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('event-photos')
          .getPublicUrl(filePath);

        const { error: dbError } = await supabase
          .from('photos')
          .insert({
            event_id: eventId,
            url: publicUrl,
            uploaded_by: user?.id,
          });

        if (dbError) throw dbError;
      }

      toast.success(`${files.length} photo${files.length === 1 ? '' : 's'} uploaded successfully`);

      const isDone = window.confirm(
        'Photos uploaded successfully! Are you done uploading photos for this event? Click OK if you\'re finished, or Cancel if you have more photos to upload.'
      );

      if (isDone) {
        const { error: updateError } = await supabase
          .from('events')
          .update({ status: 'completed' })
          .eq('id', eventId);

        if (updateError) {
          throw updateError;
        }

        toast.success('Event marked as completed');
        await fetchEvents();
      }

    } catch (error) {
      console.error('Error uploading photos:', error);
      toast.error('Failed to upload photos');
    } finally {
      setUploadingPhotos(prev => ({ ...prev, [eventId]: false }));
    }
  };

  const handleEdit = (event: any) => {
    setEditingEvent(event.id);
    setForm({
      name: event.name,
      description: event.description || '',
      date: new Date(event.date).toISOString().split('T')[0],
      event_time: event.event_time || '',
      location: event.location,
      host_type: event.host_type || 'company',
      host_name: event.host_name || '',
      expected_attendees: event.expected_attendees || 0,
      image_url: event.image_url || '',
    });
  };

  const handleUpdate = async (id: string) => {
    try {
      await updateEvent(id, {
        ...form,
        status: getEventStatus({
          ...form,
          date: new Date(form.date).toISOString(),
        } as Event),
      }, selectedImage || undefined);

      setEditingEvent(null);
      setSelectedImage(null);
      await fetchEvents();
      toast.success('Event updated successfully');
    } catch (error) {
      console.error('Error updating event:', error);
      toast.error('Failed to update event');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this event?')) {
      return;
    }

    try {
      await deleteEvent(id);
      await fetchEvents();
      toast.success('Event deleted successfully');
    } catch (error) {
      console.error('Error deleting event:', error);
      toast.error('Failed to delete event');
    }
  };

  const isAdmin = user?.role === 'admin';
  const isPhotographer = user?.role === 'photographer';

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">
          {isPhotographer ? 'My Assigned Events' : 'Events'}
        </h1>
        {isAdmin && (
          <button 
            onClick={() => setIsCreating(true)}
            className="flex items-center px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-black rounded hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
          >
            <Plus className="h-5 w-5 mr-2" />
            Create Event
          </button>
        )}
      </div>

      <DataControls
        searchPlaceholder="Search events..."
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        sortOptions={sortOptions}
        selectedSort={sortBy}
        onSortChange={setSortBy}
        filterOptions={filterOptions}
        selectedFilters={activeFilters}
        onFilterChange={setActiveFilters}
      />

      {isCreating && (
        <div className="mb-8 bg-white dark:bg-gray-800 rounded-lg p-6">
          <h2 className="text-lg font-medium mb-4">Create New Event</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Event Name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-4 py-2 border rounded dark:bg-gray-700 dark:border-gray-600"
              />
              <textarea
                placeholder="Description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full px-4 py-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                rows={3}
              />
              <ImageUpload
                onImageSelect={(file) => setSelectedImage(file)}
                onImageClear={() => {
                  setSelectedImage(null);
                  setForm({ ...form, image_url: '' });
                }}
                currentImage={form.image_url}
              />
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="w-full px-4 py-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                />
                <input
                  type="time"
                  value={form.event_time}
                  onChange={(e) => setForm({ ...form, event_time: e.target.value })}
                  className="w-full px-4 py-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                />
              </div>
              <input
                type="text"
                placeholder="Location"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                className="w-full px-4 py-2 border rounded dark:bg-gray-700 dark:border-gray-600"
              />
              <select
                value={form.host_type}
                onChange={(e) => setForm({ ...form, host_type: e.target.value as 'company' | 'individual' })}
                className="w-full px-4 py-2 border rounded dark:bg-gray-700 dark:border-gray-600"
              >
                <option value="company">Company</option>
                <option value="individual">Individual</option>
              </select>
              <input
                type="text"
                placeholder="Host Name"
                value={form.host_name}
                onChange={(e) => setForm({ ...form, host_name: e.target.value })}
                className="w-full px-4 py-2 border rounded dark:bg-gray-700 dark:border-gray-600"
              />
              <input
                type="number"
                placeholder="Expected Attendees"
                value={form.expected_attendees}
                onChange={(e) => setForm({ ...form, expected_attendees: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border rounded dark:bg-gray-700 dark:border-gray-600"
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2 mt-6">
            <button
              onClick={() => {
                setIsCreating(false);
                setSelectedImage(null);
              }}
              className="px-4 py-2 border rounded hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              className="px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-black rounded hover:bg-gray-800 dark:hover:bg-gray-100"
            >
              Create
            </button>
          </div>
        </div>
      )}

      {filteredData.length === 0 ? (
        <EmptyState
          title={isPhotographer ? "No assigned events" : "No events found"}
          message={isPhotographer 
            ? "You haven't been assigned to any events yet."
            : "Try adjusting your search criteria or filters to find what you're looking for."}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredData.map((event) => (
            <div key={event.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
              {editingEvent === event.id ? (
                <div className="p-6 space-y-4">
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-4 py-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                    placeholder="Event Name"
                  />
                  <ImageUpload
                    onImageSelect={(file) => setSelectedImage(file)}
                    onImageClear={() => {
                      setSelectedImage(null);
                      setForm({ ...form, image_url: '' });
                    }}
                    currentImage={form.image_url}
                  />
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="w-full px-4 py-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                    placeholder="Description"
                    rows={3}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="date"
                      value={form.date}
                      onChange={(e) => setForm({ ...form, date: e.target.value })}
                      className="w-full px-4 py-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                    />
                    <input
                      type="time"
                      value={form.event_time}
                      onChange={(e) => setForm({ ...form, event_time: e.target.value })}
                      className="w-full px-4 py-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                    />
                  </div>
                  <input
                    type="text"
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    className="w-full px-4 py-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                    placeholder="Location"
                  />
                  <select
                    value={form.host_type}
                    onChange={(e) => setForm({ ...form, host_type: e.target.value as 'company' | 'individual' })}
                    className="w-full px-4 py-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                  >
                    <option value="company">Company</option>
                    <option value="individual">Individual</option>
                  </select>
                  <input
                    type="text"
                    value={form.host_name}
                    onChange={(e) => setForm({ ...form, host_name: e.target.value })}
                    className="w-full px-4 py-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                    placeholder="Host Name"
                  />
                  <input
                    type="number"
                    value={form.expected_attendees}
                    onChange={(e) => setForm({ ...form, expected_attendees: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                    placeholder="Expected Attendees"
                  />
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => {
                        setEditingEvent(null);
                        setSelectedImage(null);
                      }}
                      className="p-2 text-red-600 hover:text-red-900 dark:hover:text-red-400"
                    >
                      <X className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleUpdate(event.id)}
                      className="p-2 text-green-600 hover:text-green-900 dark:hover:text-green-400"
                    >
                      <Check className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {event.image_url && (
                    <div className="relative h-48">
                      <img
                        src={event.image_url}
                        alt={event.name}
                        className="w-full h-full object-cover"
                      />
                      {isAdmin && (
                        <div className="absolute top-2 right-2 flex space-x-2">
                          <button
                            onClick={() => handleEdit(event)}
                            className="p-2 bg-white/90 rounded-full hover:bg-white transition-colors"
                          >
                            <Pencil className="h-4 w-4 text-gray-700" />
                          </button>
                          <button
                            onClick={() => handleDelete(event.id)}
                            className="p-2 bg-white/90 rounded-full hover:bg-white transition-colors"
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                  <div className="p-6">
                    <div className="flex justify-between items-start">
                      <h2 className="text-xl font-semibold mb-2">{event.name}</h2>
                      {!event.image_url && isAdmin && (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEdit(event)}
                            className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(event.id)}
                            className="p-2 text-red-500 hover:text-red-700 dark:hover:text-red-300"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>
                    <p className="text-gray-600 dark:text-gray-300 mb-4">{event.description}</p>
                    <div className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2" />
                        <span>{new Date(event.date).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-2" />
                        <span>{event.event_time}</span>
                      </div>
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-2" />
                        <span>{event.location}</span>
                      </div>
                      <div className="flex items-center">
                        {event.host_type === 'company' ? (
                          <Building2 className="h-4 w-4 mr-2" />
                        ) : (
                          <User className="h-4 w-4 mr-2" />
                        )}
                        <span>{event.host_name}</span>
                      </div>
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-2" />
                        <span>{event.expected_attendees} expected attendees</span>
                      </div>
                    </div>

                    {isPhotographer && (
                      <div className="mt-6 pt-4 border-t dark:border-gray-700">
                        <input
                          type="file"
                          id={`photo-upload-${event.id}`}
                          multiple
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => e.target.files && handlePhotoUpload(event.id, e.target.files)}
                        />
                        <label
                          htmlFor={`photo-upload-${event.id}`}
                          className={`flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-white bg-gray-900 dark:text-black dark:bg-white rounded-md hover:bg-gray-800 dark:hover:bg-gray-100 cursor-pointer transition-colors ${
                            uploadingPhotos[event.id] ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                        >
                          {uploadingPhotos[event.id] ? (
                            <>
                              <Upload className="h-4 w-4 mr-2 animate-bounce" />
                              Uploading...
                            </>
                          ) : (
                            <>
                              <Camera className="h-4 w-4 mr-2" />
                              Upload Photos
                            </>
                          )}
                        </label>
                      </div>
                    )}

                    {isAdmin && (
                      <div className="mt-6 pt-4 border-t dark:border-gray-700">
                        <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                          Assigned Photographers
                        </h3>
                        <PhotographerSelect eventId={event.id} />
                      </div>
                    )}

                    {event.qr_code && (
                      <div className="mt-6 pt-4 border-t dark:border-gray-700">
                        <QRCodeDownload 
                          url={event.qr_code}
                          eventName={event.name}
                          eventDate={event.date}
                          eventTime={event.event_time}
                          location={event.location}
                          hostType={event.host_type}
                          hostName={event.host_name}
                          imageUrl={event.image_url}
                        />
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};