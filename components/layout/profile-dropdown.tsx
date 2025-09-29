'use client';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, Settings, LogOut, Shield, Mail, Phone } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { signOut } from '@/lib/auth';
import { motion } from 'framer-motion';

interface ProfileDropdownProps {
  user: {
    name?: string;
    role?: string;
    email?: string;
    profile_image?: string;
  } | null;
}

export function ProfileDropdown({ user }: ProfileDropdownProps) {
  const handleSignOut = async () => {
    await signOut();
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleBadge = (role: string) => {
    return role === 'admin' ? (
      <Badge variant="warning" size="sm" className="ml-2">
        <Shield className="h-3 w-3 mr-1" />
        Admin
      </Badge>
    ) : (
      <Badge variant="info" size="sm" className="ml-2">
        <User className="h-3 w-3 mr-1" />
        Teacher
      </Badge>
    );
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <motion.button 
          className="flex items-center gap-3 hover:bg-gray-50 rounded-xl p-2 transition-all duration-200"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-gray-900 leading-tight">
              {user?.name || 'User'}
            </p>
            <div className="flex items-center justify-end gap-1">
              <p className="text-xs text-gray-500">
                {user?.role === 'admin' ? 'Administrator' : 'Teacher'}
              </p>
              {user?.role && getRoleBadge(user.role)}
            </div>
          </div>
          
          <div className="relative">
            <Avatar className="h-10 w-10 border-2 border-gray-200 shadow-sm">
              {user?.profile_image ? (
                <AvatarImage src={user.profile_image} alt={user?.name || 'User'} className="object-cover" />
              ) : (
                <AvatarFallback className="bg-gradient-to-br from-primary-500 to-primary-600 text-white font-semibold">
                  {user?.name ? getInitials(user.name) : 'U'}
                </AvatarFallback>
              )}
            </Avatar>
            
            {/* Online indicator */}
            <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-success-500 border-2 border-white rounded-full"></div>
          </div>
        </motion.button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent className="w-72 p-2" align="end" forceMount>
        <DropdownMenuLabel className="font-normal p-3">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12 border-2 border-gray-200">
              {user?.profile_image ? (
                <AvatarImage src={user.profile_image} alt={user?.name || 'User'} />
              ) : (
                <AvatarFallback className="bg-gradient-to-br from-primary-500 to-primary-600 text-white font-semibold text-lg">
                  {user?.name ? getInitials(user.name) : 'U'}
                </AvatarFallback>
              )}
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <p className="text-base font-semibold text-gray-900 truncate">
                {user?.name || 'User'}
              </p>
              <div className="flex items-center gap-2 mt-1">
                {user?.role && getRoleBadge(user.role)}
              </div>
              
              {user?.email && (
                <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
                  <Mail className="h-3 w-3" />
                  <span className="truncate">{user.email}</span>
                </div>
              )}
            </div>
          </div>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator className="my-2" />
        
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link 
              href={`/${user?.role}/profile`} 
              className="cursor-pointer flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="p-2 bg-primary-100 rounded-lg">
                <User className="h-4 w-4 text-primary-600" />
              </div>
              <div>
                <span className="font-medium">Profile Settings</span>
                <p className="text-xs text-gray-500">Manage your account</p>
              </div>
            </Link>
          </DropdownMenuItem>
          
          <DropdownMenuItem asChild>
            <Link 
              href={`/${user?.role}/settings`} 
              className="cursor-pointer flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="p-2 bg-accent-100 rounded-lg">
                <Settings className="h-4 w-4 text-accent-600" />
              </div>
              <div>
                <span className="font-medium">Preferences</span>
                <p className="text-xs text-gray-500">Notifications & settings</p>
              </div>
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        
        <DropdownMenuSeparator className="my-2" />
        
        <DropdownMenuItem 
          onClick={handleSignOut} 
          className="cursor-pointer flex items-center gap-3 p-3 rounded-lg hover:bg-red-50 text-red-600 hover:text-red-700 transition-colors"
        >
          <div className="p-2 bg-red-100 rounded-lg">
            <LogOut className="h-4 w-4" />
          </div>
          <div>
            <span className="font-medium">Sign Out</span>
            <p className="text-xs text-red-500">End your session</p>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}