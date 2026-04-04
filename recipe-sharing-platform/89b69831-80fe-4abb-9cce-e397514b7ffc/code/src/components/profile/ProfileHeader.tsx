'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { User, Recipe } from '@/types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { 
  Edit, 
  Settings, 
  Mail, 
  Calendar, 
  MapPin, 
  Globe, 
  ChefHat, 
  Users, 
  Star, 
  Bookmark, 
  MoreVertical,
  Share2,
  Bell,
  BellOff,
  Camera,
  Link as LinkIcon,
  Check,
  X
} from 'lucide-react';

interface ProfileHeaderProps {
  user: User;
  isCurrentUser?: boolean;
  recipeCount?: number;
  averageRating?: number;
  className?: string;
}

export function ProfileHeader({ 
  user, 
  isCurrentUser = false, 
  recipeCount = 0,
  averageRating = 0,
  className 
}: ProfileHeaderProps) {
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  
  const [isFollowing, setIsFollowing] = useState(
    currentUser?.following?.includes(user.id) || false
  );
  const [isLoading, setIsLoading] = useState(false);
  const [showCoverModal, setShowCoverModal] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  
  const handleFollowToggle = async () => {
    if (!currentUser) {
      toast({
        title: 'Authentication Required',
        description: 'Please log in to follow users',
        type: 'warning',
      });
      router.push('/login');
      return;
    }
    
    if (isCurrentUser) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/users/${user.username}/follow`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: isFollowing ? 'unfollow' : 'follow' }),
      });
      
      if (response.ok) {
        setIsFollowing(!isFollowing);
        toast({
          title: isFollowing ? 'Unfollowed' : 'Following',
          description: isFollowing 
            ? `You've unfollowed ${user.displayName}`
            : `You're now following ${user.displayName}`,
          type: 'success',
        });
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update follow status');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update follow status',
        type: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleShareProfile = () => {
    const profileUrl = `${window.location.origin}/profile/${user.username}`;
    if (navigator.share) {
      navigator.share({
        title: `${user.displayName}'s Profile on RecipeShare`,
        text: `Check out ${user.displayName}'s recipes on RecipeShare!`,
        url: profileUrl,
      });
    } else {
      navigator.clipboard.writeText(profileUrl);
      toast({
        title: 'Link Copied',
        description: 'Profile link copied to clipboard',
        type: 'success',
      });
    }
    setShowShareModal(false);
  };
  
  const formatJoinDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      year: 'numeric' 
    });
  };
  
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };
  
  return (
    <>
      <div className={cn('relative rounded-2xl overflow-hidden bg-gradient-to-br from-gray-900 to-gray-800 dark:from-gray-950 dark:to-gray-900', className)}>
        {/* Cover Image */}
        <div className="relative h-48 md:h-64 lg:h-80 w-full">
          {user.coverImageUrl ? (
            <Image
              src={user.coverImageUrl}
              alt={`${user.displayName}'s cover`}
              fill
              className="object-cover"
              priority
              onClick={() => setShowCoverModal(true)}
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-r from-primary-600 to-primary-400 dark:from-primary-700 dark:to-primary-500" />
          )}
          
          {/* Cover Image Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          
          {/* Cover Image Actions */}
          {isCurrentUser && (
            <div className="absolute top-4 right-4">
              <Button
                variant="outline"
                size="sm"
                className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20"
                leftIcon={<Camera className="w-4 h-4" />}
                onClick={() => setShowCoverModal(true)}
              >
                Change Cover
              </Button>
            </div>
          )}
        </div>
        
        {/* Profile Info Section */}
        <div className="relative px-4 md:px-8 pb-6 md:pb-8">
          <div className="flex flex-col md:flex-row items-start md:items-end gap-4 md:gap-6 -mt-16 md:-mt-20">
            {/* Avatar */}
            <div className="relative">
              <Avatar
                src={user.avatarUrl}
                alt={user.displayName}
                size="xl"
                className="border-4 border-white dark:border-gray-900 shadow-2xl"
                fallback={getInitials(user.displayName)}
              />
              
              {isCurrentUser && (
                <Button
                  variant="primary"
                  size="sm"
                  className="absolute -bottom-2 -right-2 rounded-full p-2 shadow-lg"
                  onClick={() => setShowAvatarModal(true)}
                >
                  <Camera className="w-4 h-4" />
                </Button>
              )}
              
              {user.isAdmin && (
                <Badge
                  variant="primary"
                  className="absolute -top-2 -right-2 px-2 py-1 text-xs font-semibold"
                >
                  <ChefHat className="w-3 h-3 mr-1" />
                  Admin
                </Badge>
              )}
            </div>
            
            {/* User Info */}
            <div className="flex-1 flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div className="space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                  <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white">
                    {user.displayName}
                  </h1>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-gray-300">@{user.username}</span>
                    
                    {averageRating > 0 && (
                      <Badge variant="warning" className="gap-1">
                        <Star className="w-3 h-3 fill-current" />
                        {averageRating.toFixed(1)}
                      </Badge>
                    )}
                  </div>
                </div>
                
                {user.bio && (
                  <p className="text-gray-300 max-w-2xl">
                    {user.bio}
                  </p>
                )}
                
                {/* User Stats */}
                <div className="flex flex-wrap items-center gap-4 pt-2">
                  <div className="flex items-center gap-2 text-gray-300">
                    <Calendar className="w-4 h-4" />
                    <span className="text-sm">Joined {formatJoinDate(user.joinDate)}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-gray-300">
                    <ChefHat className="w-4 h-4" />
                    <span className="text-sm">{recipeCount} recipes</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-gray-300">
                    <Users className="w-4 h-4" />
                    <span className="text-sm">
                      {user.followers?.length || 0} followers • {user.following?.length || 0} following
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                {isCurrentUser ? (
                  <>
                    <Link href="/profile/edit">
                      <Button
                        variant="outline"
                        className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20"
                        leftIcon={<Edit className="w-4 h-4" />}
                      >
                        Edit Profile
                      </Button>
                    </Link>
                    
                    <Link href="/settings">
                      <Button
                        variant="ghost"
                        className="text-white hover:bg-white/10"
                        leftIcon={<Settings className="w-4 h-4" />}
                      >
                        Settings
                      </Button>
                    </Link>
                  </>
                ) : (
                  <>
                    <Button
                      variant={isFollowing ? "outline" : "primary"}
                      className={cn(
                        isFollowing 
                          ? "bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20"
                          : "bg-white text-gray-900 hover:bg-gray-100"
                      )}
                      leftIcon={isFollowing ? <Check className="w-4 h-4" /> : <Users className="w-4 h-4" />}
                      onClick={handleFollowToggle}
                      isLoading={isLoading}
                      disabled={isLoading}
                    >
                      {isFollowing ? 'Following' : 'Follow'}
                    </Button>
                    
                    <Button
                      variant="outline"
                      className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20"
                      leftIcon={<Mail className="w-4 h-4" />}
                    >
                      Message
                    </Button>
                  </>
                )}
                
                <Button
                  variant="ghost"
                  className="text-white hover:bg-white/10"
                  leftIcon={<Share2 className="w-4 h-4" />}
                  onClick={() => setShowShareModal(true)}
                >
                  Share
                </Button>
                
                {!isCurrentUser && (
                  <Button
                    variant="ghost"
                    className="text-white hover:bg-white/10"
                    leftIcon={<Bell className="w-4 h-4" />}
                  >
                    Notify
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Cover Image Modal */}
      <Modal
        isOpen={showCoverModal}
        onClose={() => setShowCoverModal(false)}
        title="Change Cover Image"
        size="lg"
      >
        <div className="space-y-4">
          <div className="aspect-video relative rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
            {user.coverImageUrl ? (
              <Image
                src={user.coverImageUrl}
                alt="Current cover"
                fill
                className="object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <Camera className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">No cover image</p>
                </div>
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <Button variant="outline" leftIcon={<Upload className="w-4 h-4" />}>
              Upload New
            </Button>
            <Button variant="outline" leftIcon={<LinkIcon className="w-4 h-4" />}>
              From URL
            </Button>
          </div>
          
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="ghost" onClick={() => setShowCoverModal(false)}>
              Cancel
            </Button>
            <Button variant="primary">
              Save Changes
            </Button>
          </div>
        </div>
      </Modal>
      
      {/* Avatar Modal */}
      <Modal
        isOpen={showAvatarModal}
        onClose={() => setShowAvatarModal(false)}
        title="Change Profile Picture"
        size="md"
      >
        <div className="space-y-4">
          <div className="flex justify-center">
            <Avatar
              src={user.avatarUrl}
              alt={user.displayName}
              size="xl"
              className="border-4 border-gray-200 dark:border-gray-700"
              fallback={getInitials(user.displayName)}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <Button variant="outline" leftIcon={<Upload className="w-4 h-4" />}>
              Upload Photo
            </Button>
            <Button variant="outline" leftIcon={<LinkIcon className="w-4 h-4" />}>
              From URL
            </Button>
          </div>
          
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="ghost" onClick={() => setShowAvatarModal(false)}>
              Cancel
            </Button>
            <Button variant="primary">
              Save Changes
            </Button>
          </div>
        </div>
      </Modal>
      
      {/* Share Modal */}
      <Modal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        title="Share Profile"
        size="sm"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <Avatar
              src={user.avatarUrl}
              alt={user.displayName}
              size="md"
              fallback={getInitials(user.displayName)}
            />
            <div>
              <p className="font-semibold">{user.displayName}</p>
              <p className="text-sm text-gray-500">@{user.username}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-4 gap-2">
            <Button variant="ghost" className="flex-col h-auto py-3">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mb-1">
                <span className="text-white font-bold">f</span>
              </div>
              <span className="text-xs">Facebook</span>
            </Button>
            
            <Button variant="ghost" className="flex-col h-auto py-3">
              <div className="w-8 h-8 bg-blue-400 rounded-full flex items-center justify-center mb-1">
                <span className="text-white font-bold">𝕏</span>
              </div>
              <span className="text-xs">Twitter</span>
            </Button>
            
            <Button variant="ghost" className="flex-col h-auto py-3">
              <div className="w-8 h-8 bg-pink-500 rounded-full flex items-center justify-center mb-1">
                <span className="text-white font-bold">IG</span>
              </div>
              <span className="text-xs">Instagram</span>
            </Button>
            
            <Button variant="ghost" className="flex-col h-auto py-3">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mb-1">
                <Mail className="w-4 h-4 text-white" />
              </div>
              <span className="text-xs">Email</span>
            </Button>
          </div>
          
          <div className="flex gap-2">
            <Input
              value={`${window.location.origin}/profile/${user.username}`}
              readOnly
              className="flex-1"
            />
            <Button
              variant="primary"
              leftIcon={<LinkIcon className="w-4 h-4" />}
              onClick={handleShareProfile}
            >
              Copy
            </Button>
          </div>
          
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setShowShareModal(false)}>
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}