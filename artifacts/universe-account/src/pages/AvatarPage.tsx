import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AppShell } from "@/components/layout/AppShell";
import { GlassCard } from "@/components/glass/GlassCard";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import {
  UserAvatarConfig, AvatarFrame, AvatarBackground, AvatarBadge, AvatarTitle, AvatarTheme, AvatarPreset,
  RARITY_META, ItemRarity,
} from "@/lib/types/avatar";
import {
  avatarFrames, avatarBackgrounds, avatarBadges, avatarTitles, avatarThemes, avatarPresets,
} from "@/lib/mock/avatarData";
import {
  apiGetAvatarConfig, apiEquipFrame, apiEquipBackground, apiEquipBadge, apiEquipTitle, apiEquipTheme, apiApplyPreset,
} from "@/lib/services/avatarService";
import {
  Loader2, Check, Lock, Star, Layers, Image, Award, Type, Palette, Wand2, Package, Sparkles,
  ChevronRight, Shield, TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Helpers ───────────────────────────────────────────────────────────────────

const container = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };
const item = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.3 } } };

function RarityPill({ rarity }: { rarity: ItemRarity }) {
  const m = RARITY_META[rarity];
  return (
    <span className={cn("text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md border", m.bg, m.border, m.color)}>
      {m.label}
    </span>
  );
}

// ── Live Avatar Preview ───────────────────────────────────────────────────────

function AvatarPreview({
  config, frame, background, badge, title, theme, initials,
}: {
  config: UserAvatarConfig;
  frame: AvatarFrame;
  background: AvatarBackground;
  badge: AvatarBadge | null;
  title: AvatarTitle;
  theme: AvatarTheme;
  initials: string;
}) {
  return (
    <div className="flex flex-col items-center gap-4">
      {/* Avatar card */}
      <div
        className="relative w-48 h-48 rounded-3xl overflow-hidden flex items-center justify-center select-none"
        style={{ background: background.gradient }}
      >
        {/* Particle shimmer for special backgrounds */}
        {background.particles && (
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(18)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 rounded-full bg-white/30"
                style={{ left: `${(i * 37) % 100}%`, top: `${(i * 53) % 100}%` }}
                animate={{ opacity: [0.1, 0.6, 0.1], scale: [0.5, 1.2, 0.5] }}
                transition={{ duration: 2 + (i % 3), repeat: Infinity, delay: i * 0.3 }}
              />
            ))}
          </div>
        )}

        {/* Frame glow layer */}
        {frame.id !== "frame-none" && (
          <div
            className={cn("absolute inset-0 rounded-3xl", frame.preview.animation)}
            style={{ boxShadow: `inset 0 0 0 3px transparent, ${frame.preview.glow.replace("shadow-", "") || ""}` }}
          />
        )}

        {/* Avatar circle */}
        <div
          className={cn(
            "relative w-28 h-28 rounded-2xl flex items-center justify-center text-white font-bold text-4xl z-10",
            frame.id !== "frame-none" ? frame.preview.animation : ""
          )}
          style={{
            background: `linear-gradient(135deg, ${theme.primary}cc, ${theme.accent}99)`,
            boxShadow: frame.id !== "frame-none"
              ? `0 0 0 3px ${theme.primary}80, ${frame.preview.glow.includes("shadow") ? "0 0 24px " + theme.accent + "60" : ""}` : undefined,
          }}
        >
          {initials}
          {/* Badge overlay */}
          {badge && badge.id !== "badge-none" && (
            <div className="absolute -bottom-2 -right-2 w-9 h-9 rounded-xl bg-[#050c1a]/90 border border-white/15 flex items-center justify-center text-lg shadow-lg">
              {badge.icon}
            </div>
          )}
        </div>

        {/* Frame border visual */}
        {frame.id !== "frame-none" && (
          <div
            className={cn("absolute inset-0 rounded-3xl pointer-events-none", frame.preview.animation)}
            style={{
              background: `linear-gradient(135deg, ${frame.preview.gradient.replace("from-", "").replace(" to-", ", ")})`,
              WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
              WebkitMaskComposite: "xor",
              maskComposite: "exclude",
              padding: "3px",
            }}
          />
        )}
      </div>

      {/* Name + title + level */}
      <div className="text-center">
        <p className="text-white font-bold text-lg">{config.displayName}</p>
        <p className={cn("text-sm font-semibold mt-0.5", title.gradient ? "" : title.color)}
          style={title.gradient ? { background: `linear-gradient(90deg, var(--from), var(--via, var(--from)), var(--to))`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" } : undefined}>
          {title.name}
        </p>
        <div className="flex items-center justify-center gap-3 mt-2">
          <div className="flex items-center gap-1">
            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            <span className="text-white/60 text-xs">Lv.{config.level}</span>
          </div>
          <span className="text-white/15">·</span>
          <div className="flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-violet-400" />
            <span className="text-white/60 text-xs">{config.reputation} pts</span>
          </div>
          {badge && badge.id !== "badge-none" && (
            <>
              <span className="text-white/15">·</span>
              <span className="text-sm">{badge.icon}</span>
            </>
          )}
        </div>
      </div>

      {/* Theme chip */}
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/10">
        <span className="text-sm">{theme.icon}</span>
        <span className="text-white/40 text-xs">Chủ đề {theme.name}</span>
      </div>
    </div>
  );
}

