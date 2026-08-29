import { useAuthStore } from '../state/auth.store';

interface UserAvatarProps {
  size?: 'sm' | 'md' | 'lg';
  showName?: boolean;
}

export const UserAvatar = ({ size = 'md', showName = false }: UserAvatarProps) => {
  const { user } = useAuthStore();

  const sizeClasses = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-12 w-12 text-base',
  };

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  return (
    <div className="flex items-center gap-2">
      <div
        className={`${sizeClasses[size]} rounded-full bg-[#2563EB] flex items-center justify-center text-white font-semibold`}
      >
        {initials}
      </div>
      {showName && user && (
        <div className="hidden md:block">
          <div className="text-sm font-medium text-[#0F172A]">{user.name}</div>
          <div className="text-xs text-[#64748B]">{user.email}</div>
        </div>
      )}
    </div>
  );
};
