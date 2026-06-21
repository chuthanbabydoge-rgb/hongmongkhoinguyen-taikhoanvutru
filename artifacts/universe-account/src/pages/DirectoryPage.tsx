import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AppShell } from "@/components/layout/AppShell";
import { GlassCard } from "@/components/glass/GlassCard";
import { useDirectory } from "@/hooks/useDirectory";
import { DirectoryUser, DirectoryFilter } from "@/lib/types/directory";
import { REPUTATION_RANK_COLORS, FILTER_LABELS } from "@/lib/mock/directoryMock";
import {
  Search, X, BadgeCheck, Users, Zap, Trophy,
  Globe, BarChart3, Star, Crown, Layers, LayoutGrid,
  List, TrendingUp, Clock, ChevronRight, Medal,
} from "lucide-react";

// ─── Animations ───────────────────────────────────────────────────────────────
const containerAnim = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };
const itemAnim = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.28 } } };

// ─── Time helper ──────────────────────────────────────────────────────────────
function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "now";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

function xpPct(xp: number, next: number) {
  return Math.min(Math.round((xp / next) * 100), 100);
}

// ─── Medal for top-3 positions ────────────────────────────────────────────────
function RankMedal({ rank }: { rank: number }) {
  if (rank === 1) return <span className="text-lg">🥇</span>;
  if (rank === 2) return <span className="text-lg">🥈</span>;
  if (rank === 3) return <span className="text-lg">🥉</span>;
  return (
    <span className="w-6 h-6 flex items-center justify-center text-white/30 text-xs font-bold font-mono tabular-nums">
      {rank}
    </span>
  );
}

// ─── Specialization pills ─────────────────────────────────────────────────────
const SPEC_META: Record<string, { label: string; color: string; bg: string }> = {
  creator:          { label: "Creator",    color: "text-violet-400", bg: "bg-violet-500/10 border-violet-500/20" },
  trader:           { label: "Trader",     color: "text-cyan-400",   bg: "bg-cyan-500/10 border-cyan-500/20" },
  breeder:          { label: "Breeder",    color: "text-amber-400",  bg: "bg-amber-500/10 border-amber-500/20" },
  football_manager: { label: "Manager",   color: "text-emerald-400",bg: "bg-emerald-500/10 border-emerald-500/20" },
  explorer:         { label: "Explorer",   color: "text-blue-400",   bg: "bg-blue-500/10 border-blue-500/20" },
  guardian:         { label: "Guardian",   color: "text-red-400",    bg: "bg-red-500/10 border-red-500/20" },
};

