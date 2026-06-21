import { useAuth } from "@/hooks/useAuth";
import { RoleBadge } from "@/components/auth/RoleBadge";
import { Bell } from "lucide-react";

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  const { user } = useAuth();

  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#050c1a]/80 backdrop-blur-xl">
      <div>
        <h1 className="text-xl font-bold text-white tracking-tight">{title}</h1>
        {subtitle && <p className="text-white/40 text-sm mt-0.5">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-4">
        {user && <RoleBadge role={user.role} size="sm" />}
        <button
          data-testid="button-notifications"
          className="relative w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-all duration-200"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-violet-500 shadow-[0_0_6px_rgba(124,58,237,0.8)]" />
        </button>
      </div>
    </header>
  );
}
