import { getInitials } from "@/lib/user-profile";
import { cn } from "@/lib/utils";

interface UserAvatarProps {
  name: string;
  photoURL?: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizeClasses = {
  sm: "h-8 w-8 text-xs",
  md: "h-12 w-12 text-sm",
  lg: "h-20 w-20 text-xl",
  xl: "h-28 w-28 text-2xl",
};

export function UserAvatar({
  name,
  photoURL,
  size = "md",
  className,
}: UserAvatarProps) {
  const s = sizeClasses[size];

  if (photoURL) {
    return (
      <img
        src={photoURL}
        alt={name}
        className={cn(
          "rounded-full object-cover ring-2 ring-pink-200/80",
          s,
          className
        )}
      />
    );
  }

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-navy-700 to-navy-800 font-semibold text-white ring-2 ring-pink-200/60",
        s,
        className
      )}
      aria-hidden
    >
      {getInitials(name)}
    </div>
  );
}
