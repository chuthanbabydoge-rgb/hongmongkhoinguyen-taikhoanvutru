import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AppShell } from "@/components/layout/AppShell";
import { GlassCard } from "@/components/glass/GlassCard";
import { useEcosystem } from "@/hooks/useEcosystem";
import { useToast } from "@/hooks/use-toast";
import { EcosystemModule, ModuleId } from "@/lib/types/ecosystem";
import {
  Wifi, WifiOff, AlertTriangle, Clock, CheckCircle2, XCircle,
  Loader2, ChevronDown, ChevronUp, ExternalLink, RefreshCw,
  Lock, Unlock, Activity, Zap, BarChart3, Code2, ShieldCheck,
  Globe, Timer, TrendingUp, TrendingDown, Minus,
} from "lucide-react";

// ─── Animations ───────────────────────────────────────────────────────────────
const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.3 } } };

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS_META = {
  connected: {
    label: "Connected",
    dot: "bg-emerald-400",
    text: "text-emerald-400",
    bg: "bg-emerald-500/10 border-emerald-500/20",
    ping: true,
    Icon: Wifi,
  },
  disconnected: {
    label: "Disconnected",
    dot: "bg-white/20",
    text: "text-white/30",
    bg: "bg-white/5 border-white/10",
    ping: false,
    Icon: WifiOff,
  },
  pending: {
    label: "Pending",
    dot: "bg-amber-400",
    text: "text-amber-400",
    bg: "bg-amber-500/10 border-amber-500/20",
    ping: true,
    Icon: Clock,
  },
  degraded: {
    label: "Degraded",
    dot: "bg-orange-400",
    text: "text-orange-400",
    bg: "bg-orange-500/10 border-orange-500/20",
    ping: false,
    Icon: AlertTriangle,
  },
  maintenance: {
    label: "Maintenance",
    dot: "bg-blue-400",
    text: "text-blue-400",
    bg: "bg-blue-500/10 border-blue-500/20",
    ping: false,
    Icon: RefreshCw,
  },
};

const METHOD_COLOR: Record<string, string> = {
  GET: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  POST: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  PUT: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  PATCH: "text-violet-400 bg-violet-500/10 border-violet-500/20",
  DELETE: "text-red-400 bg-red-500/10 border-red-500/20",
};

const API_STATUS_META = {
  stable: { label: "Stable", color: "text-emerald-400", bg: "bg-emerald-500/8 border-emerald-500/15" },
  beta: { label: "Beta", color: "text-amber-400", bg: "bg-amber-500/8 border-amber-500/15" },
  planned: { label: "Planned", color: "text-white/30", bg: "bg-white/3 border-white/8" },
};

