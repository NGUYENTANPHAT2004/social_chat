// fe/src/features/user/components/ProfileModal/ProfileModal.tsx - Optimized
'use client';
import React, { useState, useEffect } from 'react';
import { X, Camera, User, MapPin, Calendar, Settings, Bell } from 'lucide-react';
import Button from '@/components/atoms/Button/Button';
import Input from '@/components/atoms/Input/Input';
import Avatar from '@/components/atoms/Avatar/Avatar';
import Badge from '@/components/atoms/Badge/Badge';
import { useUser, useUserValidation } from '@/hooks/useUserProfile';
import { UpdateProfileDto, UpdateSettingsDto } from '@/types/user';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
  const { 
    currentUser, 
    updateUserProfile, 
    updateUserSettings, 
    updateAvatar, 
    loading, 
    error,
    clearUserError 
  } = useUser();
  
  const { 
    validateDisplayName, 
    validateBio, 
    validateAvatarFile 
  } = useUserValidation();

  const [activeTab, setActiveTab] = useState<'profile' | 'settings'>('profile');
  const [isUploading, setIsUploading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Profile form data
  const [profileData, setProfileData] = useState<UpdateProfileDto>({
    displayName: '',
    bio: '',
    location: '',
    birthdate: '',
  });

  // Settings form data
  const [settingsData, setSettingsData] = useState<UpdateSettingsDto>({
    notifications: true,
    privacy: 'public',
    language: 'vi',
    theme: 'light',
  });

  useEffect(() => {
    if (currentUser) {
      setProfileData({
        displayName: currentUser.profile?.displayName || '',
        bio: currentUser.profile?.bio || '',
        location: currentUser.profile?.location || '',
        birthdate: currentUser.profile?.birthdate 
          ? new Date(currentUser.profile.birthdate).toISOString().split('T')[0] 
          : '',
      });

      setSettingsData({
        notifications: currentUser.settings?.notifications ?? true,
        privacy: currentUser.settings?.privacy || 'public',
        language: currentUser.settings?.language || 'vi',
        theme: currentUser.settings?.theme || 'light',
      });
    }
  }, [currentUser]);

  useEffect(() => {
    if (error) {
      setErrors({ general: error });
    } else {
      setErrors({});
    }
  }, [error]);

  const handleProfileInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
    
    // Clear field error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSettingsChange = (field: string, value: any) => {
    setSettingsData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    // Validate display name
    const displayNameError = validateDisplayName(profileData.displayName || '');
    if (displayNameError) {
      newErrors.displayName = displayNameError;
    }

    // Validate bio
    const bioError = validateBio(profileData.bio || '');
    if (bioError) {
      newErrors.bio = bioError;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    const fileError = validateAvatarFile(file);
    if (fileError) {
      setErrors({ avatar: fileError });
      return;
    }

    try {
      setIsUploading(true);
      setErrors({});
      
      await updateAvatar(file);
      
      // Show success message (you can replace with toast notification)
      alert('Avatar updated successfully');
    } catch (error: any) {
      console.error('Avatar upload failed:', error);
      setErrors({ avatar: 'Failed to update avatar' });
    } finally {
      setIsUploading(false);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    if (!validateForm()) return;

    try {
      clearUserError();
      await updateUserProfile(profileData);
      
      // Show success message
      alert('Profile updated successfully');
    } catch (error: any) {
      console.error('Profile update failed:', error);
      setErrors({ general: 'Failed to update profile' });
    }
  };

  const handleSettingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    try {
      clearUserError();
      await updateUserSettings(settingsData);
      
      // Show success message
      alert('Settings updated successfully');
    } catch (error: any) {
      console.error('Settings update failed:', error);
      setErrors({ general: 'Failed to update settings' });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Profile Settings</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Error Display */}
        {errors.general && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{errors.general}</p>
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex-1 px-6 py-3 text-center font-medium transition-colors ${
              activeTab === 'profile'
                ? 'text-purple-600 border-b-2 border-purple-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <User className="w-5 h-5 inline mr-2" />
            Profile
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex-1 px-6 py-3 text-center font-medium transition-colors ${
              activeTab === 'settings'
                ? 'text-purple-600 border-b-2 border-purple-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Settings className="w-5 h-5 inline mr-2" />
            Settings
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh] custom-scrollbar">
          {activeTab === 'profile' && (
            <form onSubmit={handleProfileSubmit} className="space-y-6">
              {/* Avatar Section */}
              <div className="flex items-center space-x-6">
                <div className="relative">
                  <Avatar
                    src={currentUser?.avatar}
                    name={currentUser?.username}
                    size="2xl"
                  />
                  <label
                    htmlFor="avatar-upload"
                    className={`absolute bottom-0 right-0 bg-purple-500 text-white p-2 rounded-full cursor-pointer hover:bg-purple-600 transition-colors ${
                      isUploading ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    <Camera className="w-4 h-4" />
                  </label>
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarUpload}
                    disabled={isUploading}
                  />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{currentUser?.username}</h3>
                  <p className="text-sm text-gray-500">{currentUser?.email}</p>
                  <div className="flex items-center space-x-2 mt-2">
                    <Badge variant="primary" size="sm">
                      {currentUser?.role}
                    </Badge>
                    <Badge 
                      variant={currentUser?.status === 'active' ? 'success' : 'default'} 
                      size="sm"
                    >
                      {currentUser?.status}
                    </Badge>
                  </div>
                </div>
              </div>

              {errors.avatar && (
                <div className="text-sm text-red-600">{errors.avatar}</div>
              )}

              {/* Profile Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Input
                    type="text"
                    name="displayName"
                    label="Display Name"
                    placeholder="Enter your display name"
                    value={profileData.displayName}
                    onChange={handleProfileInputChange}
                    leftIcon={<User className="w-5 h-5" />}
                    error={errors.displayName}
                  />
                </div>

                <Input
                  type="text"
                  name="location"
                  label="Location"
                  placeholder="Enter your location"
                  value={profileData.location}
                  onChange={handleProfileInputChange}
                  leftIcon={<MapPin className="w-5 h-5" />}
                />

                <Input
                  type="date"
                  name="birthdate"
                  label="Birth Date"
                  value={profileData.birthdate}
                  onChange={handleProfileInputChange}
                  leftIcon={<Calendar className="w-5 h-5" />}
                />

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bio
                  </label>
                  <textarea
                    name="bio"
                    value={profileData.bio}
                    onChange={handleProfileInputChange}
                    rows={3}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none ${
                      errors.bio ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Tell us about yourself..."
                  />
                  {errors.bio && (
                    <p className="mt-1 text-sm text-red-600">{errors.bio}</p>
                  )}
                </div>
              </div>

              {/* Stats */}
              {currentUser?.stats && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3">Account Statistics</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">{currentUser.stats.gamesPlayed}</div>
                      <div className="text-sm text-gray-500">Games Played</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{currentUser.stats.gamesWon}</div>
                      <div className="text-sm text-gray-500">Games Won</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-600">{currentUser.stats.totalEarnings} KC</div>
                      <div className="text-sm text-gray-500">Total Earnings</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{currentUser.stats.followersCount}</div>
                      <div className="text-sm text-gray-500">Followers</div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-3">
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" loading={loading}>
                  Save Profile
                </Button>
              </div>
            </form>
          )}

          {activeTab === 'settings' && (
            <form onSubmit={handleSettingsSubmit} className="space-y-6">
              {/* Notification Settings */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900 flex items-center">
                  <Bell className="w-5 h-5 mr-2" />
                  Notification Preferences
                </h4>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700">
                      Enable Notifications
                    </label>
                    <button
                      type="button"
                      onClick={() => handleSettingsChange('notifications', !settingsData.notifications)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        settingsData.notifications ? 'bg-purple-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          settingsData.notifications ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* Privacy Settings */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900">Privacy Settings</h4>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Profile Visibility
                  </label>
                  <select
                    value={settingsData.privacy}
                    onChange={(e) => handleSettingsChange('privacy', e.target.value as 'public' | 'private' | 'friends')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="public">Public</option>
                    <option value="friends">Friends Only</option>
                    <option value="private">Private</option>
                  </select>
                </div>
              </div>

              {/* Appearance Settings */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900">Appearance</h4>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Theme
                  </label>
                  <select
                    value={settingsData.theme}
                    onChange={(e) => handleSettingsChange('theme', e.target.value as 'light' | 'dark')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Language
                  </label>
                  <select
                    value={settingsData.language}
                    onChange={(e) => handleSettingsChange('language', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="vi">Tiếng Việt</option>
                    <option value="en">English</option>
                  </select>
                </div>
              </div>

              {/* Account Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3">Account Information</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Balance:</span>
                    <span className="font-medium text-purple-600">{currentUser?.kcBalance} KC</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Trust Score:</span>
                    <span className="font-medium">{currentUser?.trustScore}/100</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Member Since:</span>
                    <span className="font-medium">
                      {currentUser?.createdAt ? new Date(currentUser.createdAt).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" loading={loading}>
                  Save Settings
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;