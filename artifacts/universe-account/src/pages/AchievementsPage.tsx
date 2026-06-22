import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { AppShell } from "@/components/layout/AppShell";
import { GlassCard } from "@/components/glass/GlassCard";
import { useAuth } from "@/hooks/useAuth";
import {
  Achievement, UserAchievement, AchievementCategory,
  RARITY_META, CATEGORY_META, computeLevel,
} from "@/lib/types/achievement";
import { allAchievements, initialUserAchievements } from "@/lib/mock/achievementData";
import {
  Trophy, Star, Zap, TrendingUp, Lock, CheckCircle2, ChevronRight,
  Loader2, Gift, Search, Filter, BarChart3, Clock, Award, Flame,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Local storage helpers ─────────────────────────────────────────────────────

const UA_KEY = "universe_user_achievements_v2";

function loadUserAchievements(userId: string): UserAchievement[] {
  try {
    const raw = localStorage.getItem(UA_KEY);
    if (raw) {
      const all: UserAchievement[] = JSON.parse(raw);
      const user = all.filter((u) => u.userId === userId);
      if (user.length > 0) return user;
    }
  } catch {}
  const seeded = initialUserAchievements.filter((u) => u.userId === userId);
  const existing = (() => { try { return JSON.parse(localStorage.getItem(UA_KEY) ?? "[]"); } catch { return []; } })();
  localStorage.setItem(UA_KEY, JSON.stringify([...seeded, ...existing.filter((u: UserAchievement) => u.userId !== userId)]));
  return seeded;
}

function persistClaim(userId: string, achievementId: string) {
  try {
    const all: UserAchievement[] = JSON.parse(localStorage.getItem(UA_KEY) ?? "[]");
    localStorage.setItem(UA_KEY, JSON.stringify(
      all.map((u) => u.userId === userId && u.achievementId === achievementId ? { ...u, rewardClaimed: true } : u)
    ));
  } catch {}
}

// ── Animation presets ─────────────────────────────────────────────────────────

const stagger: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };
const pop: Variants = {
  hidden: { opacity: 0, y: 14, scale: 0.97 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.3, ease: "easeOut" } },
};

function timeAgo(iso: string) {
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (d === 0) return "hôm nay";
  if (d === 1) return "hôm qua";
  if (d < 30) return `${d} ngày trước`;
  if (d < 365) return `${Math.floor(d / 30)} tháng trước`;
  return `${Math.floor(d / 365)} năm trước`;
}

// ── XP / Level Hero bar ───────────────────────────────────────────────────────

