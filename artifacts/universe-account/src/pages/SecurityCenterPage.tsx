import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/useAuth";
import { AppShell } from "@/components/layout/AppShell";
import { GlassCard } from "@/components/glass/GlassCard";
import { apiToggle2FA, apiChangePassword } from "@/lib/mock/mockApi";
import { useToast } from "@/hooks/use-toast";
import {
  Shield, Key, Smartphone, AlertTriangle, Check, Loader2,
  X, Eye, EyeOff, Fingerprint, Cpu, Globe, MapPin, Clock,
  RefreshCw, Copy, CheckCheck, ChevronRight, Bell, BellOff,
  Lock, Unlock, ZapOff, Activity, LifeBuoy, QrCode, ShieldCheck,
  ShieldAlert, ShieldOff, Ban, Zap, LogIn, LogOut,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface LoginEntry {
  id: string;
  device: string;
  browser: string;
  os: string;
  ip: string;
  location: string;
  time: string;
  status: "success" | "suspicious" | "blocked" | "failed";
}

interface SecurityAlert {
  id: string;
  severity: "critical" | "warning" | "info";
  title: string;
  detail: string;
  time: string;
  dismissed: boolean;
}

interface RecoveryCode {
  code: string;
  used: boolean;
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const INITIAL_LOGIN_HISTORY: LoginEntry[] = [
  { id: "lh1", device: "MacBook Pro", browser: "Chrome 124", os: "macOS 14", ip: "192.168.1.1", location: "San Francisco, CA", time: new Date().toISOString(), status: "success" },
  { id: "lh2", device: "iPhone 15 Pro", browser: "Safari 17", os: "iOS 17", ip: "10.0.0.12", location: "San Francisco, CA", time: new Date(Date.now() - 3600000 * 4).toISOString(), status: "success" },
  { id: "lh3", device: "Unknown Device", browser: "Chrome 122", os: "Windows 11", ip: "185.220.101.47", location: "Moscow, Russia", time: new Date(Date.now() - 3600000 * 12).toISOString(), status: "suspicious" },
  { id: "lh4", device: "Windows PC", browser: "Firefox 124", os: "Windows 10", ip: "172.16.0.5", location: "Austin, TX", time: new Date(Date.now() - 86400000).toISOString(), status: "success" },
  { id: "lh5", device: "Unknown Bot", browser: "Python Requests", os: "Linux", ip: "45.33.32.156", location: "Unknown", time: new Date(Date.now() - 86400000 * 2).toISOString(), status: "blocked" },
  { id: "lh6", device: "MacBook Air", browser: "Safari 17", os: "macOS 13", ip: "192.168.5.21", location: "New York, NY", time: new Date(Date.now() - 86400000 * 3).toISOString(), status: "success" },
  { id: "lh7", device: "Android Phone", browser: "Chrome Mobile", os: "Android 14", ip: "100.21.45.67", location: "London, UK", time: new Date(Date.now() - 86400000 * 5).toISOString(), status: "failed" },
];

const INITIAL_ALERTS: SecurityAlert[] = [
  { id: "a1", severity: "critical", title: "Suspicious login detected", detail: "Login attempt from Moscow, Russia (IP 185.220.101.47). This is unusual for your account.", time: new Date(Date.now() - 3600000 * 12).toISOString(), dismissed: false },
  { id: "a2", severity: "warning", title: "Password not changed in 90 days", detail: "For best security, update your password regularly.", time: new Date(Date.now() - 86400000 * 7).toISOString(), dismissed: false },
  { id: "a3", severity: "info", title: "New device logged in", detail: "A new device was added to your account. If this wasn't you, revoke it immediately.", time: new Date(Date.now() - 86400000).toISOString(), dismissed: false },
];

const INITIAL_RECOVERY_CODES: RecoveryCode[] = [
  { code: "UNIV-4K9P-2M7R", used: false },
  { code: "UNIV-8X3Q-5T1W", used: false },
  { code: "UNIV-6B2N-9H4E", used: false },
  { code: "UNIV-7Y5C-3A8D", used: true },
  { code: "UNIV-1F6L-0J2S", used: false },
  { code: "UNIV-3G8V-4P7K", used: false },
  { code: "UNIV-5R1M-2N6B", used: false },
  { code: "UNIV-9T4H-8W3Q", used: false },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgoShort(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

function getPasswordStrength(pw: string): { score: number; label: string; color: string } {
  let score = 0;
  if (pw.length >= 8) score += 25;
  if (pw.length >= 12) score += 10;
  if (/[A-Z]/.test(pw)) score += 20;
  if (/[0-9]/.test(pw)) score += 20;
  if (/[^A-Za-z0-9]/.test(pw)) score += 25;
  const clamped = Math.min(score, 100);
  if (clamped >= 80) return { score: clamped, label: "Strong", color: "bg-emerald-500" };
  if (clamped >= 55) return { score: clamped, label: "Fair", color: "bg-amber-500" };
  if (clamped > 0) return { score: clamped, label: "Weak", color: "bg-red-500" };
  return { score: 0, label: "", color: "bg-white/10" };
}

// ─── Zod schema ───────────────────────────────────────────────────────────────

const pwSchema = z.object({
  current: z.string().min(1, "Required"),
  newPw: z.string().min(8, "At least 8 characters"),
  confirm: z.string(),
}).refine(d => d.newPw === d.confirm, { message: "Passwords do not match", path: ["confirm"] });
type PwValues = z.infer<typeof pwSchema>;

// ─── Animations ───────────────────────────────────────────────────────────────

const container = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };
const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.35 } } };

