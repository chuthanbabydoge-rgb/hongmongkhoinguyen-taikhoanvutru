import { motion } from "framer-motion";
import { useSessions } from "@/hooks/useSessions";
import { AppShell } from "@/components/layout/AppShell";
import { GlassCard } from "@/components/glass/GlassCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Session } from "@/lib/types/session";
import { timeAgo } from "@/lib/utils/auth";
import { Monitor, Smartphone, Globe, MapPin, Clock, X, ShieldAlert } from "lucide-react";

function SessionCard({ session, onRevoke }: { session: Session; onRevoke?: (id: string) => void }) {
  return (
    <GlassCard
      data-testid={`card-session-${session.id}`}
      className="p-5"
      glow={session.isCurrent ? "cyan" : "none"}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
            session.isCurrent
              ? "bg-cyan-500/20 border border-cyan-500/30 text-cyan-400"
              : "bg-white/5 border border-white/10 text-white/40"
          }`}>
            {session.device.toLowerCase().includes("iphone") || session.device.toLowerCase().includes("mobile")
              ? <Smartphone className="w-5 h-5" />
              : <Monitor className="w-5 h-5" />
            }
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p data-testid={`text-session-device-${session.id}`} className="text-white font-semibold text-sm truncate">{session.device}</p>
              {session.isCurrent && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-medium shrink-0">
                  Current
                </span>
              )}
            </div>
            <p className="text-white/40 text-xs mt-0.5">{session.browser} · {session.os}</p>
          </div>
        </div>

        {!session.isCurrent && onRevoke && (
          <Button
            data-testid={`button-revoke-session-${session.id}`}
            size="sm"
            variant="ghost"
            onClick={() => onRevoke(session.id)}
            className="bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 text-xs shrink-0"
          >
            <X className="w-3 h-3 mr-1" />
            Revoke
          </Button>
        )}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <div className="flex items-center gap-1.5 text-xs text-white/50">
          <Globe className="w-3 h-3 text-white/30" />
          <span>{session.ip}</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-white/50">
          <MapPin className="w-3 h-3 text-white/30" />
          <span>{session.location}</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-white/50">
          <Clock className="w-3 h-3 text-white/30" />
          <span>Active {timeAgo(session.lastActive)}</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-white/50">
          <Clock className="w-3 h-3 text-white/30" />
          <span>Started {timeAgo(session.createdAt)}</span>
        </div>
      </div>
    </GlassCard>
  );
}

export default function SessionsPage() {
  const { sessions, isLoading, revokeSession, revokeAll } = useSessions();
  const { toast } = useToast();

  const handleRevoke = async (id: string) => {
    await revokeSession(id);
    toast({ title: "Session revoked", description: "The session has been terminated." });
  };

  const handleRevokeAll = async () => {
    await revokeAll();
    toast({ title: "All sessions revoked", description: "All other sessions have been terminated." });
  };

  const current = sessions.filter(s => s.isCurrent);
  const others = sessions.filter(s => !s.isCurrent);

  const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
  const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

  return (
    <AppShell title="Sessions" subtitle="Monitor and manage your active login sessions">
      <div className="p-6 max-w-3xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <span className="text-white/40 text-sm">{sessions.length} active session{sessions.length !== 1 ? "s" : ""}</span>
          </div>
          {others.length > 0 && (
            <Button
              data-testid="button-revoke-all"
              size="sm"
              onClick={handleRevokeAll}
              className="bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-all text-xs"
            >
              <ShieldAlert className="w-3 h-3 mr-1.5" />
              Revoke All Other Sessions
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-white/10 bg-white/5 p-5">
                <div className="flex gap-3 mb-4">
                  <Skeleton className="w-10 h-10 rounded-xl bg-white/10 shrink-0" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-40 mb-1 bg-white/10" />
                    <Skeleton className="h-3 w-28 bg-white/10" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {Array.from({ length: 4 }).map((_, j) => <Skeleton key={j} className="h-3 bg-white/10" />)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">
            {current.length > 0 && (
              <div>
                <p className="text-white/30 text-xs uppercase tracking-widest mb-3">Current Session</p>
                {current.map(s => (
                  <motion.div key={s.id} variants={item}>
                    <SessionCard session={s} />
                  </motion.div>
                ))}
              </div>
            )}

            {others.length > 0 && (
              <div>
                <p className="text-white/30 text-xs uppercase tracking-widest mb-3">Other Sessions</p>
                <div className="space-y-3">
                  {others.map(s => (
                    <motion.div key={s.id} variants={item}>
                      <SessionCard session={s} onRevoke={handleRevoke} />
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {sessions.length === 0 && (
              <div className="text-center py-16 text-white/30">
                <Clock className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No active sessions found</p>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </AppShell>
  );
}
