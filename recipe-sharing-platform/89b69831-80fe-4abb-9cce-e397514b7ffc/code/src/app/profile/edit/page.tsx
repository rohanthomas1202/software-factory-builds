'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Spinner } from '@/components/ui/Spinner';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { 
  User, 
  Mail, 
  Camera, 
  Save, 
  X, 
  ArrowLeft, 
  Globe, 
  MapPin, 
  Calendar,
  Lock,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  Upload,
  Trash2
} from 'lucide-react';
import Link from 'next/link';

interface ProfileFormData {
  displayName: string;
  username: string;
  email: string;
  bio: string;
  avatarUrl: string;
  coverImageUrl: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export default function EditProfilePage() {
  const router = useRouter();
  const { user, isLoading: authLoading, updateProfile } = useAuth();
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState<ProfileFormData>({
    displayName: '',
    username: '',
    email: '',
    bio: '',
    avatarUrl: '',
    coverImageUrl: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof ProfileFormData, string>>>({});

  // Initialize form with user data
  useEffect(() => {
    if (user) {
      setFormData({
        displayName: user.displayName || '',
        username: user.username || '',
        email: user.email || '',
        bio: user.bio || '',
        avatarUrl: user.avatarUrl || '',
        coverImageUrl: user.coverImageUrl || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    }
  }, [user]);

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof ProfileFormData, string>> = {};

    if (!formData.displayName.trim()) {
      newErrors.displayName = 'Display name is required';
    }

    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      newErrors.username = 'Username can only contain letters, numbers, and underscores';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (formData.newPassword) {
      if (!formData.currentPassword) {
        newErrors.currentPassword = 'Current password is required to set a new password';
      }

      if (formData.newPassword.length < 6) {
        newErrors.newPassword = 'Password must be at least 6 characters';
      }

      if (formData.newPassword !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast({
        title: 'Validation Error',
        description: 'Please fix the errors in the form',
        type: 'error',
      });
      return;
    }

    setIsSaving(true);
    try {
      const updateData: any = {
        displayName: formData.displayName,
        username: formData.username,
        email: formData.email,
        bio: formData.bio,
        avatarUrl: formData.avatarUrl,
        coverImageUrl: formData.coverImageUrl,
      };

      if (formData.newPassword) {
        updateData.currentPassword = formData.currentPassword;
        updateData.newPassword = formData.newPassword;
      }

      const success = await updateProfile(updateData);
      
      if (success) {
        toast({
          title: 'Profile Updated',
          description: 'Your profile has been successfully updated',
          type: 'success',
        });
        
        // Redirect to profile page if username changed
        if (formData.username !== user?.username) {
          router.push(`/profile/${formData.username}`);
        }
      } else {
        toast({
          title: 'Update Failed',
          description: 'Failed to update profile. Please try again.',
          type: 'error',
        });
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        type: 'error',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (field: keyof ProfileFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleImageUpload = async (field: 'avatarUrl' | 'coverImageUrl', file: File) => {
    // In a real app, you would upload to a storage service
    // For now, we'll simulate by creating a data URL
    const reader = new FileReader();
    reader.onloadend = () => {
      handleInputChange(field, reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" label="Loading..." />
      </div>
    );
  }

  if (!user) {
    router.push('/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-950 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <Link
            href={`/profile/${user.username}`}
            className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Profile
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Edit Profile
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                Update your profile information and settings
              </p>
            </div>
            <Badge variant="primary" className="gap-2">
              <User className="w-3 h-3" />
              {user.recipeCount} recipes
            </Badge>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Cover Image */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Camera className="w-5 h-5" />
              Cover Image
            </h2>
            <div className="relative h-48 rounded-xl overflow-hidden bg-gradient-to-r from-primary-500 to-primary-600">
              {formData.coverImageUrl ? (
                <Image
                  src={formData.coverImageUrl}
                  alt="Cover"
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Camera className="w-12 h-12 text-white/50" />
                </div>
              )}
              <div className="absolute bottom-4 right-4">
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageUpload('coverImageUrl', file);
                    }}
                  />
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    className="gap-2 backdrop-blur-sm bg-white/10 hover:bg-white/20"
                  >
                    <Upload className="w-4 h-4" />
                    Change Cover
                  </Button>
                </label>
              </div>
            </div>
          </div>

          {/* Profile Image & Basic Info */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <User className="w-5 h-5" />
              Basic Information
            </h2>
            
            <div className="flex flex-col md:flex-row gap-8">
              {/* Avatar */}
              <div className="md:w-1/3">
                <div className="flex flex-col items-center">
                  <div className="relative mb-4">
                    <Avatar
                      src={formData.avatarUrl}
                      alt={formData.displayName}
                      size="xl"
                      border
                      className="ring-4 ring-white dark:ring-gray-800"
                    />
                    <label className="absolute bottom-0 right-0 cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleImageUpload('avatarUrl', file);
                        }}
                      />
                      <div className="w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center hover:bg-primary-600 transition-colors">
                        <Camera className="w-5 h-5 text-white" />
                      </div>
                    </label>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                    Click the camera icon to upload a new profile picture
                  </p>
                </div>
              </div>

              {/* Form Fields */}
              <div className="md:w-2/3 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input
                    label="Display Name"
                    value={formData.displayName}
                    onChange={(e) => handleInputChange('displayName', e.target.value)}
                    error={errors.displayName}
                    leftIcon={<User className="w-4 h-4" />}
                    placeholder="Your display name"
                    required
                  />
                  
                  <Input
                    label="Username"
                    value={formData.username}
                    onChange={(e) => handleInputChange('username', e.target.value)}
                    error={errors.username}
                    leftIcon={<User className="w-4 h-4" />}
                    placeholder="username"
                    required
                  />
                </div>

                <Input
                  label="Email Address"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  error={errors.email}
                  leftIcon={<Mail className="w-4 h-4" />}
                  placeholder="your@email.com"
                  required
                />

                <Textarea
                  label="Bio"
                  value={formData.bio}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                  placeholder="Tell the community about yourself..."
                  rows={4}
                  maxLength={500}
                  showCount
                  helperText="Share your cooking style, favorite cuisines, or anything else!"
                />
              </div>
            </div>
          </div>

          {/* Password Change */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <Lock className="w-5 h-5" />
              Change Password
            </h2>
            
            <div className="space-y-6">
              <Input
                label="Current Password"
                type={showPassword ? 'text' : 'password'}
                value={formData.currentPassword}
                onChange={(e) => handleInputChange('currentPassword', e.target.value)}
                error={errors.currentPassword}
                leftIcon={<Lock className="w-4 h-4" />}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                }
                placeholder="Enter current password"
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="New Password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.newPassword}
                  onChange={(e) => handleInputChange('newPassword', e.target.value)}
                  error={errors.newPassword}
                  placeholder="At least 6 characters"
                  helperText="Leave blank to keep current password"
                />
                
                <Input
                  label="Confirm New Password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  error={errors.confirmPassword}
                  placeholder="Confirm new password"
                />
              </div>

              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                <AlertCircle className="w-4 h-4" />
                <p>Password must be at least 6 characters long</p>
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-red-200 dark:border-red-900/50">
            <h2 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-4">
              Danger Zone
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg bg-red-50 dark:bg-red-900/20">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    Delete Account
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                    Permanently delete your account and all your data
                  </p>
                </div>
                <Button
                  type="button"
                  variant="danger"
                  className="gap-2"
                  onClick={() => {
                    toast({
                      title: 'Account Deletion',
                      description: 'This feature is not implemented in the demo',
                      type: 'warning',
                    });
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Account
                </Button>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
            <Link href={`/profile/${user.username}`}>
              <Button type="button" variant="ghost" className="gap-2">
                <X className="w-4 h-4" />
                Cancel
              </Button>
            </Link>
            
            <div className="flex items-center gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setFormData({
                    displayName: user.displayName || '',
                    username: user.username || '',
                    email: user.email || '',
                    bio: user.bio || '',
                    avatarUrl: user.avatarUrl || '',
                    coverImageUrl: user.coverImageUrl || '',
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: '',
                  });
                  setErrors({});
                }}
              >
                Reset Changes
              </Button>
              
              <Button
                type="submit"
                variant="primary"
                isLoading={isSaving}
                className="gap-2"
              >
                <Save className="w-4 h-4" />
                Save Changes
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}