// ─── USER CARD (grid view) ────────────────────────────────────────────────────
function UserCard({ user, rank, scoreLabel, score }: {
  user: DirectoryUser;
  rank?: number;
  scoreLabel?: string;
  score?: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const rankColors = REPUTATION_RANK_COLORS[user.reputationRank];
  const xp = xpPct(user.experience, user.experienceToNext);

  return (
    <motion.div layout className="h-full">
      <GlassCard
        className={`h-full flex flex-col overflow-hidden transition-all duration-300 ${rankColors.glow} ${
          user.reputationRank === "Cosmic"
            ? "border-fuchsia-500/20"
            : user.reputationRank === "Legend"
            ? "border-amber-500/15"
            : ""
        }`}
        glow="none"
      >
        <div className="p-4 flex flex-col flex-1 gap-3">
          {/* Header */}
          <div className="flex items-start gap-3">
            <div className="relative shrink-0">
              <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${user.avatarColor} flex items-center justify-center text-white font-bold text-lg shadow-lg`}>
                {user.avatar}
              </div>
              {user.isOnline && (
                <span className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
                  <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-[#050c1a]" />
                </span>
              )}
              {rank && rank <= 3 && (
                <span className="absolute -top-2 -left-2 text-base">
                  {rank === 1 ? "🥇" : rank === 2 ? "🥈" : "🥉"}
                </span>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <p className="text-white font-bold text-sm truncate leading-tight">{user.displayName}</p>
                {user.verifiedAt && <BadgeCheck className="w-3.5 h-3.5 text-cyan-400 shrink-0" />}
              </div>
              <p className="text-white/35 text-xs mt-0.5">@{user.username}</p>
              <p className="text-white/25 text-[10px] italic mt-0.5 truncate">{user.title}</p>
            </div>

            <div className={`shrink-0 px-1.5 py-0.5 rounded-md border text-[10px] font-bold ${rankColors.bg} ${rankColors.color}`}>
              {user.reputationRank}
            </div>
          </div>

          {/* Badges */}
          {user.badges.length > 0 && (
            <div className="flex items-center gap-1 flex-wrap">
              {user.badges.map((b, i) => (
                <span key={i} className="text-sm">{b}</span>
              ))}
            </div>
          )}

          {/* Specs */}
          <div className="flex flex-wrap gap-1">
            {user.specializations.map(s => {
              const m = SPEC_META[s];
              return (
                <span key={s} className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md border ${m.color} ${m.bg}`}>
                  {m.label}
                </span>
              );
            })}
          </div>

          {/* Level + XP bar */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-white/30 text-xs flex items-center gap-1">
                <Zap className="w-3 h-3 text-amber-400" />
                Lv {user.level}
              </span>
              <span className="text-white/25 text-[10px] font-mono tabular-nums">{xp}%</span>
            </div>
            <div className="h-1 rounded-full bg-white/8 overflow-hidden">
              <div
                className={`h-full rounded-full bg-gradient-to-r ${user.avatarColor}`}
                style={{ width: `${xp}%` }}
              />
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-1.5 text-center">
            {[
              { label: "Rep", value: user.reputation },
              { label: "Assets", value: user.assetsOwned >= 1000 ? `${(user.assetsOwned / 1000).toFixed(1)}k` : user.assetsOwned },
              { label: "Trades", value: user.tradesCompleted >= 1000 ? `${(user.tradesCompleted / 1000).toFixed(1)}k` : user.tradesCompleted },
            ].map(s => (
              <div key={s.label} className="py-1.5 rounded-lg bg-white/3 border border-white/8">
                <p className="text-white font-bold text-sm leading-none">{s.value}</p>
                <p className="text-white/25 text-[10px] mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Score badge (when in leaderboard mode) */}
          {scoreLabel && score !== undefined && (
            <div className={`flex items-center justify-between px-3 py-2 rounded-xl border ${rankColors.bg} ${rankColors.glow}`}>
              <span className={`text-xs font-semibold ${rankColors.color}`}>{scoreLabel}</span>
              <span className={`text-sm font-bold tabular-nums ${rankColors.color}`}>{score.toLocaleString()}</span>
            </div>
          )}

          {/* Expand button */}
          <button
            onClick={() => setExpanded(v => !v)}
            className="w-full flex items-center justify-center gap-1 text-xs text-white/25 hover:text-white/50 transition-colors mt-auto pt-1 border-t border-white/6"
          >
            {expanded ? "Less" : "More"}
            <ChevronRight className={`w-3 h-3 transition-transform duration-200 ${expanded ? "rotate-90" : ""}`} />
          </button>

          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="pt-2 space-y-2 border-t border-white/6">
                  <p className="text-white/35 text-xs italic leading-relaxed">{user.bio}</p>
                  <div className="grid grid-cols-2 gap-1.5 text-xs">
                    {[
                      { label: "Universe ID", value: user.universeId },
                      { label: "Followers", value: user.followersCount.toLocaleString() },
                      { label: "Worlds Built", value: user.worldsBuilt },
                      { label: "Achievements", value: user.achievementsUnlocked },
                      { label: "Last Seen", value: timeAgo(user.lastSeen) },
                      { label: "Win Rate", value: user.winRate ? `${user.winRate}%` : "—" },
                    ].map(d => (
                      <div key={d.label} className="space-y-0.5">
                        <p className="text-white/20">{d.label}</p>
                        <p className="text-white/55 font-medium truncate font-mono text-[10px]">{d.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Rank accent bar */}
        {user.reputationRank === "Cosmic" && (
          <div className="h-0.5 bg-gradient-to-r from-fuchsia-500 via-violet-500 to-cyan-500" />
        )}
        {user.reputationRank === "Legend" && (
          <div className={`h-0.5 bg-gradient-to-r ${user.avatarColor} opacity-70`} />
        )}
      </GlassCard>
    </motion.div>
  );
}

// ─── LEADERBOARD ROW (compact list) ──────────────────────────────────────────
function LeaderboardRow({ user, rank, score, scoreKey }: {
  user: DirectoryUser;
  rank: number;
  score: number;
  scoreKey: string;
}) {
  const rankColors = REPUTATION_RANK_COLORS[user.reputationRank];
  const isTop3 = rank <= 3;

  return (
    <motion.div
      variants={itemAnim}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all hover:bg-white/5 ${
        rank === 1
          ? "bg-amber-500/5 border-amber-500/15"
          : rank === 2
          ? "bg-white/4 border-white/10"
          : rank === 3
          ? "bg-white/3 border-white/8"
          : "bg-white/2 border-white/6"
      }`}
    >
      {/* Rank */}
      <div className="w-7 flex items-center justify-center shrink-0">
        <RankMedal rank={rank} />
      </div>

      {/* Avatar */}
      <div className="relative shrink-0">
        <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${user.avatarColor} flex items-center justify-center text-white font-bold text-sm shadow-md`}>
          {user.avatar}
        </div>
        {user.isOnline && (
          <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border border-[#050c1a]" />
        )}
      </div>

      {/* Name */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className={`text-sm font-semibold truncate ${isTop3 ? "text-white" : "text-white/75"}`}>
            {user.displayName}
          </p>
          {user.verifiedAt && <BadgeCheck className="w-3 h-3 text-cyan-400 shrink-0" />}
        </div>
        <p className="text-white/25 text-[10px]">Lv {user.level} · {user.reputationRank}</p>
      </div>

      {/* Score */}
      <div className="text-right shrink-0">
        <p className={`text-sm font-bold tabular-nums ${isTop3 ? rankColors.color : "text-white/50"}`}>
          {score.toLocaleString()}
        </p>
        <p className="text-white/20 text-[10px]">{scoreKey}</p>
      </div>
    </motion.div>
  );
}

// ─── LEADERBOARD PANEL ────────────────────────────────────────────────────────
const LEADERBOARD_TABS = [
  { id: "creators",  label: "Creators",  icon: "🌍", key: "creatorScore",  display: "pts" },
  { id: "traders",   label: "Traders",   icon: "💱", key: "traderScore",   display: "vol" },
  { id: "breeders",  label: "Breeders",  icon: "🐾", key: "breederScore",  display: "pts" },
  { id: "football",  label: "Managers",  icon: "⚽", key: "footballScore", display: "pts" },
] as const;

type LeaderboardTab = typeof LEADERBOARD_TABS[number]["id"];

function LeaderboardPanel({ topCreators, topTraders, topBreeders, topFootball }: {
  topCreators: DirectoryUser[];
  topTraders: DirectoryUser[];
  topBreeders: DirectoryUser[];
  topFootball: DirectoryUser[];
}) {
  const [tab, setTab] = useState<LeaderboardTab>("creators");

  const tabData = {
    creators: { users: topCreators,  scoreKey: "creatorScore",  display: "pts" },
    traders:  { users: topTraders,   scoreKey: "traderScore",   display: "vol" },
    breeders: { users: topBreeders,  scoreKey: "breederScore",  display: "pts" },
    football: { users: topFootball,  scoreKey: "footballScore", display: "pts" },
  };
  const { users, scoreKey, display } = tabData[tab];

  return (
    <GlassCard className="border-white/8 h-full">
      <div className="p-4 h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-2 mb-4">
          <Trophy className="w-4 h-4 text-amber-400" />
          <h3 className="text-white font-bold text-sm">Leaderboard</h3>
        </div>

        {/* Tabs */}
        <div className="grid grid-cols-4 gap-1 p-1 rounded-xl bg-white/4 border border-white/8 mb-4">
          {LEADERBOARD_TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex flex-col items-center gap-0.5 py-1.5 rounded-lg text-[10px] font-semibold transition-all ${
                tab === t.id
                  ? "bg-violet-600/30 text-violet-200 border border-violet-500/35"
                  : "text-white/30 hover:text-white/60"
              }`}
            >
              <span className="text-sm">{t.icon}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </div>

        {/* Top 3 spotlight */}
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex-1 space-y-2 overflow-y-auto"
          >
            {/* Gold top-3 podium */}
            <div className="flex items-end gap-1.5 mb-3 px-1">
              {/* 2nd */}
              {users[1] && (
                <div className="flex-1 flex flex-col items-center gap-1">
                  <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${users[1].avatarColor} flex items-center justify-center text-white font-bold text-base shadow-lg`}>
                    {users[1].avatar}
                  </div>
                  <div className="w-full h-10 rounded-t-lg bg-white/8 border border-white/10 flex items-center justify-center">
                    <span className="text-base">🥈</span>
                  </div>
                </div>
              )}
              {/* 1st */}
              {users[0] && (
                <div className="flex-1 flex flex-col items-center gap-1">
                  <div className="relative">
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${users[0].avatarColor} flex items-center justify-center text-white font-bold text-lg shadow-[0_0_20px_rgba(255,215,0,0.3)]`}>
                      {users[0].avatar}
                    </div>
                    <Crown className="absolute -top-3 left-1/2 -translate-x-1/2 w-4 h-4 text-amber-400" />
                  </div>
                  <div className="w-full h-14 rounded-t-lg bg-amber-500/15 border border-amber-500/25 flex items-center justify-center">
                    <span className="text-lg">🥇</span>
                  </div>
                </div>
              )}
              {/* 3rd */}
              {users[2] && (
                <div className="flex-1 flex flex-col items-center gap-1">
                  <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${users[2].avatarColor} flex items-center justify-center text-white font-bold text-base shadow-lg`}>
                    {users[2].avatar}
                  </div>
                  <div className="w-full h-8 rounded-t-lg bg-white/5 border border-white/8 flex items-center justify-center">
                    <span className="text-sm">🥉</span>
                  </div>
                </div>
              )}
            </div>

            <motion.div variants={containerAnim} initial="hidden" animate="show" className="space-y-1.5">
              {users.map((user, i) => (
                <LeaderboardRow
                  key={user.id}
                  user={user}
                  rank={i + 1}
                  score={(user as any)[scoreKey]}
                  scoreKey={display}
                />
              ))}
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>
    </GlassCard>
  );
}

// ─── FILTER TABS ──────────────────────────────────────────────────────────────
const FILTER_TABS: { key: DirectoryFilter; icon: string }[] = [
  { key: "all",                  icon: "🌐" },
  { key: "top_creators",         icon: "🌍" },
  { key: "top_traders",          icon: "💱" },
  { key: "top_breeders",         icon: "🐾" },
  { key: "top_football_managers",icon: "⚽" },
];

// ─── SCORE MAP for filter → user score ───────────────────────────────────────
const FILTER_SCORE: Record<DirectoryFilter, { key: keyof DirectoryUser; label: string } | null> = {
  all: null,
  top_creators:          { key: "creatorScore",  label: "Creator pts" },
  top_traders:           { key: "traderScore",   label: "Trade vol" },
  top_breeders:          { key: "breederScore",  label: "Breed pts" },
  top_football_managers: { key: "footballScore", label: "Manager pts" },
};

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
type ViewMode = "grid" | "list";

export default function DirectoryPage() {
  const {
    search, setSearch, clearSearch,
    filter, setFilter,
    sort, setSort,
    filtered,
    topCreators, topTraders, topBreeders, topFootball,
    totalCount, onlineCount,
  } = useDirectory();

  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [searchFocused, setSearchFocused] = useState(false);

  const scoreMeta = FILTER_SCORE[filter];

  return (
    <AppShell title="Universe Directory" subtitle="Discover citizens, explore rankings and find the legends of the Universe">
      <div className="p-4 sm:p-6 max-w-7xl space-y-5">
        <motion.div variants={containerAnim} initial="hidden" animate="show">

          {/* ── STATS BAR ─────────────────────────────────────────────── */}
          <motion.div variants={itemAnim}>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Total Citizens",   value: totalCount,  Icon: Users,     color: "text-violet-400", bg: "bg-violet-500/10 border-violet-500/20" },
                { label: "Online Now",       value: onlineCount, Icon: Globe,     color: "text-emerald-400",bg: "bg-emerald-500/10 border-emerald-500/20" },
                { label: "Cosmic Legends",   value: filtered.filter(u => u.reputationRank === "Cosmic").length || 1,  Icon: Crown,     color: "text-fuchsia-400",bg: "bg-fuchsia-500/10 border-fuchsia-500/20" },
                { label: "Results Showing",  value: filtered.length, Icon: BarChart3, color: "text-cyan-400",  bg: "bg-cyan-500/10 border-cyan-500/20" },
              ].map(s => (
                <div key={s.label} className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${s.bg}`}>
                  <s.Icon className={`w-5 h-5 shrink-0 ${s.color}`} />
                  <div>
                    <p className="text-white font-bold text-xl leading-none tabular-nums">{s.value}</p>
                    <p className="text-white/35 text-xs mt-0.5">{s.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* ── SEARCH + CONTROLS ──────────────────────────────────────── */}
          <motion.div variants={itemAnim} className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className={`flex items-center gap-2 flex-1 px-3 py-2.5 rounded-xl border transition-all ${searchFocused ? "bg-white/8 border-violet-500/30" : "bg-white/4 border-white/10"}`}>
              <Search className="w-4 h-4 text-white/25 shrink-0" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                placeholder="Search by name, username, Universe ID…"
                className="flex-1 bg-transparent text-white text-sm placeholder:text-white/20 outline-none"
              />
              {search && (
                <button onClick={clearSearch} className="text-white/25 hover:text-white/60 transition-colors">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Sort */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-white/5 border border-white/8 shrink-0">
              {([
                { key: "reputation", Icon: Star,       label: "Rep" },
                { key: "level",      Icon: TrendingUp, label: "Level" },
                { key: "recent",     Icon: Clock,      label: "Recent" },
              ] as const).map(({ key, Icon, label }) => (
                <button
                  key={key}
                  onClick={() => setSort(key)}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    sort === key
                      ? "bg-violet-600/30 text-violet-200 border border-violet-500/35"
                      : "text-white/35 hover:text-white/60"
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  {label}
                </button>
              ))}
            </div>

            {/* View toggle */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-white/5 border border-white/8 shrink-0">
              {([
                { key: "grid", Icon: LayoutGrid },
                { key: "list", Icon: List },
              ] as const).map(({ key, Icon }) => (
                <button
                  key={key}
                  onClick={() => setViewMode(key)}
                  className={`p-1.5 rounded-lg transition-all ${
                    viewMode === key
                      ? "bg-violet-600/30 text-violet-300 border border-violet-500/35"
                      : "text-white/30 hover:text-white/60"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </button>
              ))}
            </div>
          </motion.div>

          {/* ── FILTER TABS ────────────────────────────────────────────── */}
          <motion.div variants={itemAnim}>
            <div className="flex gap-1 p-1 rounded-xl bg-white/4 border border-white/8 overflow-x-auto">
              {FILTER_TABS.map(({ key, icon }) => (
                <button
                  key={key}
                  onClick={() => setFilter(key)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                    filter === key
                      ? "bg-violet-600/30 text-violet-200 border border-violet-500/35 shadow-[0_0_10px_rgba(124,58,237,0.2)]"
                      : "text-white/40 hover:text-white/70"
                  }`}
                >
                  <span>{icon}</span>
                  {FILTER_LABELS[key]}
                </button>
              ))}
            </div>
          </motion.div>

          {/* ── MAIN CONTENT: Users + Leaderboard ─────────────────────── */}
          <motion.div variants={itemAnim} className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-5">

            {/* Left: User grid / list */}
            <div>
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
                  <Search className="w-10 h-10 text-white/15" />
                  <p className="text-white/40 text-sm font-medium">No users found</p>
                  <p className="text-white/20 text-xs">Try a different search term or filter</p>
                  <button onClick={() => { clearSearch(); setFilter("all"); }} className="text-xs px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white/40 hover:text-white/70 hover:bg-white/10 transition-all mt-2">
                    Clear filters
                  </button>
                </div>
              ) : viewMode === "grid" ? (
                <motion.div
                  variants={containerAnim}
                  initial="hidden"
                  animate="show"
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
                >
                  {filtered.map((user, i) => (
                    <motion.div key={user.id} variants={itemAnim}>
                      <UserCard
                        user={user}
                        rank={filter !== "all" ? i + 1 : undefined}
                        scoreLabel={scoreMeta?.label}
                        score={scoreMeta ? (user as any)[scoreMeta.key] : undefined}
                      />
                    </motion.div>
                  ))}
                </motion.div>
              ) : (
                /* List view */
                <motion.div variants={containerAnim} initial="hidden" animate="show" className="space-y-2">
                  {filtered.map((user, i) => {
                    const rankColors = REPUTATION_RANK_COLORS[user.reputationRank];
                    return (
                      <motion.div key={user.id} variants={itemAnim}>
                        <div className={`flex items-center gap-3 px-4 py-3.5 rounded-xl border transition-all hover:bg-white/5 ${
                          user.reputationRank === "Cosmic" ? "border-fuchsia-500/20 bg-fuchsia-500/3" :
                          user.reputationRank === "Legend" ? "border-amber-500/15 bg-amber-500/2" :
                          "border-white/8 bg-white/2"
                        }`}>
                          {filter !== "all" && (
                            <div className="w-7 flex items-center justify-center shrink-0">
                              <RankMedal rank={i + 1} />
                            </div>
                          )}
                          <div className="relative shrink-0">
                            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${user.avatarColor} flex items-center justify-center text-white font-bold text-sm shadow-md`}>
                              {user.avatar}
                            </div>
                            {user.isOnline && (
                              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border border-[#050c1a]" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="text-white font-semibold text-sm truncate">{user.displayName}</p>
                              {user.verifiedAt && <BadgeCheck className="w-3 h-3 text-cyan-400 shrink-0" />}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                              <p className="text-white/30 text-xs">@{user.username}</p>
                              <span className="text-white/10">·</span>
                              <p className="text-white/25 text-xs italic truncate">{user.title}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {user.badges.slice(0, 3).map((b, idx) => <span key={idx} className="text-sm">{b}</span>)}
                          </div>
                          <div className="text-right shrink-0 hidden sm:block">
                            <p className={`text-sm font-bold tabular-nums ${rankColors.color}`}>{user.reputation}</p>
                            <p className="text-white/20 text-[10px]">rep</p>
                          </div>
                          <div className={`px-2 py-0.5 rounded-md border text-[10px] font-bold shrink-0 ${rankColors.bg} ${rankColors.color}`}>
                            Lv {user.level}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </motion.div>
              )}
            </div>

            {/* Right: Leaderboard */}
            <div className="hidden xl:block">
              <div className="sticky top-6">
                <LeaderboardPanel
                  topCreators={topCreators}
                  topTraders={topTraders}
                  topBreeders={topBreeders}
                  topFootball={topFootball}
                />
              </div>
            </div>
          </motion.div>

          {/* ── MOBILE LEADERBOARD (below grid on small screens) ──────── */}
          <motion.div variants={itemAnim} className="xl:hidden">
            <LeaderboardPanel
              topCreators={topCreators}
              topTraders={topTraders}
              topBreeders={topBreeders}
              topFootball={topFootball}
            />
          </motion.div>

        </motion.div>
      </div>
    </AppShell>
  );
}