// ── Item Grid Card ────────────────────────────────────────────────────────────

function ItemCard({
  id, name, rarity, icon, description, isOwned, isEquipped, preview,
  onClick,
}: {
  id: string; name: string; rarity: ItemRarity; icon?: string;
  description: string; isOwned: boolean; isEquipped: boolean;
  preview?: React.ReactNode; onClick: () => void;
}) {
  const m = RARITY_META[rarity];
  return (
    <motion.button
      whileHover={isOwned ? { scale: 1.02 } : {}}
      whileTap={isOwned ? { scale: 0.98 } : {}}
      onClick={isOwned ? onClick : undefined}
      className={cn(
        "relative flex flex-col items-center gap-2.5 p-4 rounded-2xl border text-center transition-all",
        isEquipped
          ? `bg-gradient-to-b ${m.gradient} ${m.border} ${m.glow}`
          : isOwned
          ? "bg-white/3 border-white/10 hover:bg-white/6 hover:border-white/20 cursor-pointer"
          : "bg-white/2 border-white/5 cursor-not-allowed opacity-40"
      )}
    >
      {/* Equipped indicator */}
      {isEquipped && (
        <div className={cn("absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center", m.bg, m.border)}>
          <Check className={cn("w-3 h-3", m.color)} />
        </div>
      )}
      {/* Locked indicator */}
      {!isOwned && (
        <div className="absolute top-2 right-2">
          <Lock className="w-3.5 h-3.5 text-white/20" />
        </div>
      )}

      {/* Preview / icon */}
      {preview ?? (
        <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center text-2xl border", m.bg, m.border)}>
          {icon}
        </div>
      )}

      <div className="space-y-1">
        <p className={cn("text-xs font-semibold leading-tight", isOwned ? "text-white/80" : "text-white/30")}>
          {name}
        </p>
        <RarityPill rarity={rarity} />
      </div>

      {!isOwned && (
        <p className="text-[9px] text-white/20 leading-snug">{description.split(".")[0]}</p>
      )}
    </motion.button>
  );
}

// ── Frame Preview ─────────────────────────────────────────────────────────────

function FramePreviewBox({ frame }: { frame: AvatarFrame }) {
  return (
    <div
      className={cn("w-12 h-12 rounded-xl flex items-center justify-center border-2 shrink-0", frame.preview.animation)}
      style={{
        borderImage: frame.id !== "frame-none"
          ? `linear-gradient(135deg, ${frame.preview.gradient.replace("from-", "").replace(" to-", ", ")}) 1` : undefined,
        borderColor: frame.id === "frame-none" ? "rgba(255,255,255,0.1)" : undefined,
        boxShadow: frame.preview.glow.includes("shadow") ? undefined : undefined,
      }}
    >
      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-white/20 to-white/5 flex items-center justify-center">
        <Layers className="w-4 h-4 text-white/40" />
      </div>
    </div>
  );
}

// ── Preset Card ───────────────────────────────────────────────────────────────

