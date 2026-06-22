import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { RoleBadge } from "@/components/auth/RoleBadge";
import { cn } from "@/lib/utils";
import {
  User, Shield, Monitor, Clock, LogOut,
  ChevronLeft, ChevronRight, Hexagon, ShieldCheck, Globe2, Fingerprint, BookUser, Trophy, Star, Bell, Smile
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const navItems = [
  { path: "/account-center", label: "Account Center", icon: User },
  { path: "/security-center", label: "Security Center", icon: Shield },
  { path: "/devices", label: "Devices", icon: Monitor },
  { path: "/sessions", label: "Sessions", icon: Clock },
  { path: "/roles", label: "Roles & Permissions", icon: ShieldCheck },
  { path: "/ecosystem", label: "Ecosystem", icon: Globe2 },
  { path: "/identity", label: "Digital Identity", icon: Fingerprint },
  { path: "/directory", label: "Directory", icon: BookUser },
  { path: "/achievements", label: "Achievements", icon: Trophy },
  { path: "/reputation", label: "Reputation", icon: Star },
  { path: "/notifications", label: "Notifications", icon: Bell },
  { path: "/avatar", label: "Avatar Center", icon: Smile },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [location] = useLocation();
  const { user, logout } = useAuth();

  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 240 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="relative flex flex-col h-screen bg-[#050c1a] border-r border-white/10 shrink-0 overflow-hidden z-20"
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-white/10">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center shrink-0 shadow-[0_0_20px_rgba(124,58,237,0.4)]">
          <Hexagon className="w-5 h-5 text-white" />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <p className="text-white font-bold text-sm tracking-wider uppercase whitespace-nowrap">Universe</p>
              <p className="text-white/40 text-xs whitespace-nowrap">Account System</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ path, label, icon: Icon }) => {
          const active = location === path;
          return (
            <Link key={path} href={path}>
              <div
                data-testid={`nav-${label.toLowerCase().replace(/\s+/g, "-")}`}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all duration-200 cursor-pointer group relative",
                  active
                    ? "bg-violet-600/20 text-violet-300 border border-violet-500/30 shadow-[0_0_15px_rgba(124,58,237,0.2)]"
                    : "text-white/50 hover:text-white/80 hover:bg-white/5"
                )}
              >
                <Icon className={cn("w-5 h-5 shrink-0", active && "text-violet-400")} />
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-sm font-medium whitespace-nowrap"
                    >
                      {label}
                    </motion.span>
                  )}
                </AnimatePresence>
                {active && (
                  <motion.div
                    layoutId="activeNav"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-violet-400 rounded-full"
                  />
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* User footer */}
      <div className="border-t border-white/10 p-3">
        {user && !collapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-2 px-2 py-2"
          >
            <div className="flex items-center gap-2 mb-1">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                {user.avatar}
              </div>
              <div className="min-w-0">
                <p className="text-white text-xs font-semibold truncate">{user.username}</p>
                <p className="text-white/40 text-xs truncate">{user.email}</p>
              </div>
            </div>
            <RoleBadge role={user.role} size="sm" className="mt-1" />
          </motion.div>
        )}
        <button
          data-testid="button-logout"
          onClick={logout}
          className={cn(
            "flex items-center gap-3 w-full rounded-lg px-3 py-2.5 text-white/50 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200",
            collapsed && "justify-center"
          )}
        >
          <LogOut className="w-5 h-5 shrink-0" />
          <AnimatePresence>
            {!collapsed && (
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-sm font-medium">
                Sign Out
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>

      {/* Collapse toggle */}
      <button
        data-testid="button-sidebar-toggle"
        onClick={() => setCollapsed(c => !c)}
        className="absolute top-5 -right-3 w-6 h-6 rounded-full bg-[#0d1829] border border-white/20 flex items-center justify-center text-white/50 hover:text-white hover:border-violet-500/50 transition-all duration-200 z-30"
      >
        {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>
    </motion.aside>
  );
}
