import React from "react";
import { cn } from "@/lib/utils";

interface BatteryIndicatorProps {
  level: number; // 0-100
  className?: string;
  showPercentage?: boolean;
  size?: "sm" | "md" | "lg";
}

export function BatteryIndicator({
  level,
  className,
  showPercentage = true,
  size = "md",
}: BatteryIndicatorProps) {
  // Clamp level between 0 and 100
  const clampedLevel = Math.max(0, Math.min(100, level));

  // Determine battery status and colors
  const getBatteryStatus = (level: number) => {
    if (level <= 15) return { status: "critical", color: "bg-red-500" };
    if (level <= 30) return { status: "low", color: "bg-yellow-500" };
    return { status: "normal", color: "bg-green-500" };
  };

  const { status, color } = getBatteryStatus(clampedLevel);

  // Size variants
  const sizeClasses = {
    sm: {
      container: "h-3 w-6",
      text: "text-xs",
      icon: "h-3 w-3",
    },
    md: {
      container: "h-4 w-8",
      text: "text-sm",
      icon: "h-4 w-4",
    },
    lg: {
      container: "h-5 w-10",
      text: "text-base",
      icon: "h-5 w-5",
    },
  };

  const sizes = sizeClasses[size];

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {/* Battery Bar Visualization */}
      <div
        className={cn(
          "relative rounded-sm border border-muted-foreground/30",
          sizes.container,
        )}
      >
        {/* Battery Terminal */}
        <div className="absolute -right-0.5 top-1/2 h-1/2 w-0.5 -translate-y-1/2 rounded-r-sm bg-muted-foreground/30" />

        {/* Battery Fill */}
        <div
          className={cn("h-full rounded-sm transition-all duration-300", color)}
          style={{ width: `${clampedLevel}%` }}
        />

        {/* Battery Background */}
        <div
          className="absolute inset-0 rounded-sm bg-muted/20"
          style={{ zIndex: -1 }}
        />
      </div>

      {/* Percentage Text */}
      {showPercentage && (
        <span className={cn("font-medium tabular-nums", sizes.text)}>
          {clampedLevel}%
        </span>
      )}
    </div>
  );
}

// Variant with just the percentage and status color
export function BatteryPercentage({
  level,
  className,
}: {
  level: number;
  className?: string;
}) {
  const clampedLevel = Math.max(0, Math.min(100, level));

  const getTextColor = (level: number) => {
    if (level <= 15) return "text-red-500";
    if (level <= 30) return "text-yellow-500";
    return "text-green-600";
  };

  return (
    <span
      className={cn(
        "font-medium tabular-nums",
        getTextColor(clampedLevel),
        className,
      )}
    >
      {clampedLevel}%
    </span>
  );
}
