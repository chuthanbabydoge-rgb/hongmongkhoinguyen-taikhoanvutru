import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/hooks/useAuth";
import { AppShell } from "@/components/layout/AppShell";
import { GlassCard } from "@/components/glass/GlassCard";
import { RoleBadge } from "@/components/auth/RoleBadge";
import { apiUpdateUser } from "@/lib/mock/mockApi";
import { timeAgo, formatDate } from "@/lib/utils/auth";
import {
  Globe, Package, ArrowLeftRight, Trophy, Edit3, Check, X,
  Zap, ChevronRight, Clock, Users, ToggleLeft, ToggleRight,
  Crown, Sparkles, Shield, Star, Plus, LogOut,
} from "lucide-react";
import type { ConnectedModule, ConnectedWorld } from "@/lib/types/user";

const profileSchema = z.object({
  username: z.string().min(2, "At least 2 characters").max(32, "Max 32 characters"),
  email: z.string().email("Invalid email"),
  bio: z.string().max(200, "Max 200 characters").optional(),
  title: z.string().max(40, "Max 40 characters").optional(),
});
type ProfileForm = z.infer<typeof profileSchema>;

const AVATAR_OPTIONS = ["🌌", "⚡", "🔮", "🛸", "🌠", "🌀", "🔯", "🌊", "🔥", "❄️", "⭐", "🌙"];

const ACTIVITY_LOG = [
  { action: "Signed in", detail: "Chrome on macOS", time: new Date().toISOString(), icon: "🔐" },
  { action: "World joined", detail: "Nebula Nexus — Member role assigned", time: new Date(Date.now() - 3600000 * 2).toISOString(), icon: "🌌" },
  { action: "Asset acquired", detail: "Quantum Shard #4821 added to inventory", time: new Date(Date.now() - 86400000).toISOString(), icon: "💎" },
  { action: "Trade completed", detail: "Exchanged 50 Credits for Dark Matter x3", time: new Date(Date.now() - 86400000 * 2).toISOString(), icon: "🔄" },
  { action: "Achievement unlocked", detail: "First Steps — Completed onboarding", time: new Date(Date.now() - 86400000 * 3).toISOString(), icon: "🏆" },
  { action: "Module activated", detail: "Universal Translator now online", time: new Date(Date.now() - 86400000 * 5).toISOString(), icon: "⚙️" },
];

const MEMBERSHIP_META: Record<string, { label: string; color: string; glow: string; icon: typeof Crown }> = {
  free: { label: "Free Tier", color: "text-white/50 border-white/20 bg-white/5", glow: "text-white/40", icon: Star },
  premium: { label: "Premium", color: "text-violet-300 border-violet-500/40 bg-violet-500/15", glow: "text-violet-400", icon: Sparkles },
  enterprise: { label: "Enterprise", color: "text-amber-300 border-amber-500/40 bg-amber-500/15", glow: "text-amber-400", icon: Crown },
};

const STATUS_META: Record<string, { label: string; dot: string; text: string }> = {
  active: { label: "Active", dot: "bg-emerald-400", text: "text-emerald-300" },
  restricted: { label: "Restricted", dot: "bg-amber-400", text: "text-amber-300" },
  suspended: { label: "Suspended", dot: "bg-red-400", text: "text-red-300" },
};

const CATEGORY_COLORS: Record<string, string> = {
  Exploration: "bg-cyan-500/15 text-cyan-300 border-cyan-500/20",
  Creation: "bg-violet-500/15 text-violet-300 border-violet-500/20",
  Social: "bg-pink-500/15 text-pink-300 border-pink-500/20",
  Adventure: "bg-orange-500/15 text-orange-300 border-orange-500/20",
  Trade: "bg-amber-500/15 text-amber-300 border-amber-500/20",
  Tech: "bg-blue-500/15 text-blue-300 border-blue-500/20",
};

const MODULE_CATEGORY_COLORS: Record<string, string> = {
  Communication: "text-cyan-400",
  Tools: "text-violet-400",
  Finance: "text-amber-400",
  Enhancement: "text-emerald-400",
  Navigation: "text-orange-400",
  Analytics: "text-pink-400",
};

const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.35 } } };
const container = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };

export default function AccountCenterPage() {
  const { user, updateUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);
  const [worlds, setWorlds] = useState<ConnectedWorld[]>(user?.connectedWorlds ?? []);
  const [modules, setModules] = useState<ConnectedModule[]>(user?.connectedModules ?? []);
  const safeStats = user?.stats ?? { worldsJoined: 0, assetsOwned: 0, tradesCompleted: 0, achievements: 0 };
  const [worldLoading, setWorldLoading] = useState<string | null>(null);
  const [moduleLoading, setModuleLoading] = useState<string | null>(null);

  const form = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      username: user?.username ?? "",
      email: user?.email ?? "",
      bio: user?.bio ?? "",
      title: user?.title ?? "",
    },
  });

  if (!user) return null;

  const membership = MEMBERSHIP_META[user.membershipStatus] ?? MEMBERSHIP_META.free;
  const statusMeta = STATUS_META[user.status] ?? STATUS_META.active;
  const MembershipIcon = membership.icon;

  const joinedWorlds = worlds.filter(w => w.joined).length;

  async function handleSaveProfile(data: ProfileForm) {
    setSaving(true);
    setSaveError(null);
    try {
      const avatarValue = selectedAvatar ?? user.avatar;
      const updated = await apiUpdateUser(user.id, {
        username: data.username,
        email: data.email,
        bio: data.bio ?? user.bio,
        title: data.title ?? user.title,
        avatar: avatarValue,
      });
      updateUser(updated);
      setEditing(false);
      setShowAvatarPicker(false);
      setSelectedAvatar(null);
    } catch (e: unknown) {
      setSaveError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  function handleCancelEdit() {
    form.reset({ username: user.username, email: user.email, bio: user.bio, title: user.title });
    setEditing(false);
    setShowAvatarPicker(false);
    setSelectedAvatar(null);
    setSaveError(null);
  }

  async function handleToggleWorld(worldId: string) {
    setWorldLoading(worldId);
    await new Promise(r => setTimeout(r, 500));
    const next = worlds.map(w =>
      w.id === worldId ? { ...w, joined: !w.joined, role: !w.joined ? "Member" : "" } : w
    );
    setWorlds(next);
    const updated = await apiUpdateUser(user.id, { connectedWorlds: next });
    updateUser(updated);
    setWorldLoading(null);
  }

  async function handleToggleModule(moduleId: string) {
    setModuleLoading(moduleId);
    await new Promise(r => setTimeout(r, 400));
    const next = modules.map(m =>
      m.id === moduleId ? { ...m, enabled: !m.enabled } : m
    );
    setModules(next);
    const updated = await apiUpdateUser(user.id, { connectedModules: next });
    updateUser(updated);
    setModuleLoading(null);
  }

  const stats = [
    { label: "Worlds Joined", value: joinedWorlds, icon: Globe, color: "from-cyan-600 to-cyan-500", bg: "bg-cyan-500/10", border: "border-cyan-500/20" },
    { label: "Assets Owned", value: safeStats.assetsOwned, icon: Package, color: "from-violet-600 to-violet-500", bg: "bg-violet-500/10", border: "border-violet-500/20" },
    { label: "Trades Completed", value: safeStats.tradesCompleted, icon: ArrowLeftRight, color: "from-amber-600 to-amber-500", bg: "bg-amber-500/10", border: "border-amber-500/20" },
    { label: "Achievements", value: safeStats.achievements, icon: Trophy, color: "from-emerald-600 to-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
  ];

  const currentAvatar = selectedAvatar ?? user.avatar;
  const isEmoji = currentAvatar.length > 2;

  return (
    <AppShell title="Account Center" subtitle="Manage your identity and profile">
      <div className="p-4 sm:p-6 max-w-6xl space-y-5">
        <motion.div variants={container} initial="hidden" animate="show">

          {/* ── PROFILE HERO ─────────────────────────────────────────── */}
          <motion.div variants={item}>
            <GlassCard className="p-6" glow="violet">
              <form onSubmit={form.handleSubmit(handleSaveProfile)}>
                <div className="flex flex-col sm:flex-row items-start gap-5">

                  {/* Avatar */}
                  <div className="relative shrink-0">
                    <button
                      type="button"
                      onClick={() => editing && setShowAvatarPicker(v => !v)}
                      className={`w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-bold shadow-[0_0_30px_rgba(124,58,237,0.4)] transition-all ${
                        isEmoji
                          ? "bg-white/5 border border-white/10"
                          : "bg-gradient-to-br from-violet-600 via-purple-500 to-cyan-500 text-white"
                      } ${editing ? "ring-2 ring-violet-500 cursor-pointer hover:ring-cyan-400" : ""}`}
                    >
                      {currentAvatar}
                    </button>
                    {editing && (
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-violet-600 border-2 border-[#050c1a] flex items-center justify-center">
                        <Edit3 className="w-3 h-3 text-white" />
                      </div>
                    )}

                    {/* Avatar picker dropdown */}
                    <AnimatePresence>
                      {showAvatarPicker && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.9, y: -4 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.9, y: -4 }}
                          className="absolute top-24 left-0 z-20 bg-[#0a1628] border border-white/10 rounded-xl p-3 shadow-2xl w-52"
                        >
                          <p className="text-white/40 text-xs mb-2 font-medium uppercase tracking-wider">Choose Avatar</p>
                          <div className="grid grid-cols-6 gap-1.5">
                            {AVATAR_OPTIONS.map(em => (
                              <button
                                key={em}
                                type="button"
                                onClick={() => { setSelectedAvatar(em); setShowAvatarPicker(false); }}
                                className={`text-xl p-1.5 rounded-lg transition-all hover:bg-white/10 ${selectedAvatar === em ? "bg-violet-500/30 ring-1 ring-violet-500" : ""}`}
                              >
                                {em}
                              </button>
                            ))}
                          </div>
                          <button
                            type="button"
                            onClick={() => { setSelectedAvatar(null); setShowAvatarPicker(false); }}
                            className="mt-2 w-full text-xs text-white/40 hover:text-white/60 transition-colors text-center"
                          >
                            Reset to initials
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Fields */}
                  <div className="flex-1 min-w-0 space-y-3">
                    {editing ? (
                      <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="text-white/40 text-xs uppercase tracking-wider mb-1 block">Display Name</label>
                            <input
                              {...form.register("username")}
                              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30 transition-all placeholder:text-white/20"
                              placeholder="Your display name"
                            />
                            {form.formState.errors.username && (
                              <p className="text-red-400 text-xs mt-1">{form.formState.errors.username.message}</p>
                            )}
                          </div>
                          <div>
                            <label className="text-white/40 text-xs uppercase tracking-wider mb-1 block">Email</label>
                            <input
                              {...form.register("email")}
                              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30 transition-all placeholder:text-white/20"
                              placeholder="your@email.com"
                            />
                            {form.formState.errors.email && (
                              <p className="text-red-400 text-xs mt-1">{form.formState.errors.email.message}</p>
                            )}
                          </div>
                        </div>
                        <div>
                          <label className="text-white/40 text-xs uppercase tracking-wider mb-1 block">Title</label>
                          <input
                            {...form.register("title")}
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30 transition-all placeholder:text-white/20"
                            placeholder="Your cosmic title"
                          />
                        </div>
                        <div>
                          <label className="text-white/40 text-xs uppercase tracking-wider mb-1 flex items-center justify-between">
                            <span>Bio</span>
                            <span className="text-white/20">{form.watch("bio")?.length ?? 0}/200</span>
                          </label>
                          <textarea
                            {...form.register("bio")}
                            rows={2}
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30 transition-all resize-none placeholder:text-white/20"
                            placeholder="Tell the universe about yourself…"
                          />
                          {form.formState.errors.bio && (
                            <p className="text-red-400 text-xs mt-1">{form.formState.errors.bio.message}</p>
                          )}
                        </div>
                        {saveError && (
                          <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{saveError}</p>
                        )}
                        <div className="flex items-center gap-2 pt-1">
                          <button
                            type="submit"
                            disabled={saving}
                            className="flex items-center gap-1.5 px-4 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-all"
                          >
                            {saving ? (
                              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}>
                                <Zap className="w-3.5 h-3.5" />
                              </motion.div>
                            ) : <Check className="w-3.5 h-3.5" />}
                            {saving ? "Saving…" : "Save Changes"}
                          </button>
                          <button
                            type="button"
                            onClick={handleCancelEdit}
                            className="flex items-center gap-1.5 px-4 py-2 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-sm font-medium rounded-lg transition-all border border-white/10"
                          >
                            <X className="w-3.5 h-3.5" /> Cancel
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center gap-3 flex-wrap">
                          <h2 className="text-2xl font-bold text-white">{user.username}</h2>
                          <RoleBadge role={user.role} />
                          {/* Status */}
                          <span className={`flex items-center gap-1.5 text-xs font-medium ${statusMeta.text}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${statusMeta.dot} shadow-[0_0_6px_currentColor]`} />
                            {statusMeta.label}
                          </span>
                        </div>
                        <p className="text-white/50 text-sm">{user.email}</p>
                        {user.bio && <p className="text-white/60 text-sm leading-relaxed">{user.bio}</p>}
                        <p className="text-violet-300/80 text-sm italic">"{user.title}"</p>

                        {/* Membership badge */}
                        <div className="flex items-center gap-2 flex-wrap mt-1">
                          <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border ${membership.color}`}>
                            <MembershipIcon className={`w-3 h-3 ${membership.glow}`} />
                            {membership.label}
                          </span>
                          <span className="text-white/25 text-xs">Member since {formatDate(user.createdAt).split(",")[0]}</span>
                        </div>

                        {/* Level bar */}
                        <div className="pt-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-white/40 text-xs uppercase tracking-wider">Level {user.level}</span>
                            <span className="text-white/30 text-xs">{user.level}%</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-white/8 overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${user.level}%` }}
                              transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
                              className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-400 shadow-[0_0_8px_rgba(124,58,237,0.5)]"
                            />
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Edit button (top-right) */}
                  {!editing && (
                    <button
                      type="button"
                      onClick={() => setEditing(true)}
                      className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-violet-500/40 text-white/60 hover:text-white text-xs font-medium rounded-lg transition-all"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> Edit Profile
                    </button>
                  )}
                </div>
              </form>
            </GlassCard>
          </motion.div>

          {/* ── STATS CARDS ──────────────────────────────────────────── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
            {stats.map((stat, i) => (
              <motion.div key={stat.label} variants={item}>
                <GlassCard className={`p-4 border ${stat.border} ${stat.bg}`} glow="none">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-3 shadow-lg`}>
                    <stat.icon className="w-5 h-5 text-white" />
                  </div>
                  <p className="text-2xl font-bold text-white tabular-nums">{stat.value.toLocaleString()}</p>
                  <p className="text-white/40 text-xs mt-0.5">{stat.label}</p>
                </GlassCard>
              </motion.div>
            ))}
          </div>

          {/* ── CONNECTED WORLDS ────────────────────────────────────── */}
          <motion.div variants={item} className="mt-4">
            <GlassCard className="p-5" glow="none">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-white font-semibold text-sm">Connected Worlds</h3>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-400 border border-cyan-500/20">
                    {joinedWorlds} joined
                  </span>
                </div>
                <button className="flex items-center gap-1 text-xs text-white/30 hover:text-white/60 transition-colors">
                  View all <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {worlds.map(world => (
                  <motion.div
                    key={world.id}
                    layout
                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                      world.joined
                        ? "bg-white/5 border-white/10 hover:border-white/20"
                        : "bg-transparent border-white/5 hover:border-white/10 opacity-60 hover:opacity-80"
                    }`}
                  >
                    <div className="text-2xl w-10 h-10 flex items-center justify-center bg-white/5 rounded-xl shrink-0">
                      {world.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="text-white text-sm font-medium truncate">{world.name}</p>
                        {world.joined && world.role && (
                          <span className="text-xs px-1.5 py-0.5 rounded bg-violet-500/20 text-violet-300 border border-violet-500/20 shrink-0">
                            {world.role}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`text-xs px-1.5 py-0.5 rounded-full border ${CATEGORY_COLORS[world.category] ?? "bg-white/5 text-white/40 border-white/10"}`}>
                          {world.category}
                        </span>
                        <span className="text-white/30 text-xs flex items-center gap-0.5">
                          <Users className="w-2.5 h-2.5" />
                          {world.members.toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleToggleWorld(world.id)}
                      disabled={worldLoading === world.id}
                      className={`shrink-0 flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg font-medium transition-all disabled:opacity-50 ${
                        world.joined
                          ? "bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20"
                          : "bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/20"
                      }`}
                    >
                      {worldLoading === world.id ? (
                        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.7, ease: "linear" }}>
                          <Zap className="w-3 h-3" />
                        </motion.div>
                      ) : world.joined ? (
                        <><LogOut className="w-3 h-3" /> Leave</>
                      ) : (
                        <><Plus className="w-3 h-3" /> Join</>
                      )}
                    </button>
                  </motion.div>
                ))}
              </div>
            </GlassCard>
          </motion.div>

          {/* ── MODULES + ACTIVITY ──────────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">

            {/* Connected Modules */}
            <motion.div variants={item}>
              <GlassCard className="p-5 h-full" glow="none">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-violet-400" />
                    <h3 className="text-white font-semibold text-sm">Connected Modules</h3>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-400 border border-violet-500/20">
                      {modules.filter(m => m.enabled).length} active
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  {modules.map(mod => (
                    <motion.div
                      key={mod.id}
                      layout
                      className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                        mod.enabled
                          ? "bg-white/5 border-white/10"
                          : "bg-transparent border-white/5 opacity-60"
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-white text-sm font-medium">{mod.name}</p>
                          <span className={`text-xs font-medium ${MODULE_CATEGORY_COLORS[mod.category] ?? "text-white/40"}`}>
                            {mod.category}
                          </span>
                        </div>
                        <p className="text-white/35 text-xs mt-0.5 line-clamp-1">{mod.description}</p>
                      </div>
                      <button
                        onClick={() => handleToggleModule(mod.id)}
                        disabled={moduleLoading === mod.id}
                        className="shrink-0 transition-all disabled:opacity-50"
                        title={mod.enabled ? "Disable module" : "Enable module"}
                      >
                        {moduleLoading === mod.id ? (
                          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.7, ease: "linear" }}>
                            <Zap className={`w-5 h-5 ${mod.enabled ? "text-violet-400" : "text-white/30"}`} />
                          </motion.div>
                        ) : mod.enabled ? (
                          <ToggleRight className="w-7 h-7 text-violet-400 hover:text-violet-300 transition-colors" />
                        ) : (
                          <ToggleLeft className="w-7 h-7 text-white/20 hover:text-white/40 transition-colors" />
                        )}
                      </button>
                    </motion.div>
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
                <div className="relative">
                  <div className="absolute left-[18px] top-3 bottom-3 w-px bg-gradient-to-b from-violet-500/40 via-white/10 to-transparent" />
                  <div className="space-y-4">
                    {ACTIVITY_LOG.map((log, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <div className="shrink-0 w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-base z-10">
                          {log.icon}
                        </div>
                        <div className="flex-1 min-w-0 pt-1">
                          <p className="text-white/80 text-xs font-medium leading-snug">{log.action}</p>
                          <p className="text-white/35 text-xs mt-0.5 truncate">{log.detail}</p>
                        </div>
                        <span className="text-white/25 text-xs whitespace-nowrap pt-1">{timeAgo(log.time)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          </div>

          {/* ── SECURITY SCORE SUMMARY ──────────────────────────────── */}
          <motion.div variants={item} className="mt-4">
            <GlassCard className="p-5" glow="none">
              <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
                <div className="relative w-14 h-14 shrink-0">
                  <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
                    <circle cx="28" cy="28" r="22" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="4" />
                    <motion.circle
                      cx="28" cy="28" r="22" fill="none"
                      stroke="url(#scoreGrad2)" strokeWidth="4" strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 22}`}
                      initial={{ strokeDashoffset: 2 * Math.PI * 22 }}
                      animate={{ strokeDashoffset: 2 * Math.PI * 22 * (1 - user.securityScore / 100) }}
                      transition={{ duration: 1.4, ease: "easeOut", delay: 0.5 }}
                    />
                    <defs>
                      <linearGradient id="scoreGrad2" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#7c3aed" />
                        <stop offset="100%" stopColor="#06b6d4" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-sm font-bold text-white">{user.securityScore}</span>
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Shield className="w-3.5 h-3.5 text-violet-400" />
                    <p className="text-white font-semibold text-sm">Security Score</p>
                    <span className={`text-xs font-medium ${user.securityScore >= 80 ? "text-emerald-400" : user.securityScore >= 50 ? "text-amber-400" : "text-red-400"}`}>
                      {user.securityScore >= 80 ? "Strong" : user.securityScore >= 50 ? "Fair" : "Weak"}
                    </span>
                  </div>
                  <p className="text-white/40 text-xs mt-0.5">
                    {user.twoFactorEnabled ? "2FA is enabled" : "Enable 2FA to improve your score"} · Manage in Security Center
                  </p>
                  <div className="flex items-center gap-1.5 mt-2">
                    {[...Array(10)].map((_, i) => (
                      <div
                        key={i}
                        className={`flex-1 h-1.5 rounded-full transition-all ${
                          i < Math.round(user.securityScore / 10)
                            ? i < 3 ? "bg-red-500" : i < 6 ? "bg-amber-500" : "bg-emerald-500"
                            : "bg-white/8"
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <a href="/security-center" className="shrink-0 flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300 font-medium transition-colors border border-violet-500/30 hover:border-violet-400/50 px-3 py-1.5 rounded-lg bg-violet-500/10 hover:bg-violet-500/20">
                  Security Center <ChevronRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </GlassCard>
          </motion.div>

        </motion.div>
      </div>
    </AppShell>
  );
}