// ─── Time helpers ─────────────────────────────────────────────────────────────
function timeAgo(iso: string | null): string {
  if (!iso) return "Never";
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// ─── Trend icon ───────────────────────────────────────────────────────────────
function TrendIcon({ trend }: { trend?: "up" | "down" | "neutral" }) {
  if (trend === "up") return <TrendingUp className="w-3 h-3 text-emerald-400" />;
  if (trend === "down") return <TrendingDown className="w-3 h-3 text-red-400" />;
  return <Minus className="w-3 h-3 text-white/25" />;
}

// ─── Stat tile ────────────────────────────────────────────────────────────────
function StatTile({ stat, module: mod }: { stat: EcosystemModule["stats"][0]; module: EcosystemModule }) {
  return (
    <div className="flex flex-col gap-1 p-3 rounded-xl bg-white/3 border border-white/8 hover:bg-white/5 transition-colors">
      <span className="text-white/35 text-xs">{stat.label}</span>
      <div className="flex items-end gap-1">
        <span className={`text-xl font-bold tabular-nums ${mod.textColor}`}>{stat.value}</span>
        {stat.unit && <span className="text-white/30 text-xs mb-0.5">{stat.unit}</span>}
      </div>
      {stat.trendValue && (
        <div className="flex items-center gap-1">
          <TrendIcon trend={stat.trend} />
          <span className={`text-xs ${stat.trend === "up" ? "text-emerald-400/70" : stat.trend === "down" ? "text-red-400/70" : "text-white/25"}`}>
            {stat.trendValue}
          </span>
        </div>
      )}
    </div>
  );
}

// ─── Module card ──────────────────────────────────────────────────────────────
interface ModuleCardProps {
  module: EcosystemModule;
  expanded: boolean;
  activeTab: "stats" | "permissions" | "api";
  onExpand: () => void;
  onTabChange: (tab: "stats" | "permissions" | "api") => void;
  onConnect: (id: ModuleId) => void;
  onDisconnect: (id: ModuleId) => void;
  onTogglePerm: (id: ModuleId, scope: string) => void;
  loadingId: string | null;
}

function ModuleCard({
  module: mod,
  expanded,
  activeTab,
  onExpand,
  onTabChange,
  onConnect,
  onDisconnect,
  onTogglePerm,
  loadingId,
}: ModuleCardProps) {
  const status = STATUS_META[mod.status];
  const isConnected = mod.status === "connected" || mod.status === "degraded";
  const isConnecting = loadingId === `connect:${mod.id}`;
  const isDisconnecting = loadingId === `disconnect:${mod.id}`;
  const isActionLoading = isConnecting || isDisconnecting;

  return (
    <motion.div layout className="flex flex-col">
      <GlassCard
        className={`overflow-hidden flex flex-col transition-all duration-300 ${
          mod.status === "connected"
            ? `${mod.borderColor} ${mod.glowColor}`
            : mod.status === "degraded"
            ? "border-orange-500/20 shadow-[0_0_20px_rgba(249,115,22,0.1)]"
            : ""
        }`}
        glow="none"
      >
        <div className="p-5 flex flex-col flex-1">

          {/* ── Header ─────────────────────────────────────────────── */}
          <div className="flex items-start gap-3 mb-4">
            <div className={`relative w-13 h-13 w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0 border ${mod.bgColor} ${mod.borderColor}`}>
              {mod.icon}
              {status.ping && (
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-60 ${status.dot}`} />
                  <span className={`relative inline-flex rounded-full h-3 w-3 ${status.dot}`} />
                </span>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-white font-bold text-sm">{mod.name}</h3>
                <span className="text-white/25 text-xs font-mono">{mod.version}</span>
              </div>
              <p className={`text-xs font-medium mt-0.5 ${mod.textColor}`}>{mod.tagline}</p>
            </div>

            {/* Status badge */}
            <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border text-xs font-medium shrink-0 ${status.bg} ${status.text}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
              {status.label}
            </div>
          </div>

          {/* ── Description ────────────────────────────────────────── */}
          <p className="text-white/40 text-xs leading-relaxed mb-4 line-clamp-2">{mod.description}</p>

          {/* ── Quick info row ─────────────────────────────────────── */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            {[
              {
                label: "Last Access",
                value: timeAgo(mod.lastAccessed),
                Icon: Clock,
              },
              {
                label: "Connected",
                value: mod.connectedAt ? formatDate(mod.connectedAt) : "—",
                Icon: Globe,
              },
              {
                label: "Uptime",
                value: mod.status === "connected" || mod.status === "degraded" ? `${mod.uptime}%` : "—",
                Icon: Activity,
              },
            ].map(row => (
              <div key={row.label} className="flex flex-col items-center gap-0.5 p-2 rounded-xl bg-white/3 border border-white/6 text-center">
                <row.Icon className="w-3.5 h-3.5 text-white/25 mb-0.5" />
                <span className={`text-xs font-semibold ${mod.status !== "disconnected" && mod.status !== "pending" ? "text-white/70" : "text-white/25"}`}>
                  {row.value}
                </span>
                <span className="text-white/25 text-[10px]">{row.label}</span>
              </div>
            ))}
          </div>

          {/* ── Latency bar (connected/degraded only) ──────────────── */}
          {(mod.status === "connected" || mod.status === "degraded") && (
            <div className="flex items-center gap-2 mb-4 px-3 py-2 rounded-xl bg-white/3 border border-white/8">
              <Zap className={`w-3.5 h-3.5 shrink-0 ${mod.latencyMs < 100 ? "text-emerald-400" : mod.latencyMs < 200 ? "text-amber-400" : "text-red-400"}`} />
              <span className="text-white/35 text-xs">Latency</span>
              <div className="flex-1 h-1 bg-white/8 rounded-full overflow-hidden">
                <motion.div
                  className={`h-full rounded-full ${mod.latencyMs < 100 ? "bg-emerald-500" : mod.latencyMs < 200 ? "bg-amber-500" : "bg-red-500"}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min((mod.latencyMs / 300) * 100, 100)}%` }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                />
              </div>
              <span className={`text-xs font-mono tabular-nums shrink-0 ${mod.latencyMs < 100 ? "text-emerald-400" : mod.latencyMs < 200 ? "text-amber-400" : "text-red-400"}`}>
                {mod.latencyMs}ms
              </span>
            </div>
          )}

          {/* ── Permissions granted count ──────────────────────────── */}
          <div className="flex items-center gap-2 mb-4">
            <div className="flex items-center gap-1.5">
              {mod.permissions.map(p => (
                <div
                  key={p.scope}
                  className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all ${
                    p.granted
                      ? `${mod.bgColor} ${mod.borderColor}`
                      : "bg-white/3 border-white/8"
                  }`}
                  title={p.label}
                >
                  {p.granted
                    ? <CheckCircle2 className={`w-3 h-3 ${mod.textColor}`} />
                    : <XCircle className="w-3 h-3 text-white/15" />
                  }
                </div>
              ))}
            </div>
            <span className="text-white/30 text-xs ml-1">
              {mod.permissions.filter(p => p.granted).length}/{mod.permissions.length} permissions
            </span>
          </div>

          {/* ── Actions ────────────────────────────────────────────── */}
          <div className="flex gap-2 pt-3 border-t border-white/8">
            {isConnected ? (
              <button
                onClick={() => onDisconnect(mod.id)}
                disabled={isActionLoading}
                className="flex-1 flex items-center justify-center gap-1.5 text-xs py-2 px-3 rounded-lg border font-medium transition-all disabled:opacity-50 bg-red-500/8 hover:bg-red-500/15 text-red-400/70 hover:text-red-300 border-red-500/15 hover:border-red-500/25"
              >
                {isDisconnecting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <WifiOff className="w-3.5 h-3.5" />}
                Disconnect
              </button>
            ) : (
              <button
                onClick={() => onConnect(mod.id)}
                disabled={isActionLoading}
                className={`flex-1 flex items-center justify-center gap-1.5 text-xs py-2 px-3 rounded-lg border font-medium transition-all disabled:opacity-50 ${mod.bgColor} hover:opacity-80 ${mod.textColor} ${mod.borderColor}`}
              >
                {isConnecting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wifi className="w-3.5 h-3.5" />}
                Connect
              </button>
            )}
            <button
              onClick={onExpand}
              className="flex items-center justify-center gap-1 text-xs py-2 px-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/40 hover:text-white/70 transition-all"
            >
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* ── Expanded panel ──────────────────────────────────────────── */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden border-t border-white/8"
            >
              <div className="p-5">
                {/* Tab bar */}
                <div className="flex gap-1 p-1 rounded-xl bg-white/4 border border-white/8 mb-4">
                  {([
                    { key: "stats", label: "Statistics", Icon: BarChart3 },
                    { key: "permissions", label: "Permissions", Icon: ShieldCheck },
                    { key: "api", label: "API Endpoints", Icon: Code2 },
                  ] as const).map(({ key, label, Icon }) => (
                    <button
                      key={key}
                      onClick={() => onTabChange(key)}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        activeTab === key
                          ? `${mod.bgColor} ${mod.textColor} border ${mod.borderColor}`
                          : "text-white/35 hover:text-white/60"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">{label}</span>
                    </button>
                  ))}
                </div>

                {/* ── Stats tab ──────────────────────────────────────── */}
                {activeTab === "stats" && (
                  <div className="grid grid-cols-2 gap-2">
                    {mod.stats.map(stat => (
                      <StatTile key={stat.label} stat={stat} module={mod} />
                    ))}
                  </div>
                )}

                {/* ── Permissions tab ────────────────────────────────── */}
                {activeTab === "permissions" && (
                  <div className="space-y-2">
                    {mod.permissions.map(perm => {
                      const isLoading = loadingId === `perm:${mod.id}:${perm.scope}`;
                      return (
                        <div
                          key={perm.scope}
                          className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                            perm.granted ? `${mod.bgColor} ${mod.borderColor}` : "bg-white/2 border-white/8"
                          }`}
                        >
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center border shrink-0 ${
                            perm.granted ? `${mod.bgColor} ${mod.borderColor}` : "bg-white/5 border-white/10"
                          }`}>
                            {perm.granted
                              ? <Unlock className={`w-3.5 h-3.5 ${mod.textColor}`} />
                              : <Lock className="w-3.5 h-3.5 text-white/25" />
                            }
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium ${perm.granted ? mod.textColor : "text-white/45"}`}>
                              {perm.label}
                            </p>
                            <p className="text-white/25 text-xs font-mono">{perm.scope}</p>
                          </div>
                          <button
                            onClick={() => onTogglePerm(mod.id, perm.scope)}
                            disabled={!!loadingId}
                            className={`relative shrink-0 w-10 h-5 rounded-full border transition-all duration-300 disabled:opacity-60 ${
                              perm.granted
                                ? `bg-gradient-to-r ${mod.gradientFrom} ${mod.gradientTo} border-transparent`
                                : "bg-white/8 border-white/15"
                            }`}
                          >
                            {isLoading ? (
                              <Loader2 className="w-3 h-3 animate-spin text-white/60 absolute inset-0 m-auto" />
                            ) : (
                              <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-all duration-300 ${
                                perm.granted ? "left-[calc(100%-18px)]" : "left-0.5"
                              }`} />
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* ── API endpoints tab ──────────────────────────────── */}
                {activeTab === "api" && (
                  <div className="space-y-2">
                    {mod.apiEndpoints.map((ep, i) => {
                      const apiMeta = API_STATUS_META[ep.status];
                      const methodColor = METHOD_COLOR[ep.method] ?? METHOD_COLOR.GET;
                      return (
                        <div key={i} className="flex items-center gap-2.5 p-3 rounded-xl bg-white/2 border border-white/8 hover:bg-white/4 transition-colors group">
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md border shrink-0 font-mono ${methodColor}`}>
                            {ep.method}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-white/60 text-xs font-mono truncate group-hover:text-white/80 transition-colors">
                              {ep.path}
                            </p>
                            <p className="text-white/25 text-xs mt-0.5 truncate">{ep.description}</p>
                          </div>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-md border font-medium shrink-0 ${apiMeta.color} ${apiMeta.bg}`}>
                            {apiMeta.label}
                          </span>
                        </div>
                      );
                    })}
                    <div className="mt-3 p-2.5 rounded-xl bg-white/3 border border-white/8 flex items-center gap-2">
                      <Code2 className="w-3.5 h-3.5 text-white/25 shrink-0" />
                      <p className="text-white/30 text-xs">
                        Full API docs available at{" "}
                        <span className={`font-mono ${mod.textColor}`}>universe.io/docs/{mod.id}</span>
                      </p>
                      <ExternalLink className="w-3 h-3 text-white/20 ml-auto shrink-0" />
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom accent bar */}
        {mod.status === "connected" && (
          <div className={`h-0.5 bg-gradient-to-r ${mod.gradientFrom} ${mod.gradientTo} opacity-60`} />
        )}
        {mod.status === "degraded" && (
          <div className="h-0.5 bg-gradient-to-r from-orange-500 to-amber-500 opacity-60" />
        )}
      </GlassCard>
    </motion.div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function EcosystemPage() {
  const { modules, loadingId, connect, disconnect, togglePermission } = useEcosystem();
  const { toast } = useToast();

  const [expandedId, setExpandedId] = useState<ModuleId | null>(null);
  const [activeTabs, setActiveTabs] = useState<Record<string, "stats" | "permissions" | "api">>({});

  const handleConnect = async (id: ModuleId) => {
    const mod = modules.find(m => m.id === id);
    await connect(id);
    toast({ title: "Module connected", description: `${mod?.name} is now active in your ecosystem.` });
  };

  const handleDisconnect = async (id: ModuleId) => {
    const mod = modules.find(m => m.id === id);
    await disconnect(id);
    toast({ title: "Module disconnected", description: `${mod?.name} has been removed from your ecosystem.` });
  };

  const handleTogglePerm = async (id: ModuleId, scope: string) => {
    const mod = modules.find(m => m.id === id);
    const perm = mod?.permissions.find(p => p.scope === scope);
    await togglePermission(id, scope);
    const nowGranted = !perm?.granted;
    toast({
      title: nowGranted ? "Permission granted" : "Permission revoked",
      description: `${perm?.label} ${nowGranted ? "enabled" : "disabled"} for ${mod?.name}`,
    });
  };

  const handleExpand = (id: ModuleId) => {
    setExpandedId(prev => (prev === id ? null : id));
    if (!activeTabs[id]) {
      setActiveTabs(prev => ({ ...prev, [id]: "stats" }));
    }
  };

  // Summary stats
  const connectedCount = modules.filter(m => m.status === "connected").length;
  const degradedCount = modules.filter(m => m.status === "degraded").length;
  const pendingCount = modules.filter(m => m.status === "pending").length;
  const totalPermsGranted = modules.reduce((s, m) => s + m.permissions.filter(p => p.granted).length, 0);

  return (
    <AppShell title="Ecosystem" subtitle="Manage connected modules, permissions, and API integrations">
      <div className="p-4 sm:p-6 max-w-7xl space-y-5">
        <motion.div variants={container} initial="hidden" animate="show">

          {/* ── STATS BAR ─────────────────────────────────────────────── */}
          <motion.div variants={item}>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
              {[
                { label: "Connected", value: connectedCount, Icon: Wifi, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
                { label: "Degraded", value: degradedCount, Icon: AlertTriangle, color: "text-orange-400", bg: "bg-orange-500/10 border-orange-500/20" },
                { label: "Pending", value: pendingCount, Icon: Clock, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
                { label: "Permissions Active", value: totalPermsGranted, Icon: ShieldCheck, color: "text-violet-400", bg: "bg-violet-500/10 border-violet-500/20" },
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

          {/* ── DEGRADED BANNER ────────────────────────────────────────── */}
          {degradedCount > 0 && (
            <motion.div variants={item}>
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-orange-500/8 border border-orange-500/20 mb-5">
                <AlertTriangle className="w-4 h-4 text-orange-400 shrink-0" />
                <p className="text-orange-300/80 text-sm">
                  <span className="font-semibold">Exchange Hub</span> is experiencing degraded performance.
                  High latency detected — our team is investigating.
                </p>
                <button className="ml-auto text-xs text-orange-400/70 hover:text-orange-300 border border-orange-500/20 rounded-lg px-3 py-1 hover:bg-orange-500/10 transition-all shrink-0">
                  View Status
                </button>
              </div>
            </motion.div>
          )}

          {/* ── MODULE GRID ────────────────────────────────────────────── */}
          <motion.div
            variants={container}
            className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4"
          >
            {modules.map(mod => (
              <motion.div key={mod.id} variants={item}>
                <ModuleCard
                  module={mod}
                  expanded={expandedId === mod.id}
                  activeTab={activeTabs[mod.id] ?? "stats"}
                  onExpand={() => handleExpand(mod.id)}
                  onTabChange={tab => setActiveTabs(prev => ({ ...prev, [mod.id]: tab }))}
                  onConnect={handleConnect}
                  onDisconnect={handleDisconnect}
                  onTogglePerm={handleTogglePerm}
                  loadingId={loadingId}
                />
              </motion.div>
            ))}
          </motion.div>

          {/* ── FOOTER NOTE ─────────────────────────────────────────────── */}
          <motion.div variants={item}>
            <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-white/2 border border-white/6 mt-2">
              <div className="flex items-center gap-2">
                <Timer className="w-3.5 h-3.5 text-white/20" />
                <span className="text-white/25 text-xs">Ecosystem data refreshes every 60 seconds</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-white/25 text-xs">Live</span>
              </div>
            </div>
          </motion.div>

        </motion.div>
      </div>
    </AppShell>
  );
}
