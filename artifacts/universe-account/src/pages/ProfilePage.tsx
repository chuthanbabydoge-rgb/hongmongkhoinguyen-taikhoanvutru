import { useState, useMemo } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { useParams, useLocation } from "wouter";
import { GlassCard } from "@/components/glass/GlassCard";
import { useAuth } from "@/hooks/useAuth";
import { getPublicProfile, REP_TIER_META, AVATAR_GRADIENT, PublicBadge, PublicAsset, ActivityEntry } from "@/lib/mock/profileData";
import { allAchievements, initialUserAchievements } from "@/lib/mock/achievementData";
import { RARITY_META, CATEGORY_META, computeLevel } from "@/lib/types/achievement";
import { cn } from "@/lib/utils";
import {
  ArrowLeft, Share2, Check, Star, Zap, Trophy, Globe, Package,
  TrendingUp, Calendar, Clock, BarChart3, Users, Heart,
  ChevronRight, Copy, Shield, Award, Flame, Lock,
} from "lucide-react";

// ── Animations ────────────────────────────────────────────────────────────────

const stagger: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };
const pop: Variants = {
  hidden: { opacity: 0, y: 14, scale: 0.97 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.28, ease: "easeOut" } },
};

function timeAgo(iso: string) {
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (d === 0) return "hôm nay";
  if (d === 1) return "hôm qua";
  if (d < 30) return `${d} ngày trước`;
  if (d < 365) return `${Math.floor(d / 30)} tháng trước`;
  return `${Math.floor(d / 365)} năm trước`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("vi-VN", { year: "numeric", month: "long", day: "numeric" });
}

// ── Not Found ─────────────────────────────────────────────────────────────────

function ProfileNotFound({ username }: { username: string }) {
  const [, navigate] = useLocation();
  return (
    <div className="min-h-screen bg-[#050c1a] flex items-center justify-center p-6">
      <div className="text-center space-y-4">
        <div className="w-20 h-20 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-4xl">🌌</div>
        <h1 className="text-white font-bold text-2xl">Không Tìm Thấy</h1>
        <p className="text-white/40 text-sm">Người dùng <span className="text-violet-300 font-semibold">@{username}</span> không tồn tại trong Universe.</p>
        <button onClick={() => navigate("/account-center")}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600/20 border border-violet-500/35 text-violet-300 text-sm font-semibold hover:bg-violet-600/30 transition-all mx-auto">
          <ArrowLeft className="w-4 h-4" /> Về Trang Chủ
        </button>
      </div>
    </div>
  );
}

// ── Rarity dot ────────────────────────────────────────────────────────────────

function RarityDot({ rarity }: { rarity: "common" | "rare" | "epic" | "legendary" }) {
  const m = RARITY_META[rarity];
  return <div className={cn("w-2 h-2 rounded-full shrink-0", m.barColor)} />;
}

// ── Share button ──────────────────────────────────────────────────────────────

function ShareButton({ username }: { username: string }) {
  const [copied, setCopied] = useState(false);
  const url = `${window.location.origin}/profile/${username}`;

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // fallback
      const el = document.createElement("textarea");
      el.value = url;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <button onClick={handleShare}
      className={cn(
        "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-all",
        copied
          ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.2)]"
          : "bg-white/5 border-white/15 text-white/60 hover:bg-white/10 hover:text-white hover:border-white/25"
      )}>
      {copied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
      {copied ? "Đã Sao Chép!" : "Chia Sẻ"}
    </button>
  );
}

// ── Tabs ──────────────────────────────────────────────────────────────────────

type Tab = "achievements" | "activity" | "worlds" | "assets" | "badges" | "stats";

const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: "achievements", label: "Thành Tích", icon: <Trophy className="w-3.5 h-3.5" /> },
  { key: "activity", label: "Hoạt Động", icon: <Flame className="w-3.5 h-3.5" /> },
  { key: "worlds", label: "Thế Giới", icon: <Globe className="w-3.5 h-3.5" /> },
  { key: "assets", label: "Tài Sản", icon: <Package className="w-3.5 h-3.5" /> },
  { key: "badges", label: "Huy Hiệu", icon: <Award className="w-3.5 h-3.5" /> },
  { key: "stats", label: "Thống Kê", icon: <BarChart3 className="w-3.5 h-3.5" /> },
];

// ── Achievement tab ───────────────────────────────────────────────────────────