// ─── Status config ────────────────────────────────────────────────────────────

const LOGIN_STATUS = {
  success: { label: "Success", dot: "bg-emerald-400", text: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
  suspicious: { label: "Suspicious", dot: "bg-amber-400", text: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
  blocked: { label: "Blocked", dot: "bg-red-400", text: "text-red-400", bg: "bg-red-500/10 border-red-500/20" },
  failed: { label: "Failed", dot: "bg-red-300", text: "text-red-300", bg: "bg-red-500/8 border-red-500/15" },
};

const ALERT_META = {
  critical: { icon: ShieldAlert, border: "border-red-500/30", bg: "bg-red-500/10", text: "text-red-300", dot: "bg-red-400" },
  warning: { icon: AlertTriangle, border: "border-amber-500/30", bg: "bg-amber-500/10", text: "text-amber-300", dot: "bg-amber-400" },
  info: { icon: Bell, border: "border-blue-500/30", bg: "bg-blue-500/10", text: "text-blue-300", dot: "bg-blue-400" },
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function SecurityCenterPage() {
  const { user, updateUser } = useAuth();
  const { toast } = useToast();

  const [alerts, setAlerts] = useState<SecurityAlert[]>(INITIAL_ALERTS);
  const [loginHistory] = useState<LoginEntry[]>(INITIAL_LOGIN_HISTORY);
  const [recoveryCodes, setRecoveryCodes] = useState<RecoveryCode[]>(INITIAL_RECOVERY_CODES);
  const [toggling2FA, setToggling2FA] = useState(false);
  const [changingPw, setChangingPw] = useState(false);
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [generatingCodes, setGeneratingCodes] = useState(false);
  const [codesVisible, setCodesVisible] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [twoFAMethod, setTwoFAMethod] = useState<"sms" | "app" | null>("sms");
  const [showHistory, setShowHistory] = useState(false);

  const pwForm = useForm<PwValues>({
    resolver: zodResolver(pwSchema),
    defaultValues: { current: "", newPw: "", confirm: "" },
  });

  const newPwValue = pwForm.watch("newPw") ?? "";
  const pwStrength = getPasswordStrength(newPwValue);

  if (!user) return null;

  const activeAlerts = alerts.filter(a => !a.dismissed);

  const scoreBreakdown = [
    { label: "Password Strength", score: 25, max: 25, active: true, icon: Key },
    { label: "Two-Factor Auth", score: user.twoFactorEnabled ? 25 : 0, max: 25, active: user.twoFactorEnabled, icon: Smartphone },
    { label: "Trusted Devices", score: 20, max: 20, active: true, icon: ShieldCheck },
    { label: "Login Hygiene", score: 15, max: 15, active: true, icon: Activity },
    { label: "Recovery Setup", score: recoveryCodes.filter(c => !c.used).length > 4 ? 15 : 8, max: 15, active: true, icon: LifeBuoy },
  ];

  const computedScore = scoreBreakdown.reduce((a, b) => a + b.score, 0);

  const toggle2FA = async () => {
    setToggling2FA(true);
    try {
      const updated = await apiToggle2FA(user.id, !user.twoFactorEnabled);
      updateUser(updated);
      toast({
        title: updated.twoFactorEnabled ? "2FA Enabled" : "2FA Disabled",
        description: updated.twoFactorEnabled
          ? "Two-factor authentication is now active. Your account is more secure."
          : "Two-factor authentication has been disabled.",
      });
    } catch (e: unknown) {
      toast({ title: "Error", description: e instanceof Error ? e.message : "Failed", variant: "destructive" });
    } finally {
      setToggling2FA(false);
    }
  };

  const changePassword = async (values: PwValues) => {
    setChangingPw(true);
    try {
      await apiChangePassword(user.id, values.current, values.newPw);
      pwForm.reset();
      toast({ title: "Password changed", description: "Your password has been updated successfully." });
    } catch (e: unknown) {
      toast({ title: "Error", description: e instanceof Error ? e.message : "Failed", variant: "destructive" });
    } finally {
      setChangingPw(false);
    }
  };

  const dismissAlert = (id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, dismissed: true } : a));
  };

  const generateNewCodes = async () => {
    setGeneratingCodes(true);
    await new Promise(r => setTimeout(r, 1200));
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    const rnd = (n: number) => Array.from({ length: n }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
    setRecoveryCodes(Array.from({ length: 8 }, () => ({ code: `UNIV-${rnd(4)}-${rnd(4)}`, used: false })));
    setCodesVisible(true);
    setGeneratingCodes(false);
    toast({ title: "New codes generated", description: "Save these codes in a secure location — they replace your old ones." });
  };

  const copyCode = async (code: string) => {
    await navigator.clipboard.writeText(code).catch(() => {});
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const copyAllCodes = async () => {
    const text = recoveryCodes.filter(c => !c.used).map(c => c.code).join("\n");
    await navigator.clipboard.writeText(text).catch(() => {});
    toast({ title: "Copied!", description: "All active recovery codes copied to clipboard." });
  };

  const scoreColor = computedScore >= 80 ? "#10b981" : computedScore >= 55 ? "#f59e0b" : "#ef4444";
  const scoreLabel = computedScore >= 80 ? "Excellent" : computedScore >= 55 ? "Good" : "Needs Attention";

  return (
    <AppShell title="Security Center" subtitle="Protect your identity and account access">
      <div className="p-4 sm:p-6 max-w-6xl space-y-4">
        <motion.div variants={container} initial="hidden" animate="show">

          {/* ── SECURITY ALERTS ──────────────────────────────────────────── */}
          <AnimatePresence>
            {activeAlerts.map(alert => {
              const meta = ALERT_META[alert.severity];
              const Icon = meta.icon;
              return (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, y: -10, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: "auto" }}
                  exit={{ opacity: 0, y: -10, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="mb-3"
                >
                  <div className={`flex items-start gap-3 p-4 rounded-xl border ${meta.border} ${meta.bg}`}>
                    <Icon className={`w-4 h-4 ${meta.text} shrink-0 mt-0.5`} />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold ${meta.text}`}>{alert.title}</p>
                      <p className="text-white/50 text-xs mt-0.5">{alert.detail}</p>
                      <p className="text-white/25 text-xs mt-1">{timeAgoShort(alert.time)}</p>
                    </div>
                    <button
                      onClick={() => dismissAlert(alert.id)}
                      className="shrink-0 text-white/30 hover:text-white/70 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {/* ── SECURITY DASHBOARD ───────────────────────────────────────── */}
          <motion.div variants={item}>
            <GlassCard className="p-6" glow="violet">
              <div className="flex flex-col lg:flex-row items-start gap-6">

                {/* Score ring */}
                <div className="flex flex-col items-center shrink-0">
                  <div className="relative w-32 h-32">
                    <svg className="w-32 h-32 -rotate-90" viewBox="0 0 128 128">
                      <circle cx="64" cy="64" r="54" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
                      <motion.circle
                        cx="64" cy="64" r="54" fill="none"
                        stroke={scoreColor} strokeWidth="8" strokeLinecap="round"
                        strokeDasharray={`${2 * Math.PI * 54}`}
                        initial={{ strokeDashoffset: 2 * Math.PI * 54 }}
                        animate={{ strokeDashoffset: 2 * Math.PI * 54 * (1 - computedScore / 100) }}
                        transition={{ duration: 1.6, ease: "easeOut", delay: 0.2 }}
                      />
                      <defs>
                        <filter id="glow">
                          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                          <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
                        </filter>
                      </defs>
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-4xl font-bold text-white tabular-nums">{computedScore}</span>
                      <span className="text-white/30 text-xs mt-0.5">/ 100</span>
                    </div>
                  </div>
                  <p className="text-sm font-semibold mt-2" style={{ color: scoreColor }}>{scoreLabel}</p>
                  <p className="text-white/30 text-xs">Security Score</p>
                </div>

                {/* Breakdown bars */}
                <div className="flex-1 w-full">
                  <h3 className="text-white font-semibold text-sm mb-4 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-violet-400" />
                    Score Breakdown
                  </h3>
                  <div className="space-y-3">
                    {scoreBreakdown.map(s => (
                      <div key={s.label}>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <div className="flex items-center gap-1.5">
                            <s.icon className={`w-3 h-3 ${s.active ? "text-violet-400" : "text-white/20"}`} />
                            <span className={s.active ? "text-white/70" : "text-white/30"}>{s.label}</span>
                          </div>
                          <span className={s.active ? "text-white/80 font-medium" : "text-white/25"}>
                            {s.score}/{s.max}
                          </span>
                        </div>
                        <div className="h-1.5 rounded-full bg-white/8 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(s.score / s.max) * 100}%` }}
                            transition={{ duration: 1, ease: "easeOut", delay: 0.4 }}
                            className={`h-full rounded-full ${
                              s.active
                                ? s.score === s.max
                                  ? "bg-gradient-to-r from-violet-500 to-emerald-400"
                                  : "bg-gradient-to-r from-violet-500 to-amber-400"
                                : "bg-white/15"
                            }`}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Quick stats */}
                <div className="flex lg:flex-col gap-3 w-full lg:w-auto lg:shrink-0">
                  {[
                    { label: "Threats Blocked", value: "12", icon: Ban, color: "text-red-400" },
                    { label: "Active Alerts", value: String(activeAlerts.length), icon: Bell, color: activeAlerts.length > 0 ? "text-amber-400" : "text-emerald-400" },
                    { label: "Recovery Codes", value: `${recoveryCodes.filter(c => !c.used).length}/8`, icon: LifeBuoy, color: "text-cyan-400" },
                  ].map(stat => (
                    <div key={stat.label} className="flex-1 lg:flex-none flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 border border-white/8">
                      <stat.icon className={`w-4 h-4 ${stat.color} shrink-0`} />
                      <div>
                        <p className="text-white font-bold text-lg leading-none tabular-nums">{stat.value}</p>
                        <p className="text-white/35 text-xs mt-0.5">{stat.label}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </GlassCard>
          </motion.div>

          {/* ── 2FA + CHANGE PASSWORD ─────────────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

            {/* Two-Factor Authentication */}
            <motion.div variants={item}>
              <GlassCard className="p-5" glow={user.twoFactorEnabled ? "emerald" : "none"}>
                {/* Header */}
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                    user.twoFactorEnabled
                      ? "bg-emerald-500/15 border-emerald-500/30"
                      : "bg-white/5 border-white/10"
                  }`}>
                    <Smartphone className={`w-5 h-5 ${user.twoFactorEnabled ? "text-emerald-400" : "text-white/40"}`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-white font-semibold text-sm">Two-Factor Authentication</h3>
                    <p className="text-white/40 text-xs">Add an extra security layer</p>
                  </div>
                  <button
                    onClick={toggle2FA}
                    disabled={toggling2FA}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none disabled:opacity-50 ${
                      user.twoFactorEnabled ? "bg-emerald-500" : "bg-white/15"
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                      user.twoFactorEnabled ? "translate-x-6" : "translate-x-1"
                    }`} />
                  </button>
                </div>

                {/* Status banner */}
                <div className={`text-xs px-3 py-2 rounded-lg mb-4 ${
                  user.twoFactorEnabled
                    ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
                    : "bg-amber-500/10 text-amber-300 border border-amber-500/20"
                }`}>
                  {user.twoFactorEnabled
                    ? "✓ 2FA is active — your account has an extra layer of protection"
                    : "⚠ Enable 2FA to gain +20 security points and protect your account"}
                </div>

                {/* Method selector */}
                <p className="text-white/40 text-xs uppercase tracking-wider mb-2">Authentication Method</p>
                <div className="space-y-2">
                  {[
                    { id: "sms", label: "SMS / Text Message", desc: "Code sent to your phone", icon: Smartphone, available: true },
                    { id: "app", label: "Authenticator App", desc: "Google Auth, Authy, 1Password", icon: QrCode, available: false, tag: "Coming Soon" },
                  ].map(method => (
                    <button
                      key={method.id}
                      onClick={() => method.available && setTwoFAMethod(method.id as "sms" | "app")}
                      disabled={!method.available}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left transition-all ${
                        twoFAMethod === method.id
                          ? "bg-violet-500/15 border-violet-500/40"
                          : method.available
                          ? "bg-white/5 border-white/8 hover:border-white/20"
                          : "bg-white/3 border-white/5 opacity-50 cursor-not-allowed"
                      }`}
                    >
                      <method.icon className={`w-4 h-4 shrink-0 ${twoFAMethod === method.id ? "text-violet-400" : "text-white/40"}`} />
                      <div className="flex-1">
                        <p className="text-white text-xs font-medium">{method.label}</p>
                        <p className="text-white/35 text-xs">{method.desc}</p>
                      </div>
                      {method.tag && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-white/8 text-white/40 border border-white/10">{method.tag}</span>
                      )}
                      {twoFAMethod === method.id && <Check className="w-3.5 h-3.5 text-violet-400 shrink-0" />}
                    </button>
                  ))}
                </div>

                {/* Future methods */}
                <div className="mt-3 pt-3 border-t border-white/8">
                  <p className="text-white/25 text-xs uppercase tracking-wider mb-2">Future Support</p>
                  <div className="flex gap-2">
                    {[
                      { label: "Biometric", icon: Fingerprint },
                      { label: "Passkeys", icon: Key },
                      { label: "Hardware Key", icon: Cpu },
                    ].map(f => (
                      <div key={f.label} className="flex-1 flex flex-col items-center gap-1 p-2 rounded-lg bg-white/3 border border-white/5">
                        <f.icon className="w-4 h-4 text-white/20" />
                        <span className="text-white/25 text-xs">{f.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </GlassCard>
            </motion.div>

            {/* Change Password */}
            <motion.div variants={item}>
              <GlassCard className="p-5" glow="none">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-violet-500/15 border border-violet-500/30 flex items-center justify-center">
                    <Key className="w-5 h-5 text-violet-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold text-sm">Change Password</h3>
                    <p className="text-white/40 text-xs">Last changed 90+ days ago</p>
                  </div>
                </div>

                <form onSubmit={pwForm.handleSubmit(changePassword)} className="space-y-3">
                  {/* Current password */}
                  <div>
                    <label className="text-white/40 text-xs uppercase tracking-wider block mb-1">Current Password</label>
                    <div className="relative">
                      <input
                        {...pwForm.register("current")}
                        type={showCurrentPw ? "text" : "password"}
                        placeholder="Enter current password"
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 pr-9 text-white text-sm focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30 transition-all placeholder:text-white/20"
                      />
                      <button type="button" onClick={() => setShowCurrentPw(v => !v)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70">
                        {showCurrentPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {pwForm.formState.errors.current && <p className="text-red-400 text-xs mt-1">{pwForm.formState.errors.current.message}</p>}
                  </div>

                  {/* New password */}
                  <div>
                    <label className="text-white/40 text-xs uppercase tracking-wider block mb-1">New Password</label>
                    <div className="relative">
                      <input
                        {...pwForm.register("newPw")}
                        type={showNewPw ? "text" : "password"}
                        placeholder="At least 8 characters"
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 pr-9 text-white text-sm focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30 transition-all placeholder:text-white/20"
                      />
                      <button type="button" onClick={() => setShowNewPw(v => !v)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70">
                        {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {/* Strength meter */}
                    {newPwValue.length > 0 && (
                      <div className="mt-1.5">
                        <div className="flex gap-1">
                          {[25, 50, 75, 100].map(threshold => (
                            <div key={threshold} className={`flex-1 h-1 rounded-full transition-all duration-300 ${pwStrength.score >= threshold ? pwStrength.color : "bg-white/10"}`} />
                          ))}
                        </div>
                        <p className={`text-xs mt-1 ${pwStrength.score >= 80 ? "text-emerald-400" : pwStrength.score >= 55 ? "text-amber-400" : "text-red-400"}`}>
                          {pwStrength.label}
                          {pwStrength.score >= 80 && " — great password!"}
                          {pwStrength.score < 55 && pwStrength.score > 0 && " — try adding numbers and symbols"}
                        </p>
                      </div>
                    )}
                    {pwForm.formState.errors.newPw && <p className="text-red-400 text-xs mt-1">{pwForm.formState.errors.newPw.message}</p>}
                  </div>

                  {/* Confirm */}
                  <div>
                    <label className="text-white/40 text-xs uppercase tracking-wider block mb-1">Confirm New Password</label>
                    <div className="relative">
                      <input
                        {...pwForm.register("confirm")}
                        type={showConfirmPw ? "text" : "password"}
                        placeholder="Repeat new password"
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 pr-9 text-white text-sm focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30 transition-all placeholder:text-white/20"
                      />
                      <button type="button" onClick={() => setShowConfirmPw(v => !v)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70">
                        {showConfirmPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {pwForm.formState.errors.confirm && <p className="text-red-400 text-xs mt-1">{pwForm.formState.errors.confirm.message}</p>}
                  </div>

                  <button
                    type="submit"
                    disabled={changingPw}
                    className="w-full flex items-center justify-center gap-1.5 px-4 py-2 bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/30 hover:border-violet-500/50 text-violet-300 text-sm font-medium rounded-lg transition-all disabled:opacity-50"
                  >
                    {changingPw ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Updating…</> : <><Key className="w-3.5 h-3.5" /> Update Password</>}
                  </button>
                </form>
              </GlassCard>
            </motion.div>
          </div>

          {/* ── LOGIN HISTORY + SUSPICIOUS ACTIVITY ─────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

            {/* Login History */}
            <motion.div variants={item}>
              <GlassCard className="p-5" glow="none">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center">
                      <Activity className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div>
                      <h3 className="text-white font-semibold text-sm">Login History</h3>
                      <p className="text-white/40 text-xs">Recent sign-in activity</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowHistory(v => !v)}
                    className="text-xs text-white/30 hover:text-white/60 flex items-center gap-1 transition-colors"
                  >
                    {showHistory ? "Show less" : "Show all"} <ChevronRight className={`w-3.5 h-3.5 transition-transform ${showHistory ? "rotate-90" : ""}`} />
                  </button>
                </div>

                <div className="space-y-2">
                  {(showHistory ? loginHistory : loginHistory.slice(0, 4)).map(entry => {
                    const s = LOGIN_STATUS[entry.status];
                    return (
                      <motion.div
                        key={entry.id}
                        layout
                        className={`flex items-start gap-3 p-3 rounded-xl border ${
                          entry.status === "suspicious" || entry.status === "blocked"
                            ? s.bg
                            : "bg-white/4 border-white/8"
                        }`}
                      >
                        <div className={`w-2 h-2 rounded-full ${s.dot} mt-1.5 shrink-0 shadow-[0_0_6px_currentColor]`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-white text-xs font-medium">{entry.device}</span>
                            <span className="text-white/30 text-xs">·</span>
                            <span className="text-white/50 text-xs">{entry.browser}</span>
                            {(entry.status === "suspicious" || entry.status === "blocked") && (
                              <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${s.text} bg-current/10`}>
                                {s.label}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            <span className="flex items-center gap-0.5 text-white/30 text-xs">
                              <MapPin className="w-2.5 h-2.5" />{entry.location}
                            </span>
                            <span className="text-white/20 text-xs">{entry.ip}</span>
                          </div>
                        </div>
                        <span className="text-white/25 text-xs whitespace-nowrap shrink-0">{timeAgoShort(entry.time)}</span>
                      </motion.div>
                    );
                  })}
                </div>
              </GlassCard>
            </motion.div>

            {/* Suspicious Activity Detection */}
            <motion.div variants={item}>
              <GlassCard className="p-5" glow="none">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-red-500/15 border border-red-500/30 flex items-center justify-center">
                    <ShieldAlert className="w-5 h-5 text-red-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold text-sm">Suspicious Activity</h3>
                    <p className="text-white/40 text-xs">Flagged events requiring review</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {loginHistory.filter(e => e.status === "suspicious" || e.status === "blocked").map(entry => {
                    const isSuspicious = entry.status === "suspicious";
                    return (
                      <div key={entry.id} className={`p-3 rounded-xl border ${isSuspicious ? "bg-amber-500/8 border-amber-500/25" : "bg-red-500/8 border-red-500/25"}`}>
                        <div className="flex items-start gap-2">
                          {isSuspicious
                            ? <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                            : <Ban className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                          }
                          <div className="flex-1 min-w-0">
                            <p className={`text-xs font-semibold ${isSuspicious ? "text-amber-300" : "text-red-300"}`}>
                              {isSuspicious ? "Suspicious Login Attempt" : "Login Blocked"}
                            </p>
                            <p className="text-white/50 text-xs mt-0.5">{entry.device} · {entry.browser}</p>
                            <div className="flex items-center gap-3 mt-1 flex-wrap">
                              <span className="flex items-center gap-1 text-white/35 text-xs">
                                <Globe className="w-3 h-3" />{entry.ip}
                              </span>
                              <span className="flex items-center gap-1 text-white/35 text-xs">
                                <MapPin className="w-3 h-3" />{entry.location}
                              </span>
                              <span className="flex items-center gap-1 text-white/35 text-xs">
                                <Clock className="w-3 h-3" />{timeAgoShort(entry.time)}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2 mt-2.5">
                          <button className="flex-1 text-xs py-1.5 px-3 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white border border-white/8 transition-all">
                            Not me
                          </button>
                          <button className={`flex-1 text-xs py-1.5 px-3 rounded-lg font-medium border transition-all ${
                            isSuspicious
                              ? "bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border-amber-500/25"
                              : "bg-red-500/15 hover:bg-red-500/25 text-red-300 border-red-500/25"
                          }`}>
                            {isSuspicious ? "Block & Report" : "Review"}
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  {/* Detection summary */}
                  <div className="pt-1 mt-2 border-t border-white/8">
                    <div className="grid grid-cols-3 gap-2 text-center">
                      {[
                        { label: "Flagged", value: "2", color: "text-amber-400" },
                        { label: "Blocked", value: "1", color: "text-red-400" },
                        { label: "Safe", value: "4", color: "text-emerald-400" },
                      ].map(s => (
                        <div key={s.label} className="px-2 py-2 rounded-lg bg-white/4 border border-white/8">
                          <p className={`text-lg font-bold ${s.color} tabular-nums`}>{s.value}</p>
                          <p className="text-white/30 text-xs">{s.label}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          </div>

          {/* ── RECOVERY OPTIONS + BACKUP CODES ──────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

            {/* Recovery Options */}
            <motion.div variants={item}>
              <GlassCard className="p-5" glow="none">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center">
                    <LifeBuoy className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold text-sm">Recovery Options</h3>
                    <p className="text-white/40 text-xs">Account recovery fallbacks</p>
                  </div>
                </div>

                <div className="space-y-2">
                  {[
                    { label: "Recovery Email", value: user.email, status: "verified", icon: ShieldCheck, color: "emerald" },
                    { label: "Phone Number", value: "Not configured", status: "missing", icon: Smartphone, color: "amber" },
                    { label: "Backup Codes", value: `${recoveryCodes.filter(c => !c.used).length} codes remaining`, status: recoveryCodes.filter(c => !c.used).length > 4 ? "good" : "low", icon: Key, color: recoveryCodes.filter(c => !c.used).length > 4 ? "emerald" : "amber" },
                  ].map(opt => (
                    <div key={opt.label} className="flex items-center gap-3 p-3 rounded-xl bg-white/4 border border-white/8">
                      <opt.icon className={`w-4 h-4 text-${opt.color}-400 shrink-0`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-white/70 text-xs font-medium">{opt.label}</p>
                        <p className="text-white/35 text-xs truncate">{opt.value}</p>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${
                        opt.status === "verified" || opt.status === "good"
                          ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/20"
                          : opt.status === "missing"
                          ? "bg-red-500/10 text-red-300 border-red-500/20"
                          : "bg-amber-500/10 text-amber-300 border-amber-500/20"
                      }`}>
                        {opt.status === "verified" ? "Verified" : opt.status === "good" ? "Good" : opt.status === "missing" ? "Missing" : "Low"}
                      </span>
                    </div>
                  ))}

                  <button className="w-full flex items-center justify-center gap-1.5 text-xs py-2 px-3 mt-1 rounded-lg bg-white/5 hover:bg-white/10 text-white/50 hover:text-white border border-white/8 hover:border-white/15 transition-all">
                    <Smartphone className="w-3.5 h-3.5" /> Add Phone Number
                  </button>
                </div>
              </GlassCard>
            </motion.div>

            {/* Backup Codes */}
            <motion.div variants={item}>
              <GlassCard className="p-5" glow="none">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-violet-500/15 border border-violet-500/30 flex items-center justify-center">
                      <Lock className="w-5 h-5 text-violet-400" />
                    </div>
                    <div>
                      <h3 className="text-white font-semibold text-sm">Backup Recovery Codes</h3>
                      <p className="text-white/40 text-xs">Single-use emergency codes</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setCodesVisible(v => !v)}
                    className="text-white/30 hover:text-white/70 transition-colors"
                  >
                    {codesVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-1.5 mb-3">
                  {recoveryCodes.map((code, i) => (
                    <button
                      key={i}
                      onClick={() => codesVisible && !code.used && copyCode(code.code)}
                      disabled={code.used || !codesVisible}
                      className={`relative flex items-center justify-between px-2.5 py-2 rounded-lg text-left transition-all ${
                        code.used
                          ? "bg-white/3 border border-white/5 opacity-40"
                          : codesVisible
                          ? "bg-white/5 border border-white/10 hover:border-violet-500/40 hover:bg-violet-500/8 cursor-pointer"
                          : "bg-white/5 border border-white/10 cursor-default"
                      }`}
                    >
                      <span className={`font-mono text-xs ${code.used ? "line-through text-white/25" : "text-white/70"}`}>
                        {codesVisible ? code.code : "••••-••••-••••"}
                      </span>
                      {codesVisible && !code.used && (
                        copiedCode === code.code
                          ? <CheckCheck className="w-3 h-3 text-emerald-400 shrink-0" />
                          : <Copy className="w-3 h-3 text-white/20 shrink-0" />
                      )}
                      {code.used && <span className="text-white/25 text-xs">used</span>}
                    </button>
                  ))}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={copyAllCodes}
                    disabled={!codesVisible}
                    className="flex-1 flex items-center justify-center gap-1.5 text-xs py-2 px-3 rounded-lg bg-white/5 hover:bg-white/10 text-white/50 hover:text-white border border-white/8 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Copy className="w-3.5 h-3.5" /> Copy All
                  </button>
                  <button
                    onClick={generateNewCodes}
                    disabled={generatingCodes}
                    className="flex-1 flex items-center justify-center gap-1.5 text-xs py-2 px-3 rounded-lg bg-violet-500/10 hover:bg-violet-500/20 text-violet-300 border border-violet-500/20 hover:border-violet-500/40 transition-all disabled:opacity-60"
                  >
                    {generatingCodes ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                    {generatingCodes ? "Generating…" : "Regenerate"}
                  </button>
                </div>
                <p className="text-white/25 text-xs mt-2 text-center">Each code can only be used once. Store them safely.</p>
              </GlassCard>
            </motion.div>
          </div>

          {/* ── ACCOUNT RECOVERY + FUTURE METHODS ────────────────────────── */}
          <motion.div variants={item}>
            <GlassCard className="p-5" glow="none">
              <div className="flex items-center gap-2 mb-4">
                <Zap className="w-4 h-4 text-violet-400" />
                <h3 className="text-white font-semibold text-sm">Future Authentication Methods</h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-400 border border-violet-500/20">Roadmap</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  {
                    label: "Authenticator App",
                    desc: "Time-based codes from Google Authenticator, Authy, or 1Password",
                    icon: QrCode,
                    color: "violet",
                    eta: "Q2 2025",
                  },
                  {
                    label: "Biometric Login",
                    desc: "Face ID, Touch ID, or Windows Hello for seamless sign-in",
                    icon: Fingerprint,
                    color: "cyan",
                    eta: "Q3 2025",
                  },
                  {
                    label: "Passkeys",
                    desc: "Passwordless sign-in using device-bound cryptographic keys",
                    icon: Key,
                    color: "emerald",
                    eta: "Q4 2025",
                  },
                ].map(method => (
                  <div
                    key={method.label}
                    className={`p-4 rounded-xl border border-${method.color}-500/15 bg-${method.color}-500/5 flex flex-col gap-3`}
                  >
                    <div className="flex items-center justify-between">
                      <method.icon className={`w-6 h-6 text-${method.color}-400/60`} />
                      <span className={`text-xs px-2 py-0.5 rounded-full bg-${method.color}-500/10 text-${method.color}-400/60 border border-${method.color}-500/15 font-medium`}>
                        {method.eta}
                      </span>
                    </div>
                    <div>
                      <p className={`text-${method.color}-300/80 text-sm font-semibold`}>{method.label}</p>
                      <p className="text-white/30 text-xs mt-1 leading-relaxed">{method.desc}</p>
                    </div>
                    <button className={`w-full text-xs py-1.5 px-3 rounded-lg border border-${method.color}-500/20 text-${method.color}-400/50 bg-${method.color}-500/5 hover:bg-${method.color}-500/10 transition-all`}>
                      Notify me when available
                    </button>
                  </div>
                ))}
              </div>
            </GlassCard>
          </motion.div>

        </motion.div>
      </div>
    </AppShell>
  );
}
