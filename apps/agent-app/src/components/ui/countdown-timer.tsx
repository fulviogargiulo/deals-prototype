import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface CountdownTimerProps {
  expiresAt: string;
  onExpire?: () => void;
  variant?: "light" | "dark";
  /** Accent color for the digit backgrounds (CSS color string, e.g. "#006D77") */
  accentColor?: string;
  /** Size variant: default shows large digit boxes, inline shows compact text */
  size?: "default" | "inline";
}

export function CountdownTimer({ expiresAt, onExpire, variant = "light", accentColor, size = "default" }: CountdownTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState(calculateTimeRemaining(expiresAt));

  useEffect(() => {
    const interval = setInterval(() => {
      const remaining = calculateTimeRemaining(expiresAt);
      setTimeRemaining(remaining);

      if (remaining.total <= 0 && onExpire) {
        onExpire();
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt, onExpire]);

  const { hours, minutes, seconds } = timeRemaining;
  const isDark = variant === "dark";

  if (size === "inline") {
    const formatted = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    return (
      <span className={cn(
        "text-sm font-semibold tabular-nums",
        isDark ? "text-white" : "text-foreground"
      )}>
        {formatted}
      </span>
    );
  }

  return (
    <div className="inline-flex items-center gap-2">
      <TimeUnit value={Math.floor(hours / 10)} dark={isDark} accentColor={accentColor} />
      <TimeUnit value={hours % 10} dark={isDark} accentColor={accentColor} />
      <span className={cn("text-2xl font-semibold", isDark ? "text-white/40" : "text-muted-foreground")}>:</span>
      <TimeUnit value={Math.floor(minutes / 10)} dark={isDark} accentColor={accentColor} />
      <TimeUnit value={minutes % 10} dark={isDark} accentColor={accentColor} />
      <span className={cn("text-2xl font-semibold", isDark ? "text-white/40" : "text-muted-foreground")}>:</span>
      <TimeUnit value={Math.floor(seconds / 10)} dark={isDark} accentColor={accentColor} />
      <TimeUnit value={seconds % 10} dark={isDark} accentColor={accentColor} />
    </div>
  );
}

function TimeUnit({ value, dark, accentColor }: { value: number; dark?: boolean; accentColor?: string }) {
  return (
    <div
      className={cn(
        "rounded-lg w-12 h-14 flex items-center justify-center",
        !accentColor && (dark ? "bg-white/15" : "bg-muted")
      )}
      style={accentColor ? { backgroundColor: accentColor } : undefined}
    >
      <span className={cn("text-3xl font-semibold", dark || accentColor ? "text-white" : "text-foreground")}>{value}</span>
    </div>
  );
}

function calculateTimeRemaining(expiresAt: string) {
  const now = new Date().getTime();
  const expires = new Date(expiresAt).getTime();
  const total = expires - now;

  if (total <= 0) {
    return { total: 0, hours: 0, minutes: 0, seconds: 0 };
  }

  const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((total / (1000 * 60)) % 60);
  const seconds = Math.floor((total / 1000) % 60);

  return { total, hours, minutes, seconds };
}

interface CountdownLabelsProps {
  variant?: "light" | "dark";
}

export function CountdownLabels({ variant = "light" }: CountdownLabelsProps) {
  const isDark = variant === "dark";
  return (
    <div className="inline-flex items-center gap-2 mt-2">
      <span className={cn("text-xs w-24 text-center", isDark ? "text-white/50" : "text-muted-foreground")}>hours</span>
      <span className="w-4"></span>
      <span className={cn("text-xs w-24 text-center", isDark ? "text-white/50" : "text-muted-foreground")}>minutes</span>
      <span className="w-4"></span>
      <span className={cn("text-xs w-24 text-center", isDark ? "text-white/50" : "text-muted-foreground")}>seconds</span>
    </div>
  );
}
