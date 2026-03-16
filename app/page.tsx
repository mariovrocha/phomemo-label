"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import LabelPrinter from "./components/LabelPrinter";

export interface Label {
  text1: string;
  text2: string;
}

function parseLabelsFromParams(searchParams: URLSearchParams): Label[] {
  const raw = searchParams.get("labels");
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed
        .filter((l) => l && typeof l.text1 === "string")
        .map((l) => ({ text1: l.text1, text2: l.text2 ?? "" }));
    }
  } catch {
    // ignore malformed JSON
  }
  return [];
}

function LabelPage() {
  const searchParams = useSearchParams();
  const fromParams = parseLabelsFromParams(searchParams);

  const [labels, setLabels] = useState<Label[]>(
    fromParams.length > 0
      ? fromParams
      : []
  );

  return (
    <main className="relative min-h-screen overflow-hidden" style={{ background: "#f0f7f6" }}>
      {/* Soft blurred teal blobs — novalogica style */}
      <div className="pointer-events-none fixed inset-0 z-0">
        {/* Top-left blob */}
        <div
          className="absolute"
          style={{
            width: "60vw",
            height: "60vw",
            top: "-15vw",
            left: "-20vw",
            background: "radial-gradient(circle, rgba(149,232,194,0.35) 0%, rgba(66,150,145,0.12) 40%, transparent 70%)",
            filter: "blur(60px)",
          }}
        />
        {/* Center-right blob */}
        <div
          className="absolute"
          style={{
            width: "50vw",
            height: "50vw",
            top: "10vh",
            right: "-10vw",
            background: "radial-gradient(circle, rgba(66,150,145,0.25) 0%, rgba(0,98,105,0.1) 40%, transparent 70%)",
            filter: "blur(80px)",
          }}
        />
        {/* Bottom-center blob */}
        <div
          className="absolute"
          style={{
            width: "70vw",
            height: "50vw",
            bottom: "-10vw",
            left: "20vw",
            background: "radial-gradient(circle, rgba(149,232,194,0.2) 0%, rgba(66,150,145,0.08) 40%, transparent 70%)",
            filter: "blur(80px)",
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <div className="max-w-3xl mx-auto px-4 pt-14 pb-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-500/10 text-primary-600 text-xs font-medium tracking-wide uppercase mb-5">
            <span className="w-2 h-2 rounded-full bg-primary-400 animate-pulse" />
            Phomemo D30
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 tracking-tight">
            Label Printer
          </h1>
          <p className="mt-3 text-base text-gray-500 max-w-md mx-auto">
            Print QR code labels via Bluetooth.
          </p>
        </div>

        {/* Main content */}
        <div className="max-w-3xl mx-auto px-4 pb-12">
          <LabelPrinter labels={labels} onLabelsChange={setLabels} />
        </div>
      </div>
    </main>
  );
}

export default function Home() {
  return (
    <Suspense>
      <LabelPage />
    </Suspense>
  );
}