function PresetCard({ preset, onApply, isActive, canEquip }: {
  preset: AvatarPreset;
  onApply: () => void;
  isActive: boolean;
  canEquip: (frameId: string, bgId: string, badgeId: string, titleId: string) => boolean;
}) {
  const unlockable = canEquip(preset.frameId, preset.backgroundId, preset.badgeId, preset.titleId);
  const frame = avatarFrames.find((f) => f.id === preset.frameId)!;
  const bg = avatarBackgrounds.find((b) => b.id === preset.backgroundId)!;
  const badge = avatarBadges.find((b) => b.id === preset.badgeId)!;
  const title = avatarTitles.find((t) => t.id === preset.titleId)!;

  return (
    <motion.div
      whileHover={unlockable ? { y: -2 } : {}}
      className={cn(
        "relative rounded-2xl border overflow-hidden transition-all",
        isActive ? "border-violet-500/40 shadow-[0_0_20px_rgba(124,58,237,0.2)]" :
        unlockable ? "border-white/12 hover:border-white/22 cursor-pointer" :
        "border-white/6 opacity-50"
      )}
    >
      {/* Background preview strip */}
      <div className="h-16 w-full relative" style={{ background: bg.gradient }}>
        {isActive && (
          <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded-md bg-violet-600/50 border border-violet-500/60 text-[9px] font-bold text-violet-200 uppercase tracking-wider">
            Đang dùng
          </div>
        )}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-12 h-12 rounded-xl flex items-center justify-center text-xl border-2 bg-[#050c1a]/80"
          style={{ borderColor: `${RARITY_META[frame.rarity].border.replace("border-", "").replace("/", "")}` }}>
          {preset.icon}
        </div>
      </div>

      <div className="pt-8 pb-4 px-4 text-center space-y-2">
        <p className="text-white/85 font-bold text-sm">{preset.name}</p>
        <p className="text-white/35 text-[10px] leading-relaxed">{preset.description}</p>

        {/* Items summary */}
        <div className="flex flex-wrap justify-center gap-1 pt-1">
          {[
            { label: frame.name, rarity: frame.rarity },
            { label: badge.name, rarity: badge.rarity },
            { label: title.name, rarity: title.rarity },
          ].map((i) => (
            <span key={i.label} className={cn("text-[8px] font-semibold px-1.5 py-0.5 rounded border",
              RARITY_META[i.rarity].bg, RARITY_META[i.rarity].border, RARITY_META[i.rarity].color
            )}>
              {i.label}
            </span>
          ))}
        </div>

        <button
          onClick={unlockable && !isActive ? onApply : undefined}
          disabled={!unlockable || isActive}
          className={cn(
            "w-full py-1.5 rounded-xl text-xs font-semibold transition-all border",
            isActive ? "bg-violet-600/20 border-violet-500/30 text-violet-300 cursor-default" :
            unlockable ? "bg-white/5 border-white/12 text-white/60 hover:bg-violet-600/20 hover:border-violet-500/30 hover:text-violet-200" :
            "bg-white/3 border-white/6 text-white/20 cursor-not-allowed"
          )}
        >
          {isActive ? "Đang áp dụng" : unlockable ? "Áp dụng thiết lập" : "Chưa mở khóa"}
        </button>
      </div>
    </motion.div>
  );
}

// ── Wardrobe Section ──────────────────────────────────────────────────────────

type WardrobeTab = "frames" | "backgrounds" | "badges" | "titles";

function WardrobePanel({ config, onEquipFrame, onEquipBackground, onEquipBadge, onEquipTitle }: {
  config: UserAvatarConfig;
  onEquipFrame: (id: string) => void;
  onEquipBackground: (id: string) => void;
  onEquipBadge: (id: string) => void;
  onEquipTitle: (id: string) => void;
}) {
  const [tab, setTab] = useState<WardrobeTab>("frames");

  const tabs: { key: WardrobeTab; label: string; icon: React.ReactNode; count: number }[] = [
    { key: "frames", label: "Khung", icon: <Layers className="w-3.5 h-3.5" />, count: config.ownedFrameIds.length },
    { key: "backgrounds", label: "Hình nền", icon: <Image className="w-3.5 h-3.5" />, count: config.ownedBackgroundIds.length },
    { key: "badges", label: "Huy hiệu", icon: <Award className="w-3.5 h-3.5" />, count: config.ownedBadgeIds.length },
    { key: "titles", label: "Danh hiệu", icon: <Type className="w-3.5 h-3.5" />, count: config.ownedTitleIds.length },
  ];

  return (
    <div className="space-y-4">
      {/* Tab bar */}
      <div className="flex gap-1 p-1 rounded-xl bg-white/5 border border-white/8 overflow-x-auto">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex-1 justify-center",
              tab === t.key
                ? "bg-violet-600/30 text-violet-200 border border-violet-500/40"
                : "text-white/40 hover:text-white/70"
            )}>
            {t.icon} {t.label}
            <span className={cn("text-[9px] px-1.5 py-0.5 rounded-md", tab === t.key ? "bg-violet-500/30 text-violet-300" : "bg-white/8 text-white/25")}>
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.2 }}>

          {tab === "frames" && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {avatarFrames.map((f) => (
                <ItemCard key={f.id} id={f.id} name={f.name} rarity={f.rarity}
                  description={f.description}
                  isOwned={config.ownedFrameIds.includes(f.id)}
                  isEquipped={config.currentFrameId === f.id}
                  preview={<FramePreviewBox frame={f} />}
                  onClick={() => onEquipFrame(f.id)} />
              ))}
            </div>
          )}

          {tab === "backgrounds" && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {avatarBackgrounds.map((b) => (
                <ItemCard key={b.id} id={b.id} name={b.name} rarity={b.rarity}
                  description={b.description}
                  isOwned={config.ownedBackgroundIds.includes(b.id)}
                  isEquipped={config.currentBackgroundId === b.id}
                  preview={
                    <div className="w-full h-14 rounded-xl overflow-hidden border border-white/10 shrink-0"
                      style={{ background: b.gradient }}>
                      {b.particles && (
                        <div className="w-full h-full flex items-center justify-center">
                          <Sparkles className="w-4 h-4 text-white/40" />
                        </div>
                      )}
                    </div>
                  }
                  onClick={() => onEquipBackground(b.id)} />
              ))}
            </div>
          )}

          {tab === "badges" && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {avatarBadges.map((b) => (
                <ItemCard key={b.id} id={b.id} name={b.name} rarity={b.rarity}
                  icon={b.icon} description={b.description}
                  isOwned={config.ownedBadgeIds.includes(b.id)}
                  isEquipped={config.currentBadgeId === b.id}
                  onClick={() => onEquipBadge(b.id)} />
              ))}
            </div>
          )}

          {tab === "titles" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {avatarTitles.map((t) => {
                const owned = config.ownedTitleIds.includes(t.id);
                const equipped = config.currentTitleId === t.id;
                const m = RARITY_META[t.rarity];
                return (
                  <motion.button key={t.id}
                    whileHover={owned ? { scale: 1.01 } : {}}
                    whileTap={owned ? { scale: 0.99 } : {}}
                    onClick={owned ? () => onEquipTitle(t.id) : undefined}
                    className={cn(
                      "flex items-center gap-3 p-4 rounded-2xl border text-left transition-all",
                      equipped ? `bg-gradient-to-r ${m.gradient} ${m.border} ${m.glow}` :
                      owned ? "bg-white/3 border-white/10 hover:bg-white/6 hover:border-white/20 cursor-pointer" :
                      "bg-white/2 border-white/5 opacity-40 cursor-not-allowed"
                    )}>
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center border shrink-0", m.bg, m.border)}>
                      <Type className={cn("w-4 h-4", m.color)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={cn("font-semibold text-sm", t.gradient
                          ? "bg-gradient-to-r " + t.gradient + " bg-clip-text text-transparent"
                          : owned ? t.color : "text-white/25")}>
                          {t.name}
                        </span>
                        {equipped && <Check className={cn("w-3 h-3 shrink-0", m.color)} />}
                      </div>
                      <p className="text-white/30 text-[10px] mt-0.5 leading-snug">{t.description}</p>
                    </div>
                    <RarityPill rarity={t.rarity} />
                    {!owned && <Lock className="w-3.5 h-3.5 text-white/20 shrink-0" />}
                  </motion.button>
                );
              })}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// ── Theme Picker ──────────────────────────────────────────────────────────────

function ThemePicker({ current, onSelect }: { current: string; onSelect: (id: string) => void }) {
  return (
    <div className="grid grid-cols-5 gap-2">
      {avatarThemes.map((t) => (
        <button key={t.id} onClick={() => onSelect(t.id)}
          className={cn(
            "flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all",
            current === t.id
              ? "border-violet-500/50 bg-violet-600/20 shadow-[0_0_12px_rgba(124,58,237,0.2)]"
              : "border-white/10 bg-white/3 hover:bg-white/7 hover:border-white/20"
          )}>
          <span className="text-xl">{t.icon}</span>
          <span className="text-[10px] text-white/50 font-medium">{t.name}</span>
          {current === t.id && <Check className="w-3 h-3 text-violet-300" />}
        </button>
      ))}
    </div>
  );
}

// ── Custom Tab Panel ──────────────────────────────────────────────────────────

type CustomTab = "preset" | "customize" | "wardrobe";

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function AvatarPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [config, setConfig] = useState<UserAvatarConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<CustomTab>("preset");

  useEffect(() => {
    if (!user) return;
    apiGetAvatarConfig(user.id).then((c) => { setConfig(c); setIsLoading(false); });
  }, [user]);

  // Derived display items
  const frame = config ? (avatarFrames.find((f) => f.id === config.currentFrameId) ?? avatarFrames[0]) : avatarFrames[0];
  const background = config ? (avatarBackgrounds.find((b) => b.id === config.currentBackgroundId) ?? avatarBackgrounds[0]) : avatarBackgrounds[0];
  const badge = config?.currentBadgeId ? (avatarBadges.find((b) => b.id === config.currentBadgeId) ?? null) : null;
  const titleObj = config ? (avatarTitles.find((t) => t.id === config.currentTitleId) ?? avatarTitles[0]) : avatarTitles[0];
  const theme = config ? (avatarThemes.find((t) => t.id === config.currentThemeId) ?? avatarThemes[0]) : avatarThemes[0];

  const mutate = useCallback(async (fn: (userId: string) => Promise<UserAvatarConfig>) => {
    if (!user) return;
    setIsSaving(true);
    try {
      const updated = await fn(user.id);
      setConfig(updated);
    } finally {
      setIsSaving(false);
    }
  }, [user]);

  const handleEquipFrame = (id: string) => mutate((uid) => apiEquipFrame(uid, id)).then(() =>
    toast({ title: "Khung đã được trang bị", description: frame.name }));
  const handleEquipBackground = (id: string) => mutate((uid) => apiEquipBackground(uid, id)).then(() =>
    toast({ title: "Hình nền đã được thay đổi" }));
  const handleEquipBadge = (id: string) => mutate((uid) => apiEquipBadge(uid, id)).then(() =>
    toast({ title: "Huy hiệu đã được trang bị" }));
  const handleEquipTitle = (id: string) => mutate((uid) => apiEquipTitle(uid, id)).then(() =>
    toast({ title: "Danh hiệu đã được áp dụng" }));
  const handleEquipTheme = (id: string) => mutate((uid) => apiEquipTheme(uid, id)).then(() =>
    toast({ title: "Chủ đề đã được thay đổi" }));

  const handleApplyPreset = async (preset: AvatarPreset) => {
    if (!user) return;
    setIsSaving(true);
    try {
      const updated = await apiApplyPreset(user.id, {
        frameId: preset.frameId,
        backgroundId: preset.backgroundId,
        badgeId: preset.badgeId,
        titleId: preset.titleId,
        themeId: preset.themeId,
      });
      setConfig(updated);
      toast({ title: `Thiết lập "${preset.name}" đã được áp dụng!`, description: preset.description });
    } finally {
      setIsSaving(false);
    }
  };

  const canEquipPreset = (frameId: string, bgId: string, badgeId: string, titleId: string) => {
    if (!config) return false;
    return (
      config.ownedFrameIds.includes(frameId) &&
      config.ownedBackgroundIds.includes(bgId) &&
      config.ownedBadgeIds.includes(badgeId) &&
      config.ownedTitleIds.includes(titleId)
    );
  };

  const isPresetActive = (preset: AvatarPreset) =>
    config?.currentFrameId === preset.frameId &&
    config?.currentBackgroundId === preset.backgroundId &&
    config?.currentBadgeId === preset.badgeId &&
    config?.currentTitleId === preset.titleId;

  if (isLoading || !config) {
    return (
      <AppShell title="Trung Tâm Avatar" subtitle="Tùy chỉnh danh tính hình ảnh của bạn">
        <div className="flex-1 flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-violet-400" />
        </div>
      </AppShell>
    );
  }

  const TABS: { key: CustomTab; label: string; icon: React.ReactNode }[] = [
    { key: "preset", label: "Thiết Lập Nhanh", icon: <Wand2 className="w-3.5 h-3.5" /> },
    { key: "customize", label: "Tùy Chỉnh", icon: <Palette className="w-3.5 h-3.5" /> },
    { key: "wardrobe", label: "Kho Vật Phẩm", icon: <Package className="w-3.5 h-3.5" /> },
  ];

  return (
    <AppShell title="Trung Tâm Avatar" subtitle="Tùy chỉnh danh tính hình ảnh của bạn trong vũ trụ">
      <div className="p-4 sm:p-6 max-w-7xl">
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">

          {/* ── TOP: PREVIEW + STATS ────────────────────────────────── */}
          <motion.div variants={item}>
            <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-5">

              {/* Avatar preview card */}
              <GlassCard className="border-white/10">
                <div className="p-6 flex flex-col items-center gap-2 min-w-64">
                  {isSaving && (
                    <div className="flex items-center gap-1.5 mb-1 text-violet-300">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span className="text-[10px]">Đang lưu...</span>
                    </div>
                  )}
                  <AvatarPreview
                    config={config}
                    frame={frame}
                    background={background}
                    badge={badge}
                    title={titleObj}
                    theme={theme}
                    initials={config.initials}
                  />
                </div>
              </GlassCard>

              {/* Stats strip */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 content-start">
                {[
                  { label: "Cấp Độ Avatar", value: config.level, icon: <Star className="w-5 h-5 text-amber-400 fill-amber-400" />, color: "text-amber-300", bg: "bg-amber-500/10 border-amber-500/20" },
                  { label: "Điểm Danh Tiếng", value: config.reputation, icon: <TrendingUp className="w-5 h-5 text-violet-400" />, color: "text-violet-300", bg: "bg-violet-500/10 border-violet-500/20" },
                  { label: "Vật Phẩm Sở Hữu", value: config.ownedFrameIds.length + config.ownedBackgroundIds.length + config.ownedBadgeIds.length + config.ownedTitleIds.length, icon: <Package className="w-5 h-5 text-cyan-400" />, color: "text-cyan-300", bg: "bg-cyan-500/10 border-cyan-500/20" },
                  { label: "Chủ Đề Hiện Tại", value: theme.name, icon: <span className="text-xl">{theme.icon}</span>, color: "text-emerald-300", bg: "bg-emerald-500/10 border-emerald-500/20" },
                ].map((s) => (
                  <div key={s.label} className={cn("flex items-center gap-3 px-4 py-4 rounded-2xl border", s.bg)}>
                    <div className="shrink-0">{s.icon}</div>
                    <div>
                      <p className={cn("font-bold text-xl leading-none", s.color)}>{s.value}</p>
                      <p className="text-white/30 text-[10px] mt-1">{s.label}</p>
                    </div>
                  </div>
                ))}

                {/* Current equipment summary */}
                <GlassCard className="col-span-2 md:col-span-4">
                  <div className="p-4 flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-1.5 text-white/30 text-[10px] uppercase tracking-widest shrink-0">
                      <Shield className="w-3 h-3" />
                      Trang bị hiện tại
                    </div>
                    {[
                      { label: "Khung", value: frame.name, rarity: frame.rarity as ItemRarity },
                      { label: "Nền", value: background.name, rarity: background.rarity as ItemRarity },
                      { label: "Huy hiệu", value: badge ? badge.name : "Không", rarity: (badge?.rarity ?? "common") as ItemRarity },
                      { label: "Danh hiệu", value: titleObj.name, rarity: titleObj.rarity as ItemRarity },
                      { label: "Chủ đề", value: theme.name, rarity: "common" as ItemRarity },
                    ].map((e, i) => (
                      <div key={i} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/4 border border-white/8">
                        <span className="text-white/25 text-[9px] uppercase">{e.label}:</span>
                        <span className={cn("text-xs font-semibold", RARITY_META[e.rarity].color)}>{e.value}</span>
                      </div>
                    ))}
                  </div>
                </GlassCard>
              </div>
            </div>
          </motion.div>

          {/* ── TAB BAR ────────────────────────────────────────────── */}
          <motion.div variants={item}>
            <div className="flex gap-1 p-1 rounded-xl bg-white/5 border border-white/8 w-fit">
              {TABS.map((t) => (
                <button key={t.key} onClick={() => setActiveTab(t.key)}
                  className={cn(
                    "flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
                    activeTab === t.key
                      ? "bg-violet-600/30 text-violet-200 border border-violet-500/40 shadow-[0_0_10px_rgba(124,58,237,0.2)]"
                      : "text-white/40 hover:text-white/70"
                  )}>
                  {t.icon}
                  {t.label}
                </button>
              ))}
            </div>
          </motion.div>

          {/* ── TAB CONTENT ────────────────────────────────────────── */}
          <AnimatePresence mode="wait">

            {/* PRESET TAB */}
            {activeTab === "preset" && (
              <motion.div key="preset" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }} className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-white/50 text-sm">Chọn một thiết lập có sẵn để áp dụng ngay lập tức.</p>
                  <span className="text-white/25 text-xs">{avatarPresets.length} thiết lập</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  {avatarPresets.map((preset) => (
                    <PresetCard key={preset.id} preset={preset}
                      onApply={() => handleApplyPreset(preset)}
                      isActive={isPresetActive(preset)}
                      canEquip={canEquipPreset} />
                  ))}
                </div>
              </motion.div>
            )}

            {/* CUSTOMIZE TAB */}
            {activeTab === "customize" && (
              <motion.div key="customize" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }} className="space-y-5">

                {/* Frame picker */}
                <GlassCard>
                  <div className="p-5 space-y-4">
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-white/40" />
                      <p className="text-white/55 text-xs font-medium uppercase tracking-widest">Khung Avatar</p>
                      <span className="text-white/20 text-xs ml-auto">{avatarFrames.filter((f) => config.ownedFrameIds.includes(f.id)).length}/{avatarFrames.length} sở hữu</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
                      {avatarFrames.map((f) => {
                        const owned = config.ownedFrameIds.includes(f.id);
                        const equipped = config.currentFrameId === f.id;
                        const m = RARITY_META[f.rarity];
                        return (
                          <motion.button key={f.id} whileHover={owned ? { scale: 1.04 } : {}} onClick={owned ? () => handleEquipFrame(f.id) : undefined}
                            title={f.name}
                            className={cn(
                              "relative flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all",
                              equipped ? `${m.bg} ${m.border} ${m.glow}` :
                              owned ? "bg-white/3 border-white/10 hover:bg-white/6 cursor-pointer" :
                              "bg-white/2 border-white/5 opacity-35 cursor-not-allowed"
                            )}>
                            {equipped && <div className={cn("absolute top-1.5 right-1.5 w-4 h-4 rounded-full flex items-center justify-center", m.bg, m.border)}><Check className={cn("w-2.5 h-2.5", m.color)} /></div>}
                            {!owned && <Lock className="absolute top-1.5 right-1.5 w-3 h-3 text-white/20" />}
                            <FramePreviewBox frame={f} />
                            <p className="text-[9px] text-white/40 truncate w-full text-center">{f.name}</p>
                            <RarityPill rarity={f.rarity} />
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>
                </GlassCard>

                {/* Background picker */}
                <GlassCard>
                  <div className="p-5 space-y-4">
                    <div className="flex items-center gap-2">
                      <Image className="w-4 h-4 text-white/40" />
                      <p className="text-white/55 text-xs font-medium uppercase tracking-widest">Hình Nền</p>
                      <span className="text-white/20 text-xs ml-auto">{avatarBackgrounds.filter((b) => config.ownedBackgroundIds.includes(b.id)).length}/{avatarBackgrounds.length} sở hữu</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
                      {avatarBackgrounds.map((b) => {
                        const owned = config.ownedBackgroundIds.includes(b.id);
                        const equipped = config.currentBackgroundId === b.id;
                        const m = RARITY_META[b.rarity];
                        return (
                          <motion.button key={b.id} whileHover={owned ? { scale: 1.04 } : {}} onClick={owned ? () => handleEquipBackground(b.id) : undefined}
                            title={b.name}
                            className={cn(
                              "relative flex flex-col items-center gap-1.5 p-1.5 rounded-xl border transition-all overflow-hidden",
                              equipped ? `${m.border} ${m.glow}` :
                              owned ? "border-white/10 hover:border-white/20 cursor-pointer" :
                              "border-white/5 opacity-35 cursor-not-allowed"
                            )}>
                            {equipped && <div className={cn("absolute top-1.5 right-1.5 z-10 w-4 h-4 rounded-full flex items-center justify-center bg-black/60", m.border)}><Check className={cn("w-2.5 h-2.5", m.color)} /></div>}
                            {!owned && <Lock className="absolute top-1.5 right-1.5 z-10 w-3 h-3 text-white/40" />}
                            <div className="w-full h-12 rounded-lg overflow-hidden" style={{ background: b.gradient }}>
                              {b.particles && <div className="w-full h-full flex items-center justify-center"><Sparkles className="w-3 h-3 text-white/50" /></div>}
                            </div>
                            <p className="text-[9px] text-white/40 truncate w-full text-center px-1">{b.name}</p>
                            <RarityPill rarity={b.rarity} />
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>
                </GlassCard>

                {/* Badge + Title row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Badge */}
                  <GlassCard>
                    <div className="p-5 space-y-3">
                      <div className="flex items-center gap-2">
                        <Award className="w-4 h-4 text-white/40" />
                        <p className="text-white/55 text-xs font-medium uppercase tracking-widest">Huy Hiệu</p>
                      </div>
                      <div className="grid grid-cols-4 gap-2">
                        {avatarBadges.map((b) => {
                          const owned = config.ownedBadgeIds.includes(b.id);
                          const equipped = config.currentBadgeId === b.id;
                          const m = RARITY_META[b.rarity];
                          return (
                            <motion.button key={b.id} whileHover={owned ? { scale: 1.06 } : {}} onClick={owned ? () => handleEquipBadge(b.id) : undefined}
                              title={b.name}
                              className={cn(
                                "relative flex flex-col items-center gap-1.5 p-2.5 rounded-xl border transition-all",
                                equipped ? `${m.bg} ${m.border} ${m.glow}` :
                                owned ? "bg-white/3 border-white/10 hover:bg-white/6 cursor-pointer" :
                                "bg-white/2 border-white/5 opacity-30 cursor-not-allowed"
                              )}>
                              {!owned && <Lock className="absolute top-1 right-1 w-2.5 h-2.5 text-white/20" />}
                              <span className="text-xl">{b.icon}</span>
                              <p className="text-[8px] text-white/35 text-center leading-tight">{b.name}</p>
                            </motion.button>
                          );
                        })}
                      </div>
                    </div>
                  </GlassCard>

                  {/* Theme */}
                  <GlassCard>
                    <div className="p-5 space-y-3">
                      <div className="flex items-center gap-2">
                        <Palette className="w-4 h-4 text-white/40" />
                        <p className="text-white/55 text-xs font-medium uppercase tracking-widest">Chủ Đề Giao Diện</p>
                      </div>
                      <ThemePicker current={config.currentThemeId} onSelect={handleEquipTheme} />
                    </div>
                  </GlassCard>
                </div>

                {/* Title list */}
                <GlassCard>
                  <div className="p-5 space-y-3">
                    <div className="flex items-center gap-2">
                      <Type className="w-4 h-4 text-white/40" />
                      <p className="text-white/55 text-xs font-medium uppercase tracking-widest">Danh Hiệu</p>
                      <span className="text-white/20 text-xs ml-auto">{config.ownedTitleIds.length}/{avatarTitles.length} sở hữu</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {avatarTitles.map((t) => {
                        const owned = config.ownedTitleIds.includes(t.id);
                        const equipped = config.currentTitleId === t.id;
                        const m = RARITY_META[t.rarity];
                        return (
                          <motion.button key={t.id} whileHover={owned ? { x: 2 } : {}} onClick={owned ? () => handleEquipTitle(t.id) : undefined}
                            className={cn(
                              "flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all",
                              equipped ? `${m.bg} ${m.border} ${m.glow}` :
                              owned ? "bg-white/3 border-white/10 hover:bg-white/6 cursor-pointer" :
                              "bg-white/2 border-white/5 opacity-35 cursor-not-allowed"
                            )}>
                            {equipped ? <Check className={cn("w-4 h-4 shrink-0", m.color)} /> : owned ? <ChevronRight className="w-4 h-4 shrink-0 text-white/20" /> : <Lock className="w-4 h-4 shrink-0 text-white/15" />}
                            <span className={cn("text-sm font-semibold flex-1", t.gradient ? "bg-gradient-to-r " + t.gradient + " bg-clip-text text-transparent" : owned ? t.color : "text-white/20")}>
                              {t.name}
                            </span>
                            <RarityPill rarity={t.rarity} />
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            )}

            {/* WARDROBE TAB */}
            {activeTab === "wardrobe" && (
              <motion.div key="wardrobe" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
                <GlassCard>
                  <div className="p-5 space-y-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-white/40" />
                        <p className="text-white/55 text-xs font-medium uppercase tracking-widest">Kho Vật Phẩm</p>
                      </div>
                      <div className="flex items-center gap-3">
                        {[
                          { label: "Khung", count: config.ownedFrameIds.length, total: avatarFrames.length },
                          { label: "Nền", count: config.ownedBackgroundIds.length, total: avatarBackgrounds.length },
                          { label: "Huy hiệu", count: config.ownedBadgeIds.length, total: avatarBadges.length },
                          { label: "Danh hiệu", count: config.ownedTitleIds.length, total: avatarTitles.length },
                        ].map((s) => (
                          <div key={s.label} className="text-center px-3 py-1.5 rounded-lg bg-white/4 border border-white/8">
                            <p className="text-white/70 text-sm font-bold">{s.count}<span className="text-white/20 text-xs">/{s.total}</span></p>
                            <p className="text-white/25 text-[9px]">{s.label}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                    <WardrobePanel
                      config={config}
                      onEquipFrame={handleEquipFrame}
                      onEquipBackground={handleEquipBackground}
                      onEquipBadge={handleEquipBadge}
                      onEquipTitle={handleEquipTitle}
                    />
                  </div>
                </GlassCard>
              </motion.div>
            )}
          </AnimatePresence>

        </motion.div>
      </div>
    </AppShell>
  );
}
