'use client';
import React, { useState, useEffect } from 'react';
import { X, Camera, User, Mail, Phone, MapPin, Calendar, Settings, Bell } from 'lucide-react';
import Button from '@/components/atoms/Button/Button';
import Input from '@/components/atoms/Input/Input';
import Avatar from '@/components/atoms/Avatar/Avatar';
import Badge from '@/components/atoms/Badge/Badge';
import { useAuth } from '@/features/auth/context/AuthContext';
import { ProfileService } from '@/services/profile';
import { UpdateProfileDto, UpdateSettingsDto } from '@/types/user';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'settings'>('profile');
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

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
    if (user) {
      setProfileData({
        displayName: user.profile?.displayName || '',
        bio: user.profile?.bio || '',
        location: user.profile?.location || '',
        birthdate: user.profile?.birthdate ? new Date(user.profile.birthdate).toISOString().split('T')[0] : '',
      });

      setSettingsData({
        notifications: user.settings?.notifications ?? true,
        privacy: user.settings?.privacy || 'public',
        language: user.settings?.language || 'vi',
        theme: user.settings?.theme || 'light',
      });
    }
  }, [user]);

  const handleProfileInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
  };

  const handleSettingsChange = (field: string, value: any) => {
    setSettingsData(prev => ({ ...prev, [field]: value }));
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    try {
      setIsUploading(true);
      const updatedUser = await ProfileService.updateAvatar(file);
      updateUser(updatedUser);
      
      // Show success message
      alert('Avatar updated successfully');
    } catch (error: any) {
      console.error('Avatar upload failed:', error);
      alert(error.response?.data?.message || 'Failed to update avatar');
    } finally {
      setIsUploading(false);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      setIsLoading(true);
      const updatedUser = await ProfileService.updateProfile(profileData);
      updateUser(updatedUser);
      
      // Show success message
      alert('Profile updated successfully');
    } catch (error: any) {
      console.error('Profile update failed:', error);
      alert(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSettingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      setIsLoading(true);
      const updatedUser = await ProfileService.updateSettings(settingsData);
      updateUser(updatedUser);
      
      // Show success message
      alert('Settings updated successfully');
    } catch (error: any) {
      console.error('Settings update failed:', error);
      alert(error.response?.data?.message || 'Failed to update settings');
    } finally {
      setIsLoading(false);
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
                    src={user?.avatar}
                    name={user?.username}
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
                  <h3 className="text-lg font-semibold text-gray-900">{user?.username}</h3>
                  <p className="text-sm text-gray-500">{user?.email}</p>
                  <div className="flex items-center space-x-2 mt-2">
                    <Badge variant="primary" size="sm">
                      {user?.role}
                    </Badge>
                    <Badge 
                      variant={user?.status === 'active' ? 'success' : 'default'} 
                      size="sm"
                    >
                      {user?.status}
                    </Badge>
                  </div>
                </div>
              </div>

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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                    placeholder="Tell us about yourself..."
                  />
                </div>
              </div>

              {/* Stats */}
              {user?.stats && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3">Account Statistics</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">{user.stats.gamesPlayed}</div>
                      <div className="text-sm text-gray-500">Games Played</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{user.stats.gamesWon}</div>
                      <div className="text-sm text-gray-500">Games Won</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-600">{user.stats.totalEarnings} KC</div>
                      <div className="text-sm text-gray-500">Total Earnings</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{user.stats.followersCount}</div>
                      <div className="text-sm text-gray-500">Followers</div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-3">
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" loading={isLoading}>
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
                    <span className="font-medium text-purple-600">{user?.kcBalance} KC</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Trust Score:</span>
                    <span className="font-medium">{user?.trustScore}/100</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Member Since:</span>
                    <span className="font-medium">
                      {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" loading={isLoading}>
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