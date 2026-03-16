"use client";

import { useEffect, useRef } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { PencilEdit01Icon, Delete02Icon, Tick02Icon } from "@hugeicons/core-free-icons";
import { Button } from "./ui/button";
import { renderLabel, LABEL_WIDTH_PX, LABEL_HEIGHT_PX } from "../lib/label-renderer";
import type { Label } from "../page";

const PREVIEW_SCALE = 2;

interface LabelCardProps {
  label: Label;
  index: number;
  selected: boolean;
  onToggleSelect: () => void;
  onEdit: () => void;
  onRemove: () => void;
}

export default function LabelCard({
  label,
  index,
  selected,
  onToggleSelect,
  onEdit,
  onRemove,
}: LabelCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let cancelled = false;
    async function render() {
      try {
        const { canvas } = await renderLabel(label.text1, label.text2);
        if (cancelled) return;
        const el = canvasRef.current;
        if (!el) return;
        el.width = LABEL_WIDTH_PX * PREVIEW_SCALE;
        el.height = LABEL_HEIGHT_PX * PREVIEW_SCALE;
        const ctx = el.getContext("2d")!;
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(canvas, 0, 0, el.width, el.height);
      } catch {
        // ignore render errors for empty text
      }
    }
    render();
    return () => { cancelled = true; };
  }, [label.text1, label.text2]);

  return (
    <div
      onClick={onToggleSelect}
      className={`group relative flex flex-col rounded-2xl transition-all duration-200 cursor-pointer overflow-hidden ${
        selected
          ? "ring-2 ring-primary-500 bg-white shadow-md"
          : "border border-gray-200 bg-white shadow-xs hover:shadow-md hover:border-gray-300"
      }`}
    >
      {/* Preview area */}
      <div className="relative bg-gray-50 p-3 flex items-center justify-center bg-white">
        <canvas
          ref={canvasRef}
          className="block rounded"
          style={{ width: "100%", height: "auto", imageRendering: "auto" }}
        />
        {selected && (
          <div
            className="absolute top-2 right-2 h-7 w-7 rounded-full text-white flex items-center justify-center shadow-md"
            style={{ background: "linear-gradient(135deg, #429691, #95e8c2)" }}
          >
            <HugeiconsIcon icon={Tick02Icon} size={14} />
          </div>
        )}
      </div>

      {/* Content area */}
      <div className="px-4 pt-1.5 pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[10px] font-bold tracking-widest uppercase text-primary-500">Label #{index + 1}</span>
            </div>
            <p className="text-sm font-semibold text-gray-700 truncate">{label.text1 || "\u2014"}</p>
            <p className="text-sm text-gray-400 truncate">{label.text2 || "\u2014"}</p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 sm:opacity-0 max-sm:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              onClick={onEdit}
            >
              <HugeiconsIcon icon={PencilEdit01Icon} size={16} />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-error-500 hover:text-error-700 hover:bg-error-50"
              onClick={onRemove}
            >
              <HugeiconsIcon icon={Delete02Icon} size={16} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
