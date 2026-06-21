import { useState } from "react";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/useAuth";
import { AppShell } from "@/components/layout/AppShell";
import { GlassCard } from "@/components/glass/GlassCard";
import { ROLE_PERMISSIONS } from "@/lib/utils/permissions";
import { apiToggle2FA, apiChangePassword } from "@/lib/mock/mockApi";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Shield, Key, Smartphone, AlertTriangle, Check, Loader2, Lock } from "lucide-react";

const pwSchema = z.object({
  current: z.string().min(1, "Required"),
  newPw: z.string().min(6, "At least 6 characters"),
  confirm: z.string()
}).refine(d => d.newPw === d.confirm, {
  message: "Passwords do not match",
  path: ["confirm"]
});
type PwValues = z.infer<typeof pwSchema>;

const SECURITY_EVENTS = [
  { type: "success", msg: "Successful login from Chrome on macOS", time: "Just now" },
  { type: "warning", msg: "New device detected: iPhone 15 Pro", time: "2 hours ago" },
  { type: "success", msg: "2FA verification passed", time: "1 day ago" },
  { type: "info", msg: "Password changed successfully", time: "7 days ago" },
  { type: "success", msg: "Account created", time: "30 days ago" }
];

export default function SecurityCenterPage() {
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
  const [toggling2FA, setToggling2FA] = useState(false);
  const [changingPw, setChangingPw] = useState(false);

  const pwForm = useForm<PwValues>({
    resolver: zodResolver(pwSchema),
    defaultValues: { current: "", newPw: "", confirm: "" }
  });

  if (!user) return null;

  const permissions = ROLE_PERMISSIONS[user.role];

  const scoreBreakdown = [
    { label: "Password Strength", score: 30, max: 30, active: true },
    { label: "Two-Factor Auth", score: user.twoFactorEnabled ? 25 : 0, max: 25, active: user.twoFactorEnabled },
    { label: "Trusted Devices", score: 20, max: 20, active: true },
    { label: "Recent Activity", score: user.securityScore - (user.twoFactorEnabled ? 75 : 50), max: 25, active: true }
  ];

  const toggle2FA = async () => {
    setToggling2FA(true);
    try {
      const updated = await apiToggle2FA(user.id, !user.twoFactorEnabled);
      updateUser(updated);
      toast({
        title: updated.twoFactorEnabled ? "2FA Enabled" : "2FA Disabled",
        description: updated.twoFactorEnabled
          ? "Two-factor authentication is now active."
          : "Two-factor authentication has been disabled."
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
      const { apiChangePassword } = await import("@/lib/mock/mockApi");
      await apiChangePassword(user.id, values.current, values.newPw);
      pwForm.reset();
      toast({ title: "Password changed", description: "Your password has been updated successfully." });
    } catch (e: unknown) {
      toast({ title: "Error", description: e instanceof Error ? e.message : "Failed", variant: "destructive" });
    } finally {
      setChangingPw(false);
    }
  };

  const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
  const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

  return (
    <AppShell title="Security Center" subtitle="Protect your identity and account access">
      <div className="p-6 space-y-4 max-w-5xl">
        <motion.div variants={container} initial="hidden" animate="show">

          {/* Score + Breakdown */}
          <motion.div variants={item}>
            <GlassCard className="p-6" glow="violet">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                {/* Score ring */}
                <div className="flex flex-col items-center shrink-0">
                  <div className="relative w-28 h-28">
                    <svg className="w-28 h-28 -rotate-90" viewBox="0 0 112 112">
                      <circle cx="56" cy="56" r="46" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
                      <motion.circle
                        cx="56" cy="56" r="46" fill="none"
                        stroke={user.securityScore >= 80 ? "#10b981" : user.securityScore >= 60 ? "#f59e0b" : "#ef4444"}
                        strokeWidth="8" strokeLinecap="round"
                        strokeDasharray={`${2 * Math.PI * 46}`}
                        initial={{ strokeDashoffset: 2 * Math.PI * 46 }}
                        animate={{ strokeDashoffset: 2 * Math.PI * 46 * (1 - user.securityScore / 100) }}
                        transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-3xl font-bold text-white">{user.securityScore}</span>
                      <span className="text-white/30 text-xs">/ 100</span>
                    </div>
                  </div>
                  <p className={`text-sm font-semibold mt-2 ${
                    user.securityScore >= 80 ? "text-emerald-400" :
                    user.securityScore >= 60 ? "text-amber-400" : "text-red-400"
                  }`}>
                    {user.securityScore >= 80 ? "Excellent" : user.securityScore >= 60 ? "Good" : "Needs Attention"}
                  </p>
                </div>

                {/* Breakdown */}
                <div className="flex-1 space-y-3 w-full">
                  {scoreBreakdown.map(item => (
                    <div key={item.label}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-white/60">{item.label}</span>
                        <span className={item.active ? "text-white/80" : "text-white/30"}>
                          {item.score}/{item.max}
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${(item.score / item.max) * 100}%` }}
                          transition={{ duration: 1, ease: "easeOut", delay: 0.4 }}
                          className={`h-full rounded-full ${
                            item.active
                              ? "bg-gradient-to-r from-violet-500 to-emerald-400"
                              : "bg-white/20"
                          }`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </GlassCard>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
            {/* 2FA Toggle */}
            <motion.div variants={item}>
              <GlassCard className="p-5" glow={user.twoFactorEnabled ? "emerald" : "none"}>
                <div className="flex items-start gap-3 mb-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    user.twoFactorEnabled ? "bg-emerald-500/20 border border-emerald-500/30" : "bg-white/5 border border-white/10"
                  }`}>
                    <Smartphone className={`w-5 h-5 ${user.twoFactorEnabled ? "text-emerald-400" : "text-white/40"}`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-white font-semibold text-sm">Two-Factor Authentication</h3>
                    <p className="text-white/40 text-xs mt-0.5">Add an extra layer of security to your account</p>
                  </div>
                  <Switch
                    data-testid="switch-2fa"
                    checked={user.twoFactorEnabled}
                    onCheckedChange={toggle2FA}
                    disabled={toggling2FA}
                    className="shrink-0"
                  />
                </div>
                <div className={`text-xs px-3 py-2 rounded-lg ${
                  user.twoFactorEnabled
                    ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
                    : "bg-amber-500/10 text-amber-300 border border-amber-500/20"
                }`}>
                  {user.twoFactorEnabled
                    ? "2FA is active — +25 security points"
                    : "Enable 2FA to gain +25 security points"}
                </div>
              </GlassCard>
            </motion.div>

            {/* Change Password */}
            <motion.div variants={item}>
              <GlassCard className="p-5" glow="none">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center">
                    <Key className="w-5 h-5 text-violet-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold text-sm">Change Password</h3>
                    <p className="text-white/40 text-xs">Update your account password</p>
                  </div>
                </div>
                <Form {...pwForm}>
                  <form onSubmit={pwForm.handleSubmit(changePassword)} className="space-y-3">
                    <FormField
                      control={pwForm.control}
                      name="current"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              data-testid="input-current-password"
                              type="password"
                              placeholder="Current password"
                              className="bg-white/5 border-white/10 text-white placeholder:text-white/30 h-9 text-sm"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={pwForm.control}
                      name="newPw"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              data-testid="input-new-password"
                              type="password"
                              placeholder="New password"
                              className="bg-white/5 border-white/10 text-white placeholder:text-white/30 h-9 text-sm"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={pwForm.control}
                      name="confirm"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              data-testid="input-confirm-new-password"
                              type="password"
                              placeholder="Confirm new password"
                              className="bg-white/5 border-white/10 text-white placeholder:text-white/30 h-9 text-sm"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      data-testid="button-change-password"
                      type="submit"
                      disabled={changingPw}
                      size="sm"
                      className="w-full bg-violet-600/20 hover:bg-violet-600/30 text-violet-300 border border-violet-500/30 hover:border-violet-500/50 transition-all"
                    >
                      {changingPw ? <><Loader2 className="w-3 h-3 animate-spin mr-1" />Updating...</> : "Update Password"}
                    </Button>
                  </form>
                </Form>
              </GlassCard>
            </motion.div>

            {/* Permissions */}
            <motion.div variants={item}>
              <GlassCard className="p-5 h-full" glow="none">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center">
                    <Lock className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold text-sm">Active Permissions</h3>
                    <p className="text-white/40 text-xs">Your current role grants these permissions</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {permissions.map(p => (
                    <div key={p} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/5">
                      <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                      <span className="text-white/70 text-xs font-mono">{p}</span>
                    </div>
                  ))}
                </div>
              </GlassCard>
            </motion.div>

            {/* Security Events */}
            <motion.div variants={item}>
              <GlassCard className="p-5 h-full" glow="none">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
                    <Shield className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold text-sm">Security Events</h3>
                    <p className="text-white/40 text-xs">Recent security-related activity</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {SECURITY_EVENTS.map((ev, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${
                        ev.type === "success" ? "bg-emerald-400" :
                        ev.type === "warning" ? "bg-amber-400" : "bg-blue-400"
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-white/70 text-xs">{ev.msg}</p>
                        <p className="text-white/25 text-xs">{ev.time}</p>
                      </div>
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