function HeroBar({ totalXP, achievementScore, reputation }: { totalXP: number; achievementScore: number; reputation: number }) {
  const { level, xpInLevel, xpForNextLevel } = computeLevel(totalXP);
  const pct = Math.round((xpInLevel / xpForNextLevel) * 100);

  return (
    <GlassCard className="border-violet-500/20 overflow-hidden">
      <div className="h-1 bg-gradient-to-r from-violet-500 via-cyan-400 to-violet-500" />
      <div className="p-5">
        <div className="flex items-center gap-5 flex-wrap">

          {/* Level orb */}
          <div className="relative shrink-0">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center shadow-[0_0_32px_rgba(124,58,237,0.45)]">
              <span className="text-white font-black text-2xl">{level}</span>
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-amber-400 border-2 border-[#050c1a] flex items-center justify-center">
              <Star className="w-3 h-3 fill-amber-900 text-amber-900" />
            </div>
          </div>

          {/* XP bar */}
          <div className="flex-1 min-w-52 space-y-2.5">
            <div className="flex justify-between items-end">
              <div>
                <p className="text-white/35 text-[10px] uppercase tracking-widest">Cấp Độ Hiện Tại</p>
                <p className="text-white font-bold text-xl leading-none">Cấp {level}</p>
              </div>
              <div className="text-right">
                <p className="text-white/35 text-[10px] uppercase tracking-widest">Tổng XP</p>
                <p className="text-violet-300 font-bold text-xl leading-none tabular-nums">{totalXP.toLocaleString()}</p>
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="h-3 rounded-full bg-white/8 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 1.3, ease: "easeOut", delay: 0.2 }}
                  className="h-full rounded-full bg-gradient-to-r from-violet-500 via-cyan-400 to-violet-400 relative"
                >
                  <div className="absolute right-0 top-0 h-full w-6 bg-gradient-to-r from-transparent to-white/25 rounded-full" />
                </motion.div>
              </div>
              <div className="flex justify-between text-[10px] text-white/25">
                <span>{xpInLevel.toLocaleString()} XP</span>
                <span>{pct}% • Còn {(xpForNextLevel - xpInLevel).toLocaleString()} XP đến Cấp {level + 1}</span>
              </div>
            </div>
          </div>

          {/* Quick stats */}
          <div className="flex gap-2.5 flex-wrap shrink-0">
            {[
              { label: "Điểm Thành Tích", val: achievementScore, icon: <Trophy className="w-4 h-4 text-amber-400" />, color: "text-amber-300" },
              { label: "Điểm Danh Tiếng", val: reputation, icon: <TrendingUp className="w-4 h-4 text-emerald-400" />, color: "text-emerald-300" },
              { label: "XP Cần Thêm", val: `+${(xpForNextLevel - xpInLevel).toLocaleString()}`, icon: <Zap className="w-4 h-4 text-violet-400" />, color: "text-violet-300" },
            ].map((s) => (
              <div key={s.label} className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10">
                {s.icon}
                <div>
                  <p className={cn("font-bold text-base leading-none tabular-nums", s.color)}>{s.val}</p>
                  <p className="text-white/25 text-[9px] mt-0.5">{s.label}</p>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </GlassCard>
  );
}

// ── Stats dashboard ───────────────────────────────────────────────────────────

function StatsDashboard({
  achievements,
  userAchievements,
  achievementScore,
}: {
  achievements: Achievement[];
  userAchievements: UserAchievement[];
  achievementScore: number;
}) {
  const unlocked = userAchievements.filter((u) => u.isUnlocked).length;
  const inProg = userAchievements.filter((u) => !u.isUnlocked && u.progress > 0).length;
  const locked = achievements.length - unlocked - inProg;
  const pct = Math.round((unlocked / achievements.length) * 100);

  const rarityCounts = (["common", "rare", "epic", "legendary"] as const).map((r) => {
    const total = achievements.filter((a) => a.rarity === r).length;
    const done = userAchievements.filter((u) => {
      const a = achievements.find((x) => x.id === u.achievementId);
      return a?.rarity === r && u.isUnlocked;
    }).length;
    return { rarity: r, total, done };
  });

  const recent = userAchievements
    .filter((u) => u.isUnlocked && u.unlockedAt)
    .sort((a, b) => new Date(b.unlockedAt!).getTime() - new Date(a.unlockedAt!).getTime())
    .slice(0, 3);

  const catStats = (Object.keys(CATEGORY_META) as AchievementCategory[]).map((cat) => {
    const total = achievements.filter((a) => a.category === cat).length;
    const done = userAchievements.filter((u) => {
      const a = achievements.find((x) => x.id === u.achievementId);
      return a?.category === cat && u.isUnlocked;
    }).length;
    return { cat, total, done };
  });

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">

      {/* Completion */}
      <GlassCard className="border-violet-500/20">
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Trophy className="w-4 h-4 text-amber-400" />
              <span className="text-white/40 text-xs uppercase tracking-wider">Hoàn Thành</span>
            </div>
            <span className="text-amber-300 font-bold text-xl tabular-nums">{unlocked}<span className="text-white/20 text-sm font-normal">/{achievements.length}</span></span>
          </div>
          <div className="h-2.5 rounded-full bg-white/8 overflow-hidden">
            <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1, ease: "easeOut", delay: 0.1 }}
              className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-400" />
          </div>
          <div className="flex justify-between text-[10px] text-white/25">
            <span>{pct}% hoàn thành</span>
            <span className="text-amber-300 font-semibold">{achievementScore} điểm</span>
          </div>
        </div>
      </GlassCard>

      {/* Status breakdown */}
      <GlassCard>
        <div className="p-4 space-y-2.5">
          <div className="flex items-center gap-1.5 mb-1">
            <BarChart3 className="w-4 h-4 text-white/35" />
            <span className="text-white/40 text-xs uppercase tracking-wider">Phân Loại</span>
          </div>
          {[
            { label: "Đã hoàn thành", count: unlocked, dot: "bg-emerald-400", color: "text-emerald-300" },
            { label: "Đang tiến hành", count: inProg, dot: "bg-amber-400", color: "text-amber-300" },
            { label: "Đã khóa", count: locked, dot: "bg-white/15", color: "text-white/25" },
          ].map((s) => (
            <div key={s.label} className="flex items-center gap-2">
              <div className={cn("w-2 h-2 rounded-full shrink-0", s.dot)} />
              <span className="text-white/40 text-xs flex-1">{s.label}</span>
              <span className={cn("font-bold text-sm tabular-nums", s.color)}>{s.count}</span>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* By rarity */}
      <GlassCard>
        <div className="p-4 space-y-2">
          <div className="flex items-center gap-1.5 mb-1">
            <Award className="w-4 h-4 text-white/35" />
            <span className="text-white/40 text-xs uppercase tracking-wider">Theo Độ Hiếm</span>
          </div>
          {rarityCounts.map(({ rarity, total, done }) => {
            const m = RARITY_META[rarity];
            return (
              <div key={rarity} className="space-y-0.5">
                <div className="flex justify-between">
                  <span className={cn("text-[10px] font-semibold", m.color)}>{m.label}</span>
                  <span className="text-white/25 text-[10px]">{done}/{total}</span>
                </div>
                <div className="h-1.5 rounded-full bg-white/6 overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${total > 0 ? (done / total) * 100 : 0}%` }}
                    transition={{ duration: 0.8, ease: "easeOut", delay: 0.15 }}
                    className={cn("h-full rounded-full", m.barColor)} />
                </div>
              </div>
            );
          })}
        </div>
      </GlassCard>

      {/* Recent unlocks */}
      <GlassCard>
        <div className="p-4 space-y-2.5">
          <div className="flex items-center gap-1.5 mb-1">
            <Flame className="w-4 h-4 text-white/35" />
            <span className="text-white/40 text-xs uppercase tracking-wider">Mới Mở Khóa</span>
          </div>
          {recent.length === 0 && (
            <p className="text-white/20 text-xs text-center py-4">Chưa có thành tích</p>
          )}
          {recent.map((ua) => {
            const a = allAchievements.find((x) => x.id === ua.achievementId);
            if (!a) return null;
            const m = RARITY_META[a.rarity];
            return (
              <div key={ua.achievementId} className="flex items-center gap-2">
                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center text-base border shrink-0", m.bg, m.border)}>
                  {a.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white/65 text-[10px] font-semibold truncate">{a.title}</p>
                  <p className="text-white/25 text-[9px]">{timeAgo(ua.unlockedAt!)}</p>
                </div>
                <span className={cn("text-[9px] font-bold", m.color)}>+{m.points}pt</span>
              </div>
            );
          })}
        </div>
      </GlassCard>

      {/* Category progress — spans full width */}
      <GlassCard className="sm:col-span-2 lg:col-span-4">
        <div className="p-4">
          <div className="flex items-center gap-1.5 mb-3">
            <BarChart3 className="w-4 h-4 text-white/35" />
            <span className="text-white/40 text-xs uppercase tracking-wider">Tiến Độ Theo Danh Mục</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {catStats.map(({ cat, total, done }) => {
              const m = CATEGORY_META[cat];
              const catPct = total > 0 ? (done / total) * 100 : 0;
              return (
                <div key={cat} className={cn("rounded-xl p-3 border space-y-2", m.bg, m.border)}>
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{m.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className={cn("text-[10px] font-bold leading-tight", m.color)}>{m.label}</p>
                      <p className="text-white/25 text-[9px]">{done}/{total}</p>
                    </div>
                  </div>
                  <div className="h-1.5 rounded-full bg-black/20 overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${catPct}%` }} transition={{ duration: 0.9, ease: "easeOut", delay: 0.2 }}
                      className={cn("h-full rounded-full", m.color.replace("text-", "bg-"))} />
                  </div>
                  <p className={cn("text-[9px] font-bold", m.color)}>{Math.round(catPct)}%</p>
                </div>
              );
            })}
          </div>
        </div>
      </GlassCard>
    </div>
  );
}

// ── Category filter tabs ──────────────────────────────────────────────────────

function CategoryTabs({
  selected, onChange, achievements, userAchievements,
}: {
  selected: AchievementCategory | "all";
  onChange: (c: AchievementCategory | "all") => void;
  achievements: Achievement[];
  userAchievements: UserAchievement[];
}) {
  const cats: (AchievementCategory | "all")[] = [
    "all", "account", "social", "creator", "marketplace", "world_builder", "explorer",
  ];
  return (
    <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-none flex-wrap">
      {cats.map((cat) => {
        const isAll = cat === "all";
        const meta = isAll ? null : CATEGORY_META[cat as AchievementCategory];
        const total = isAll ? achievements.length : achievements.filter((a) => a.category === cat).length;
        const done = isAll
          ? userAchievements.filter((u) => u.isUnlocked).length
          : userAchievements.filter((u) => {
              const a = achievements.find((x) => x.id === u.achievementId);
              return a?.category === cat && u.isUnlocked;
            }).length;
        const active = selected === cat;
        return (
          <button key={cat} onClick={() => onChange(cat)}
            className={cn(
              "flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border whitespace-nowrap transition-all shrink-0",
              active
                ? isAll
                  ? "bg-violet-600/25 border-violet-500/40 text-violet-200 shadow-[0_0_10px_rgba(124,58,237,0.18)]"
                  : `${meta!.bg} ${meta!.border} ${meta!.color}`
                : "bg-white/4 border-white/10 text-white/35 hover:text-white/65 hover:bg-white/7"
            )}>
            <span className="text-base leading-none">{isAll ? "🏆" : meta!.icon}</span>
            <span>{isAll ? "Tất Cả" : meta!.label}</span>
            <span className={cn(
              "text-[9px] px-1.5 py-0.5 rounded-md font-bold tabular-nums",
              active ? "bg-black/20 text-white/60" : "bg-white/8 text-white/20"
            )}>
              {done}/{total}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// ── Achievement card ──────────────────────────────────────────────────────────

function AchievementCard({
  achievement, userAchievement, onClaim,
}: {
  achievement: Achievement;
  userAchievement: UserAchievement;
  onClaim: (id: string) => void;
}) {
  const [showReward, setShowReward] = useState(false);
  const m = RARITY_META[achievement.rarity];
  const cat = CATEGORY_META[achievement.category];
  const isUnlocked = userAchievement.isUnlocked;
  const inProgress = !isUnlocked && userAchievement.progress > 0;
  const isLocked = !isUnlocked && userAchievement.progress === 0;
  const isSecret = achievement.secret && isLocked;
  const progressPct = Math.min(100, achievement.maxProgress > 0
    ? Math.round((userAchievement.progress / achievement.maxProgress) * 100) : 0);
  const canClaim = isUnlocked && !userAchievement.rewardClaimed;

  return (
    <motion.div
      layout
      variants={pop}
      className={cn(
        "relative rounded-2xl border overflow-hidden transition-shadow",
        isUnlocked ? `bg-gradient-to-b ${m.gradient} ${m.border} ${m.glow}` :
        inProgress ? "bg-white/3 border-white/12" :
        "bg-white/2 border-white/6 opacity-50 hover:opacity-70"
      )}
    >
      {/* Completed bar accent */}
      {isUnlocked && <div className={cn("h-0.5 w-full", m.barColor, "opacity-70")} />}

      <div className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start gap-3">
          <div className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center text-2xl border shrink-0 transition-all",
            isUnlocked ? `${m.bg} ${m.border}` :
            inProgress ? "bg-white/8 border-white/15" :
            "bg-white/4 border-white/8 grayscale"
          )}>
            {isSecret ? "❓" : achievement.icon}
          </div>

          <div className="flex-1 min-w-0 space-y-1.5">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className={cn("text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-md border", m.bg, m.border, m.color)}>
                {m.label}
              </span>
              <span className={cn("text-[9px] font-medium px-1.5 py-0.5 rounded-md border", cat.bg, cat.border, cat.color)}>
                {cat.icon} {cat.label}
              </span>
              {achievement.secret && (
                <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-white/6 border border-white/10 text-white/30">Bí ẩn</span>
              )}
            </div>
            <p className={cn("font-bold text-sm leading-tight", isUnlocked ? "text-white" : inProgress ? "text-white/70" : "text-white/30")}>
              {isSecret ? "??? Thành Tích Bí Ẩn" : achievement.title}
            </p>
          </div>

          <div className="shrink-0 mt-0.5">
            {isUnlocked ? <CheckCircle2 className={cn("w-5 h-5", m.color)} /> :
             inProgress ? <Clock className="w-5 h-5 text-amber-400/70" /> :
             <Lock className="w-4 h-4 text-white/18" />}
          </div>
        </div>

        {/* Description */}
        <p className={cn("text-xs leading-relaxed", isUnlocked ? "text-white/50" : inProgress ? "text-white/38" : "text-white/18")}>
          {isSecret ? "Khám phá và hoàn thành một điều kiện ẩn để mở khóa thành tích bí ẩn này." : achievement.description}
        </p>

        {/* Progress */}
        {!isSecret && (
          <div className="space-y-1.5">
            <div className="flex justify-between text-[10px]">
              <span className="text-white/28">Tiến độ</span>
              <span className={cn("font-semibold tabular-nums", isUnlocked ? m.color : "text-white/40")}>
                {isUnlocked ? "✓ Hoàn thành!" : `${userAchievement.progress.toLocaleString()} / ${achievement.maxProgress.toLocaleString()}`}
              </span>
            </div>
            <div className="h-2 rounded-full bg-black/20 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPct}%` }}
                transition={{ duration: 0.9, ease: "easeOut", delay: 0.08 }}
                className={cn("h-full rounded-full", isUnlocked ? m.barColor : "bg-amber-400/55")}
              />
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-0.5 flex-wrap gap-2">
          <button onClick={() => setShowReward((v) => !v)}
            className="flex items-center gap-1.5 text-[10px] text-white/28 hover:text-white/55 transition-colors">
            <Gift className="w-3 h-3" />
            <span>Phần thưởng: <strong className={isUnlocked ? m.color : "text-white/28"}>{achievement.reward.label}</strong></span>
            <ChevronRight className={cn("w-3 h-3 transition-transform", showReward && "rotate-90")} />
          </button>

          <div className="flex items-center gap-2">
            {canClaim && (
              <motion.button initial={{ scale: 0.9 }} animate={{ scale: 1 }} whileTap={{ scale: 0.94 }}
                onClick={() => onClaim(achievement.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold border bg-amber-500/15 border-amber-500/35 text-amber-300 hover:bg-amber-500/25 hover:border-amber-500/55 shadow-[0_0_8px_rgba(245,158,11,0.18)] transition-all">
                <Gift className="w-3 h-3" /> Nhận Thưởng!
              </motion.button>
            )}
            {isUnlocked && !canClaim && (
              <span className="text-[9px] text-white/20 flex items-center gap-0.5">
                <CheckCircle2 className="w-2.5 h-2.5" /> Đã nhận
              </span>
            )}
            {isUnlocked && userAchievement.unlockedAt && (
              <span className="text-[9px] text-white/18">{timeAgo(userAchievement.unlockedAt)}</span>
            )}
          </div>
        </div>

        {/* Reward detail accordion */}
        <AnimatePresence>
          {showReward && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
              <div className={cn("rounded-xl border p-3 flex items-center gap-3", m.bg, m.border)}>
                <span className="text-2xl">
                  {achievement.reward.type === "xp" ? "⚡" :
                   achievement.reward.type === "badge" ? "🏅" :
                   achievement.reward.type === "title" ? "📜" : "🎨"}
                </span>
                <div>
                  <p className={cn("text-sm font-bold", m.color)}>{achievement.reward.value}</p>
                  <p className="text-white/28 text-[10px]">{achievement.reward.label}</p>
                  <p className="text-white/18 text-[9px]">+{m.points} điểm thành tích</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

type FilterStatus = "all" | "completed" | "in_progress" | "locked";

export default function AchievementsPage() {
  const { user } = useAuth();
  const [userAchievements, setUserAchievements] = useState<UserAchievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<AchievementCategory | "all">("all");
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("all");
  const [rarityFilter, setRarityFilter] = useState<"all" | "common" | "rare" | "epic" | "legendary">("all");
  const [search, setSearch] = useState("");
  const [claimedId, setClaimedId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const t = setTimeout(() => {
      setUserAchievements(loadUserAchievements(user.id));
      setLoading(false);
    }, 350);
    return () => clearTimeout(t);
  }, [user]);

  const handleClaim = (achievementId: string) => {
    if (!user) return;
    persistClaim(user.id, achievementId);
    setUserAchievements((prev) =>
      prev.map((u) => u.achievementId === achievementId ? { ...u, rewardClaimed: true } : u)
    );
    setClaimedId(achievementId);
    setTimeout(() => setClaimedId(null), 2500);
  };

  const totalXP = useMemo(() => userAchievements.reduce((acc, ua) => {
    if (!ua.isUnlocked) return acc;
    const a = allAchievements.find((x) => x.id === ua.achievementId);
    if (!a) return acc;
    const xpBase = a.reward.type === "xp" ? (a.reward.value as number) : 0;
    return acc + xpBase + RARITY_META[a.rarity].points;
  }, 0), [userAchievements]);

  const achievementScore = useMemo(() => userAchievements.reduce((acc, ua) => {
    if (!ua.isUnlocked) return acc;
    const a = allAchievements.find((x) => x.id === ua.achievementId);
    return acc + (a ? RARITY_META[a.rarity].points : 0);
  }, 0), [userAchievements]);

  const reputation = useMemo(() =>
    Math.min(1000, Math.round(achievementScore * 1.2 + (user?.securityScore ?? 0) * 2)),
    [achievementScore, user?.securityScore]
  );

  const filtered = useMemo(() => allAchievements.filter((a) => {
    if (category !== "all" && a.category !== category) return false;
    if (rarityFilter !== "all" && a.rarity !== rarityFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      if (!a.title.toLowerCase().includes(q) && !a.description.toLowerCase().includes(q)) return false;
    }
    if (statusFilter !== "all") {
      const ua = userAchievements.find((u) => u.achievementId === a.id);
      const st = ua?.isUnlocked ? "completed" : ua && ua.progress > 0 ? "in_progress" : "locked";
      if (st !== statusFilter) return false;
    }
    return true;
  }), [category, rarityFilter, search, statusFilter, userAchievements]);

  if (loading) {
    return (
      <AppShell title="Trung Tâm Thành Tích" subtitle="Theo dõi hành trình và phần thưởng của bạn">
        <div className="flex-1 flex items-center justify-center py-32">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-violet-400" />
            <p className="text-white/30 text-sm">Đang tải thành tích...</p>
          </div>
        </div>
      </AppShell>
    );
  }

  const statusOptions: { key: FilterStatus; label: string; icon: React.ReactNode }[] = [
    { key: "all", label: "Tất Cả", icon: <Filter className="w-3 h-3" /> },
    { key: "completed", label: "Hoàn Thành", icon: <CheckCircle2 className="w-3 h-3" /> },
    { key: "in_progress", label: "Đang Làm", icon: <Clock className="w-3 h-3" /> },
    { key: "locked", label: "Đã Khóa", icon: <Lock className="w-3 h-3" /> },
  ];

  return (
    <AppShell title="Trung Tâm Thành Tích" subtitle="Theo dõi tiến độ, nhận phần thưởng và chinh phục vũ trụ">

      {/* Claimed toast */}
      <AnimatePresence>
        {claimedId && (
          <motion.div initial={{ opacity: 0, y: -10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.96 }}
            className="fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-500/20 border border-amber-500/40 shadow-[0_0_24px_rgba(245,158,11,0.25)] backdrop-blur-xl">
            <Gift className="w-5 h-5 text-amber-400" />
            <span className="text-amber-200 text-sm font-semibold">Đã nhận phần thưởng!</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="p-4 sm:p-6 max-w-7xl space-y-5">
        <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-5">

          {/* ── Hero Bar ──────────────────────────────────────── */}
          <motion.div variants={pop}>
            <HeroBar totalXP={totalXP} achievementScore={achievementScore} reputation={reputation} />
          </motion.div>

          {/* ── Stats Dashboard ───────────────────────────────── */}
          <motion.div variants={pop}>
            <StatsDashboard
              achievements={allAchievements}
              userAchievements={userAchievements}
              achievementScore={achievementScore}
            />
          </motion.div>

          {/* ── Section header ────────────────────────────────── */}
          <motion.div variants={pop} className="flex items-center gap-3">
            <Trophy className="w-5 h-5 text-amber-400" />
            <h2 className="text-white font-bold text-lg">Danh Sách Thành Tích</h2>
            <div className="flex-1 h-px bg-white/8" />
          </motion.div>

          {/* ── Category tabs ─────────────────────────────────── */}
          <motion.div variants={pop}>
            <CategoryTabs
              selected={category}
              onChange={setCategory}
              achievements={allAchievements}
              userAchievements={userAchievements}
            />
          </motion.div>

          {/* ── Search + Filters ──────────────────────────────── */}
          <motion.div variants={pop}>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative flex-1 min-w-44">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/25" />
                <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                  placeholder="Tìm kiếm thành tích..."
                  className="w-full pl-8 pr-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/70 placeholder:text-white/20 text-sm focus:outline-none focus:border-violet-500/40 focus:bg-white/8 transition-all" />
              </div>

              <div className="flex gap-1 p-1 rounded-xl bg-white/4 border border-white/8">
                {statusOptions.map((s) => (
                  <button key={s.key} onClick={() => setStatusFilter(s.key)}
                    className={cn(
                      "flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all whitespace-nowrap",
                      statusFilter === s.key ? "bg-white/12 text-white border border-white/15" : "text-white/30 hover:text-white/55"
                    )}>
                    {s.icon} {s.label}
                  </button>
                ))}
              </div>

              <div className="flex gap-1 p-1 rounded-xl bg-white/4 border border-white/8">
                {(["all", "common", "rare", "epic", "legendary"] as const).map((r) => {
                  const m = r !== "all" ? RARITY_META[r] : null;
                  return (
                    <button key={r} onClick={() => setRarityFilter(r)}
                      className={cn(
                        "px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all whitespace-nowrap",
                        rarityFilter === r
                          ? r === "all" ? "bg-white/12 text-white border border-white/15" : `${m!.bg} ${m!.border} ${m!.color}`
                          : "text-white/30 hover:text-white/55"
                      )}>
                      {r === "all" ? "Tất Cả" : m!.label}
                    </button>
                  );
                })}
              </div>

              <span className="text-white/20 text-xs whitespace-nowrap">{filtered.length} thành tích</span>
            </div>
          </motion.div>

          {/* ── Achievement grid ──────────────────────────────── */}
          {filtered.length === 0 ? (
            <motion.div variants={pop} className="flex flex-col items-center justify-center py-24 text-center">
              <Trophy className="w-14 h-14 text-white/8 mb-4" />
              <p className="text-white/30 text-sm font-medium">Không tìm thấy thành tích</p>
              <p className="text-white/15 text-xs mt-1">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
            </motion.div>
          ) : (
            <motion.div
              variants={stagger}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
            >
              <AnimatePresence mode="popLayout">
                {filtered.map((achievement) => {
                  const ua = userAchievements.find((u) => u.achievementId === achievement.id) ?? {
                    achievementId: achievement.id,
                    userId: user?.id ?? "",
                    progress: 0,
                    isUnlocked: false,
                    rewardClaimed: false,
                  };
                  return (
                    <AchievementCard
                      key={achievement.id}
                      achievement={achievement}
                      userAchievement={ua}
                      onClaim={handleClaim}
                    />
                  );
                })}
              </AnimatePresence>
            </motion.div>
          )}
        </motion.div>
      </div>
    </AppShell>
  );
}
