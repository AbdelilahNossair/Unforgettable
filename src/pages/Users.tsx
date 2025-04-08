import React, { useEffect, useState } from 'react';
import { User, Mail, Calendar, Pencil, Trash2, Plus, X, Check, Loader2 } from 'lucide-react';
import { getUsers, createUser, updateUser, deleteUser } from '../lib/api';
import { DataControls } from '../components/DataControls';
import { EmptyState } from '../components/EmptyState';
import { useDataControls } from '../hooks/useDataControls';
import { ImageUpload } from '../components/ImageUpload';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { Database } from '../lib/supabase-types';

type User = Database['public']['Tables']['users']['Row'];

const sortOptions = [
  { label: 'Email (A-Z)', value: 'email_asc' },
  { label: 'Email (Z-A)', value: 'email_desc' },
  { label: 'Role (A-Z)', value: 'role_asc' },
  { label: 'Role (Z-A)', value: 'role_desc' },
  { label: 'Created (Newest)', value: 'created_desc' },
  { label: 'Created (Oldest)', value: 'created_asc' },
];

const filterOptions = [
  { label: 'Admins', value: 'admin' },
  { label: 'Photographers', value: 'photographer' },
  { label: 'Attendees', value: 'attendee' },
];

export const Users: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [editForm, setEditForm] = useState({
    email: '',
    password_hash: '',
    role: '' as 'admin' | 'photographer' | 'attendee',
    full_name: '',
    avatar_url: '',
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
    data: users,
    searchFields: ['email', 'role', 'full_name'],
    initialSort: 'email_asc',
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const data = await getUsers();
      setUsers(data);
    } catch (error) {
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (file: File): Promise<string> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('users-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('users-images')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  };

  const handleCreate = async () => {
    try {
      let avatarUrl = '';
      if (selectedImage) {
        avatarUrl = await handleImageUpload(selectedImage);
      }

      await createUser({
        ...editForm,
        avatar_url: avatarUrl,
      });

      setIsCreating(false);
      setSelectedImage(null);
      setEditForm({
        email: '',
        password_hash: '',
        role: 'attendee',
        full_name: '',
        avatar_url: '',
      });
      await fetchUsers();
      toast.success('User created successfully');
    } catch (error) {
      toast.error('Failed to create user');
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user.id);
    setEditForm({
      email: user.email,
      password_hash: user.password_hash,
      role: user.role,
      full_name: user.full_name || '',
      avatar_url: user.avatar_url || '',
    });
  };

  const handleUpdate = async (id: string) => {
    try {
      let avatarUrl = editForm.avatar_url;
      if (selectedImage) {
        avatarUrl = await handleImageUpload(selectedImage);
      }

      await updateUser(id, {
        ...editForm,
        avatar_url: avatarUrl,
      });
      setEditingUser(null);
      setSelectedImage(null);
      await fetchUsers();
      toast.success('User updated successfully');
    } catch (error) {
      toast.error('Failed to update user');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    
    try {
      await deleteUser(id);
      await fetchUsers();
      toast.success('User deleted successfully');
    } catch (error) {
      toast.error('Failed to delete user');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  return (
    <div className="py-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Users</h1>
        <button
          onClick={() => setIsCreating(true)}
          className="px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors flex items-center"
        >
          <Plus className="h-5 w-5 mr-2" />
          Add User
        </button>
      </div>

      <DataControls
        searchPlaceholder="Search users..."
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
          <h2 className="text-lg font-medium mb-4">Create New User</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <input
                type="email"
                placeholder="Email"
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                className="w-full px-4 py-2 border rounded dark:bg-gray-700 dark:border-gray-600"
              />
              <input
                type="password"
                placeholder="Password"
                value={editForm.password_hash}
                onChange={(e) => setEditForm({ ...editForm, password_hash: e.target.value })}
                className="w-full px-4 py-2 border rounded dark:bg-gray-700 dark:border-gray-600"
              />
              <select
                value={editForm.role}
                onChange={(e) => setEditForm({ ...editForm, role: e.target.value as any })}
                className="w-full px-4 py-2 border rounded dark:bg-gray-700 dark:border-gray-600"
              >
                <option value="">Select Role</option>
                <option value="admin">Admin</option>
                <option value="photographer">Photographer</option>
                <option value="attendee">Attendee</option>
              </select>
              <input
                type="text"
                placeholder="Full Name"
                value={editForm.full_name}
                onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                className="w-full px-4 py-2 border rounded dark:bg-gray-700 dark:border-gray-600"
              />
            </div>
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Profile Image
              </label>
              <ImageUpload
                onImageSelect={(file) => setSelectedImage(file)}
                onImageClear={() => {
                  setSelectedImage(null);
                  setEditForm({ ...editForm, avatar_url: '' });
                }}
                currentImage={editForm.avatar_url}
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
          title="No users found"
          message="Try adjusting your search criteria or filters to find what you're looking for."
        />
      ) : (
        <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Join Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredData.map((user) => (
                  <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {editingUser === user.id ? (
                          <div className="flex-shrink-0">
                            <ImageUpload
                              onImageSelect={(file) => setSelectedImage(file)}
                              onImageClear={() => {
                                setSelectedImage(null);
                                setEditForm({ ...editForm, avatar_url: '' });
                              }}
                              currentImage={editForm.avatar_url}
                              className="h-10 w-10"
                            />
                          </div>
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
                            {user.avatar_url ? (
                              <img
                                src={user.avatar_url}
                                alt={user.full_name || user.email}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <User className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                            )}
                          </div>
                        )}
                        <div className="ml-4">
                          {editingUser === user.id ? (
                            <div className="space-y-2">
                              <input
                                type="email"
                                value={editForm.email}
                                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                                className="block w-full px-2 py-1 text-sm border rounded dark:bg-gray-700 dark:border-gray-600"
                              />
                              <input
                                type="text"
                                value={editForm.full_name}
                                onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                                className="block w-full px-2 py-1 text-sm border rounded dark:bg-gray-700 dark:border-gray-600"
                                placeholder="Full Name"
                              />
                            </div>
                          ) : (
                            <div>
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {user.full_name}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {user.email}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingUser === user.id ? (
                        <select
                          value={editForm.role}
                          onChange={(e) => setEditForm({ ...editForm, role: e.target.value as any })}
                          className="block w-full px-2 py-1 text-sm border rounded dark:bg-gray-700 dark:border-gray-600"
                        >
                          <option value="admin">Admin</option>
                          <option value="photographer">Photographer</option>
                          <option value="attendee">Attendee</option>
                        </select>
                      ) : (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                          {user.role}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {editingUser === user.id ? (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleUpdate(user.id)}
                            className="text-green-600 hover:text-green-900 dark:hover:text-green-400"
                          >
                            <Check className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => {
                              setEditingUser(null);
                              setSelectedImage(null);
                            }}
                            className="text-red-600 hover:text-red-900 dark:hover:text-red-400"
                          >
                            <X className="h-5 w-5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEdit(user)}
                            className="text-indigo-600 hover:text-indigo-900 dark:hover:text-indigo-400"
                          >
                            <Pencil className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(user.id)}
                            className="text-red-600 hover:text-red-900 dark:hover:text-red-400"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};