'use client';
import React from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  MessageCircle, 
  Users, 
  Play, 
  User, 
  Gamepad2 
} from 'lucide-react';

interface NavItem {
  href: string;
  icon: React.ElementType;
  label: string;
  badge?: number;
}

const navItems: NavItem[] = [
  { href: '/chat', icon: MessageCircle, label: 'Chat', badge: 3 },
  { href: '/rooms', icon: Users, label: 'Rooms' },
  { href: '/games', icon: Gamepad2, label: 'Games' },
  { href: '/reels', icon: Play, label: 'Reels' },
  { href: '/profile', icon: User, label: 'Profile' },
];

const MobileNavbar: React.FC = () => {
  const pathname = usePathname();

  return (
    <div className="bg-white border-t border-gray-200 px-2 py-1 safe-area-bottom">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex flex-col items-center justify-center p-2 rounded-lg min-w-0 flex-1 relative
                ${isActive 
                  ? 'text-indigo-600 bg-indigo-50' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }
                transition-colors
              `}
            >
              <div className="relative">
                <Icon size={20} />
                {item.badge && (
                  <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {item.badge}
                  </div>
                )}
              </div>
              <span className="text-xs mt-1 truncate">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default MobileNavbar;