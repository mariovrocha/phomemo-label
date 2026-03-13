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
      : [{ text1: "Product Name", text2: "SKU-12345" }]
  );

  return (
    <main className="min-h-screen bg-gray-25 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-[30px] leading-[38px] font-semibold text-gray-900">
            Phomemo D30 Label Printer
          </h1>
          <p className="mt-2 text-base text-gray-500">
            Create and print QR code labels via Bluetooth
          </p>
        </div>
        <LabelPrinter labels={labels} onLabelsChange={setLabels} />
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
