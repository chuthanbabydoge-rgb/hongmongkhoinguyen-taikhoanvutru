import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { AppShell } from "@/components/layout/AppShell";
import { GlassCard } from "@/components/glass/GlassCard";
import { RoleBadge } from "@/components/auth/RoleBadge";
import { ROLE_PERMISSIONS } from "@/lib/utils/permissions";
import { formatDate, timeAgo } from "@/lib/utils/auth";
import { Shield, Monitor, Clock, Star, Zap, Trophy, Lock } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const ACTIVITY_LOG = [
  { action: "Signed in", detail: "Chrome on macOS", time: new Date().toISOString() },
  { action: "Security score updated", detail: "Score improved by 5 points", time: new Date(Date.now() - 3600000 * 2).toISOString() },
  { action: "Device verified", detail: "MacBook Pro trusted", time: new Date(Date.now() - 86400000).toISOString() },
  { action: "Profile updated", detail: "Username changed", time: new Date(Date.now() - 86400000 * 3).toISOString() },
  { action: "Password changed", detail: "Security update applied", time: new Date(Date.now() - 86400000 * 7).toISOString() }
];

export default function AccountCenterPage() {
  const { user } = useAuth();
  if (!user) return null;

  const permissions = ROLE_PERMISSIONS[user.role];

  const stats = [
    { label: "Security Score", value: `${user.securityScore}%`, icon: Shield, color: "from-violet-600 to-violet-500", glow: "violet" as const },
    { label: "Level Progress", value: `${user.level}/100`, icon: Star, color: "from-amber-600 to-amber-500", glow: "none" as const },
    { label: "Member Since", value: formatDate(user.createdAt).split(",")[0], icon: Trophy, color: "from-cyan-600 to-cyan-500", glow: "cyan" as const },
    { label: "Last Login", value: timeAgo(user.lastLogin), icon: Clock, color: "from-emerald-600 to-emerald-500", glow: "emerald" as const },
  ];

  const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
  const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

  return (
    <AppShell title="Account Center" subtitle="Manage your identity and profile">
      <div className="p-6 space-y-6 max-w-5xl">

        {/* Profile hero */}
        <motion.div variants={container} initial="hidden" animate="show">
          <motion.div variants={item}>
            <GlassCard className="p-6" glow="violet">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
                {/* Avatar */}
                <div className="relative">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-600 via-purple-500 to-cyan-500 flex items-center justify-center text-white text-2xl font-bold shadow-[0_0_30px_rgba(124,58,237,0.5)]">
                    {user.avatar}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#050c1a] border-2 border-violet-500 flex items-center justify-center">
                    <Zap className="w-3 h-3 text-violet-400" />
                  </div>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h2 data-testid="text-username" className="text-2xl font-bold text-white">{user.username}</h2>
                    <RoleBadge role={user.role} />
                  </div>
                  <p data-testid="text-email" className="text-white/50 text-sm mt-0.5">{user.email}</p>
                  <p className="text-violet-300/80 text-sm mt-1 italic">"{user.title}"</p>

                  {/* Level bar */}
                  <div className="mt-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-white/40 text-xs uppercase tracking-wider">Level {user.level}</span>
                      <span className="text-white/40 text-xs">{user.level}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${user.level}%` }}
                        transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
                        className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-400 shadow-[0_0_10px_rgba(124,58,237,0.6)]"
                      />
                    </div>
                  </div>
                </div>

                {/* Security score ring */}
                <div className="flex flex-col items-center">
                  <div className="relative w-20 h-20">
                    <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
                      <circle cx="40" cy="40" r="32" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6" />
                      <motion.circle
                        cx="40" cy="40" r="32" fill="none"
                        stroke="url(#scoreGrad)" strokeWidth="6"
                        strokeLinecap="round"
                        strokeDasharray={`${2 * Math.PI * 32}`}
                        initial={{ strokeDashoffset: 2 * Math.PI * 32 }}
                        animate={{ strokeDashoffset: 2 * Math.PI * 32 * (1 - user.securityScore / 100) }}
                        transition={{ duration: 1.5, ease: "easeOut", delay: 0.4 }}
                      />
                      <defs>
                        <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#7c3aed" />
                          <stop offset="100%" stopColor="#06b6d4" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-xl font-bold text-white">{user.securityScore}</span>
                      <span className="text-white/30 text-xs">score</span>
                    </div>
                  </div>
                  <p className="text-white/40 text-xs mt-1">Security</p>
                </div>
              </div>
            </GlassCard>
          </motion.div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
            {stats.map((stat, i) => (
              <motion.div key={stat.label} variants={item}>
                <GlassCard className="p-4" glow={stat.glow}>
                  <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center mb-3 shadow-lg`}>
                    <stat.icon className="w-4 h-4 text-white" />
                  </div>
                  <p data-testid={`stat-${stat.label.toLowerCase().replace(/\s+/g, "-")}`} className="text-xl font-bold text-white">{stat.value}</p>
                  <p className="text-white/40 text-xs mt-0.5">{stat.label}</p>
                </GlassCard>
              </motion.div>
            ))}
          </div>

          {/* Bottom row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
            {/* Permissions */}
            <motion.div variants={item}>
              <GlassCard className="p-5 h-full" glow="none">
                <div className="flex items-center gap-2 mb-4">
                  <Lock className="w-4 h-4 text-violet-400" />
                  <h3 className="text-white font-semibold text-sm">Access Permissions</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {permissions.map(p => (
                    <span
                      key={p}
                      data-testid={`badge-permission-${p}`}
                      className="text-xs px-2.5 py-1 rounded-full bg-violet-500/15 text-violet-300 border border-violet-500/20 font-mono"
                    >
                      {p}
                    </span>
                  ))}
                </div>
              </GlassCard>
            </motion.div>

            {/* Recent Activity */}
            <motion.div variants={item}>
              <GlassCard className="p-5 h-full" glow="none">
                <div className="flex items-center gap-2 mb-4">
                  <Clock className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-white font-semibold text-sm">Recent Activity</h3>
                </div>
                <div className="space-y-3">
                  {ACTIVITY_LOG.map((log, i) => (
                    <div key={i} className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-violet-400 mt-1.5 shrink-0" />
                        <div>
                          <p className="text-white/80 text-xs font-medium">{log.action}</p>
                          <p className="text-white/30 text-xs">{log.detail}</p>
                        </div>
                      </div>
                      <span className="text-white/25 text-xs whitespace-nowrap shrink-0">{timeAgo(log.time)}</span>
                    </div>
                  ))}
                </div>
              </GlassCard>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </AppShell>
  );
}
