"use client";

import { ClipLoader } from "react-spinners";

export function Spinner({ label = "Loading" }: { label?: string }) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center gap-3 text-sm text-slate-600">
      <ClipLoader color="#0C447C" size={36} />
      <span>{label}</span>
    </div>
  );
}
