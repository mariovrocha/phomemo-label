"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  BluetoothIcon,
  PrinterIcon,
  Add01Icon,
  SquareIcon,
  Tick02Icon,
  TagsIcon,
} from "@hugeicons/core-free-icons";
import { BLETransport } from "../lib/ble-transport";
import { canvasToRaster, printD30 } from "../lib/printer";
import { renderLabel, LABEL_WIDTH_PX, LABEL_HEIGHT_PX } from "../lib/label-renderer";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import LabelCard from "./LabelCard";
import LabelDialog from "./LabelDialog";
import type { Label } from "../page";

interface LabelPrinterProps {
  labels: Label[];
  onLabelsChange: (labels: Label[]) => void;
}

export default function LabelPrinter({ labels, onLabelsChange }: LabelPrinterProps) {
  const transportRef = useRef<BLETransport | null>(null);

  const [connected, setConnected] = useState(false);
  const [deviceName, setDeviceName] = useState("");
  const [printing, setPrinting] = useState(false);
  const [printStatus, setPrintStatus] = useState("");
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(
    () => new Set(labels.map((_, i) => i))
  );
  const [error, setError] = useState<string | null>(null);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [dialogLabel, setDialogLabel] = useState<Label>({ text1: "", text2: "" });

  const [bleSupported, setBleSupported] = useState(true);
  useEffect(() => {
    setBleSupported(typeof navigator !== "undefined" && "bluetooth" in navigator);
  }, []);

  const toggleSelect = (idx: number) => {
    setSelectedIndices((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const selectAll = () => {
    setSelectedIndices(new Set(labels.map((_, i) => i)));
  };

  const selectNone = () => {
    setSelectedIndices(new Set());
  };

  const allSelected = labels.length > 0 && selectedIndices.size === labels.length;

  const removeLabel = (idx: number) => {
    onLabelsChange(labels.filter((_, i) => i !== idx));
    setSelectedIndices((prev) => {
      const next = new Set<number>();
      for (const i of prev) {
        if (i < idx) next.add(i);
        else if (i > idx) next.add(i - 1);
      }
      return next;
    });
  };

  const openAddDialog = () => {
    setEditingIndex(null);
    setDialogLabel({ text1: "", text2: "" });
    setDialogOpen(true);
  };

  const openEditDialog = (idx: number) => {
    setEditingIndex(idx);
    setDialogLabel(labels[idx]);
    setDialogOpen(true);
  };

  const handleDialogSave = (saved: Label) => {
    if (editingIndex !== null) {
      // Editing existing
      onLabelsChange(labels.map((l, i) => (i === editingIndex ? saved : l)));
    } else {
      // Adding new
      onLabelsChange([...labels, saved]);
      setSelectedIndices((prev) => new Set([...prev, labels.length]));
    }
    setDialogOpen(false);
  };

  const handleDialogCancel = () => {
    setDialogOpen(false);
  };

  const handleConnect = useCallback(async () => {
    setError(null);
    try {
      const transport = new BLETransport();
      await transport.connect();
      transportRef.current = transport;
      setConnected(true);
      setDeviceName(transport.deviceName);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connection failed");
    }
  }, []);

  const handleDisconnect = useCallback(async () => {
    if (transportRef.current) {
      await transportRef.current.disconnect();
      transportRef.current = null;
    }
    setConnected(false);
    setDeviceName("");
  }, []);

  const handlePrint = useCallback(async () => {
    if (!transportRef.current?.isConnected) {
      setError("Printer not connected");
      return;
    }

    const toPrint = labels.filter((l, i) => selectedIndices.has(i) && l.text1.trim());
    if (toPrint.length === 0) {
      setError("No labels selected");
      return;
    }

    setError(null);
    setPrinting(true);

    try {
      for (let i = 0; i < toPrint.length; i++) {
        setPrintStatus(`Printing ${i + 1} of ${toPrint.length}...`);
        const { imageData } = await renderLabel(toPrint[i].text1, toPrint[i].text2);
        const rasterData = canvasToRaster(imageData, LABEL_WIDTH_PX, LABEL_HEIGHT_PX);
        await printD30(transportRef.current!, rasterData, { density: 6 });

        if (i < toPrint.length - 1) {
          await transportRef.current!.delay(1000);
        }
      }
      setPrintStatus(`Printed ${toPrint.length} label${toPrint.length > 1 ? "s" : ""}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Print failed");
    } finally {
      setPrinting(false);
    }
  }, [labels, selectedIndices]);

  const selectedCount = selectedIndices.size;
  const printableCount = labels.filter((l, i) => selectedIndices.has(i) && l.text1.trim()).length;

  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col gap-5">
      {/* Connection card */}
      <div className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white px-5 py-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className={`w-2.5 h-2.5 rounded-full ${connected ? "bg-primary-400 shadow-[0_0_8px_rgba(66,150,145,0.5)]" : "bg-gray-300"}`} />
          {connected ? (
            <Badge variant="success" className="gap-1.5">
              <HugeiconsIcon icon={BluetoothIcon} size={14} />
              {deviceName}
            </Badge>
          ) : (
            <span className="text-sm text-gray-500">No printer connected</span>
          )}
        </div>

        {!bleSupported ? (
          <Badge variant="destructive">Web Bluetooth not supported</Badge>
        ) : connected ? (
          <Button variant="outline" size="sm" onClick={handleDisconnect}>
            <HugeiconsIcon icon={BluetoothIcon} size={16} />
            Disconnect
          </Button>
        ) : (
          <Button size="sm" onClick={handleConnect}>
            <HugeiconsIcon icon={BluetoothIcon} size={16} />
            Connect D30
          </Button>
        )}
      </div>

      {/* Labels section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-baseline gap-3">
            <h2 className="text-lg font-semibold text-gray-700">Labels</h2>
            <span className="text-sm text-gray-400">
              {selectedCount} of {labels.length} selected
            </span>
          </div>
          <div className="flex items-center gap-2">
            {labels.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={allSelected ? selectNone : selectAll}
                className="text-xs"
              >
                {allSelected ? (
                  <><HugeiconsIcon icon={SquareIcon} size={16} /> Deselect all</>
                ) : (
                  <><HugeiconsIcon icon={Tick02Icon} size={16} /> Select all</>
                )}
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={openAddDialog}>
              <HugeiconsIcon icon={Add01Icon} size={16} /> Add
            </Button>
          </div>
        </div>

        {labels.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-white/60 py-14 px-6 text-center">
            <div className="w-12 h-12 rounded-full bg-primary-50 flex items-center justify-center mb-4">
              <HugeiconsIcon icon={TagsIcon} size={24} className="text-primary-500" />
            </div>
            <p className="text-sm font-semibold text-gray-600 mb-1">No labels yet</p>
            <p className="text-sm text-gray-400 mb-5">Create your first label to get started</p>
            <Button size="sm" onClick={openAddDialog}>
              <HugeiconsIcon icon={Add01Icon} size={16} /> Add Label
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {labels.map((label, idx) => (
              <LabelCard
                key={idx}
                label={label}
                index={idx}
                selected={selectedIndices.has(idx)}
                onToggleSelect={() => toggleSelect(idx)}
                onEdit={() => openEditDialog(idx)}
                onRemove={() => removeLabel(idx)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Sticky print bar */}
      {connected && (
        <div className="sticky bottom-0 z-10 -mx-4 px-4 py-3 mt-2">
          <div
            className="flex items-center justify-between max-w-3xl mx-auto rounded-2xl px-5 py-3 shadow-lg"
            style={{
              background: "linear-gradient(135deg, rgba(0,98,105,0.95) 0%, rgba(66,150,145,0.95) 100%)",
              backdropFilter: "blur(12px)",
            }}
          >
            <span className="text-sm text-white/80">
              {printing ? printStatus : `${printableCount} label${printableCount !== 1 ? "s" : ""} ready`}
            </span>
            <Button
              onClick={handlePrint}
              disabled={printing || printableCount === 0}
              size="lg"
              className="bg-white text-primary-700 hover:bg-primary-50 font-bold shadow-md"
            >
              <HugeiconsIcon icon={PrinterIcon} size={20} />
              {printing
                ? printStatus
                : printableCount === 0
                  ? "Select labels"
                  : `Print ${printableCount} Label${printableCount !== 1 ? "s" : ""}`}
            </Button>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-error-500/20 bg-error-50 p-4 text-sm text-error-700 text-center">
          {error}
        </div>
      )}

      {/* Add/Edit dialog */}
      <LabelDialog
        open={dialogOpen}
        label={dialogLabel}
        onSave={handleDialogSave}
        onCancel={handleDialogCancel}
      />
    </div>
  );
}
