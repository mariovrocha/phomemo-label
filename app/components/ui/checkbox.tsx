"use client";

import * as React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Tick02Icon } from "@hugeicons/core-free-icons";
import { cn } from "@/app/lib/utils";

interface CheckboxProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

const Checkbox = React.forwardRef<HTMLButtonElement, CheckboxProps>(
  ({ className, checked = false, onCheckedChange, ...props }, ref) => {
    return (
      <button
        ref={ref}
        role="checkbox"
        aria-checked={checked}
        type="button"
        onClick={() => onCheckedChange?.(!checked)}
        className={cn(
          "peer h-5 w-5 shrink-0 rounded-md border border-gray-300 shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/30 disabled:cursor-not-allowed disabled:opacity-50",
          checked && "bg-primary-500 border-primary-500 text-white",
          className
        )}
        {...props}
      >
        {checked && <HugeiconsIcon icon={Tick02Icon} size={14} className="mx-auto" />}
      </button>
    );
  }
);
Checkbox.displayName = "Checkbox";

export { Checkbox };