function AchievementsTab({ userId }: { userId: string }) {
  const userAchs = initialUserAchievements.filter((u) => u.userId === userId && u.isUnlocked);
  const unlocked = userAchs.map((ua) => {
    const a = allAchievements.find((x) => x.id === ua.achievementId);
    return a ? { ...a, unlockedAt: ua.unlockedAt } : null;
  }).filter(Boolean) as (typeof allAchievements[0] & { unlockedAt?: string })[];

  if (unlocked.length === 0) {
    return <EmptyState icon="🏆" text="Chưa có thành tích nào được mở khóa." />;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {unlocked.map((a) => {
        const m = RARITY_META[a.rarity];
        const cat = CATEGORY_META[a.category];
        return (
          <motion.div key={a.id} variants={pop}
            className={cn("flex items-center gap-3 p-3 rounded-xl border bg-gradient-to-r", m.gradient, m.border, m.glow)}>
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-xl border shrink-0", m.bg, m.border)}>
              {a.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className={cn("text-[9px] font-bold uppercase tracking-wide", m.color)}>{m.label}</span>
                <span className="text-white/20 text-[9px]">·</span>
                <span className="text-[9px] text-white/30">{cat.icon} {cat.label}</span>
              </div>
              <p className="text-white text-xs font-semibold leading-tight">{a.title}</p>
              <p className="text-white/35 text-[10px] mt-0.5 truncate">{a.description}</p>
            </div>
            <div className="text-right shrink-0">
              <p className={cn("text-xs font-bold", m.color)}>+{m.points}pt</p>
              {a.unlockedAt && <p className="text-white/20 text-[9px]">{timeAgo(a.unlockedAt)}</p>}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

// ── Activity tab ──────────────────────────────────────────────────────────────

const ACTIVITY_COLOR: Record<ActivityEntry["type"], string> = {
  achievement: "text-amber-300",
  trade: "text-emerald-300",
  world: "text-blue-300",
  badge: "text-violet-300",
  level: "text-cyan-300",
  social: "text-rose-300",
};

function ActivityTab({ activity }: { activity: ActivityEntry[] }) {
  if (activity.length === 0) return <EmptyState icon="📋" text="Chưa có hoạt động nào." />;

  return (
    <div className="space-y-2">
      {activity.map((a, i) => (
        <motion.div key={a.id} variants={pop}
          className={cn(
            "flex items-start gap-3 p-3 rounded-xl border transition-all",
            a.highlight ? "bg-white/5 border-white/12" : "bg-white/2 border-white/6"
          )}>
          <div className={cn(
            "w-9 h-9 rounded-xl flex items-center justify-center text-lg border shrink-0",
            a.highlight ? "bg-white/8 border-white/15" : "bg-white/4 border-white/8"
          )}>
            {a.icon}
          </div>
          <div className="flex-1 min-w-0">
            <p className={cn("text-xs font-bold", a.highlight ? "text-white" : "text-white/65")}>{a.title}</p>
            <p className="text-white/30 text-[10px] mt-0.5">{a.description}</p>
          </div>
          <div className="text-right shrink-0">
            <div className={cn("w-2 h-2 rounded-full", a.highlight ? "bg-violet-400" : "bg-white/15", "ml-auto mb-1")} />
            <p className="text-white/20 text-[9px] whitespace-nowrap">{timeAgo(a.timestamp)}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// ── Worlds tab ────────────────────────────────────────────────────────────────

function WorldsTab({ worlds }: { worlds: { id: string; name: string; icon: string; members: number; category: string; joined: boolean; role: string }[] }) {
  const joined = worlds.filter((w) => w.joined);
  if (joined.length === 0) return <EmptyState icon="🌍" text="Chưa tham gia thế giới nào." />;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {joined.map((w) => (
        <motion.div key={w.id} variants={pop}
          className="flex items-center gap-3 p-3 rounded-xl bg-blue-500/5 border border-blue-500/20 hover:bg-blue-500/10 transition-all">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl bg-blue-500/10 border border-blue-500/20 shrink-0">
            {w.icon}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-semibold">{w.name}</p>
            <p className="text-white/35 text-[10px]">{w.category}</p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-blue-300 text-[10px] font-semibold">{w.role}</p>
            <p className="text-white/25 text-[9px]">{w.members.toLocaleString()} thành viên</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// ── Assets tab ────────────────────────────────────────────────────────────────

function AssetsTab({ assets }: { assets: PublicAsset[] }) {
  if (assets.length === 0) return <EmptyState icon="📦" text="Chưa có tài sản nào." />;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {assets.map((a) => {
        const m = RARITY_META[a.rarity];
        return (
          <motion.div key={a.id} variants={pop}
            className={cn("flex items-center gap-3 p-3 rounded-xl border", m.bg, m.border)}>
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-xl border shrink-0", m.bg, m.border)}>
              {a.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <RarityDot rarity={a.rarity} />
                <span className={cn("text-[9px] font-bold uppercase", m.color)}>{m.label}</span>
              </div>
              <p className="text-white text-xs font-semibold leading-tight">{a.name}</p>
              <p className="text-white/30 text-[10px]">{a.category}</p>
            </div>
            <div className="text-right shrink-0">
              <p className={cn("text-sm font-bold tabular-nums", m.color)}>{a.value.toLocaleString()}</p>
              <p className="text-white/20 text-[9px]">UC</p>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

// ── Badges tab ────────────────────────────────────────────────────────────────

function BadgesTab({ badges }: { badges: PublicBadge[] }) {
  if (badges.length === 0) return <EmptyState icon="🏅" text="Chưa có huy hiệu nào." />;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
      {badges.map((b) => {
        const m = RARITY_META[b.rarity];
        return (
          <motion.div key={b.id} variants={pop}
            className={cn("flex flex-col items-center gap-2 p-4 rounded-xl border text-center", m.bg, m.border, m.glow)}>
            <div className="text-3xl">{b.icon}</div>
            <div className="space-y-0.5">
              <p className={cn("text-xs font-bold", m.color)}>{b.name}</p>
              <p className="text-white/25 text-[9px] leading-tight">{b.description}</p>
              <p className="text-white/20 text-[9px]">{timeAgo(b.earnedAt)}</p>
            </div>
            <span className={cn("text-[9px] font-bold px-2 py-0.5 rounded-full border", m.bg, m.border, m.color)}>
              {m.label}
            </span>
          </motion.div>
        );
      })}
    </div>
  );
}

// ── Stats tab ─────────────────────────────────────────────────────────────────

function StatsTab({ profile }: { profile: ReturnType<typeof getPublicProfile> }) {
  if (!profile) return null;
  const { user, totalXP, achievementScore, reputationScore, reputationTier } = profile;
  const { level, xpInLevel, xpForNextLevel } = computeLevel(totalXP);
  const tierM = REP_TIER_META[reputationTier];
  const xpPct = Math.round((xpInLevel / xpForNextLevel) * 100);

  const unlockedCount = initialUserAchievements.filter((u) => u.userId === user.id && u.isUnlocked).length;
  const totalAchs = 36; // total achievements in system

  const catCompletions = Object.keys(CATEGORY_META).map((cat) => {
    const total = 6; // 6 per category
    const done = initialUserAchievements.filter((ua) => {
      if (!ua.isUnlocked || ua.userId !== user.id) return false;
      const a = allAchievements.find((x) => x.id === ua.achievementId);
      return a?.category === cat;
    }).length;
    return { cat, done, total };
  });

  const rarityStats = (["legendary", "epic", "rare", "common"] as const).map((r) => {
    const done = initialUserAchievements.filter((ua) => {
      if (!ua.isUnlocked || ua.userId !== user.id) return false;
      const a = allAchievements.find((x) => x.id === ua.achievementId);
      return a?.rarity === r;
    }).length;
    const total = allAchievements.filter((a) => a.rarity === r).length;
    return { rarity: r, done, total };
  });

  return (
    <div className="space-y-4">
      {/* XP breakdown */}
      <GlassCard>
        <div className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-violet-400" />
            <span className="text-white/40 text-xs uppercase tracking-wider">Kinh Nghiệm & Cấp Độ</span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Tổng XP", val: totalXP.toLocaleString(), color: "text-violet-300" },
              { label: "Cấp Hiện Tại", val: `Cấp ${level}`, color: "text-white" },
              { label: "XP Đến Cấp Tiếp", val: `+${(xpForNextLevel - xpInLevel).toLocaleString()}`, color: "text-cyan-300" },
            ].map((s) => (
              <div key={s.label} className="text-center p-2.5 rounded-xl bg-white/4 border border-white/8">
                <p className={cn("font-bold text-lg leading-none tabular-nums", s.color)}>{s.val}</p>
                <p className="text-white/25 text-[9px] mt-1">{s.label}</p>
              </div>
            ))}
          </div>
          <div className="h-2 rounded-full bg-white/8 overflow-hidden">
            <motion.div initial={{ width: 0 }} animate={{ width: `${xpPct}%` }} transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
              className="h-full rounded-full bg-gradient-to-r from-violet-500 via-cyan-400 to-violet-400" />
          </div>
          <p className="text-white/20 text-[10px] text-center">{xpPct}% đến Cấp {level + 1}</p>
        </div>
      </GlassCard>

      {/* Core stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Giao Dịch", val: user.stats.tradesCompleted, icon: "💱", color: "text-emerald-300" },
          { label: "Tài Sản", val: user.stats.assetsOwned, icon: "📦", color: "text-amber-300" },
          { label: "Thế Giới", val: user.stats.worldsJoined, icon: "🌍", color: "text-blue-300" },
          { label: "Điểm Danh Tiếng", val: reputationScore, icon: tierM.icon, color: tierM.color },
        ].map((s) => (
          <GlassCard key={s.label}>
            <div className="p-3.5 text-center space-y-1.5">
              <div className="text-2xl">{s.icon}</div>
              <p className={cn("font-black text-xl tabular-nums", s.color)}>{s.val.toLocaleString()}</p>
              <p className="text-white/25 text-[9px] uppercase tracking-wide">{s.label}</p>
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Achievement by category */}
      <GlassCard>
        <div className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span className="text-white/40 text-xs uppercase tracking-wider">Thành Tích Theo Danh Mục</span>
          </div>
          <div className="space-y-2">
            {catCompletions.map(({ cat, done, total }) => {
              const m = CATEGORY_META[cat as keyof typeof CATEGORY_META];
              const pct = (done / total) * 100;
              return (
                <div key={cat} className="flex items-center gap-3">
                  <span className="text-base w-6 text-center shrink-0">{m.icon}</span>
                  <div className="flex-1 space-y-0.5">
                    <div className="flex justify-between">
                      <span className={cn("text-[10px] font-semibold", m.color)}>{m.label}</span>
                      <span className="text-white/25 text-[10px]">{done}/{total}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/6 overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.7, ease: "easeOut", delay: 0.1 }}
                        className={cn("h-full rounded-full", m.color.replace("text-", "bg-"))} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </GlassCard>

      {/* By rarity */}
      <GlassCard>
        <div className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-white/35" />
            <span className="text-white/40 text-xs uppercase tracking-wider">Thành Tích Theo Độ Hiếm</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {rarityStats.map(({ rarity, done, total }) => {
              const m = RARITY_META[rarity];
              return (
                <div key={rarity} className={cn("p-3 rounded-xl border text-center", m.bg, m.border)}>
                  <p className={cn("text-2xl font-black", m.color)}>{done}</p>
                  <p className="text-white/25 text-[9px]">/ {total}</p>
                  <p className={cn("text-[9px] font-bold mt-1", m.color)}>{m.label}</p>
                </div>
              );
            })}
          </div>
          <div className="pt-1">
            <div className="flex justify-between text-[10px] mb-1.5">
              <span className="text-white/30">Tổng Hoàn Thành</span>
              <span className="text-amber-300 font-bold">{unlockedCount}/{totalAchs} ({Math.round((unlockedCount / totalAchs) * 100)}%)</span>
            </div>
            <div className="h-2 rounded-full bg-white/8 overflow-hidden">
              <motion.div initial={{ width: 0 }} animate={{ width: `${(unlockedCount / totalAchs) * 100}%` }}
                transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
                className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-400" />
            </div>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <span className="text-4xl mb-3 opacity-30">{icon}</span>
      <p className="text-white/25 text-sm">{text}</p>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const params = useParams<{ username: string }>();
  const [, navigate] = useLocation();
  const { user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("achievements");
  const [following, setFollowing] = useState(false);

  const username = params?.username ?? "";
  const profile = useMemo(() => getPublicProfile(username), [username]);

  if (!profile) return <ProfileNotFound username={username} />;

  const { user, displayName, totalXP, reputationTier, reputationScore, followerCount, followingCount, badges, assets, activity } = profile;
  const tierM = REP_TIER_META[reputationTier];
  const { level, xpInLevel, xpForNextLevel } = computeLevel(totalXP);
  const xpPct = Math.round((xpInLevel / xpForNextLevel) * 100);
  const unlockedCount = initialUserAchievements.filter((u) => u.userId === user.id && u.isUnlocked).length;
  const isOwnProfile = currentUser?.id === user.id;
  const avatarGrad = AVATAR_GRADIENT[reputationTier];

  return (
    <div className="min-h-screen bg-[#050c1a]">
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full bg-violet-600/6 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-cyan-600/5 blur-3xl" />
      </div>

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-5">

        {/* ── Top nav ───────────────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <button onClick={() => navigate(-1 as never)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white/50 text-sm hover:text-white hover:bg-white/10 transition-all">
            <ArrowLeft className="w-4 h-4" /> Quay Lại
          </button>
          <div className="flex items-center gap-2">
            <ShareButton username={username} />
            {!isOwnProfile && (
              <button onClick={() => setFollowing((v) => !v)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-all",
                  following
                    ? "bg-violet-600/25 border-violet-500/40 text-violet-200"
                    : "bg-violet-600/15 border-violet-500/30 text-violet-300 hover:bg-violet-600/25"
                )}>
                <Heart className={cn("w-4 h-4 transition-all", following && "fill-violet-300")} />
                {following ? "Đang Theo Dõi" : "Theo Dõi"}
              </button>
            )}
            {isOwnProfile && (
              <button onClick={() => navigate("/account-center")}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border bg-white/5 border-white/15 text-white/60 hover:bg-white/10 transition-all">
                Chỉnh Sửa Hồ Sơ
              </button>
            )}
          </div>
        </div>

        {/* ── Hero card ─────────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: "easeOut" }}>
          <GlassCard className={cn("border overflow-hidden", tierM.border, tierM.glow)}>
            {/* Banner */}
            <div className={cn("h-28 sm:h-36 bg-gradient-to-br", avatarGrad, "relative overflow-hidden")}>
              <div className="absolute inset-0 bg-black/20" />
              {/* Animated particles */}
              {[...Array(6)].map((_, i) => (
                <motion.div key={i}
                  animate={{ y: [0, -20, 0], opacity: [0.3, 0.7, 0.3] }}
                  transition={{ duration: 3 + i, repeat: Infinity, delay: i * 0.5 }}
                  className="absolute w-1.5 h-1.5 rounded-full bg-white/30"
                  style={{ left: `${15 + i * 15}%`, top: `${30 + (i % 3) * 20}%` }} />
              ))}
              <div className="absolute right-4 top-3 text-[10px] text-white/30 flex items-center gap-1">
                <Copy className="w-3 h-3" />
                /profile/{username.toLowerCase()}
              </div>
            </div>

            <div className="p-5 -mt-10 relative">
              <div className="flex items-end gap-4 flex-wrap">
                {/* Avatar */}
                <div className="relative shrink-0">
                  <div className={cn(
                    "w-20 h-20 rounded-2xl bg-gradient-to-br flex items-center justify-center shadow-[0_0_30px_rgba(0,0,0,0.5)] border-4 border-[#050c1a] text-white font-black text-2xl",
                    avatarGrad
                  )}>
                    {user.avatar}
                  </div>
                  <div className={cn(
                    "absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-full border text-[10px] font-black flex items-center gap-0.5",
                    tierM.bg, tierM.border, tierM.color
                  )}>
                    {tierM.icon} {tierM.label}
                  </div>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0 pb-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h1 className="text-white font-black text-xl leading-none">{displayName}</h1>
                    {isOwnProfile && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-violet-500/20 border border-violet-500/35 text-violet-300 font-semibold">Bạn</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap text-xs mb-2">
                    <span className="text-white/40">@{user.username.toLowerCase()}</span>
                    <span className="text-white/15">·</span>
                    <span className={cn("font-semibold", tierM.color)}>{user.title}</span>
                  </div>
                  <p className="text-white/35 text-xs leading-relaxed line-clamp-2">{user.bio}</p>
                </div>

                {/* Follower stats */}
                <div className="flex gap-4 pb-1 shrink-0">
                  <div className="text-center">
                    <p className="text-white font-bold text-lg tabular-nums">{followerCount.toLocaleString()}</p>
                    <p className="text-white/30 text-[9px]">Người Theo Dõi</p>
                  </div>
                  <div className="w-px bg-white/8" />
                  <div className="text-center">
                    <p className="text-white font-bold text-lg tabular-nums">{followingCount.toLocaleString()}</p>
                    <p className="text-white/30 text-[9px]">Đang Theo Dõi</p>
                  </div>
                </div>
              </div>

              {/* Meta row */}
              <div className="flex items-center gap-4 mt-3 flex-wrap">
                {[
                  { icon: <Star className="w-3 h-3" />, label: `Cấp ${level}`, color: "text-violet-300" },
                  { icon: <Zap className="w-3 h-3" />, label: `${totalXP.toLocaleString()} XP`, color: "text-cyan-300" },
                  { icon: <Trophy className="w-3 h-3" />, label: `${unlockedCount} Thành Tích`, color: "text-amber-300" },
                  { icon: <Calendar className="w-3 h-3" />, label: `Tham gia ${formatDate(user.createdAt)}`, color: "text-white/35" },
                  { icon: <Clock className="w-3 h-3" />, label: `Hoạt động ${timeAgo(user.lastLogin)}`, color: "text-white/25" },
                ].map((m) => (
                  <div key={m.label} className={cn("flex items-center gap-1 text-[10px] font-medium", m.color)}>
                    {m.icon} {m.label}
                  </div>
                ))}
              </div>

              {/* XP bar */}
              <div className="mt-3 space-y-1">
                <div className="h-2 rounded-full bg-white/8 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${xpPct}%` }}
                    transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
                    className={cn("h-full rounded-full bg-gradient-to-r", avatarGrad)}
                  />
                </div>
                <div className="flex justify-between text-[9px] text-white/20">
                  <span>{xpInLevel.toLocaleString()} XP / {xpForNextLevel.toLocaleString()} XP</span>
                  <span>{xpPct}% đến Cấp {level + 1}</span>
                </div>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* ── Quick stats strip ──────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: "easeOut", delay: 0.1 }}
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
          {[
            { label: "Cấp Độ", val: level, icon: "⭐", color: "text-violet-300" },
            { label: "Tổng XP", val: totalXP.toLocaleString(), icon: "⚡", color: "text-cyan-300" },
            { label: "Danh Tiếng", val: reputationScore, icon: tierM.icon, color: tierM.color },
            { label: "Thành Tích", val: unlockedCount, icon: "🏆", color: "text-amber-300" },
            { label: "Giao Dịch", val: user.stats.tradesCompleted, icon: "💱", color: "text-emerald-300" },
            { label: "Tài Sản", val: user.stats.assetsOwned.toLocaleString(), icon: "📦", color: "text-rose-300" },
          ].map((s) => (
            <GlassCard key={s.label}>
              <div className="p-3 text-center space-y-1">
                <div className="text-xl">{s.icon}</div>
                <p className={cn("font-black text-lg leading-none tabular-nums", s.color)}>{s.val}</p>
                <p className="text-white/20 text-[9px] uppercase tracking-wide leading-tight">{s.label}</p>
              </div>
            </GlassCard>
          ))}
        </motion.div>

        {/* ── Tabs ──────────────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3, delay: 0.15 }}>
          <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-none flex-wrap">
            {TABS.map((tab) => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border whitespace-nowrap transition-all shrink-0",
                  activeTab === tab.key
                    ? "bg-violet-600/25 border-violet-500/40 text-violet-200 shadow-[0_0_10px_rgba(124,58,237,0.15)]"
                    : "bg-white/4 border-white/10 text-white/35 hover:text-white/65 hover:bg-white/7"
                )}>
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>
        </motion.div>

        {/* ── Tab content ───────────────────────────────────────── */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            variants={stagger}
            initial="hidden"
            animate="show"
          >
            {activeTab === "achievements" && <AchievementsTab userId={user.id} />}
            {activeTab === "activity" && <ActivityTab activity={activity} />}
            {activeTab === "worlds" && <WorldsTab worlds={user.connectedWorlds} />}
            {activeTab === "assets" && <AssetsTab assets={assets} />}
            {activeTab === "badges" && <BadgesTab badges={badges} />}
            {activeTab === "stats" && <StatsTab profile={profile} />}
          </motion.div>
        </AnimatePresence>

        {/* ── Footer ────────────────────────────────────────────── */}
        <div className="flex items-center justify-center gap-2 pt-4 pb-8">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center">
            <span className="text-white text-[10px] font-black">U</span>
          </div>
          <span className="text-white/20 text-xs">Universe Account System</span>
          <span className="text-white/10">·</span>
          <span className="text-white/15 text-xs">/profile/{username.toLowerCase()}</span>
        </div>

      </div>
    </div>
  );
}
