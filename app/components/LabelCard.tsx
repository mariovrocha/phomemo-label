"use client";

import { useEffect, useRef, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { PencilEdit01Icon, Delete02Icon, Tick02Icon, Cancel01Icon } from "@hugeicons/core-free-icons";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { renderLabel, LABEL_WIDTH_PX, LABEL_HEIGHT_PX } from "../lib/label-renderer";
import type { Label } from "../page";

interface LabelCardProps {
  label: Label;
  index: number;
  selected: boolean;
  onToggleSelect: () => void;
  onUpdate: (label: Label) => void;
  onRemove: () => void;
  canRemove: boolean;
}

export default function LabelCard({
  label,
  index,
  selected,
  onToggleSelect,
  onUpdate,
  onRemove,
  canRemove,
}: LabelCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(label);

  // Sync draft when label changes externally
  useEffect(() => {
    if (!editing) setDraft(label);
  }, [label, editing]);

  // Render preview — show draft while editing, otherwise show saved label
  const previewText1 = editing ? draft.text1 : label.text1;
  const previewText2 = editing ? draft.text2 : label.text2;

  useEffect(() => {
    let cancelled = false;
    async function render() {
      try {
        const { canvas } = await renderLabel(previewText1, previewText2);
        if (cancelled) return;
        const el = canvasRef.current;
        if (!el) return;
        el.width = LABEL_WIDTH_PX;
        el.height = LABEL_HEIGHT_PX;
        const ctx = el.getContext("2d")!;
        ctx.drawImage(canvas, 0, 0);
      } catch {
        // ignore render errors for empty text
      }
    }
    render();
    return () => { cancelled = true; };
  }, [previewText1, previewText2]);

  const handleSave = () => {
    onUpdate(draft);
    setEditing(false);
  };

  const handleCancel = () => {
    setDraft(label);
    setEditing(false);
  };

  const handleCardClick = () => {
    if (!editing) onToggleSelect();
  };

  return (
    <div
      onClick={handleCardClick}
      className={`group relative flex flex-col rounded-xl transition-all cursor-pointer ${
        selected
          ? "border-2 border-primary-300 bg-primary-50/30"
          : "border border-gray-200 bg-white shadow-xs hover:shadow-sm"
      }`}
    >
      {/* Preview area */}
      <div className="relative bg-gray-50 rounded-t-xl p-4 flex items-center justify-center">
        <canvas
          ref={canvasRef}
          className="block rounded-lg"
          style={{
            width: "100%",
            height: "auto",
            imageRendering: "pixelated",
          }}
        />
        {/* Selected check overlay */}
        {selected && (
          <div className="absolute top-3 right-3 h-6 w-6 rounded-full bg-primary-600 text-white flex items-center justify-center">
            <HugeiconsIcon icon={Tick02Icon} size={14} />
          </div>
        )}
      </div>

      {/* Content area */}
      <div className="p-4">
        {editing ? (
          <div className="flex flex-col gap-3" onClick={(e) => e.stopPropagation()}>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Line 1 (QR)</label>
              <Input
                value={draft.text1}
                onChange={(e) => setDraft({ ...draft, text1: e.target.value })}
                placeholder="Text line 1"
                autoFocus
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Line 2</label>
              <Input
                value={draft.text2}
                onChange={(e) => setDraft({ ...draft, text2: e.target.value })}
                placeholder="Text line 2"
              />
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSave}>
                <HugeiconsIcon icon={Tick02Icon} size={16} /> Save
              </Button>
              <Button size="sm" variant="ghost" onClick={handleCancel}>
                <HugeiconsIcon icon={Cancel01Icon} size={16} /> Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold text-gray-400">#{index + 1}</span>
              </div>
              <p className="text-sm font-semibold text-gray-900 truncate">{label.text1 || "\u2014"}</p>
              <p className="text-sm text-gray-500 truncate">{label.text2 || "\u2014"}</p>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 sm:opacity-0 max-sm:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                onClick={() => setEditing(true)}
              >
                <HugeiconsIcon icon={PencilEdit01Icon} size={16} />
              </Button>
              {canRemove && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-error-500 hover:text-error-700 hover:bg-error-50"
                  onClick={onRemove}
                >
                  <HugeiconsIcon icon={Delete02Icon} size={16} />
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
