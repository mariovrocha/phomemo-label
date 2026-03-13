"use client";

import { useCallback, useRef, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  BluetoothIcon,
  PrinterIcon,
  Add01Icon,
  SquareIcon,
} from "@hugeicons/core-free-icons";
import { BLETransport } from "../lib/ble-transport";
import { canvasToRaster, printD30 } from "../lib/printer";
import { renderLabel, LABEL_WIDTH_PX, LABEL_HEIGHT_PX } from "../lib/label-renderer";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import LabelCard from "./LabelCard";
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

  const updateLabel = (idx: number, label: Label) => {
    onLabelsChange(labels.map((l, i) => (i === idx ? label : l)));
  };

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

  const addLabel = () => {
    onLabelsChange([...labels, { text1: "", text2: "" }]);
    setSelectedIndices((prev) => new Set([...prev, labels.length]));
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

    const toPrint = labels.filter((_, i) => selectedIndices.has(i));
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

  const bleSupported = typeof navigator !== "undefined" && "bluetooth" in navigator;
  const selectedCount = selectedIndices.size;

  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col gap-6">
      {/* Connection bar */}
      <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-5 py-3.5 shadow-xs">
        <div className="flex items-center gap-3">
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
            <h2 className="text-lg font-semibold text-gray-900">Labels</h2>
            <span className="text-sm text-gray-500">
              {selectedCount} of {labels.length} selected
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={allSelected ? selectNone : selectAll}
              className="text-xs"
            >
              {allSelected ? (
                <><HugeiconsIcon icon={SquareIcon} size={16} /> Deselect all</>
              ) : (
                <><HugeiconsIcon icon={BluetoothIcon} size={16} /> Select all</>
              )}
            </Button>
            <Button variant="outline" size="sm" onClick={addLabel}>
              <HugeiconsIcon icon={Add01Icon} size={16} /> Add
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {labels.map((label, idx) => (
            <LabelCard
              key={idx}
              label={label}
              index={idx}
              selected={selectedIndices.has(idx)}
              onToggleSelect={() => toggleSelect(idx)}
              onUpdate={(l) => updateLabel(idx, l)}
              onRemove={() => removeLabel(idx)}
              canRemove={labels.length > 1}
            />
          ))}
        </div>
      </div>

      {/* Sticky print bar */}
      {connected && (
        <div className="sticky bottom-0 bg-white/80 backdrop-blur-sm border-t border-gray-200 -mx-4 px-4 py-3 mt-2">
          <div className="flex items-center justify-between max-w-3xl mx-auto">
            <span className="text-sm text-gray-600">
              {printing ? printStatus : `${selectedCount} label${selectedCount !== 1 ? "s" : ""} ready`}
            </span>
            <Button
              onClick={handlePrint}
              disabled={printing || selectedCount === 0}
              size="lg"
            >
              <HugeiconsIcon icon={PrinterIcon} size={20} />
              {printing
                ? printStatus
                : selectedCount === 0
                  ? "Select labels to print"
                  : `Print ${selectedCount} Label${selectedCount !== 1 ? "s" : ""}`}
            </Button>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-error-500/30 bg-error-50 p-3 text-sm text-error-700 text-center">
          {error}
        </div>
      )}
    </div>
  );
}
