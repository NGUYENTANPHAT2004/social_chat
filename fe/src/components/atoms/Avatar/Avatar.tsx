import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { clsx } from 'clsx';
import { User } from 'lucide-react';

const avatarVariants = cva(
  'relative inline-flex items-center justify-center overflow-hidden rounded-full bg-gray-100',
  {
    variants: {
      size: {
        xs: 'h-6 w-6',
        sm: 'h-8 w-8',
        md: 'h-10 w-10',
        lg: 'h-12 w-12',
        xl: 'h-16 w-16',
        '2xl': 'h-20 w-20',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  }
);

export interface AvatarProps extends VariantProps<typeof avatarVariants> {
  src?: string;
  alt?: string;
  name?: string;
  online?: boolean;
  className?: string;
}

const Avatar: React.FC<AvatarProps> = ({ src, alt, name, online, size, className }) => {
  const [imageError, setImageError] = React.useState(false);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const sizeClasses = {
    xs: 'text-xs',
    sm: 'text-sm',
    md: 'text-sm',
    lg: 'text-base',
    xl: 'text-lg',
    '2xl': 'text-xl',
  };

  const onlineIndicatorSizes = {
    xs: 'h-1.5 w-1.5',
    sm: 'h-2 w-2',
    md: 'h-2.5 w-2.5',
    lg: 'h-3 w-3',
    xl: 'h-3.5 w-3.5',
    '2xl': 'h-4 w-4',
  };

  return (
    <div className={clsx(avatarVariants({ size }), className)}>
      {src && !imageError ? (
        <img
          src={src}
          alt={alt || name}
          className="h-full w-full object-cover"
          onError={() => setImageError(true)}
        />
      ) : name ? (
        <span className={clsx('font-medium text-gray-600', sizeClasses[size || 'md'])}>
          {getInitials(name)}
        </span>
      ) : (
        <User className="h-1/2 w-1/2 text-gray-400" />
      )}
      
      {online && (
        <span
          className={clsx(
            'absolute bottom-0 right-0 block rounded-full bg-green-400 ring-2 ring-white',
            onlineIndicatorSizes[size || 'md']
          )}
        />
      )}
    </div>
  );
};

export default Avatar;