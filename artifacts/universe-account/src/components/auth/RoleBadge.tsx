import { Role, ROLE_LABELS } from "@/lib/types/user";
import { cn } from "@/lib/utils";

const roleStyles: Record<Role, string> = {
  admin: "bg-violet-500/20 text-violet-300 border-violet-500/40 shadow-[0_0_10px_rgba(124,58,237,0.3)]",
  moderator: "bg-blue-500/20 text-blue-300 border-blue-500/40 shadow-[0_0_10px_rgba(59,130,246,0.3)]",
  creator: "bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-[0_0_10px_rgba(6,182,212,0.3)]",
  premium: "bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-[0_0_10px_rgba(245,158,11,0.3)]",
  user: "bg-slate-500/20 text-slate-300 border-slate-500/40"
};

interface RoleBadgeProps {
  role: Role;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function RoleBadge({ role, size = "md", className }: RoleBadgeProps) {
  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-3 py-1",
    lg: "text-base px-4 py-1.5"
  };
  return (
    <span
      data-testid={`badge-role-${role}`}
      className={cn(
        "inline-flex items-center font-semibold rounded-full border tracking-wide",
        roleStyles[role],
        sizeClasses[size],
        className
      )}
    >
      {ROLE_LABELS[role]}
    </span>
  );
}
