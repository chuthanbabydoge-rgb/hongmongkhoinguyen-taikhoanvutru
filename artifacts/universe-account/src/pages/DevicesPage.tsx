import { motion } from "framer-motion";
import { useDevices } from "@/hooks/useDevices";
import { AppShell } from "@/components/layout/AppShell";
import { GlassCard } from "@/components/glass/GlassCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Device } from "@/lib/types/device";
import { timeAgo, formatDate } from "@/lib/utils/auth";
import { Monitor, Smartphone, Tablet, Shield, ShieldOff, Trash2, Plus, CheckCircle } from "lucide-react";

function DeviceIcon({ type }: { type: Device["type"] }) {
  const cls = "w-6 h-6";
  if (type === "mobile") return <Smartphone className={cls} />;
  if (type === "tablet") return <Tablet className={cls} />;
  return <Monitor className={cls} />;
}

function DeviceCard({ device, onToggleTrust, onRemove }: {
  device: Device;
  onToggleTrust: (id: string, trusted: boolean) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <GlassCard
      data-testid={`card-device-${device.id}`}
      className="p-5"
      glow={device.trusted ? "emerald" : "none"}
    >
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${
            device.trusted
              ? "bg-emerald-500/20 border border-emerald-500/30 text-emerald-400"
              : "bg-white/5 border border-white/10 text-white/40"
          }`}>
            <DeviceIcon type={device.type} />
          </div>
          <div>
            <p data-testid={`text-device-name-${device.id}`} className="text-white font-semibold text-sm">{device.name}</p>
            <p className="text-white/40 text-xs capitalize">{device.type}</p>
          </div>
        </div>
        {device.trusted && (
          <div className="flex items-center gap-1 text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
            <CheckCircle className="w-3 h-3" />
            <span className="text-xs font-medium">Trusted</span>
          </div>
        )}
      </div>

      <div className="space-y-1.5 mb-4">
        <div className="flex items-center justify-between text-xs">
          <span className="text-white/40">Operating System</span>
          <span className="text-white/70">{device.os}</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-white/40">Browser</span>
          <span className="text-white/70">{device.browser}</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-white/40">Last Seen</span>
          <span className="text-white/70">{timeAgo(device.lastSeen)}</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-white/40">Registered</span>
          <span className="text-white/70">{formatDate(device.registeredAt)}</span>
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          data-testid={`button-trust-${device.id}`}
          size="sm"
          variant="ghost"
          onClick={() => onToggleTrust(device.id, !device.trusted)}
          className={`flex-1 text-xs border ${
            device.trusted
              ? "bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20"
              : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20"
          }`}
        >
          {device.trusted ? (
            <><ShieldOff className="w-3 h-3 mr-1" />Untrust</>
          ) : (
            <><Shield className="w-3 h-3 mr-1" />Trust</>
          )}
        </Button>
        <Button
          data-testid={`button-remove-device-${device.id}`}
          size="sm"
          variant="ghost"
          onClick={() => onRemove(device.id)}
          className="bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 text-xs"
        >
          <Trash2 className="w-3 h-3" />
        </Button>
      </div>
    </GlassCard>
  );
}

export default function DevicesPage() {
  const { devices, isLoading, toggleTrust, removeDevice, registerDevice } = useDevices();
  const { toast } = useToast();

  const handleToggleTrust = async (id: string, trusted: boolean) => {
    await toggleTrust(id, trusted);
    toast({ title: trusted ? "Device trusted" : "Device untrusted", description: trusted ? "This device is now trusted." : "Trust removed from device." });
  };

  const handleRemove = async (id: string) => {
    await removeDevice(id);
    toast({ title: "Device removed", description: "The device has been removed from your account." });
  };

  const handleRegister = async () => {
    const device = await registerDevice();
    if (device) {
      toast({ title: "Device registered", description: `${device.name} has been added to your account.` });
    }
  };

  const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
  const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

  return (
    <AppShell title="Devices" subtitle="Manage trusted devices connected to your account">
      <div className="p-6 max-w-5xl">
        {/* Header action */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <span className="text-white/40 text-sm">{devices.length} device{devices.length !== 1 ? "s" : ""} registered</span>
            <span className="text-white/20">·</span>
            <span className="text-emerald-400 text-sm">{devices.filter(d => d.trusted).length} trusted</span>
          </div>
          <Button
            data-testid="button-register-device"
            onClick={handleRegister}
            size="sm"
            className="bg-violet-600/20 text-violet-300 border border-violet-500/30 hover:bg-violet-600/30 hover:border-violet-500/50 transition-all"
          >
            <Plus className="w-4 h-4 mr-2" />
            Register Device
          </Button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-white/10 bg-white/5 p-5">
                <Skeleton className="h-11 w-11 rounded-xl mb-4 bg-white/10" />
                <Skeleton className="h-4 w-32 mb-2 bg-white/10" />
                <Skeleton className="h-3 w-20 mb-4 bg-white/10" />
                <div className="space-y-1.5 mb-4">
                  {Array.from({ length: 4 }).map((_, j) => <Skeleton key={j} className="h-3 bg-white/10" />)}
                </div>
                <Skeleton className="h-8 bg-white/10" />
              </div>
            ))}
          </div>
        ) : (
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {devices.map(device => (
              <motion.div key={device.id} variants={item}>
                <DeviceCard
                  device={device}
                  onToggleTrust={handleToggleTrust}
                  onRemove={handleRemove}
                />
              </motion.div>
            ))}
            {devices.length === 0 && (
              <div className="col-span-full text-center py-16 text-white/30">
                <Monitor className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No devices registered</p>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </AppShell>
  );
}
