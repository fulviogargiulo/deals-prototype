import { cn } from "@/lib/utils";

interface UserAvatarProps {
  name: string;
  image?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function UserAvatar({ name, image, size = 'md', className }: UserAvatarProps) {
  const getInitials = (fullName: string) => {
    return fullName
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .join('')
      .slice(0, 2);
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'w-8 h-8';
      case 'md':
        return 'w-12 h-12';
      case 'lg':
        return 'w-16 h-16';
      default:
        return 'w-12 h-12';
    }
  };

  const getTextSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'text-sm';
      case 'md':
        return 'text-base';
      case 'lg':
        return 'text-lg';
      default:
        return 'text-base';
    }
  };

  if (image) {
    return (
      <div className={cn(
        "rounded-full overflow-hidden flex-shrink-0",
        getSizeClasses(),
        className
      )}>
        <img 
          src={image} 
          alt={name} 
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  // Check if className contains background/text overrides
  const hasCustomBg = className?.includes('bg-');
  const hasCustomText = className?.includes('text-') && !className?.includes('text-center');
  const hasCustomFontSize = className?.includes('text-sm') || className?.includes('text-base') || className?.includes('text-lg') || className?.includes('text-xl');

  return (
    <div className={cn(
      "rounded-full flex items-center justify-center font-semibold leading-heading flex-shrink-0",
      !hasCustomBg && "bg-secondary",
      !hasCustomText && "text-foreground",
      getSizeClasses(),
      !hasCustomFontSize && getTextSizeClasses(),
      className
    )}>
      {getInitials(name)}
    </div>
  );
}
