"use client";

import { useEffect, useRef, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Tick02Icon, Cancel01Icon } from "@hugeicons/core-free-icons";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { renderLabel, LABEL_WIDTH_PX, LABEL_HEIGHT_PX } from "../lib/label-renderer";
import type { Label } from "../page";

interface LabelDialogProps {
  open: boolean;
  label: Label;
  onSave: (label: Label) => void;
  onCancel: () => void;
}

export default function LabelDialog({ open, label, onSave, onCancel }: LabelDialogProps) {
  const [draft, setDraft] = useState(label);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  // Sync draft when label prop changes
  useEffect(() => {
    setDraft(label);
  }, [label]);

  // Open/close native dialog
  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    if (open && !el.open) {
      el.showModal();
    } else if (!open && el.open) {
      el.close();
    }
  }, [open]);

  // Render preview
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    async function render() {
      try {
        const { canvas } = await renderLabel(draft.text1, draft.text2);
        if (cancelled) return;
        const el = canvasRef.current;
        if (!el) return;
        el.width = LABEL_WIDTH_PX * 2;
        el.height = LABEL_HEIGHT_PX * 2;
        const ctx = el.getContext("2d")!;
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(canvas, 0, 0, el.width, el.height);
      } catch {
        // ignore
      }
    }
    render();
    return () => { cancelled = true; };
  }, [draft.text1, draft.text2, open]);

  const handleSave = () => {
    onSave(draft);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSave();
    }
  };

  if (!open) return null;

  return (
    <dialog
      ref={dialogRef}
      onCancel={onCancel}
      className="fixed inset-0 z-50 m-auto w-full max-w-md rounded-2xl border border-gray-200 bg-white p-0 shadow-lg backdrop:bg-gray-900/30 backdrop:backdrop-blur-sm"
    >
      <div className="p-6 flex flex-col gap-5" onKeyDown={handleKeyDown}>
        {/* Preview */}
        <div className="bg-gray-50 rounded-xl p-3 flex items-center justify-center">
          <canvas
            ref={canvasRef}
            className="block rounded"
            style={{ width: "100%", height: "auto", imageRendering: "auto" }}
          />
        </div>

        {/* Fields */}
        <div className="flex flex-col gap-3">
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Line 1 (QR code)</label>
            <Input
              value={draft.text1}
              onChange={(e) => setDraft({ ...draft, text1: e.target.value })}
              placeholder="e.g. NLLP000001"
              autoFocus
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">Line 2</label>
            <Input
              value={draft.text2}
              onChange={(e) => setDraft({ ...draft, text2: e.target.value })}
              placeholder="e.g. SKU-12345"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 justify-end">
          <Button variant="ghost" onClick={onCancel}>
            <HugeiconsIcon icon={Cancel01Icon} size={16} /> Cancel
          </Button>
          <Button onClick={handleSave}>
            <HugeiconsIcon icon={Tick02Icon} size={16} /> Save
          </Button>
        </div>
      </div>
    </dialog>
  );
}
