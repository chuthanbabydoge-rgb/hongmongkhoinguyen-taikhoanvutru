import { cn } from "@/lib/utils";
import { HTMLAttributes } from "react";

interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  glow?: "violet" | "cyan" | "emerald" | "red" | "none";
  hover?: boolean;
}

const glowMap = {
  violet: "hover:shadow-[0_0_30px_rgba(124,58,237,0.3)] hover:border-violet-500/30",
  cyan: "hover:shadow-[0_0_30px_rgba(6,182,212,0.3)] hover:border-cyan-500/30",
  emerald: "hover:shadow-[0_0_30px_rgba(16,185,129,0.3)] hover:border-emerald-500/30",
  red: "hover:shadow-[0_0_30px_rgba(239,68,68,0.3)] hover:border-red-500/30",
  none: ""
};

export function GlassCard({ className, glow = "violet", hover = true, children, ...props }: GlassCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-xl",
        hover && "transition-all duration-300",
        hover && glow !== "none" && glowMap[glow],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function GlassPanel({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-2xl shadow-2xl",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
