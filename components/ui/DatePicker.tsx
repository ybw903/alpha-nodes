"use client";

import { useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/Calendar";
import { getDateFnsLocale } from "@/lib/dateFnsLocales";
import { useLocale } from "next-intl";

interface DatePickerProps {
  value: string; // "YYYY-MM-DD"
  onChange: (value: string) => void;
  align?: "left" | "right";
}

export function DatePicker({
  value,
  onChange,
  align = "left",
}: DatePickerProps) {
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const [popupStyle, setPopupStyle] = useState<React.CSSProperties>({});
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  // Append T00:00:00 to avoid timezone-offset date shifting
  const selected = value ? new Date(value + "T00:00:00") : undefined;

  const calcPosition = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setPopupStyle(
      align === "right"
        ? { top: rect.bottom + 4, right: window.innerWidth - rect.right }
        : { top: rect.bottom + 4, left: rect.left }
    );
  };

  const handleToggle = () => {
    if (!open) calcPosition();
    setOpen((prev) => !prev);
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        popupRef.current &&
        !popupRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSelect = (date: Date | undefined) => {
    if (!date) return;
    onChange(format(date, "yyyy-MM-dd"));
    setOpen(false);
  };

  return (
    <div>
      <button
        ref={triggerRef}
        type="button"
        onMouseDown={handleToggle}
        className="w-full bg-(--color-bg-elevated) border border-(--color-border-default) rounded-md px-2 py-1.5 text-xs text-left focus:outline-none focus:border-(--color-accent) transition-colors"
      >
        {selected ? (
          <span className="text-foreground font-mono">
            {format(selected, "yyyy-MM-dd")}
          </span>
        ) : (
          <span className="text-(--color-text-muted)">—</span>
        )}
      </button>

      {open && (
        <div
          ref={popupRef}
          style={{ position: "fixed", ...popupStyle }}
          className="z-100 bg-(--color-bg-surface) border border-(--color-border-default) rounded-lg shadow-2xl"
        >
          <Calendar
            mode="single"
            selected={selected}
            onSelect={handleSelect}
            defaultMonth={selected}
            locale={getDateFnsLocale(locale)}
          />
        </div>
      )}
    </div>
  );
}
