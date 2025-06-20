'use client';

import React, { useState, useCallback } from 'react';
import { EditProfileProps, UpdateProfileDto } from '../type';

/**
 * EditProfile Component - Form chỉnh sửa profile
 */
export const EditProfile: React.FC<EditProfileProps> = ({
  user,
  onSave,
  onCancel,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState<UpdateProfileDto>({
    displayName: user.profile.displayName,
    bio: user.profile.bio,
    location: user.profile.location,
    birthdate: user.profile.birthdate?.toISOString().split('T')[0],
  });

  const handleInputChange = useCallback((field: keyof UpdateProfileDto, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  }, [formData, onSave]);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Display Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Display Name
        </label>
        <input
          type="text"
          value={formData.displayName || ''}
          onChange={(e) => handleInputChange('displayName', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          placeholder="Your display name"
        />
      </div>

      {/* Bio */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Bio
        </label>
        <textarea
          value={formData.bio || ''}
          onChange={(e) => handleInputChange('bio', e.target.value)}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          placeholder="Tell us about yourself"
        />
      </div>

      {/* Location */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Location
        </label>
        <input
          type="text"
          value={formData.location || ''}
          onChange={(e) => handleInputChange('location', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          placeholder="Your location"
        />
      </div>

      {/* Birthdate */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Birth Date
        </label>
        <input
          type="date"
          value={formData.birthdate || ''}
          onChange={(e) => handleInputChange('birthdate', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Buttons */}
      <div className="flex space-x-4">
        <button
          type="submit"
          disabled={isLoading}
          className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
        >
          {isLoading ? 'Saving...' : 'Save Changes'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
        >
          Cancel
        </button>
      </div>
    </form>
  );
};